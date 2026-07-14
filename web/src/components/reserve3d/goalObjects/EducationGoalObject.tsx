import { RoundedBox } from '@react-three/drei';
import type { GoalObjectProps } from './types';
import { useGoalObjectMaterials } from './useGoalObjectMaterials';

const bookTransforms = [
  { position: [0, -0.62, 0] as const, rotation: [0, 0.05, -0.07] as const, width: 1.92 },
  { position: [0.08, -0.02, 0] as const, rotation: [0, -0.04, 0.08] as const, width: 1.78 },
  { position: [-0.04, 0.58, 0] as const, rotation: [0, 0.06, -0.04] as const, width: 1.68 },
];

export function EducationGoalObject({ progress, quality }: GoalObjectProps) {
  const materials = useGoalObjectMaterials(progress, quality);
  const smoothness = quality === 'high' ? 5 : quality === 'medium' ? 4 : 2;

  return (
    <group rotation={[0.07, -0.31, -0.025]} scale={0.98}>
      {bookTransforms.map((book, index) => (
        <group key={index} position={book.position} rotation={book.rotation}>
          <RoundedBox
            args={[book.width, 0.38, 0.98 - index * 0.04]}
            material={index === 1 ? materials.dark : materials.body}
            radius={0.065}
            smoothness={smoothness}
          />
          <RoundedBox
            args={[book.width - 0.22, 0.22, 0.87 - index * 0.04]}
            material={materials.glass}
            position={[0.07, 0, 0.025]}
            radius={0.04}
            smoothness={smoothness}
          />
          <RoundedBox
            args={[0.13, 0.4, 1 - index * 0.04]}
            material={materials.accent}
            position={[-book.width / 2 + 0.06, 0, 0]}
            radius={0.025}
            smoothness={smoothness}
          />
        </group>
      ))}

      {quality !== 'low' ? (
        <group position={[0.62, 1.06, 0.04]} rotation={[0, 0, -0.13]}>
          <RoundedBox
            args={[0.11, 0.76, 0.065]}
            material={materials.accent}
            radius={0.025}
            smoothness={smoothness}
          />
          <mesh material={materials.dark} position={[0, -0.43, 0]} rotation={[0, 0, Math.PI / 4]}>
            <octahedronGeometry args={[0.13, quality === 'high' ? 1 : 0]} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}
