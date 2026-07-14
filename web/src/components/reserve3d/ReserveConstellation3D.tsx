import { useCallback, useEffect, useRef, useState } from 'react';
import { AdaptiveDpr, PerformanceMonitor, usePerformanceMonitor } from '@react-three/drei';
import { Canvas, useThree, type RootState } from '@react-three/fiber';
import { AnimatedMoney } from '../AnimatedMoney';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { getGoalProgress } from '../../lib/calculations';
import { formatMoney } from '../../lib/format';
import { getGoalCategoryLabel } from '../../lib/goalCategories';
import type { ReserveConstellationData } from '../../lib/reserveVisual';
import { ReserveConstellationFallback } from './ReserveConstellationFallback';
import { ReserveConstellationLoading } from './ReserveConstellationLoading';
import { ReserveConstellationScene } from './ReserveConstellationScene';
import {
  getInitialReserveQuality,
  getMaximumReserveQuality,
  lowerReserveQuality,
  raiseReserveQuality,
  reserveQualityConfigs,
  type ReserveQualityTier,
} from './reserveQuality';
import { supportsWebGL } from './webglSupport';

type WebGLCapability = 'checking' | 'supported' | 'unsupported';

function AdaptivePerformanceDpr() {
  const regress = useThree((state) => state.performance.regress);
  const handleDecline = useCallback(() => regress(), [regress]);
  usePerformanceMonitor({ onDecline: handleDecline });

  return <AdaptiveDpr />;
}

