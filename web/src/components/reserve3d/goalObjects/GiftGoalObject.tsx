import { RoundedBox } from '@react-three/drei';
import type { GoalObjectProps } from './types';
import { useGoalObjectMaterials } from './useGoalObjectMaterials';

export function GiftGoalObject({ progress, quality }: GoalObjectProps) {
  const materials = useGoalObjectMaterials(progress, quality);
  const smoothness = quality === 'high' ? 5 : quality === 'medium' ? 4 : 2;
  const bowSegments = quality === 'high' ? 24 : quality === 'medium' ? 18 : 12;

  return (
    <group position={[0, -0.08, 0]} rotation={[0.035, -0.34, -0.012]} scale={0.96}>
      <RoundedBox
        args={[1.5, 1.08, 1.28]}
        material={materials.body}
        position={[0, -0.24, 0]}
        radius={0.09}
        smoothness={smoothness}
      />
      <RoundedBox
        args={[1.64, 0.22, 1.4]}
        material={materials.dark}
        position={[0, 0.39, 0]}
        radius={0.065}
        smoothness={smoothness}
      />

      <RoundedBox
        args={[0.21, 1.13, 1.3]}
        material={materials.accent}
        position={[0, -0.21, 0]}
        radius={0.03}
        smoothness={smoothness}
      />
      <RoundedBox
        args={[0.22, 0.055, 1.43]}
        material={materials.accent}
        position={[0, 0.515, 0]}
        radius={0.018}
        smoothness={smoothness}
      />
      <RoundedBox
        args={[1.66, 0.055, 0.22]}
        material={materials.accent}
        position={[0, 0.518, 0]}
        radius={0.018}
        smoothness={smoothness}
      />

      <group position={[0, 0.78, 0.04]}>
        <mesh material={materials.accent} position={[-0.24, 0.08, 0]} rotation={[0, 0, 0.28]} scale={[0.9, 0.52, 0.72]}>
          <torusGeometry args={[0.25, 0.055, 6, bowSegments]} />
        </mesh>
        <mesh material={materials.accent} position={[0.24, 0.08, 0]} rotation={[0, 0, -0.28]} scale={[0.9, 0.52, 0.72]}>
          <torusGeometry args={[0.25, 0.055, 6, bowSegments]} />
        </mesh>
        <mesh material={materials.dark} position={[0, 0.04, 0.04]} scale={[1.05, 0.8, 0.92]}>
          <octahedronGeometry args={[0.14, quality === 'high' ? 1 : 0]} />
        </mesh>
        {quality !== 'low' ? (
          <>
            <mesh material={materials.accent} position={[-0.12, -0.15, 0]} rotation={[0, 0, -0.32]}>
              <coneGeometry args={[0.09, 0.38, 4]} />
            </mesh>
            <mesh material={materials.accent} position={[0.12, -0.15, 0]} rotation={[0, 0, 0.32]}>
              <coneGeometry args={[0.09, 0.38, 4]} />
            </mesh>
          </>
        ) : null}
      </group>

      {quality === 'high' ? (
        <RoundedBox
          args={[0.035, 0.72, 0.02]}
          material={materials.glass}
          position={[0.755, -0.17, 0.4]}
          radius={0.01}
          rotation={[0, 0.12, 0.08]}
          smoothness={3}
        />
      ) : null}
    </group>
  );
}
