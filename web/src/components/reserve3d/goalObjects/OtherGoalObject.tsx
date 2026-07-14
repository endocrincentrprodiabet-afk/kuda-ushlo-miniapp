import type { GoalObjectProps } from './types';
import { useGoalObjectMaterials } from './useGoalObjectMaterials';

export function OtherGoalObject({ progress, quality }: GoalObjectProps) {
  const materials = useGoalObjectMaterials(progress, quality);

  return (
    <group rotation={[0.1, -0.24, 0.04]}>
      <mesh material={materials.body} scale={[1.05, 1.6, 0.92]}>
        <octahedronGeometry args={[1, quality === 'high' ? 1 : 0]} />
      </mesh>
      <mesh material={materials.glass} rotation={[0.24, 0.5, 0.12]} scale={[0.7, 1.18, 0.68]}>
        <icosahedronGeometry args={[1, quality === 'high' ? 1 : 0]} />
      </mesh>
      <mesh material={materials.accent} position={[-0.92, -0.28, 0.08]} rotation={[0.12, 0, -0.32]} scale={[0.22, 0.72, 0.2]}>
        <octahedronGeometry args={[1, 0]} />
      </mesh>
      <mesh material={materials.accent} position={[0.88, 0.36, -0.08]} rotation={[-0.16, 0, 0.28]} scale={[0.18, 0.58, 0.18]}>
        <octahedronGeometry args={[1, 0]} />
      </mesh>
      {quality !== 'low' ? (
        <mesh material={materials.accent} rotation={[Math.PI / 2.5, 0.18, -0.2]}>
          <torusGeometry args={[1.3, 0.025, 5, quality === 'high' ? 48 : 28]} />
        </mesh>
      ) : null}
    </group>
  );
}