function useSceneVisibility(container: React.RefObject<HTMLDivElement | null>): boolean {
  const [inViewport, setInViewport] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(() => document.visibilityState !== 'hidden');

  useEffect(() => {
    const element = container.current;

    if (!element || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(entry?.isIntersecting ?? true),
      { rootMargin: '40px 0px', threshold: 0.04 },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [container]);

  useEffect(() => {
    const handleVisibilityChange = () => setDocumentVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return inViewport && documentVisible;
}

function useMobileConstellation(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    window.matchMedia('(max-width: 719px), (max-width: 1024px) and (pointer: coarse)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(max-width: 719px), (max-width: 1024px) and (pointer: coarse)');
    const update = () => setIsMobile(query.matches);
    query.addEventListener('change', update);

    return () => query.removeEventListener('change', update);
  }, []);

  return isMobile;
}

export default function ReserveConstellation3D(props: ReserveConstellationData) {
  const { currency, goals, selectedGoalId } = props;
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useMobileConstellation();
  const canvasContainer = useRef<HTMLDivElement>(null);
  const contextCleanup = useRef<(() => void) | null>(null);
  const qualityChangeAt = useRef(Number.NEGATIVE_INFINITY);
  const viewportChangeAt = useRef(Number.NEGATIVE_INFINITY);
  const [capability, setCapability] = useState<WebGLCapability>('checking');
  const [contextRecovering, setContextRecovering] = useState(false);
  const [rendererFailed, setRendererFailed] = useState(false);
  const [quality, setQuality] = useState<ReserveQualityTier>(() => getInitialReserveQuality(reducedMotion));
  const isSceneActive = useSceneVisibility(canvasContainer);
  const qualityConfig = reserveQualityConfigs[quality];
  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId) ?? null;
  const selectedProgress = selectedGoal ? getGoalProgress(selectedGoal) : 0;

  useEffect(() => {
    setCapability(supportsWebGL() ? 'supported' : 'unsupported');
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 719px), (max-width: 1024px) and (pointer: coarse)');
    const updateInitialTier = () => setQuality(getInitialReserveQuality(reducedMotion));
    updateInitialTier();
    query.addEventListener('change', updateInitialTier);

    return () => query.removeEventListener('change', updateInitialTier);
  }, [reducedMotion]);

  useEffect(() => {
    const markViewportChange = () => {
      viewportChangeAt.current = performance.now();
    };
    const visualViewport = window.visualViewport;

    window.addEventListener('resize', markViewportChange);
    visualViewport?.addEventListener('resize', markViewportChange);

    return () => {
      window.removeEventListener('resize', markViewportChange);
      visualViewport?.removeEventListener('resize', markViewportChange);
    };
  }, []);

  useEffect(() => {
    if (!contextRecovering) {
      return;
    }

    let recoveryTimer: number | null = null;
    const clearRecoveryTimer = () => {
      if (recoveryTimer !== null) {
        window.clearTimeout(recoveryTimer);
        recoveryTimer = null;
      }
    };
    const startRecoveryTimer = () => {
      clearRecoveryTimer();

      if (document.visibilityState === 'hidden') {
        return;
      }

      recoveryTimer = window.setTimeout(() => {
        setContextRecovering(false);
        setRendererFailed(true);
      }, 5000);
    };

    startRecoveryTimer();
    document.addEventListener('visibilitychange', startRecoveryTimer);

    return () => {
      clearRecoveryTimer();
      document.removeEventListener('visibilitychange', startRecoveryTimer);
    };
  }, [contextRecovering]);

  useEffect(() => {
    if (!rendererFailed) {
      return;
    }

    contextCleanup.current?.();
    contextCleanup.current = null;
  }, [rendererFailed]);

  useEffect(
    () => () => {
      contextCleanup.current?.();
      contextCleanup.current = null;
    },
    [],
  );

  const handleQualityDecline = useCallback(() => {
    const now = performance.now();

    if (
      !isSceneActive ||
      document.visibilityState === 'hidden' ||
      now - viewportChangeAt.current < 3000 ||
      now - qualityChangeAt.current < 4000
    ) {
      return;
    }

    qualityChangeAt.current = now;
    setQuality((current) => lowerReserveQuality(current));
  }, [isSceneActive]);

  const handleQualityIncline = useCallback(() => {
    if (reducedMotion) {
      return;
    }

    const now = performance.now();

    if (now - qualityChangeAt.current < 4000) {
      return;
    }

    qualityChangeAt.current = now;
    setQuality((current) => {
      const next = raiseReserveQuality(current);
      const maximum = getMaximumReserveQuality(reducedMotion);

      return maximum === 'medium' && next === 'high' ? current : next;
    });
  }, [reducedMotion]);

  const handleCanvasCreated = useCallback(({ gl, invalidate }: RootState) => {
    contextCleanup.current?.();
    setRendererFailed(false);
    setContextRecovering(false);
    gl.setClearAlpha(0);

    const canvas = gl.domElement;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setContextRecovering(true);
    };
    const handleContextRestored = () => {
      setContextRecovering(false);
      window.requestAnimationFrame(() => invalidate());
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
    contextCleanup.current = () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost, false);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored, false);
    };
  }, []);

  if (capability === 'checking') {
    return <ReserveConstellationLoading {...props} />;
  }

  if (capability === 'unsupported' || rendererFailed) {
    return <ReserveConstellationFallback {...props} />;
  }

  const useContinuousRendering = isSceneActive && !reducedMotion && qualityConfig.animateIdle;

  return (
    <section
      className="reserve-core reserve-constellation reserve-active-goal"
      data-quality={quality}
      aria-label={selectedGoal ? `Активная цель: ${selectedGoal.title}` : 'Активная цель не выбрана'}
    >
      {selectedGoal ? (
        <header className="reserve-active-goal__header">
          <p>{getGoalCategoryLabel(selectedGoal.goalCategory)}</p>
          <h2>{selectedGoal.title}</h2>
        </header>
      ) : null}

      <div className="reserve-core__canvas reserve-constellation__canvas" ref={canvasContainer} aria-hidden="true">
        <Canvas
          camera={{ fov: isMobile ? 39 : 37, near: 0.1, far: 40, position: [0, 0, isMobile ? 6.5 : 7.1] }}
          dpr={qualityConfig.dpr}
          frameloop={useContinuousRendering ? 'always' : 'demand'}
          gl={{
            alpha: true,
            antialias: quality !== 'low',
            powerPreference: isMobile ? 'default' : 'high-performance',
          }}
          onCreated={handleCanvasCreated}
        >
          <PerformanceMonitor
            bounds={(refreshRate) => (refreshRate > 90 ? [55, 85] : [38, 57])}
            iterations={8}
            ms={300}
            onDecline={handleQualityDecline}
            onIncline={handleQualityIncline}
          >
            <AdaptivePerformanceDpr />
            <ReserveConstellationScene
              activeGoal={selectedGoal}
              isActive={isSceneActive}
              isMobile={isMobile}
              quality={quality}
              reducedMotion={reducedMotion}
            />
          </PerformanceMonitor>
        </Canvas>
        {contextRecovering ? (
          <div className="reserve-constellation__recovery" role="status">
            Восстановление 3D-сцены
          </div>
        ) : null}
      </div>

      {selectedGoal ? (
        <div className="reserve-active-goal__details">
          <div className="reserve-active-goal__saved">
            <span>Накоплено</span>
            <AnimatedMoney
              amount={selectedGoal.allocatedAmount}
              currency={currency}
              debounceMs={reducedMotion ? 0 : 180}
              durationMs={reducedMotion ? 0 : 380}
            />
          </div>
          <dl className="reserve-active-goal__metrics">
            <div>
              <dt>Сумма цели</dt>
              <dd>{formatMoney(selectedGoal.targetAmount, currency)}</dd>
            </div>
            <div>
              <dt>Осталось</dt>
              <dd>{formatMoney(Math.max(0, selectedGoal.targetAmount - selectedGoal.allocatedAmount), currency)}</dd>
            </div>
          </dl>
          <div className="reserve-active-goal__progress">
            <div>
              <span>Прогресс</span>
              <strong>{Math.round(selectedProgress * 100)}%</strong>
            </div>
            <span className="reserve-active-goal__progress-track" aria-hidden="true">
              <span style={{ width: `${selectedProgress * 100}%` }} />
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
