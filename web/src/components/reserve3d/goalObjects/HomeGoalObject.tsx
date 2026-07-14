import { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import type { GoalObjectProps } from './types';
import { createGableRoofGeometry } from './homeGeometry';
import { useGoalObjectMaterials } from './useGoalObjectMaterials';

export function HomeGoalObject({ progress, quality }: GoalObjectProps) {
  const materials = useGoalObjectMaterials(progress, quality);
  const smoothness = quality === 'high' ? 5 : quality === 'medium' ? 4 : 2;
  const mainRoof = useMemo(() => createGableRoofGeometry(1.55, 0.48, 1.36), []);
  const sideRoof = useMemo(() => createGableRoofGeometry(1.12, 0.3, 1.22), []);

  useEffect(() => () => {
    mainRoof.dispose();
    sideRoof.dispose();
  }, [mainRoof, sideRoof]);

  return (
    <group position={[0, -0.02, 0]} rotation={[0.035, -0.4, -0.01]} scale={0.94}>
      <RoundedBox
        args={[1.42, 1.12, 1.2]}
        material={materials.body}
        position={[-0.42, -0.29, 0]}
        radius={0.07}
        smoothness={smoothness}
      />
      <mesh geometry={mainRoof} material={materials.dark} position={[-0.42, 0.27, 0]} />

      <RoundedBox
        args={[1.02, 0.74, 1.08]}
        material={materials.body}
        position={[0.78, -0.48, 0.04]}
        radius={0.065}
        smoothness={smoothness}
      />
      <mesh geometry={sideRoof} material={materials.dark} position={[0.78, -0.1, 0.04]} />

      <RoundedBox
        args={[2.55, 0.13, 1.65]}
        material={materials.dark}
        position={[0.04, -0.96, 0]}
        radius={0.055}
        smoothness={smoothness}
      />
      <RoundedBox
        args={[1.08, 0.08, 0.55]}
        material={materials.dark}
        position={[0.82, -0.83, 0.74]}
        radius={0.025}
        smoothness={smoothness}
      />

      <RoundedBox
        args={[0.72, 0.54, 0.045]}
        material={materials.glass}
        position={[-0.58, -0.29, 0.625]}
        radius={0.035}
        smoothness={smoothness}
      />
      <RoundedBox
        args={[0.58, 0.38, 0.045]}
        material={materials.glass}
        position={[0.76, -0.46, 0.6]}
        radius={0.03}
        smoothness={smoothness}
      />
      <RoundedBox
        args={[0.25, 0.72, 0.055]}
        material={materials.dark}
        position={[0.08, -0.56, 0.63]}
        radius={0.025}
        smoothness={smoothness}
      />

      <mesh material={materials.accent} position={[-0.58, -0.29, 0.655]}>
        <boxGeometry args={[0.018, 0.54, 0.014]} />
      </mesh>
      {quality !== 'low' ? (
        <>
          <mesh material={materials.accent} position={[-0.58, -0.29, 0.656]}>
            <boxGeometry args={[0.72, 0.018, 0.014]} />
          </mesh>
          <mesh material={materials.accent} position={[0.76, -0.46, 0.63]}>
            <boxGeometry args={[0.018, 0.38, 0.014]} />
          </mesh>
          <mesh material={materials.accent} position={[-0.42, 0.765, 0]}>
            <boxGeometry args={[0.025, 0.025, 1.39]} />
          </mesh>
          <mesh material={materials.accent} position={[0.78, 0.205, 0.04]}>
            <boxGeometry args={[0.022, 0.022, 1.24]} />
          </mesh>
        </>
      ) : null}
      {quality === 'high' ? (
        <>
          <RoundedBox
            args={[0.07, 0.07, 0.04]}
            material={materials.accent}
            position={[0.17, -0.53, 0.67]}
            radius={0.02}
            smoothness={3}
          />
          <RoundedBox
            args={[0.14, 0.48, 0.09]}
            material={materials.dark}
            position={[1.27, -0.54, 0.28]}
            radius={0.025}
            smoothness={3}
          />
        </>
      ) : null}
    </group>
  );
}
