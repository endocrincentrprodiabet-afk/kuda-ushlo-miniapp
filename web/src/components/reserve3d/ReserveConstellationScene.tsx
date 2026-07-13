import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { getGoalProgress } from '../../lib/calculations';
import type { ReserveGoal } from '../../types';
import { ReserveGoalSphere } from './ReserveGoalSphere';
import { ReserveParticles } from './ReserveParticles';
import { UnallocatedReserveCore } from './UnallocatedReserveCore';
import { reserveQualityConfigs, type ReserveQualityTier } from './reserveQuality';

type ReserveConstellationSceneProps = {
  goals: ReserveGoal[];
  isActive: boolean;
  isMobile: boolean;
  onSelectGoal: (goalId: string) => void;
  quality: ReserveQualityTier;
  reducedMotion: boolean;
  reserveTotal: number;
  selectedGoalId: string | null;
  unallocatedReserve: number;
};

type DragState = {
  active: boolean;
  lastX: number;
  pointerId: number;
  startRotationX: number;
  startRotationY: number;
  startX: number;
  startY: number;
};

const goalColors = ['#d7ff17', '#66d9c5', '#62cde8', '#e4b45d', '#a99be8', '#d97aa8'];

const mobileLayouts: Record<number, ReadonlyArray<readonly [number, number, number]>> = {
  1: [[1.28, 0.58, 0]],
  2: [[-1.22, 0.46, 0.08], [1.22, 0.46, -0.08]],
  3: [[0, 1.27, 0.05], [-1.2, -0.62, -0.12], [1.2, -0.62, 0.12]],
  4: [[-1.12, 0.92, 0.08], [1.12, 0.92, -0.08], [-1.12, -0.92, -0.08], [1.12, -0.92, 0.08]],
  5: [[0, 1.46, 0], [-1.36, 0.45, -0.12], [-0.84, -1.18, 0.12], [0.84, -1.18, -0.12], [1.36, 0.45, 0.12]],
  6: [[-0.72, 1.34, 0.22], [0.72, 1.34, -0.22], [-1.42, 0, -0.18], [1.42, 0, 0.18], [-0.72, -1.34, 0.22], [0.72, -1.34, -0.22]],
};

const desktopLayouts: Record<number, ReadonlyArray<readonly [number, number, number]>> = {
  1: [[1.72, 0.72, 0]],
  2: [[-1.7, 0.52, 0.14], [1.7, 0.52, -0.14]],
  3: [[0, 1.72, 0.1], [-1.65, -0.82, -0.2], [1.65, -0.82, 0.2]],
  4: [[-1.52, 1.16, 0.16], [1.52, 1.16, -0.16], [-1.52, -1.16, -0.16], [1.52, -1.16, 0.16]],
  5: [[0, 1.92, 0], [-1.82, 0.6, -0.2], [-1.12, -1.56, 0.2], [1.12, -1.56, -0.2], [1.82, 0.6, 0.2]],
  6: [[-0.92, 1.74, 0.32], [0.92, 1.74, -0.32], [-1.94, 0, -0.24], [1.94, 0, 0.24], [-0.92, -1.74, 0.32], [0.92, -1.74, -0.32]],
};

function DecorativeOrbit({ index, quality }: { index: number; quality: ReserveQualityTier }) {
  const segments = quality === 'high' ? 72 : 48;
  const args = useMemo(() => [index === 0 ? 2.44 : 2.72, 0.008, 6, segments] as const, [index, segments]);

  return (
    <mesh rotation={index === 0 ? [1.16, 0.12, 0.24] : [0.48, 1.06, -0.18]}>
      <torusGeometry args={args} />
      <meshBasicMaterial
        color={index === 0 ? '#66d9c5' : '#a99be8'}
        depthWrite={false}
        opacity={index === 0 ? 0.18 : 0.1}
        transparent
      />
    </mesh>
  );
}

