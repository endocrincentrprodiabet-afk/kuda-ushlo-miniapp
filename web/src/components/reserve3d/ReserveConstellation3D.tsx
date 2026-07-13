import { useCallback, useEffect, useRef, useState } from 'react';
import { AdaptiveDpr, PerformanceMonitor, usePerformanceMonitor } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { AnimatedMoney } from '../AnimatedMoney';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { formatMoney } from '../../lib/format';
import type { ReserveConstellationData } from '../../lib/reserveVisual';
import { ReserveConstellationFallback } from './ReserveConstellationFallback';
import { ReserveConstellationScene } from './ReserveConstellationScene';
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
  const { allocatedTotal, currency, goals, reserveTotal, selectedGoalId, unallocatedReserve } = props;
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useMobileConstellation();
  const canvasContainer = useRef<HTMLDivElement>(null);
  const qualityChangeAt = useRef(Number.NEGATIVE_INFINITY);
  const [quality, setQuality] = useState<ReserveQualityTier>(() => getInitialReserveQuality(reducedMotion));
  const isSceneActive = useSceneVisibility(canvasContainer);
  const qualityConfig = reserveQualityConfigs[quality];

  useEffect(() => {
    const query = window.matchMedia('(max-width: 719px), (max-width: 1024px) and (pointer: coarse)');
    const updateInitialTier = () => setQuality(getInitialReserveQuality(reducedMotion));
    updateInitialTier();
    query.addEventListener('change', updateInitialTier);

    return () => query.removeEventListener('change', updateInitialTier);
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
    return <ReserveConstellationFallback {...props} />;
  }

  const useContinuousRendering = isSceneActive && !reducedMotion && qualityConfig.animateIdle;

  return (
    <section
      className="reserve-core reserve-constellation"
      data-quality={quality}
      aria-label={`Система накоплений. Целей: ${goals.length}`}
    >
      <div className="reserve-core__canvas reserve-constellation__canvas" ref={canvasContainer} aria-hidden="true">
        <Canvas
          camera={{ fov: isMobile ? 39 : 37, near: 0.1, far: 40, position: [0, 0, isMobile ? 8.4 : 9.2] }}
          dpr={qualityConfig.dpr}
          frameloop={useContinuousRendering ? 'always' : 'demand'}
          gl={{ alpha: true, antialias: quality !== 'low', powerPreference: 'high-performance' }}
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
            <ReserveConstellationScene
              goals={goals}
              isActive={isSceneActive}
              isMobile={isMobile}
              onSelectGoal={props.onSelectGoal}
              quality={quality}
              reducedMotion={reducedMotion}
              reserveTotal={reserveTotal}
              selectedGoalId={selectedGoalId}
              unallocatedReserve={unallocatedReserve}
            />
          </PerformanceMonitor>
        </Canvas>
      </div>

      <div className="reserve-core__content reserve-constellation__content">
        <p className="reserve-core__label">Общий запас</p>
        <AnimatedMoney
          amount={reserveTotal}
          className="reserve-core__amount"
          currency={currency}
          debounceMs={reducedMotion ? 0 : 180}
          durationMs={reducedMotion ? 0 : 380}
        />
        <div className="reserve-constellation__totals">
          <span>Распределено: {formatMoney(allocatedTotal, currency)}</span>
          <span>Свободно: {formatMoney(unallocatedReserve, currency)}</span>
        </div>
        {!goals.length ? <p className="reserve-core__empty">Добавь цель, чтобы собрать свою систему накоплений.</p> : null}
        {reserveTotal <= 0 ? <p className="reserve-core__empty">После пополнения или фиксации месяца здесь появится реальный запас.</p> : null}
      </div>
    </section>
  );
}
