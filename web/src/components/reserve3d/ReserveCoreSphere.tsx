import { useMemo, useRef, type MutableRefObject } from 'react';
import { MeshDistortMaterial } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { reserveQualityConfigs, type ReserveQualityTier } from './reserveQuality';

type ReserveCoreSphereProps = {
  animateIdle: boolean;
  coreScale: number;
  isActive: boolean;
  pulse: MutableRefObject<number>;
  quality: ReserveQualityTier;
  reducedMotion: boolean;
  visualProgress: number;
};

export function ReserveCoreSphere({
  animateIdle,
  coreScale,
  isActive,
  pulse,
  quality,
  reducedMotion,
  visualProgress,
}: ReserveCoreSphereProps) {
  const floatingGroup = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const coreWire = useRef<THREE.Mesh>(null);
  const pulseShell = useRef<THREE.Mesh>(null);
  const pulseMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const currentScale = useRef(coreScale);
  const invalidate = useThree((state) => state.invalidate);
  const config = reserveQualityConfigs[quality];
  const shellGeometryArgs = useMemo(
    () => [1.34, config.shellSegments[0], config.shellSegments[1]] as const,
    [config.shellSegments],
  );
  const wireGeometryArgs = useMemo(
    () => [1.344, Math.max(16, config.shellSegments[0] - 8), Math.max(12, config.shellSegments[1] - 8)] as const,
    [config.shellSegments],
  );
  const coreGeometryArgs = useMemo(() => [1.28, config.coreDetail] as const, [config.coreDetail]);
  const coreWireGeometryArgs = useMemo(() => [1.28, config.wireDetail] as const, [config.wireDetail]);

  useFrame((state, delta) => {
    if (!isActive) {
      return;
    }

    const safeDelta = Math.min(delta, 0.05);
    const pulseStrength = animateIdle && !reducedMotion ? pulse.current : 0;
    const idlePulse = animateIdle
      ? Math.sin(state.clock.elapsedTime * (1.15 + visualProgress * 0.55)) * (0.003 + visualProgress * 0.006)
      : 0;
    const targetScale = coreScale * (1 + pulseStrength * 0.07 + idlePulse);
    currentScale.current = THREE.MathUtils.damp(currentScale.current, targetScale, 6, safeDelta);

    if (Math.abs(currentScale.current - targetScale) <= 0.0008) {
      currentScale.current = targetScale;
    }

    const showCore = currentScale.current > 0.0015;

    if (floatingGroup.current) {
      floatingGroup.current.position.y = animateIdle ? Math.sin(state.clock.elapsedTime * 0.72) * 0.036 : 0;
    }

    if (core.current) {
      core.current.visible = showCore;
      core.current.scale.setScalar(currentScale.current);
      if (animateIdle) {
        core.current.rotation.y += safeDelta * (0.13 + visualProgress * 0.13);
        core.current.rotation.x += safeDelta * 0.035;
      }
    }

    if (coreWire.current) {
      coreWire.current.visible = showCore;
      coreWire.current.scale.setScalar(currentScale.current * 1.018);
      if (animateIdle) {
        coreWire.current.rotation.y -= safeDelta * 0.08;
      }
    }

    if (pulseShell.current && pulseMaterial.current) {
      pulseShell.current.scale.setScalar(1.02 + (1 - pulseStrength) * 0.42);
      pulseMaterial.current.opacity = pulseStrength * 0.14;
    }

    if (Math.abs(currentScale.current - targetScale) > 0.001) {
      invalidate();
    }
  });

  return (
    <group ref={floatingGroup}>
      <mesh>
        <sphereGeometry args={shellGeometryArgs} />
        {config.shellMaterial === 'physical' ? (
          <meshPhysicalMaterial
            clearcoat={0.68}
            clearcoatRoughness={0.26}
            color="#5bd6c0"
            depthWrite={false}
            ior={1.3}
            metalness={0.03}
            opacity={0.17}
            roughness={0.28}
            thickness={0.58}
            transmission={0.46}
            transparent
          />
        ) : config.shellMaterial === 'standard' ? (
          <meshStandardMaterial
            color="#4aa998"
            depthWrite={false}
            metalness={0.08}
            opacity={0.16}
            roughness={0.38}
            transparent
          />
        ) : (
          <meshBasicMaterial color="#397d73" depthWrite={false} opacity={0.14} transparent />
        )}
      </mesh>

      <mesh>
        <sphereGeometry args={wireGeometryArgs} />
        <meshBasicMaterial
          color="#78e6d3"
          depthWrite={false}
          opacity={quality === 'low' ? 0.16 : 0.1}
          transparent
          wireframe
        />
      </mesh>

      <mesh ref={core} scale={coreScale} visible={coreScale > 0}>
        <icosahedronGeometry args={coreGeometryArgs} />
        {quality === 'high' ? (
          <MeshDistortMaterial
            color="#c7f04a"
            distort={0.055 + visualProgress * 0.07}
            emissive="#6eaa24"
            emissiveIntensity={0.58 + visualProgress * 0.58}
            metalness={0.08}
            roughness={0.34}
            speed={animateIdle ? 0.42 + visualProgress * 0.3 : 0}
          />
        ) : (
          <meshStandardMaterial
            color="#c7f04a"
            emissive="#6eaa24"
            emissiveIntensity={quality === 'low' ? 0.4 : 0.56 + visualProgress * 0.45}
            metalness={0.05}
            roughness={quality === 'low' ? 0.48 : 0.38}
          />
        )}
      </mesh>

      <mesh ref={coreWire} scale={coreScale} visible={coreScale > 0}>
        <icosahedronGeometry args={coreWireGeometryArgs} />
        <meshBasicMaterial
          color="#d7ff17"
          depthWrite={false}
          opacity={quality === 'low' ? 0.08 : 0.11 + visualProgress * 0.08}
          transparent
          wireframe
        />
      </mesh>

      {quality === 'high' ? (
        <mesh ref={pulseShell} scale={1.02}>
          <sphereGeometry args={shellGeometryArgs} />
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
      ) : null}
    </group>
  );
}
