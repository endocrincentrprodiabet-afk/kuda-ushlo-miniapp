import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

type GoalProgressRingProps = {
  animateProgress: boolean;
  color: string;
  isActive: boolean;
  progress: number;
  radius: number;
  segments: number;
  selected: boolean;
};

export function GoalProgressRing({
  animateProgress,
  color,
  isActive,
  progress,
  radius,
  segments,
  selected,
}: GoalProgressRingProps) {
  const geometry = useRef<THREE.BufferGeometry>(null);
  const activePositions = useMemo(() => new Float32Array((segments + 1) * 3), [segments]);
  const trackPoints = useMemo(
    () =>
      Array.from({ length: segments + 1 }, (_, index) => {
        const angle = Math.PI / 2 - (index / segments) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      }),
    [radius, segments],
  );
  const displayedProgress = useRef(animateProgress ? 0 : progress);
  const invalidate = useThree((state) => state.invalidate);

  const updateArc = useCallback(
    (nextProgress: number) => {
      if (!geometry.current || nextProgress <= 0) {
        geometry.current?.setDrawRange(0, 0);
        return;
      }

      const exactSegment = Math.min(segments, nextProgress * segments);
      const wholeSegments = Math.floor(exactSegment);
      const vertexCount = Math.min(segments + 1, wholeSegments + 2);

      for (let index = 0; index <= wholeSegments; index += 1) {
        const point = trackPoints[index];
        const offset = index * 3;
        activePositions[offset] = point.x;
        activePositions[offset + 1] = point.y;
        activePositions[offset + 2] = 0;
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

      const attribute = geometry.current.getAttribute('position') as THREE.BufferAttribute;
      attribute.needsUpdate = true;
      geometry.current.setDrawRange(0, nextProgress >= 1 ? segments + 1 : vertexCount);
    },
    [activePositions, segments, trackPoints],
  );

  useEffect(() => {
    if (!animateProgress) {
      displayedProgress.current = progress;
      updateArc(progress);
      invalidate();
    }
  }, [animateProgress, invalidate, progress, updateArc]);

  useFrame((_, delta) => {
    if (!isActive || !animateProgress) {
      return;
    }

    displayedProgress.current = THREE.MathUtils.damp(
      displayedProgress.current,
      progress,
      6,
      Math.min(delta, 0.05),
    );

    if (Math.abs(displayedProgress.current - progress) <= 0.0005) {
      displayedProgress.current = progress;
    }

    updateArc(displayedProgress.current);

    if (Math.abs(displayedProgress.current - progress) > 0.0005) {
      invalidate();
    }
  });

  return (
    <group rotation={[0.16, -0.08, -0.08]}>
      <Line
        color={selected ? color : '#50635f'}
        lineWidth={selected ? 1.45 : 0.85}
        opacity={selected ? 0.46 : 0.28}
        points={trackPoints}
        transparent
      />
      <line>
        <bufferGeometry ref={geometry}>
          <bufferAttribute attach="attributes-position" args={[activePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          blending={THREE.AdditiveBlending}
          color={color}
          depthWrite={false}
          opacity={selected ? 1 : 0.76}
          transparent
        />
      </line>
    </group>
  );
}
