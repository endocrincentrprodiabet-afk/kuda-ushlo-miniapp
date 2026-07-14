import { RoundedBox } from '@react-three/drei';
import type { GoalObjectProps } from './types';
import { useGoalObjectMaterials } from './useGoalObjectMaterials';

export function OtherGoalObject({ progress, quality }: GoalObjectProps) {
  const materials = useGoalObjectMaterials(progress, quality);
  const detail = quality === 'high' ? 2 : 1;
  const segments = quality === 'high' ? 40 : quality === 'medium' ? 28 : 18;
  const smoothness = quality === 'high' ? 5 : quality === 'medium' ? 4 : 2;

  return (
    <group position={[0, -0.05, 0]} rotation={[0.08, -0.28, 0.025]} scale={0.98}>
      <mesh material={materials.body} scale={[1.02, 1.34, 0.9]}>
        <icosahedronGeometry args={[1, detail]} />
      </mesh>
      <mesh material={materials.dark} position={[0, -0.08, 0.02]} scale={[0.68, 0.9, 0.62]}>
        <dodecahedronGeometry args={[1, quality === 'high' ? 1 : 0]} />
      </mesh>
      <mesh material={materials.accent} rotation={[Math.PI / 2.45, 0.16, -0.18]}>
        <torusGeometry args={[1.08, 0.035, 6, segments]} />
      </mesh>
      {quality !== 'low' ? (
        <mesh material={materials.accent} rotation={[-Math.PI / 2.8, 0.32, 0.2]}>
          <torusGeometry args={[0.82, 0.022, 5, segments]} />
        </mesh>
      ) : null}
      <RoundedBox
        args={[1.36, 0.16, 1.02]}
        material={materials.dark}
        position={[0, -1.34, 0]}
        radius={0.055}
        smoothness={smoothness}
      />
      {quality === 'high' ? (
        <mesh material={materials.accent} position={[0.46, 0.62, 0.72]}>
          <sphereGeometry args={[0.085, 14, 8]} />
        </mesh>
      ) : null}
    </group>
  );
}
