import type { GoalObjectProps } from './types';
import { useGoalObjectMaterials } from './useGoalObjectMaterials';

export function EducationGoalObject({ progress, quality }: GoalObjectProps) {
  const materials = useGoalObjectMaterials(progress, quality);

  return (
    <group rotation={[0.1, -0.3, -0.03]}>
      <group position={[0, -0.62, 0]} rotation={[0, 0.05, -0.08]}>
        <mesh material={materials.body} scale={[2, 0.34, 1.02]}>
          <boxGeometry />
        </mesh>
        <mesh material={materials.accent} position={[-0.94, 0, 0.04]} scale={[0.12, 0.36, 1.04]}>
          <boxGeometry />
        </mesh>
        <mesh material={materials.glass} position={[0.08, 0.2, 0]} scale={[1.72, 0.045, 0.86]}>
          <boxGeometry />
        </mesh>
      </group>
      <group position={[0.08, 0, 0]} rotation={[0, -0.04, 0.1]}>
        <mesh material={materials.body} scale={[1.82, 0.34, 0.96]}>
          <boxGeometry />
        </mesh>
        <mesh material={materials.accent} position={[-0.85, 0, 0]} scale={[0.12, 0.36, 0.98]}>
          <boxGeometry />
        </mesh>
      </group>
      <group position={[-0.04, 0.62, 0]} rotation={[0, 0.08, -0.045]}>
        <mesh material={materials.body} scale={[1.7, 0.34, 0.9]}>
          <boxGeometry />
        </mesh>
        <mesh material={materials.accent} position={[-0.79, 0, 0]} scale={[0.12, 0.36, 0.92]}>
          <boxGeometry />
        </mesh>
      </group>
      {quality !== 'low' ? (
        <group position={[0.84, 1.22, 0]}>
          <mesh material={materials.accent} scale={[0.08, 0.68, 0.08]}>
            <octahedronGeometry args={[1, 0]} />
          </mesh>
          <mesh material={materials.glass} position={[0, -0.48, 0]} scale={[0.28, 0.08, 0.28]}>
            <octahedronGeometry args={[1, 0]} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}
