import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

type ReserveProgressRingProps = {
  animateProgress: boolean;
  goalProgress: number;
  hasGoal: boolean;
  isActive: boolean;
  segments: number;
};

const ringRadius = 1.72;

function getRingPoint(progress: number): THREE.Vector3 {
  const angle = Math.PI / 2 - progress * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, 0);
}

export function ReserveProgressRing({
  animateProgress,
  goalProgress,
  hasGoal,
  isActive,
  segments,
}: ReserveProgressRingProps) {
  const geometry = useRef<THREE.BufferGeometry>(null);
  const activePositions = useMemo(() => new Float32Array((segments + 1) * 3), [segments]);
  const trackPoints = useMemo(
    () => Array.from({ length: segments + 1 }, (_, index) => getRingPoint(index / segments)),
    [segments],
  );
  const displayedProgress = useRef(animateProgress ? 0 : goalProgress);
  const invalidate = useThree((state) => state.invalidate);

  const updateActiveArc = useCallback(
    (progress: number) => {
      if (!geometry.current || !hasGoal || progress <= 0) {
        geometry.current?.setDrawRange(0, 0);
        return;
      }

      const exactSegment = Math.min(segments, progress * segments);
      const wholeSegments = Math.floor(exactSegment);
      const vertexCount = Math.min(segments + 1, wholeSegments + 2);

      for (let index = 0; index <= wholeSegments; index += 1) {
        const point = trackPoints[index];
        const offset = index * 3;
        activePositions[offset] = point.x;
        activePositions[offset + 1] = point.y;
        activePositions[offset + 2] = point.z;
      }

      if (wholeSegments < segments) {
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
      geometry.current.setDrawRange(0, progress >= 1 ? segments + 1 : vertexCount);
    },
    [activePositions, hasGoal, segments, trackPoints],
  );

  useEffect(() => {
    if (!animateProgress) {
      displayedProgress.current = hasGoal ? goalProgress : 0;
      updateActiveArc(displayedProgress.current);
      invalidate();
    }
  }, [animateProgress, goalProgress, hasGoal, invalidate, updateActiveArc]);

  useFrame((_, delta) => {
    if (!isActive || !animateProgress) {
      return;
    }

    const targetProgress = hasGoal ? goalProgress : 0;
    displayedProgress.current = THREE.MathUtils.damp(
      displayedProgress.current,
      targetProgress,
      5,
      Math.min(delta, 0.05),
    );

    if (Math.abs(displayedProgress.current - targetProgress) <= 0.0005) {
      displayedProgress.current = targetProgress;
    }

    updateActiveArc(displayedProgress.current);

    if (Math.abs(displayedProgress.current - targetProgress) > 0.0005) {
      invalidate();
    }
  });

  return (
    <group rotation={[0.34, -0.18, -0.12]}>
      <Line color="#48645f" lineWidth={1.05} opacity={0.48} points={trackPoints} transparent />
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
