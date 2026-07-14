import type { GoalObjectProps } from './types';
import { useGoalObjectMaterials } from './useGoalObjectMaterials';

export function GiftGoalObject({ progress, quality }: GoalObjectProps) {
  const materials = useGoalObjectMaterials(progress, quality);
  const segments = quality === 'high' ? 12 : 8;

  return (
    <group rotation={[0.04, -0.32, 0]}>
      <mesh material={materials.body} position={[0, -0.22, 0]} scale={[1.62, 1.28, 1.28]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.body} position={[0, 0.55, 0]} scale={[1.78, 0.24, 1.42]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.accent} position={[0, -0.18, 0.66]} scale={[0.28, 1.34, 0.035]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.accent} position={[0, 0.69, 0]} scale={[0.3, 0.06, 1.45]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.accent} position={[-0.38, 1.05, 0]} rotation={[Math.PI / 2, 0.4, 0]}>
        <torusGeometry args={[0.42, 0.09, 4, segments, Math.PI * 1.45]} />
      </mesh>
      <mesh material={materials.accent} position={[0.38, 1.05, 0]} rotation={[Math.PI / 2, -0.4, Math.PI]}>
        <torusGeometry args={[0.42, 0.09, 4, segments, Math.PI * 1.45]} />
      </mesh>
      <mesh material={materials.dark} position={[0, 0.96, 0]}>
        <octahedronGeometry args={[0.2, 0]} />
      </mesh>
      {quality !== 'low' ? (
        <mesh material={materials.glass} position={[0.82, -0.12, 0.4]} rotation={[0, 0.4, 0.16]} scale={[0.04, 0.72, 0.22]}>
          <boxGeometry />
        </mesh>
      ) : null}
    </group>
  );
}
