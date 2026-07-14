import type { GoalObjectProps } from './types';
import { useGoalObjectMaterials } from './useGoalObjectMaterials';

export function TravelGoalObject({ progress, quality }: GoalObjectProps) {
  const materials = useGoalObjectMaterials(progress, quality);
  const segments = quality === 'high' ? 16 : quality === 'medium' ? 12 : 8;

  return (
    <group rotation={[0.04, -0.28, -0.035]}>
      <mesh material={materials.body} scale={[1.42, 1.82, 0.62]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.dark} position={[0, 0, 0.325]} scale={[1.22, 1.62, 0.035]}>
        <boxGeometry />
      </mesh>
      {[-0.48, 0, 0.48].map((x) => (
        <mesh key={x} material={materials.accent} position={[x, 0, 0.37]} scale={[0.055, 1.48, 0.025]}>
          <boxGeometry />
        </mesh>
      ))}
      {[-0.38, 0.38].map((x) => (
        <mesh key={x} material={materials.dark} position={[x, 1.35, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.92, 6]} />
        </mesh>
      ))}
      <mesh material={materials.accent} position={[0, 1.82, 0]} scale={[0.82, 0.1, 0.16]}>
        <boxGeometry />
      </mesh>
      {[-0.48, 0.48].map((x) => (
        <mesh key={x} material={materials.dark} position={[x, -1.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.18, segments]} />
        </mesh>
      ))}
      {quality !== 'low' ? (
        <group position={[0.56, 0.34, 0.4]} rotation={[0, 0, -0.16]}>
          <mesh material={materials.accent} scale={[0.28, 0.42, 0.035]}>
            <boxGeometry />
          </mesh>
          <mesh material={materials.dark} position={[0, 0.07, 0.04]} scale={[0.16, 0.22, 0.02]}>
            <boxGeometry />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}
