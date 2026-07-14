import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getGoalProgress } from '../../../lib/calculations';
import { getGoalCategoryConfig } from '../../../lib/goalCategories';
import type { ReserveGoal } from '../../../types';
import type { ReserveQualityTier } from '../reserveQuality';
import { getGoalObjectComponent } from './index';
import type { GoalObjectTransitionState } from './types';

type GoalObjectStageProps = {
  goal: ReserveGoal | null;
  isActive: boolean;
  isMobile: boolean;
  quality: ReserveQualityTier;
  reducedMotion: boolean;
};

type RenderState = {
  current: ReserveGoal | null;
  currentPhase: 'idle' | 'entering';
  outgoing: ReserveGoal | null;
  revision: number;
};

type AnimatedGoalObjectProps = {
  goal: ReserveGoal;
  isActive: boolean;
  isMobile: boolean;
  onEntered?: (revision: number) => void;
  onExited?: (revision: number) => void;
  phase: GoalObjectTransitionState;
  quality: ReserveQualityTier;
  reducedMotion: boolean;
  revision: number;
};

function getGoalIdentity(goal: ReserveGoal | null): string {
  if (!goal) {
    return 'none';
  }

  return `${goal.id}:${getGoalCategoryConfig(goal.goalCategory).value}`;
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function AnimatedGoalObject({
  goal,
  isActive,
  isMobile,
  onEntered,
  onExited,
  phase,
  quality,
  reducedMotion,
  revision,
}: AnimatedGoalObjectProps) {
  const outerGroup = useRef<THREE.Group>(null);
  const idleGroup = useRef<THREE.Group>(null);
  const objectGroup = useRef<THREE.Group>(null);
  const sweep = useRef<THREE.Mesh>(null);
  const sweepMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const transitionProgress = useRef(phase === 'idle' || reducedMotion ? 1 : 0);
  const previousProgress = useRef(getGoalProgress(goal));
  const completionPulse = useRef(0);
  const exitNotified = useRef(false);
  const enterNotified = useRef(false);
  const managedMaterials = useRef<THREE.Material[]>([]);
  const invalidate = useThree((state) => state.invalidate);
  const progress = getGoalProgress(goal);
  const GoalObject = getGoalObjectComponent(goal.goalCategory);

  useLayoutEffect(() => {
    const materials = new Set<THREE.Material>();

    objectGroup.current?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) {
        return;
      }

      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.forEach((material) => materials.add(material));
    });

    managedMaterials.current = Array.from(materials);
  }, [goal.goalCategory, quality]);

  useEffect(() => {
    transitionProgress.current = phase === 'idle' || reducedMotion ? 1 : 0;
    exitNotified.current = false;
    enterNotified.current = false;
    invalidate();
  }, [invalidate, phase, reducedMotion, revision]);

  useEffect(() => {
    if (previousProgress.current < 1 && progress >= 1 && !reducedMotion) {
      completionPulse.current = 1;
      invalidate();
    }

    previousProgress.current = progress;
  }, [invalidate, progress, reducedMotion]);

  useEffect(() => {
    if (isActive) {
      invalidate();
    }
  }, [invalidate, isActive]);

  useFrame((state, delta) => {
    if (!isActive) {
      return;
    }

    const safeDelta = Math.min(delta, 0.05);
    const duration = reducedMotion ? 0.12 : 0.58;
    transitionProgress.current = reducedMotion
      ? 1
      : Math.min(1, transitionProgress.current + safeDelta / duration);
    const easedTransition = easeOutCubic(transitionProgress.current);
    const isExiting = phase === 'exiting';
    const visibility = phase === 'idle' ? 1 : isExiting ? 1 - easedTransition : easedTransition;
    const verticalOffset = reducedMotion
      ? 0
      : isExiting
        ? easedTransition * 0.78
        : (1 - easedTransition) * -0.72;
    const depthOffset = reducedMotion
      ? 0
      : isExiting
        ? easedTransition * -0.46
        : (1 - easedTransition) * -0.38;
    const transitionScale = reducedMotion
      ? 1
      : isExiting
        ? 1 - easedTransition * 0.08
        : 0.92 + easedTransition * 0.08;
    const completion = completionPulse.current;
    const completionWave = reducedMotion ? 0 : Math.sin((1 - completion) * Math.PI) * completion * 0.035;
    const progressScale = 0.96 + progress * 0.04;
    const mobileScale = isMobile ? 0.9 : 1;

    completionPulse.current = reducedMotion ? 0 : Math.max(0, completion - safeDelta * 0.92);

    if (outerGroup.current) {
      outerGroup.current.position.set(0, verticalOffset, depthOffset);
      outerGroup.current.rotation.z = reducedMotion
        ? 0
        : isExiting
          ? easedTransition * -0.035
          : (1 - easedTransition) * 0.045;
      outerGroup.current.scale.setScalar(
        mobileScale * progressScale * transitionScale * (1 + completionWave),
      );
    }

    const idleStrength = reducedMotion || quality === 'low' ? 0 : quality === 'high' ? 1 : 0.58;
    if (idleGroup.current) {
      const elapsed = state.clock.elapsedTime;
      idleGroup.current.position.y = Math.sin(elapsed * 0.62) * 0.042 * idleStrength;
      idleGroup.current.rotation.x = Math.sin(elapsed * 0.34) * 0.018 * idleStrength;
      idleGroup.current.rotation.y = Math.sin(elapsed * 0.24) * 0.055 * idleStrength;
      idleGroup.current.rotation.z = Math.cos(elapsed * 0.3) * 0.012 * idleStrength;
    }

    managedMaterials.current.forEach((material) => {
      material.transparent = true;
      material.depthWrite = visibility > 0.62;
      const baseOpacity = Number(material.userData.goalBaseOpacity ?? 1);
      material.opacity = baseOpacity * visibility;
    });

    if (sweep.current && sweepMaterial.current) {
      sweep.current.visible = completion > 0.001 && !reducedMotion;
      sweep.current.rotation.z += safeDelta * 1.45;
      sweep.current.scale.setScalar(0.82 + (1 - completion) * 0.55);
      sweepMaterial.current.opacity = completion * 0.22;
    }

    if (phase !== 'idle' && transitionProgress.current < 1) {
      invalidate();
    }

    if (completionPulse.current > 0.001 || idleStrength > 0) {
      invalidate();
    }

    if (isExiting && transitionProgress.current >= 1 && !exitNotified.current) {
      exitNotified.current = true;
      onExited?.(revision);
    }

    if (phase === 'entering' && transitionProgress.current >= 1 && !enterNotified.current) {
      enterNotified.current = true;
      onEntered?.(revision);
    }
  });

  return (
    <group ref={outerGroup}>
      <group ref={idleGroup}>
        <group ref={objectGroup}>
          <GoalObject
            progress={progress}
            quality={quality}
            reducedMotion={reducedMotion}
            transitionState={phase}
          />
        </group>
      </group>
      {quality !== 'low' ? (
        <mesh ref={sweep} rotation={[Math.PI / 2.25, 0.08, 0]} visible={false}>
          <torusGeometry args={[1.72, 0.018, 5, quality === 'high' ? 64 : 40]} />
          <meshBasicMaterial
            ref={sweepMaterial}
            blending={THREE.AdditiveBlending}
            color="#d7ff17"
            depthWrite={false}
            opacity={0}
            transparent
          />
        </mesh>
      ) : null}
    </group>
  );
}

