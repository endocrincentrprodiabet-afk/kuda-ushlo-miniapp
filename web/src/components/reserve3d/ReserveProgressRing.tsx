import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

type ReserveProgressRingProps = {
  goalProgress: number;
  hasGoal: boolean;
  reducedMotion: boolean;
};

const ringSegments = 128;
const ringRadius = 1.72;

function getRingPoint(progress: number): THREE.Vector3 {
  const angle = Math.PI / 2 - progress * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, 0);
}

export function ReserveProgressRing({ goalProgress, hasGoal, reducedMotion }: ReserveProgressRingProps) {
  const geometry = useRef<THREE.BufferGeometry>(null);
  const activePositions = useMemo(() => new Float32Array((ringSegments + 1) * 3), []);
  const trackPoints = useMemo(
    () => Array.from({ length: ringSegments + 1 }, (_, index) => getRingPoint(index / ringSegments)),
    [],
  );
  const displayedProgress = useRef(reducedMotion ? goalProgress : 0);
  const invalidate = useThree((state) => state.invalidate);

  const updateActiveArc = useCallback(
    (progress: number) => {
      if (!geometry.current || !hasGoal || progress <= 0) {
        geometry.current?.setDrawRange(0, 0);
        return;
      }

      const exactSegment = Math.min(ringSegments, progress * ringSegments);
      const wholeSegments = Math.floor(exactSegment);
      const vertexCount = Math.min(ringSegments + 1, wholeSegments + 2);

      for (let index = 0; index <= wholeSegments; index += 1) {
        const point = trackPoints[index];
        const offset = index * 3;
        activePositions[offset] = point.x;
        activePositions[offset + 1] = point.y;
        activePositions[offset + 2] = point.z;
      }

      if (wholeSegments < ringSegments) {
        const start = trackPoints[wholeSegments];
        const end = trackPoints[wholeSegments + 1];
        const fraction = exactSegment - wholeSegments;
        const offset = (wholeSegments + 1) * 3;
        activePositions[offset] = THREE.MathUtils.lerp(start.x, end.x, fraction);
        activePositions[offset + 1] = THREE.MathUtils.lerp(start.y, end.y, fraction);
        activePositions[offset + 2] = 0;
      }

      const positionAttribute = geometry.current.getAttribute('position') as THREE.BufferAttribute;
      positionAttribute.needsUpdate = true;
      geometry.current.setDrawRange(0, progress >= 1 ? ringSegments + 1 : vertexCount);
    },
    [activePositions, hasGoal, trackPoints],
  );

  useEffect(() => {
    if (reducedMotion) {
      displayedProgress.current = goalProgress;
      updateActiveArc(goalProgress);
      invalidate();
    }
  }, [goalProgress, invalidate, reducedMotion, updateActiveArc]);

  useFrame((_, delta) => {
    if (reducedMotion) {
      return;
    }

    displayedProgress.current = THREE.MathUtils.damp(
      displayedProgress.current,
      hasGoal ? goalProgress : 0,
      5,
      Math.min(delta, 0.05),
    );
    updateActiveArc(displayedProgress.current);
  });

  return (
    <group rotation={[0.34, -0.18, -0.12]}>
      <Line color="#48645f" lineWidth={1.15} opacity={0.52} points={trackPoints} transparent />
      <line>
        <bufferGeometry ref={geometry}>
          <bufferAttribute attach="attributes-position" args={[activePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#d7ff17"
          depthWrite={false}
          transparent
        />
      </line>
    </group>
  );
}
