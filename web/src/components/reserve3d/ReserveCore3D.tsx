import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdaptiveDpr, PerformanceMonitor, usePerformanceMonitor } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { AnimatedMoney } from '../AnimatedMoney';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { formatMoney } from '../../lib/format';
import { getReserveVisualState, type ReserveCoreData } from '../../lib/reserveVisual';
import { ReserveCoreFallback } from './ReserveCoreFallback';
import { ReserveCoreScene } from './ReserveCoreScene';
import {
  getInitialReserveQuality,
  getMaximumReserveQuality,
  lowerReserveQuality,
  raiseReserveQuality,
  reserveQualityConfigs,
  type ReserveQualityTier,
} from './reserveQuality';

let webGLSupport: boolean | undefined;

function supportsWebGL(): boolean {
  if (webGLSupport !== undefined) {
    return webGLSupport;
  }

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    webGLSupport = Boolean(context);
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webGLSupport = false;
  }

  return webGLSupport;
}

function getProgressText(goalProgress: number): string {
  return `${Math.round(goalProgress)}% цели`;
}

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

export default function ReserveCore3D(props: ReserveCoreData) {
  const { reserveTotal, goalTitle, targetAmount, goalProgress, remainingToGoal, currency } = props;
  const reducedMotion = usePrefersReducedMotion();
  const canvasContainer = useRef<HTMLDivElement>(null);
  const qualityChangeAt = useRef(Number.NEGATIVE_INFINITY);
  const [quality, setQuality] = useState<ReserveQualityTier>(() => getInitialReserveQuality(reducedMotion));
  const isSceneActive = useSceneVisibility(canvasContainer);
  const qualityConfig = reserveQualityConfigs[quality];
  const visualState = useMemo(
    () => getReserveVisualState(reserveTotal, targetAmount),
    [reserveTotal, targetAmount],
  );

  useEffect(() => {
    const deviceQuery = window.matchMedia('(max-width: 719px), (max-width: 1024px) and (pointer: coarse)');
    const updateInitialTier = () => setQuality(getInitialReserveQuality(reducedMotion));

    updateInitialTier();
    deviceQuery.addEventListener('change', updateInitialTier);

    return () => deviceQuery.removeEventListener('change', updateInitialTier);
  }, [reducedMotion]);

  const handleQualityDecline = useCallback(() => {
    const now = performance.now();

    if (now - qualityChangeAt.current < 4000) {
      return;
    }

    qualityChangeAt.current = now;
    setQuality((current) => lowerReserveQuality(current));
  }, []);

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

  if (!supportsWebGL()) {
    return <ReserveCoreFallback {...props} />;
  }

  const useContinuousRendering = isSceneActive && !reducedMotion && qualityConfig.animateIdle;

  return (
    <section
      className="reserve-core"
      data-quality={quality}
      aria-label={goalTitle ? `Прогресс цели: ${goalTitle}` : 'Прогресс накоплений'}
    >
      <div className="reserve-core__canvas" ref={canvasContainer} aria-hidden="true">
        <Canvas
          camera={{ fov: 37, near: 0.1, far: 30, position: [0, 0, 5.25] }}
          dpr={qualityConfig.dpr}
          frameloop={useContinuousRendering ? 'always' : 'demand'}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => gl.setClearAlpha(0)}
        >
          <PerformanceMonitor
            bounds={(refreshRate) => (refreshRate > 90 ? [55, 85] : [38, 57])}
            iterations={8}
            ms={300}
            onDecline={handleQualityDecline}
            onIncline={handleQualityIncline}
          >
            <AdaptivePerformanceDpr />
            <ReserveCoreScene
              isActive={isSceneActive}
              quality={quality}
              reserveTotal={reserveTotal}
              reducedMotion={reducedMotion}
              visualState={visualState}
            />
          </PerformanceMonitor>
        </Canvas>
      </div>

      <div className="reserve-core__content">
        <p className="reserve-core__label">Всего накоплено</p>
        <AnimatedMoney
          amount={reserveTotal}
          className="reserve-core__amount"
          currency={currency}
          debounceMs={reducedMotion ? 0 : 180}
          durationMs={reducedMotion ? 0 : 380}
        />
        {targetAmount > 0 ? (
          <div className="reserve-core__status">
            <strong>{visualState.goalReached ? 'Цель достигнута' : getProgressText(goalProgress)}</strong>
            {!visualState.goalReached ? <span>Осталось: {formatMoney(remainingToGoal, currency)}</span> : null}
          </div>
        ) : (
          <p className="reserve-core__empty">Добавь цель, чтобы видеть прогресс.</p>
        )}
      </div>
    </section>
  );
}
