import type { GoalObjectProps } from './types';
import { useGoalObjectMaterials } from './useGoalObjectMaterials';

export function TechGoalObject({ progress, quality }: GoalObjectProps) {
  const materials = useGoalObjectMaterials(progress, quality);
  const segments = quality === 'high' ? 16 : quality === 'medium' ? 12 : 8;

  return (
    <group rotation={[0.08, -0.24, -0.025]}>
      <mesh material={materials.body} scale={[2.05, 1.18, 0.3]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.glass} position={[0, 0.04, 0.18]} scale={[1.48, 0.82, 0.045]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.accent} position={[0, -0.83, 0]} scale={[0.48, 0.12, 0.24]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.dark} position={[0, -0.68, 0]} scale={[0.12, 0.28, 0.14]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.body} position={[-1.16, -0.02, 0]} rotation={[0, 0, 0.18]} scale={[0.38, 0.96, 0.34]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.body} position={[1.16, -0.02, 0]} rotation={[0, 0, -0.18]} scale={[0.38, 0.96, 0.34]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.accent} position={[-1.18, 0.15, 0.23]} scale={[0.22, 0.055, 0.04]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.accent} position={[-1.18, 0.15, 0.23]} rotation={[0, 0, Math.PI / 2]} scale={[0.22, 0.055, 0.04]}>
        <boxGeometry />
      </mesh>
      {[[-1.18, -0.34], [1.08, 0.14], [1.27, -0.18]].map(([x, y]) => (
        <mesh key={`${x}-${y}`} material={materials.accent} position={[x, y, 0.23]}>
          <cylinderGeometry args={[0.1, 0.1, 0.055, segments]} />
        </mesh>
      ))}
      {quality === 'high' ? (
        <mesh material={materials.accent} position={[0, 0.04, 0.235]} scale={[1.18, 0.025, 0.015]}>
          <boxGeometry />
        </mesh>
      ) : null}
    </group>
  );
}
