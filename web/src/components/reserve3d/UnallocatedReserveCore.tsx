import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { ReserveQualityTier } from './reserveQuality';

type UnallocatedReserveCoreProps = {
  coreGeometry: THREE.BufferGeometry;
  isActive: boolean;
  quality: ReserveQualityTier;
  radius: number;
  reducedMotion: boolean;
  reserveTotal: number;
  shellGeometry: THREE.BufferGeometry;
  unallocatedReserve: number;
};

export function UnallocatedReserveCore({
  coreGeometry,
  isActive,
  quality,
  radius,
  reducedMotion,
  reserveTotal,
  shellGeometry,
  unallocatedReserve,
}: UnallocatedReserveCoreProps) {
  const core = useRef<THREE.Mesh>(null);
  const currentScale = useRef(0);
  const invalidate = useThree((state) => state.invalidate);
  const ratio = reserveTotal > 0 ? Math.min(1, unallocatedReserve / reserveTotal) : 0;
  const targetScale = ratio <= 0 ? 0 : 0.82 * Math.cbrt(ratio);
  const shellMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#31504b',
        depthWrite: false,
        emissive: '#153d37',
        emissiveIntensity: 0.18,
        metalness: 0.04,
        opacity: quality === 'low' ? 0.15 : 0.2,
        roughness: 0.46,
        transparent: true,
      }),
    [quality],
  );
  const coreMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#75cdbd',
        emissive: '#2b8071',
        emissiveIntensity: quality === 'low' ? 0.28 : 0.46,
        metalness: 0.04,
        roughness: 0.42,
      }),
    [quality],
  );

  useEffect(
    () => () => {
      shellMaterial.dispose();
      coreMaterial.dispose();
    },
    [coreMaterial, shellMaterial],
  );

  useFrame((state, delta) => {
    if (!isActive) {
      return;
    }

    currentScale.current = THREE.MathUtils.damp(currentScale.current, targetScale, 6, Math.min(delta, 0.05));

    if (core.current) {
      core.current.visible = currentScale.current > 0.001;
      core.current.scale.setScalar(currentScale.current);

      if (!reducedMotion && quality !== 'low') {
        core.current.rotation.y = state.clock.elapsedTime * 0.08;
      }
    }

    if (Math.abs(currentScale.current - targetScale) > 0.001) {
      invalidate();
    }
  });

  return (
    <group scale={radius}>
      <mesh geometry={shellGeometry} material={shellMaterial} />
      <mesh geometry={coreGeometry} material={coreMaterial} ref={core} scale={targetScale} visible={targetScale > 0} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.18, 0.01, 6, quality === 'low' ? 24 : 48]} />
        <meshBasicMaterial color="#52736d" depthWrite={false} opacity={0.26} transparent />
      </mesh>
    </group>
  );
}