export function GoalObjectStage({
  goal,
  isActive,
  isMobile,
  quality,
  reducedMotion,
}: GoalObjectStageProps) {
  const invalidate = useThree((state) => state.invalidate);
  const [renderState, setRenderState] = useState<RenderState>(() => ({
    current: goal,
    currentPhase: 'idle',
    outgoing: null,
    revision: 0,
  }));
  const selectedIdentity = getGoalIdentity(goal);

  useEffect(() => {
    setRenderState((currentState) => {
      if (getGoalIdentity(currentState.current) === selectedIdentity) {
        return currentState.current === goal
          ? currentState
          : { ...currentState, current: goal };
      }

      return {
        current: goal,
        currentPhase: reducedMotion ? 'idle' : 'entering',
        outgoing: reducedMotion ? null : currentState.current,
        revision: currentState.revision + 1,
      };
    });
    invalidate();
  }, [goal, invalidate, reducedMotion, selectedIdentity]);

  const handleExited = useCallback((revision: number) => {
    setRenderState((currentState) =>
      currentState.revision === revision
        ? { ...currentState, outgoing: null }
        : currentState,
    );
  }, []);

  const handleEntered = useCallback((revision: number) => {
    setRenderState((currentState) =>
      currentState.revision === revision
        ? { ...currentState, currentPhase: 'idle' }
        : currentState,
    );
  }, []);

  return (
    <group position={[0, 0.02, 0]}>
      {renderState.outgoing ? (
        <AnimatedGoalObject
          goal={renderState.outgoing}
          isActive={isActive}
          isMobile={isMobile}
          key={`${getGoalIdentity(renderState.outgoing)}:out:${renderState.revision}`}
          onExited={handleExited}
          phase="exiting"
          quality={quality}
          reducedMotion={reducedMotion}
          revision={renderState.revision}
        />
      ) : null}
      {renderState.current ? (
        <AnimatedGoalObject
          goal={renderState.current}
          isActive={isActive}
          isMobile={isMobile}
          key={`${getGoalIdentity(renderState.current)}:in:${renderState.revision}`}
          onEntered={handleEntered}
          phase={renderState.currentPhase}
          quality={quality}
          reducedMotion={reducedMotion}
          revision={renderState.revision}
        />
      ) : null}
    </group>
  );
}
