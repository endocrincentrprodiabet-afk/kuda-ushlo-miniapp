import { useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { getGoalProgress } from '../../lib/calculations';
import type { ReserveGoal } from '../../types';
import { GOAL_VISUAL_PALETTE, getGoalVisualState } from './goalObjects/goalVisualSystem';
import { GoalObjectStage } from './goalObjects/GoalObjectStage';
import { ReserveParticles } from './ReserveParticles';
import { reserveQualityConfigs, type ReserveQualityTier } from './reserveQuality';

type ReserveConstellationSceneProps = {
  activeGoal: ReserveGoal | null;
  isActive: boolean;
  isMobile: boolean;
  quality: ReserveQualityTier;
  reducedMotion: boolean;
};

type DragState = {
  active: boolean;
  pointerId: number;
  startRotationX: number;
  startRotationY: number;
  startX: number;
  startY: number;
};

function DecorativeOrbit({ index, quality }: { index: number; quality: ReserveQualityTier }) {
  const segments = quality === 'high' ? 72 : 48;
  const args = useMemo(() => [index === 0 ? 2.28 : 2.62, 0.008, 5, segments] as const, [index, segments]);

  return (
    <mesh rotation={index === 0 ? [1.16, 0.12, 0.24] : [0.48, 1.06, -0.18]}>
      <torusGeometry args={args} />
      <meshBasicMaterial
        color={index === 0 ? GOAL_VISUAL_PALETTE.secondaryStart : '#8d88aa'}
        depthWrite={false}
        opacity={index === 0 ? 0.075 : 0.038}
        transparent
      />
    </mesh>
  );
}

export function ReserveConstellationScene({
  activeGoal,
  isActive,
  isMobile,
  quality,
  reducedMotion,
}: ReserveConstellationSceneProps) {
  const interactionGroup = useRef<THREE.Group>(null);
  const pulse = useRef(0);
  const drag = useRef<DragState | null>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const invalidate = useThree((state) => state.invalidate);
  const regress = useThree((state) => state.performance.regress);
  const canvasElement = useThree((state) => state.gl.domElement);
  const config = reserveQualityConfigs[quality];
  const progress = activeGoal ? getGoalProgress(activeGoal) : 0;
  const visualState = getGoalVisualState(progress, quality);

  useFrame((_, delta) => {
    if (!isActive || !interactionGroup.current) {
      return;
    }

    const safeDelta = Math.min(delta, 0.05);
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
  });

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    regress();
    drag.current = {
      active: false,
      pointerId: event.pointerId,
      startRotationX: interactionGroup.current?.rotation.x ?? 0,
      startRotationY: interactionGroup.current?.rotation.y ?? 0,
      startX: event.clientX,
      startY: event.clientY,
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
      canvasElement.setPointerCapture?.(event.pointerId);
    }

    event.stopPropagation();
    targetRotation.current.x = THREE.MathUtils.clamp(
      currentDrag.startRotationX + deltaY * 0.0024,
      -0.24,
      0.24,
    );
    targetRotation.current.y = THREE.MathUtils.clamp(
      currentDrag.startRotationY + deltaX * 0.0038,
      -0.5,
      0.5,
    );
    invalidate();
  }

  function handlePointerUp(event: ThreeEvent<PointerEvent>) {
    const currentDrag = drag.current;

    if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
      return;
    }

    canvasElement.releasePointerCapture?.(event.pointerId);
    drag.current = null;

    if (!reducedMotion && quality !== 'low') {
      targetRotation.current = { x: 0, y: 0 };
    }

    invalidate();
  }

  return (
    <>
      <hemisphereLight
        color="#dbe5de"
        groundColor="#111a17"
        intensity={0.72 + visualState.easedProgress * 0.14}
      />
      <directionalLight
        color="#edf2e8"
        intensity={0.96 + visualState.easedProgress * 0.24}
        position={[3.8, 4.6, 4.2]}
      />
      <directionalLight
        color={GOAL_VISUAL_PALETTE.secondaryStart}
        intensity={0.28 + visualState.easedProgress * 0.12}
        position={[-3.2, 1.8, 3.4]}
      />

      <group ref={interactionGroup}>
        <GoalObjectStage
          goal={activeGoal}
          isActive={isActive}
          isMobile={isMobile}
          quality={quality}
          reducedMotion={reducedMotion}
        />

        <ReserveParticles
          animated={isActive && !reducedMotion && config.animateIdle}
          count={config.particleCount}
          isActive={isActive}
          pulse={pulse}
          spread={isMobile ? 2.35 : 2.8}
          visualProgress={progress}
        />

        {Array.from({ length: config.orbitRingCount }, (_, index) => (
          <DecorativeOrbit index={index} key={index} quality={quality} />
        ))}

        <group position={[0, -1.72, -0.08]}>
          <mesh>
            <cylinderGeometry args={[0.84, 0.98, 0.08, config.baseSegments]} />
            <meshStandardMaterial color="#172322" metalness={0.22} roughness={0.62} />
          </mesh>
          {quality !== 'low' ? (
            <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.78, 0.012, 5, config.baseSegments]} />
              <meshBasicMaterial color={GOAL_VISUAL_PALETTE.secondaryStart} depthWrite={false} opacity={0.18 + progress * 0.12} transparent />
            </mesh>
          ) : null}
        </group>

        <mesh
          onPointerCancel={handlePointerUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <sphereGeometry args={[isMobile ? 3.1 : 3.8, 16, 12]} />
          <meshBasicMaterial colorWrite={false} depthWrite={false} side={THREE.BackSide} />
        </mesh>
      </group>
    </>
  );
}
