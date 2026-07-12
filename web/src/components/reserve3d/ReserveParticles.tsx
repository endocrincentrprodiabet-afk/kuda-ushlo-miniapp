import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type ReserveParticlesProps = {
  pulse: React.MutableRefObject<number>;
  reducedMotion: boolean;
  visualProgress: number;
};

const particleCount = 72;

function createParticlePositions(): Float32Array {
  const positions = new Float32Array(particleCount * 3);
  let seed = 2749;

  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let index = 0; index < particleCount; index += 1) {
    const radius = 1.52 + random() * 0.72;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const offset = index * 3;

    positions[offset] = radius * Math.sin(phi) * Math.cos(theta);
    positions[offset + 1] = radius * Math.cos(phi) * 0.74;
    positions[offset + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  return positions;
}

export function ReserveParticles({ pulse, reducedMotion, visualProgress }: ReserveParticlesProps) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.PointsMaterial>(null);
  const positions = useMemo(createParticlePositions, []);

  useFrame((_, delta) => {
    if (reducedMotion || !points.current) {
      return;
    }

    const safeDelta = Math.min(delta, 0.05);
    const speed = 0.025 + visualProgress * 0.025 + pulse.current * 0.22;
    points.current.rotation.y += safeDelta * speed;
    points.current.rotation.x += safeDelta * speed * 0.18;

    if (material.current) {
      material.current.opacity = 0.3 + visualProgress * 0.36 + pulse.current * 0.18;
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
        opacity={0.3 + visualProgress * 0.36}
        size={0.026 + visualProgress * 0.012}
        sizeAttenuation
        transparent
      />
    </points>
  );
}
