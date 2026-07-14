import { RoundedBox } from '@react-three/drei';
import type { GoalObjectProps } from './types';
import { useGoalObjectMaterials } from './useGoalObjectMaterials';

export function TravelGoalObject({ progress, quality }: GoalObjectProps) {
  const materials = useGoalObjectMaterials(progress, quality);
  const smoothness = quality === 'high' ? 5 : quality === 'medium' ? 4 : 2;
  const segments = quality === 'high' ? 20 : quality === 'medium' ? 14 : 10;

  return (
    <group position={[0, -0.04, 0]} rotation={[0.035, -0.3, -0.025]} scale={0.98}>
      <RoundedBox
        args={[1.36, 1.7, 0.64]}
        material={materials.body}
        radius={0.12}
        smoothness={smoothness}
      />
      <RoundedBox
        args={[1.14, 1.48, 0.045]}
        material={materials.dark}
        position={[0, 0, 0.34]}
        radius={0.08}
        smoothness={smoothness}
      />
      {[-0.4, 0, 0.4].map((x) => (
        <RoundedBox
          args={[0.045, 1.3, 0.025]}
          key={x}
          material={materials.accent}
          position={[x, 0, 0.375]}
          radius={0.012}
          smoothness={smoothness}
        />
      ))}

      {[-0.38, 0.38].map((x) => (
        <mesh key={x} material={materials.dark} position={[x, 1.17, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.7, segments]} />
        </mesh>
      ))}
      <RoundedBox
        args={[0.82, 0.1, 0.17]}
        material={materials.accent}
        position={[0, 1.51, 0]}
        radius={0.04}
        smoothness={smoothness}
      />

      {[-0.46, 0.46].map((x) => (
        <group key={x} position={[x, -0.96, 0.08]}>
          <mesh material={materials.dark}>
            <torusGeometry args={[0.13, 0.045, 6, segments]} />
          </mesh>
          <mesh material={materials.accent} position={[0, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.035, segments]} />
          </mesh>
        </group>
      ))}

      {quality !== 'low' ? (
        <group position={[0.54, 0.31, 0.39]} rotation={[0, 0, -0.12]}>
          <RoundedBox
            args={[0.3, 0.43, 0.035]}
            material={materials.accent}
            radius={0.045}
            smoothness={smoothness}
          />
          <RoundedBox
            args={[0.17, 0.23, 0.018]}
            material={materials.dark}
            position={[0, 0.045, 0.03]}
            radius={0.025}
            smoothness={smoothness}
          />
        </group>
      ) : null}
    </group>
  );
}
