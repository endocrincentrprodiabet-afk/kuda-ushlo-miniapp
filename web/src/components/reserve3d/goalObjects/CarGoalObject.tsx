import { useEffect, useMemo } from 'react';
import type { GoalObjectProps } from './types';
import { createCarGeometryPack, disposeCarGeometryPack } from './carGeometry';
import { useCarGoalMaterials, type CarGoalMaterials } from './useCarGoalMaterials';

type WheelProps = {
  materials: CarGoalMaterials;
  quality: GoalObjectProps['quality'];
  side: -1 | 1;
  x: number;
};

function Wheel({ materials, quality, side, x }: WheelProps) {
  const tyreSegments = quality === 'high' ? 28 : quality === 'medium' ? 20 : 14;
  const spokeCount = quality === 'high' ? 10 : quality === 'medium' ? 7 : 5;
  const faceOffset = side * 0.105;

  return (
    <group position={[x, -0.3, side * 0.76]}>
      <mesh material={materials.tyre}>
        <torusGeometry args={[0.31, 0.095, quality === 'low' ? 6 : 8, tyreSegments]} />
      </mesh>
      <mesh material={materials.secondaryLine}>
        <torusGeometry args={[0.31, 0.101, 3, tyreSegments]} />
      </mesh>
      <mesh material={materials.rim} position={[0, 0, faceOffset]}>
        <torusGeometry args={[0.205, 0.027, 5, tyreSegments]} />
      </mesh>
      <mesh material={materials.rim} position={[0, 0, faceOffset]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.028, tyreSegments]} />
      </mesh>
      {Array.from({ length: spokeCount }, (_, index) => {
        const angle = (index / spokeCount) * Math.PI * 2;
        return (
          <mesh
            key={index}
            material={materials.rim}
            position={[Math.cos(angle) * 0.11, Math.sin(angle) * 0.11, faceOffset]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[0.205, quality === 'low' ? 0.022 : 0.016, 0.018]} />
          </mesh>
        );
      })}
    </group>
  );
}

export function CarGoalObject({ progress, quality }: GoalObjectProps) {
  const materials = useCarGoalMaterials(progress, quality);
  const geometry = useMemo(() => createCarGeometryPack(quality), [quality]);
  const wheelPositions = [-0.98, 1.05] as const;
  const grilleBars = quality === 'high' ? 7 : quality === 'medium' ? 5 : 3;
  const headlightSegments = quality === 'high' ? 24 : quality === 'medium' ? 18 : 12;

  useEffect(() => () => disposeCarGeometryPack(geometry), [geometry]);

  return (
    <group position={[0, -0.06, 0]} rotation={[0.045, 0.48, -0.018]} scale={1.05}>
      <mesh geometry={geometry.body} material={materials.bodyShell} />
      <mesh geometry={geometry.cabin} material={materials.bodyShell} />

      {[geometry.windshield, geometry.rearWindow, ...geometry.sideWindows].map((windowGeometry, index) => (
        <mesh geometry={windowGeometry} key={index} material={materials.glass} />
      ))}

      {geometry.keyLines.map((lineGeometry, index) => (
        <mesh geometry={lineGeometry} key={`key-${index}`} material={materials.outline} />
      ))}
      {geometry.panelLines.map((lineGeometry, index) => (
        <mesh geometry={lineGeometry} key={`panel-${index}`} material={materials.panelLine} />
      ))}
      {geometry.fineLines.map((lineGeometry, index) => (
        <mesh geometry={lineGeometry} key={`fine-${index}`} material={materials.secondaryLine} />
      ))}

      {wheelPositions.flatMap((x) => ([-1, 1] as const).map((side) => (
        <Wheel key={`${x}-${side}`} materials={materials} quality={quality} side={side} x={x} />
      )))}

      {[-0.49, -0.25, 0.25, 0.49].map((z, index) => (
        <mesh
          key={z}
          material={materials.headlight}
          position={[-1.707, index % 2 === 0 ? 0.16 : 0.14, z]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <torusGeometry args={[index % 2 === 0 ? 0.105 : 0.085, 0.012, 4, headlightSegments]} />
        </mesh>
      ))}

      <mesh geometry={geometry.frontGrille} material={materials.grille} position={[-1.714, -0.055, 0]} rotation={[0, Math.PI / 2, 0]} />
      <mesh material={materials.outline} position={[-1.721, -0.055, 0]} rotation={[0, Math.PI / 2, 0]} scale={[1.75, 0.72, 1]}>
        <torusGeometry args={[0.215, 0.012, 4, headlightSegments]} />
      </mesh>
      {Array.from({ length: grilleBars }, (_, index) => {
        const z = ((index + 1) / (grilleBars + 1) - 0.5) * 0.64;
        return (
          <mesh key={index} material={materials.secondaryLine} position={[-1.724, -0.055, z]}>
            <boxGeometry args={[0.012, 0.25, 0.012]} />
          </mesh>
        );
      })}
      <mesh geometry={geometry.lowerIntake} material={materials.grille} position={[-1.716, -0.255, 0]} rotation={[0, Math.PI / 2, 0]} />
      <mesh material={materials.secondaryLine} position={[-1.721, -0.255, 0]} rotation={[0, Math.PI / 2, 0]} scale={[3.6, 0.42, 1]}>
        <torusGeometry args={[0.125, 0.01, 4, headlightSegments]} />
      </mesh>

      <group position={[-0.08, 0.52, 0.78]} rotation={[0.08, 0.04, -0.08]}>
        <mesh material={materials.bodyShell} scale={[0.13, 0.07, 0.08]}>
          <sphereGeometry args={[1, quality === 'high' ? 14 : 9, quality === 'high' ? 8 : 6]} />
        </mesh>
      </group>
      {quality !== 'low' ? (
        <mesh material={materials.panelLine} position={[0.53, 0.42, 0.822]} rotation={[0, 0, -0.04]}>
          <boxGeometry args={[0.12, 0.018, 0.014]} />
        </mesh>
      ) : null}
    </group>
  );
}
