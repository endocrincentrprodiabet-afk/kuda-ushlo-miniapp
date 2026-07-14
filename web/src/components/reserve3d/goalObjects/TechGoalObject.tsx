import { RoundedBox } from '@react-three/drei';
import type { GoalObjectProps } from './types';
import { useGoalObjectMaterials } from './useGoalObjectMaterials';

export function TechGoalObject({ progress, quality }: GoalObjectProps) {
  const materials = useGoalObjectMaterials(progress, quality);
  const smoothness = quality === 'high' ? 5 : quality === 'medium' ? 4 : 2;
  const segments = quality === 'high' ? 20 : quality === 'medium' ? 14 : 10;
  const capsuleSegments = quality === 'high' ? 7 : quality === 'medium' ? 5 : 3;

  return (
    <group rotation={[0.055, -0.27, -0.018]} scale={0.92}>
      <RoundedBox
        args={[2.05, 1.16, 0.34]}
        material={materials.dark}
        radius={0.16}
        smoothness={smoothness}
      />
      <RoundedBox
        args={[1.5, 0.8, 0.055]}
        material={materials.glass}
        position={[0, 0.03, 0.2]}
        radius={0.075}
        smoothness={smoothness}
      />
      <RoundedBox
        args={[1.25, 0.035, 0.025]}
        material={materials.accent}
        position={[0, -0.31, 0.235]}
        radius={0.012}
        smoothness={smoothness}
      />

      {[-1.12, 1.12].map((x) => (
        <mesh key={x} material={materials.body} position={[x, -0.02, 0]}>
          <capsuleGeometry args={[0.29, 0.62, capsuleSegments, segments]} />
        </mesh>
      ))}

      <group position={[-1.13, 0.08, 0.31]}>
        <RoundedBox args={[0.32, 0.075, 0.055]} material={materials.accent} radius={0.025} smoothness={smoothness} />
        <RoundedBox args={[0.32, 0.075, 0.055]} material={materials.accent} radius={0.025} rotation={[0, 0, Math.PI / 2]} smoothness={smoothness} />
      </group>
      {[[1.03, 0.18], [1.22, 0.01], [1.18, 0.28]].map(([x, y]) => (
        <mesh key={`${x}-${y}`} material={materials.accent} position={[x, y, 0.31]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.045, segments]} />
        </mesh>
      ))}

      {quality === 'high' ? (
        <RoundedBox
          args={[0.48, 0.045, 0.03]}
          material={materials.accent}
          position={[0, 0.49, 0.215]}
          radius={0.012}
          smoothness={3}
        />
      ) : null}
    </group>
  );
}
