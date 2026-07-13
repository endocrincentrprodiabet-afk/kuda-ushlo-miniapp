import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type ReserveParticlesProps = {
  animated: boolean;
  count: number;
  isActive: boolean;
  pulse: MutableRefObject<number>;
  visualProgress: number;
  spread?: number;
};

function createParticlePositions(particleCount: number, spread: number): Float32Array {
  const positions = new Float32Array(particleCount * 3);
  let seed = 2749;

  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let index = 0; index < particleCount; index += 1) {
    const radius = spread * (0.66 + random() * 0.34);
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const offset = index * 3;

    positions[offset] = radius * Math.sin(phi) * Math.cos(theta);
    positions[offset + 1] = radius * Math.cos(phi) * 0.74;
    positions[offset + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  return positions;
}

export function ReserveParticles({
  animated,
  count,
  isActive,
  pulse,
  visualProgress,
  spread = 2.24,
}: ReserveParticlesProps) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.PointsMaterial>(null);
  const positions = useMemo(() => createParticlePositions(count, spread), [count, spread]);

  useFrame((_, delta) => {
    if (!isActive || !animated || !points.current) {
      return;
    }

    const safeDelta = Math.min(delta, 0.05);
    const speed = 0.02 + visualProgress * 0.022 + pulse.current * 0.18;
    points.current.rotation.y += safeDelta * speed;
    points.current.rotation.x += safeDelta * speed * 0.16;

    if (material.current) {
      material.current.opacity = 0.26 + visualProgress * 0.32 + pulse.current * 0.14;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={material}
        blending={THREE.AdditiveBlending}
        color="#8de9d7"
        depthWrite={false}
        opacity={0.26 + visualProgress * 0.32}
        size={0.024 + visualProgress * 0.01}
        sizeAttenuation
        transparent
      />
    </points>
  );
}
