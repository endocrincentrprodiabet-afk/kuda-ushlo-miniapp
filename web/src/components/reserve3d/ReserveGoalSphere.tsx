import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { ReserveGoal } from '../../types';
import { getGoalProgress } from '../../lib/calculations';
import { GoalProgressRing } from './GoalProgressRing';
import { reserveQualityConfigs, type ReserveQualityTier } from './reserveQuality';

type ReserveGoalSphereProps = {
  color: string;
  coreGeometry: THREE.BufferGeometry;
  goal: ReserveGoal;
  isActive: boolean;
  onSelect: () => void;
  position: readonly [number, number, number];
  quality: ReserveQualityTier;
  radius: number;
  reducedMotion: boolean;
  selected: boolean;
  shellGeometry: THREE.BufferGeometry;
  suppressSelection: React.MutableRefObject<boolean>;
  wireGeometry: THREE.BufferGeometry;
};

export function ReserveGoalSphere({
  color,
  coreGeometry,
  goal,
  isActive,
  onSelect,
  position,
  quality,
  radius,
  reducedMotion,
  selected,
  shellGeometry,
  suppressSelection,
  wireGeometry,
}: ReserveGoalSphereProps) {
  const group = useRef<THREE.Group>(null);
  const floatingGroup = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const coreWire = useRef<THREE.Mesh>(null);
  const pulseShell = useRef<THREE.Mesh>(null);
  const pulseMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const currentCoreScale = useRef(0);
  const currentSelectionScale = useRef(selected ? 1.04 : 1);
  const completionPulse = useRef(0);
  const previousProgress = useRef(getGoalProgress(goal));
  const invalidate = useThree((state) => state.invalidate);
  const progress = getGoalProgress(goal);
  const config = reserveQualityConfigs[quality];
  const animateIdle = isActive && !reducedMotion && config.animateIdle;

  const shellMaterial = useMemo(() => {
    if (config.shellMaterial === 'physical') {
      return new THREE.MeshPhysicalMaterial({
        clearcoat: 0.55,
        clearcoatRoughness: 0.3,
        color,
        depthWrite: false,
        metalness: 0.03,
        opacity: selected ? 0.25 : 0.15,
        roughness: 0.34,
        thickness: 0.42,
        transmission: 0.36,
        transparent: true,
      });
    }

    if (config.shellMaterial === 'standard') {
      return new THREE.MeshStandardMaterial({
        color,
        depthWrite: false,
        emissive: color,
        emissiveIntensity: selected ? 0.18 : 0.06,
        metalness: 0.05,
        opacity: selected ? 0.23 : 0.14,
        roughness: 0.42,
        transparent: true,
      });
    }

    return new THREE.MeshBasicMaterial({
      color,
      depthWrite: false,
      opacity: selected ? 0.25 : 0.13,
      transparent: true,
    });
  }, [color, config.shellMaterial, selected]);
  const wireMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        depthWrite: false,
        opacity: selected ? 0.28 : quality === 'low' ? 0.12 : 0.08,
        transparent: true,
        wireframe: true,
      }),
    [color, quality, selected],
  );
  const coreMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: selected ? 0.72 : quality === 'low' ? 0.3 : 0.48,
        metalness: 0.04,
        roughness: quality === 'low' ? 0.5 : 0.38,
      }),
    [color, quality, selected],
  );

  useEffect(
    () => () => {
      shellMaterial.dispose();
      wireMaterial.dispose();
      coreMaterial.dispose();
    },
    [coreMaterial, shellMaterial, wireMaterial],
  );

  useEffect(() => {
    if (previousProgress.current < 1 && progress >= 1 && !reducedMotion) {
      completionPulse.current = 1;
      invalidate();
    }

    previousProgress.current = progress;
  }, [invalidate, progress, reducedMotion]);

  useFrame((state, delta) => {
    if (!isActive) {
      return;
    }

    const safeDelta = Math.min(delta, 0.05);
    const targetCoreScale = progress <= 0 ? 0 : 0.86 * Math.cbrt(progress);
    const targetSelectionScale = selected ? 1.04 : 1;
    currentCoreScale.current = THREE.MathUtils.damp(currentCoreScale.current, targetCoreScale, 6.5, safeDelta);
    currentSelectionScale.current = THREE.MathUtils.damp(
      currentSelectionScale.current,
      targetSelectionScale,
      8,
      safeDelta,
    );
    completionPulse.current = Math.max(0, completionPulse.current - safeDelta * 1.5);

    if (group.current) {
      group.current.scale.setScalar(radius * currentSelectionScale.current);
    }

    if (floatingGroup.current) {
      floatingGroup.current.position.y = animateIdle
        ? Math.sin(state.clock.elapsedTime * 0.72 + position[0] * 0.9) * 0.025
        : 0;
    }

    const showCore = currentCoreScale.current > 0.001;

    if (core.current) {
      core.current.visible = showCore;
      core.current.scale.setScalar(currentCoreScale.current);
      if (animateIdle) {
        core.current.rotation.y += safeDelta * (0.12 + progress * 0.1);
      }
    }

    if (coreWire.current) {
      coreWire.current.visible = showCore;
      coreWire.current.scale.setScalar(currentCoreScale.current * 1.015);
    }

    if (pulseShell.current && pulseMaterial.current) {
      pulseShell.current.scale.setScalar(1.02 + (1 - completionPulse.current) * 0.25);
      pulseMaterial.current.opacity = completionPulse.current * 0.12;
    }

    if (
      Math.abs(currentCoreScale.current - targetCoreScale) > 0.001 ||
      Math.abs(currentSelectionScale.current - targetSelectionScale) > 0.001 ||
      completionPulse.current > 0
    ) {
      invalidate();
    }
  });

  return (
    <group
      position={position}
      ref={group}
      scale={radius}
      onClick={(event) => {
        event.stopPropagation();
        if (!suppressSelection.current) {
          onSelect();
        }
      }}
    >
      <group ref={floatingGroup}>
        <mesh geometry={shellGeometry} material={shellMaterial} />
        <mesh geometry={wireGeometry} material={wireMaterial} />
        <mesh geometry={coreGeometry} material={coreMaterial} ref={core} scale={0} visible={progress > 0} />
        <mesh geometry={wireGeometry} ref={coreWire} scale={0} visible={false}>
          <meshBasicMaterial color={color} depthWrite={false} opacity={0.12} transparent wireframe />
        </mesh>
        {quality === 'high' ? (
          <mesh geometry={shellGeometry} ref={pulseShell} scale={1.02}>
            <meshBasicMaterial
              ref={pulseMaterial}
              blending={THREE.AdditiveBlending}
              color={color}
              depthWrite={false}
              opacity={0}
              side={THREE.BackSide}
              transparent
            />
          </mesh>
        ) : null}
        <GoalProgressRing
          animateProgress={!reducedMotion}
          color={color}
          isActive={isActive}
          progress={progress}
          radius={1.22}
          segments={config.ringSegments}
          selected={selected}
        />
      </group>
    </group>
  );
}
