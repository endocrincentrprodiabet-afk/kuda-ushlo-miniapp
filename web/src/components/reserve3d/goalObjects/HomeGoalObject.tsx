import type { GoalObjectProps } from './types';
import { useGoalObjectMaterials } from './useGoalObjectMaterials';

export function HomeGoalObject({ progress, quality }: GoalObjectProps) {
  const materials = useGoalObjectMaterials(progress, quality);

  return (
    <group rotation={[0.04, -0.38, 0]}>
      <mesh material={materials.body} position={[-0.48, -0.22, 0]} scale={[1.52, 1.34, 1.25]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.body} position={[0.92, -0.48, 0.08]} scale={[1.05, 0.82, 1.05]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.dark} position={[-0.5, 0.62, 0]} rotation={[0, 0, 0.13]} scale={[1.72, 0.16, 1.42]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.dark} position={[0.9, 0.02, 0.08]} rotation={[0, 0, -0.08]} scale={[1.2, 0.13, 1.18]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.glass} position={[-0.72, -0.08, 0.64]} scale={[0.55, 0.52, 0.04]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.glass} position={[0.82, -0.42, 0.62]} scale={[0.5, 0.34, 0.04]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.accent} position={[0.02, -0.5, 0.65]} scale={[0.28, 0.74, 0.055]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.dark} position={[0, -1.0, 0]} scale={[2.55, 0.12, 1.62]}>
        <boxGeometry />
      </mesh>
      {quality === 'high' ? (
        <>
          <mesh material={materials.accent} position={[-0.75, -0.08, 0.7]} scale={[0.025, 0.52, 0.02]}>
            <boxGeometry />
          </mesh>
          <mesh material={materials.accent} position={[-0.72, -0.08, 0.7]} scale={[0.55, 0.025, 0.02]}>
            <boxGeometry />
          </mesh>
        </>
      ) : null}
    </group>
  );
}
