import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ReserveCoreSphere } from './ReserveCoreSphere';
import { ReserveParticles } from './ReserveParticles';
import { ReserveProgressRing } from './ReserveProgressRing';
import { reserveQualityConfigs, type ReserveQualityTier } from './reserveQuality';
import type { ReserveVisualState } from '../../lib/reserveVisual';

type ReserveCoreSceneProps = {
  isActive: boolean;
  quality: ReserveQualityTier;
  reserveTotal: number;
  reducedMotion: boolean;
  visualState: ReserveVisualState;
};

type DragState = {
  active: boolean;
  pointerId: number;
  startX: number;
  startY: number;
  startRotationX: number;
  startRotationY: number;
};

const orbitRings = [
  { color: '#66d9c5', opacity: 0.26, radius: 1.48, rotation: [1.08, 0.08, 0.28] as const },
  { color: '#ff5aa3', opacity: 0.09, radius: 1.57, rotation: [0.4, 1.12, -0.18] as const },
];

type OrbitRingProps = (typeof orbitRings)[number] & { segments: number };

function OrbitRing({ color, opacity, radius, rotation, segments }: OrbitRingProps) {
  const geometryArgs = useMemo(() => [radius, 0.007, 6, segments] as const, [radius, segments]);

  return (
    <mesh rotation={rotation}>
      <torusGeometry args={geometryArgs} />
      <meshBasicMaterial color={color} depthWrite={false} opacity={opacity} transparent />
    </mesh>
  );
}

