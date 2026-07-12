import { useEffect, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ReserveCoreSphere } from './ReserveCoreSphere';
import { ReserveParticles } from './ReserveParticles';
import { ReserveProgressRing } from './ReserveProgressRing';
import type { ReserveVisualState } from '../../lib/reserveVisual';

type ReserveCoreSceneProps = {
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

export function ReserveCoreScene({ reserveTotal, reducedMotion, visualState }: ReserveCoreSceneProps) {
  const interactionGroup = useRef<THREE.Group>(null);
  const autoRotationGroup = useRef<THREE.Group>(null);
  const pulse = useRef(0);
  const previousTotal = useRef(reserveTotal);
  const previousGoalReached = useRef(visualState.goalReached);
  const hasMounted = useRef(false);
  const targetRotation = useRef({ x: 0, y: 0 });
  const drag = useRef<DragState | null>(null);
  const [documentVisible, setDocumentVisible] = useState(() => document.visibilityState !== 'hidden');

  useEffect(() => {
    const handleVisibilityChange = () => setDocumentVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      previousTotal.current = reserveTotal;
      return;
    }

    const reachedGoalNow = !previousGoalReached.current && visualState.goalReached;

    if ((previousTotal.current !== reserveTotal || reachedGoalNow) && !reducedMotion) {
      pulse.current = 1;
    }

    previousTotal.current = reserveTotal;
    previousGoalReached.current = visualState.goalReached;
  }, [reducedMotion, reserveTotal, visualState.goalReached]);

  useFrame((_, delta) => {
    if (!documentVisible) {
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
    }

    if (autoRotationGroup.current && !reducedMotion && !drag.current?.active) {
      autoRotationGroup.current.rotation.y += safeDelta * 0.075;
    }
  });

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
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
      if (Math.abs(deltaX) < 7 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) {
        return;
      }

      currentDrag.active = true;
      (event.target as Element).setPointerCapture?.(event.pointerId);
    }

    event.stopPropagation();
    targetRotation.current.x = THREE.MathUtils.clamp(currentDrag.startRotationX + deltaY * 0.0025, -0.32, 0.32);
    targetRotation.current.y = THREE.MathUtils.clamp(currentDrag.startRotationY + deltaX * 0.004, -0.58, 0.58);
  }

  function handlePointerUp(event: ThreeEvent<PointerEvent>) {
    const currentDrag = drag.current;

    if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
      return;
    }

    (event.target as Element).releasePointerCapture?.(event.pointerId);
    drag.current = null;

    if (!reducedMotion) {
      targetRotation.current = { x: 0, y: 0 };
    }
  }

  return (
    <>
      <ambientLight intensity={0.62} />
      <pointLight color="#6ee4d0" intensity={20} position={[3.2, 2.7, 3.4]} />
      <pointLight color="#d7ff17" intensity={16} position={[-3.4, 1.2, 1.8]} />
      <pointLight color="#ff2e8a" intensity={3.5} position={[1.2, -2.6, 2.2]} />

      <group ref={interactionGroup}>
        <group ref={autoRotationGroup}>
          <ReserveCoreSphere
            coreScale={visualState.coreScale}
            pulse={pulse}
            reducedMotion={reducedMotion || !documentVisible}
            visualProgress={visualState.visualProgress}
          />
          <ReserveProgressRing
            goalProgress={visualState.goalProgress}
            hasGoal={visualState.hasGoal}
            reducedMotion={reducedMotion || !documentVisible}
          />
          <ReserveParticles
            pulse={pulse}
            reducedMotion={reducedMotion || !documentVisible}
            visualProgress={visualState.visualProgress}
          />

          <mesh rotation={[1.08, 0.08, 0.28]}>
            <torusGeometry args={[1.48, 0.008, 8, 96]} />
            <meshBasicMaterial color="#66d9c5" opacity={0.28} transparent />
          </mesh>
          <mesh rotation={[0.4, 1.12, -0.18]}>
            <torusGeometry args={[1.57, 0.006, 8, 96]} />
            <meshBasicMaterial color="#ff5aa3" opacity={0.1} transparent />
          </mesh>
        </group>

        <mesh
          onPointerCancel={handlePointerUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <sphereGeometry args={[1.82, 24, 24]} />
          <meshBasicMaterial color="#ffffff" depthWrite={false} opacity={0} transparent />
        </mesh>
      </group>

      <group position={[0, -1.58, 0]}>
        <mesh>
          <cylinderGeometry args={[0.9, 1.12, 0.08, 64]} />
          <meshStandardMaterial color="#17201f" metalness={0.22} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.73, 0.012, 8, 64]} />
          <meshBasicMaterial color="#6ee4d0" opacity={0.34} transparent />
        </mesh>
      </group>
    </>
  );
}