export function ReserveConstellationScene({
  goals,
  isActive,
  isMobile,
  onSelectGoal,
  quality,
  reducedMotion,
  reserveTotal,
  selectedGoalId,
  unallocatedReserve,
}: ReserveConstellationSceneProps) {
  const interactionGroup = useRef<THREE.Group>(null);
  const autoRotationGroup = useRef<THREE.Group>(null);
  const globalPulse = useRef(0);
  const drag = useRef<DragState | null>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const inertia = useRef({ x: 0, y: 0 });
  const suppressSelection = useRef(false);
  const invalidate = useThree((state) => state.invalidate);
  const regress = useThree((state) => state.performance.regress);
  const canvasElement = useThree((state) => state.gl.domElement);
  const config = reserveQualityConfigs[quality];
  const layout = useMemo(() => (isMobile ? mobileLayouts : desktopLayouts)[goals.length] ?? [], [goals.length, isMobile]);
  const maxTarget = useMemo(() => Math.max(0, ...goals.map((goal) => goal.targetAmount)), [goals]);
  const radii = useMemo(() => {
    const minimum = isMobile ? 0.34 : 0.48;
    const maximum = isMobile ? 0.72 : 1.02;

    return goals.map((goal) => {
      const normalizedTarget = maxTarget > 0 ? goal.targetAmount / maxTarget : 0;
      return minimum + (maximum - minimum) * Math.sqrt(normalizedTarget);
    });
  }, [goals, isMobile, maxTarget]);
  const freeRatio = reserveTotal > 0 ? Math.min(1, unallocatedReserve / reserveTotal) : 0;
  const centralRadius = (isMobile ? 0.38 : 0.5) + (isMobile ? 0.22 : 0.3) * Math.sqrt(freeRatio);
  const averageProgress = goals.length
    ? goals.reduce((total, goal) => total + getGoalProgress(goal), 0) / goals.length
    : 0;
  const animateIdle = isActive && !reducedMotion && config.animateIdle;
  const shellGeometry = useMemo(
    () => new THREE.SphereGeometry(1, config.shellSegments[0], config.shellSegments[1]),
    [config.shellSegments],
  );
  const wireGeometry = useMemo(
    () =>
      new THREE.IcosahedronGeometry(
        1.003,
        quality === 'high' ? 2 : quality === 'medium' ? 1 : 0,
      ),
    [quality],
  );
  const coreGeometry = useMemo(
    () => new THREE.IcosahedronGeometry(1, config.coreDetail),
    [config.coreDetail],
  );

  useEffect(
    () => () => {
      shellGeometry.dispose();
      wireGeometry.dispose();
      coreGeometry.dispose();
    },
    [coreGeometry, shellGeometry, wireGeometry],
  );

  useFrame((_, delta) => {
    if (!isActive) {
      return;
    }

    const safeDelta = Math.min(delta, 0.05);
    const currentDrag = drag.current;

    if (!currentDrag?.active && quality !== 'low') {
      if (Math.abs(inertia.current.x) > 0.0001 || Math.abs(inertia.current.y) > 0.0001) {
        targetRotation.current.x = THREE.MathUtils.clamp(
          targetRotation.current.x + inertia.current.x * safeDelta,
          -0.34,
          0.34,
        );
        targetRotation.current.y = THREE.MathUtils.clamp(
          targetRotation.current.y + inertia.current.y * safeDelta,
          -0.78,
          0.78,
        );
        const decay = Math.exp(-safeDelta * 5.4);
        inertia.current.x *= decay;
        inertia.current.y *= decay;
        invalidate();
      }
    }

    if (interactionGroup.current) {
      interactionGroup.current.rotation.x = THREE.MathUtils.damp(
        interactionGroup.current.rotation.x,
        targetRotation.current.x,
        currentDrag?.active ? 14 : 7,
        safeDelta,
      );
      interactionGroup.current.rotation.y = THREE.MathUtils.damp(
        interactionGroup.current.rotation.y,
        targetRotation.current.y,
        currentDrag?.active ? 14 : 7,
        safeDelta,
      );
    }

    if (autoRotationGroup.current && animateIdle && !currentDrag?.active) {
      autoRotationGroup.current.rotation.y += safeDelta * 0.035;
    }
  });

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    suppressSelection.current = false;
    inertia.current = { x: 0, y: 0 };
    drag.current = {
      active: false,
      lastX: event.clientX,
      pointerId: event.pointerId,
      startRotationX: targetRotation.current.x,
      startRotationY: targetRotation.current.y,
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
      suppressSelection.current = true;
      regress();
      canvasElement.setPointerCapture?.(event.pointerId);
    }

    event.stopPropagation();
    targetRotation.current.x = THREE.MathUtils.clamp(currentDrag.startRotationX + deltaY * 0.0024, -0.34, 0.34);
    targetRotation.current.y = THREE.MathUtils.clamp(currentDrag.startRotationY + deltaX * 0.0042, -0.78, 0.78);
    inertia.current.y = (event.clientX - currentDrag.lastX) * 0.13;
    inertia.current.x = deltaY * 0.002;
    currentDrag.lastX = event.clientX;
    invalidate();
  }

  function handlePointerUp(event: ThreeEvent<PointerEvent>) {
    const currentDrag = drag.current;

    if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
      return;
    }

    canvasElement.releasePointerCapture?.(event.pointerId);
    suppressSelection.current = currentDrag.active;
    drag.current = null;

    if (quality === 'low' || reducedMotion) {
      inertia.current = { x: 0, y: 0 };
    }

    invalidate();
  }

  return (
    <>
      <ambientLight intensity={quality === 'low' ? 0.9 : 0.64} />
      <pointLight color="#66d9c5" intensity={quality === 'low' ? 8 : 14} position={[3.5, 3, 4]} />
      <pointLight color="#d7ff17" intensity={quality === 'low' ? 7 : 12} position={[-3.8, 1.4, 2.4]} />
      {quality === 'high' ? <pointLight color="#a99be8" intensity={3} position={[1.2, -3, 2]} /> : null}

      <group
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={interactionGroup}
      >
        <group ref={autoRotationGroup}>
          <UnallocatedReserveCore
            coreGeometry={coreGeometry}
            isActive={isActive}
            quality={quality}
            radius={centralRadius}
            reducedMotion={reducedMotion}
            reserveTotal={reserveTotal}
            shellGeometry={shellGeometry}
            unallocatedReserve={unallocatedReserve}
          />

          {goals.map((goal, index) => (
            <ReserveGoalSphere
              color={goalColors[index % goalColors.length]}
              coreGeometry={coreGeometry}
              goal={goal}
              isActive={isActive}
              key={goal.id}
              onSelect={() => onSelectGoal(goal.id)}
              position={layout[index] ?? [0, 0, 0]}
              quality={quality}
              radius={radii[index]}
              reducedMotion={reducedMotion}
              selected={goal.id === selectedGoalId}
              shellGeometry={shellGeometry}
              suppressSelection={suppressSelection}
              wireGeometry={wireGeometry}
            />
          ))}

          <ReserveParticles
            animated={animateIdle}
            count={config.particleCount}
            isActive={isActive}
            pulse={globalPulse}
            spread={isMobile ? 2.7 : 3.5}
            visualProgress={averageProgress}
          />

          {Array.from({ length: config.orbitRingCount }, (_, index) => (
            <DecorativeOrbit index={index} key={index} quality={quality} />
          ))}
        </group>

        <mesh>
          <sphereGeometry args={[isMobile ? 3.2 : 4.2, 16, 12]} />
          <meshBasicMaterial colorWrite={false} depthWrite={false} side={THREE.BackSide} />
        </mesh>
      </group>
    </>
  );
}