export function ReserveCoreScene({
  isActive,
  quality,
  reserveTotal,
  reducedMotion,
  visualState,
}: ReserveCoreSceneProps) {
  const interactionGroup = useRef<THREE.Group>(null);
  const autoRotationGroup = useRef<THREE.Group>(null);
  const pulse = useRef(0);
  const previousTotal = useRef(reserveTotal);
  const previousGoalReached = useRef(visualState.goalReached);
  const hasMounted = useRef(false);
  const targetRotation = useRef({ x: 0, y: 0 });
  const drag = useRef<DragState | null>(null);
  const invalidate = useThree((state) => state.invalidate);
  const regress = useThree((state) => state.performance.regress);
  const config = reserveQualityConfigs[quality];
  const visibleOrbitRings = useMemo(() => orbitRings.slice(0, config.orbitRingCount), [config.orbitRingCount]);
  const animateIdle = isActive && !reducedMotion && config.animateIdle;
  const baseGeometryArgs = useMemo(
    () => [0.9, 1.12, 0.08, config.baseSegments] as const,
    [config.baseSegments],
  );
  const baseRingArgs = useMemo(
    () => [0.73, 0.012, 6, config.baseSegments] as const,
    [config.baseSegments],
  );
  const hitAreaArgs = useMemo(() => [1.82, 16, 12] as const, []);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      previousTotal.current = reserveTotal;
      previousGoalReached.current = visualState.goalReached;
      return;
    }

    const reachedGoalNow = !previousGoalReached.current && visualState.goalReached;

    if ((previousTotal.current !== reserveTotal || reachedGoalNow) && !reducedMotion) {
      pulse.current = 1;
      invalidate();
    }

    previousTotal.current = reserveTotal;
    previousGoalReached.current = visualState.goalReached;
  }, [invalidate, reducedMotion, reserveTotal, visualState.goalReached]);

  useFrame((_, delta) => {
    if (!isActive) {
      return;
    }

    const safeDelta = Math.min(delta, 0.05);
    pulse.current = reducedMotion ? 0 : Math.max(0, pulse.current - safeDelta * 1.65);

    if (interactionGroup.current) {
      const snapSpeed = drag.current?.active ? 13 : 5.5;
      interactionGroup.current.rotation.x = THREE.MathUtils.damp(
        interactionGroup.current.rotation.x,
        targetRotation.current.x,
        snapSpeed,
        safeDelta,
      );
      interactionGroup.current.rotation.y = THREE.MathUtils.damp(
        interactionGroup.current.rotation.y,
        targetRotation.current.y,
        snapSpeed,
        safeDelta,
      );

      if (
        !config.animateIdle &&
        (Math.abs(interactionGroup.current.rotation.x - targetRotation.current.x) > 0.001 ||
          Math.abs(interactionGroup.current.rotation.y - targetRotation.current.y) > 0.001)
      ) {
        invalidate();
      }
    }

    if (autoRotationGroup.current && animateIdle && !drag.current?.active) {
      autoRotationGroup.current.rotation.y += safeDelta * 0.075;
    }
  });

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    regress();
    drag.current = {
      active: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRotationX: interactionGroup.current?.rotation.x ?? 0,
      startRotationY: interactionGroup.current?.rotation.y ?? 0,
    };
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    const currentDrag = drag.current;

    if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - currentDrag.startX;
    const deltaY = event.clientY - currentDrag.startY;

    if (!currentDrag.active) {
      if (Math.abs(deltaX) < 8 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) {
        return;
      }

      currentDrag.active = true;
      (event.target as Element).setPointerCapture?.(event.pointerId);
    }

    event.stopPropagation();
    targetRotation.current.x = THREE.MathUtils.clamp(currentDrag.startRotationX + deltaY * 0.0025, -0.3, 0.3);
    targetRotation.current.y = THREE.MathUtils.clamp(currentDrag.startRotationY + deltaX * 0.004, -0.56, 0.56);
    invalidate();
  }

  function handlePointerUp(event: ThreeEvent<PointerEvent>) {
    const currentDrag = drag.current;

    if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
      return;
    }

    (event.target as Element).releasePointerCapture?.(event.pointerId);
    drag.current = null;

    if (!reducedMotion && quality !== 'low') {
      targetRotation.current = { x: 0, y: 0 };
      invalidate();
    }
  }

  return (
    <>
      <ambientLight intensity={quality === 'low' ? 0.86 : 0.62} />
      <pointLight color="#6ee4d0" intensity={quality === 'low' ? 12 : 20} position={[3.2, 2.7, 3.4]} />
      <pointLight color="#d7ff17" intensity={quality === 'low' ? 10 : 16} position={[-3.4, 1.2, 1.8]} />
      {quality === 'high' ? <pointLight color="#ff2e8a" intensity={3.5} position={[1.2, -2.6, 2.2]} /> : null}

      <group ref={interactionGroup}>
        <group ref={autoRotationGroup}>
          <ReserveCoreSphere
            animateIdle={animateIdle}
            coreScale={visualState.coreScale}
            isActive={isActive}
            pulse={pulse}
            quality={quality}
            reducedMotion={reducedMotion}
            visualProgress={visualState.visualProgress}
          />
          <ReserveProgressRing
            animateProgress={!reducedMotion}
            goalProgress={visualState.goalProgress}
            hasGoal={visualState.hasGoal}
            isActive={isActive}
            segments={config.ringSegments}
          />
          <ReserveParticles
            animated={animateIdle}
            count={config.particleCount}
            isActive={isActive}
            pulse={pulse}
            visualProgress={visualState.visualProgress}
          />

          {visibleOrbitRings.map((ring) => (
            <OrbitRing key={ring.radius} {...ring} segments={quality === 'high' ? 64 : 40} />
          ))}
        </group>

        <mesh
          onPointerCancel={handlePointerUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <sphereGeometry args={hitAreaArgs} />
          <meshBasicMaterial colorWrite={false} depthWrite={false} />
        </mesh>
      </group>

      <group position={[0, -1.58, 0]}>
        <mesh>
          <cylinderGeometry args={baseGeometryArgs} />
          <meshStandardMaterial color="#17201f" metalness={0.22} roughness={0.5} />
        </mesh>
        {quality !== 'low' ? (
          <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={baseRingArgs} />
            <meshBasicMaterial color="#6ee4d0" depthWrite={false} opacity={0.3} transparent />
          </mesh>
        ) : null}
      </group>
    </>
  );
}
