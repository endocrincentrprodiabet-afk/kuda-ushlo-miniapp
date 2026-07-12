import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

type ReserveCoreSphereProps = {
  coreScale: number;
  pulse: React.MutableRefObject<number>;
  reducedMotion: boolean;
  visualProgress: number;
};

export function ReserveCoreSphere({ coreScale, pulse, reducedMotion, visualProgress }: ReserveCoreSphereProps) {
  const floatingGroup = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const coreWire = useRef<THREE.Mesh>(null);
  const pulseShell = useRef<THREE.Mesh>(null);
  const pulseMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const currentScale = useRef(coreScale);

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.05);
    const pulseStrength = reducedMotion ? 0 : pulse.current;
    const idlePulse = reducedMotion
      ? 0
      : Math.sin(state.clock.elapsedTime * (1.15 + visualProgress * 0.55)) * (0.004 + visualProgress * 0.008);
    currentScale.current = THREE.MathUtils.damp(
      currentScale.current,
      coreScale * (1 + pulseStrength * 0.085 + idlePulse),
      6,
      safeDelta,
    );

    if (floatingGroup.current) {
      floatingGroup.current.position.y = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.72) * 0.045;
    }

    if (core.current) {
      core.current.scale.setScalar(currentScale.current);
      if (!reducedMotion) {
        core.current.rotation.y += safeDelta * (0.16 + visualProgress * 0.16);
        core.current.rotation.x += safeDelta * 0.045;
      }
    }

    if (coreWire.current) {
      coreWire.current.scale.setScalar(currentScale.current * 1.035);
      if (!reducedMotion) {
        coreWire.current.rotation.y -= safeDelta * 0.1;
      }
    }

    if (pulseShell.current && pulseMaterial.current) {
      pulseShell.current.scale.setScalar(1.02 + (1 - pulseStrength) * 0.48);
      pulseMaterial.current.opacity = pulseStrength * 0.18;
    }
  });

  return (
    <group ref={floatingGroup}>
      <mesh>
        <sphereGeometry args={[1.34, 48, 48]} />
        <meshPhysicalMaterial
          clearcoat={0.72}
          clearcoatRoughness={0.24}
          color="#5bd6c0"
          depthWrite={false}
          ior={1.32}
          metalness={0.04}
          opacity={0.18}
          roughness={0.24}
          thickness={0.7}
          transmission={0.54}
          transparent
        />
      </mesh>

      <mesh scale={1.008}>
        <sphereGeometry args={[1.34, 32, 32]} />
        <meshBasicMaterial color="#78e6d3" opacity={0.11} transparent wireframe />
      </mesh>

      <mesh ref={core}>
        <icosahedronGeometry args={[0.78, 4]} />
        <MeshDistortMaterial
          color="#c7f04a"
          distort={0.075 + visualProgress * 0.085}
          emissive="#6eaa24"
          emissiveIntensity={0.62 + visualProgress * 0.7}
          metalness={0.08}
          roughness={0.34}
          speed={reducedMotion ? 0 : 0.48 + visualProgress * 0.38}
        />
      </mesh>

      <mesh ref={coreWire}>
        <icosahedronGeometry args={[0.78, 2]} />
        <meshBasicMaterial color="#d7ff17" opacity={0.13 + visualProgress * 0.1} transparent wireframe />
      </mesh>

      <mesh ref={pulseShell} scale={1.02}>
        <sphereGeometry args={[1.35, 32, 32]} />
        <meshBasicMaterial
          ref={pulseMaterial}
          blending={THREE.AdditiveBlending}
          color="#d7ff17"
          depthWrite={false}
          opacity={0}
          side={THREE.BackSide}
          transparent
        />
      </mesh>
    </group>
  );
}
