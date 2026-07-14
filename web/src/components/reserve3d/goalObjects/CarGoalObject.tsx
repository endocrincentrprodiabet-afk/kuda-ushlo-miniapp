import type { GoalObjectProps } from './types';
import { useGoalObjectMaterials } from './useGoalObjectMaterials';

export function CarGoalObject({ progress, quality }: GoalObjectProps) {
  const materials = useGoalObjectMaterials(progress, quality);
  const wheelSegments = quality === 'high' ? 16 : quality === 'medium' ? 12 : 8;
  const showFineDetails = quality !== 'low';

  return (
    <group rotation={[0.06, 0.42, -0.015]} scale={0.98}>
      <mesh material={materials.body} position={[0, -0.12, 0]} scale={[2.85, 0.42, 1.14]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.body} position={[-0.72, 0.2, 0]} rotation={[0, 0, -0.035]} scale={[1.46, 0.28, 1.06]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.body} position={[0.48, 0.42, 0]} rotation={[0, 0, 0.025]} scale={[1.22, 0.46, 0.94]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.glass} position={[0.22, 0.56, 0.48]} rotation={[-0.08, 0, 0.01]} scale={[0.72, 0.28, 0.035]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.glass} position={[0.72, 0.55, 0.47]} rotation={[-0.08, 0, 0.02]} scale={[0.34, 0.28, 0.04]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.dark} position={[-1.445, 0.02, 0]} scale={[0.055, 0.42, 0.72]}>
        <boxGeometry />
      </mesh>
      <mesh material={materials.accent} position={[-1.485, -0.14, 0]} scale={[0.026, 0.055, 0.52]}>
        <boxGeometry />
      </mesh>

      {[-0.37, 0.37].map((z) => (
        <group key={z} position={[-1.48, 0.25, z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={materials.accent}>
            <cylinderGeometry args={[0.13, 0.13, 0.045, wheelSegments]} />
          </mesh>
          {showFineDetails ? (
            <mesh material={materials.glass} position={[0, 0.16, 0]}>
              <cylinderGeometry args={[0.075, 0.075, 0.048, wheelSegments]} />
            </mesh>
          ) : null}
        </group>
      ))}

      {[-0.88, 0.9].flatMap((x) =>
        [-0.58, 0.58].map((z) => (
          <group key={`${x}-${z}`} position={[x, -0.35, z]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={materials.dark}>
              <cylinderGeometry args={[0.34, 0.34, 0.19, wheelSegments]} />
            </mesh>
            <mesh material={materials.accent} position={[0, -0.105, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.205, wheelSegments]} />
            </mesh>
          </group>
        )),
      )}

      {showFineDetails ? (
        <>
          <mesh material={materials.accent} position={[-0.35, 0.08, 0.585]} scale={[1.54, 0.035, 0.025]}>
            <boxGeometry />
          </mesh>
          <mesh material={materials.dark} position={[1.43, -0.05, 0]} scale={[0.05, 0.18, 0.82]}>
            <boxGeometry />
          </mesh>
        </>
      ) : null}
    </group>
  );
}
