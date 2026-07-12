import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { AnimatedMoney } from '../AnimatedMoney';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { formatMoney } from '../../lib/format';
import { getReserveVisualState, type ReserveCoreData } from '../../lib/reserveVisual';
import { ReserveCoreFallback } from './ReserveCoreFallback';
import { ReserveCoreScene } from './ReserveCoreScene';

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

export default function ReserveCore3D(props: ReserveCoreData) {
  const { reserveTotal, goalTitle, targetAmount, goalProgress, remainingToGoal, currency } = props;
  const reducedMotion = usePrefersReducedMotion();
  const visualState = useMemo(
    () => getReserveVisualState(reserveTotal, targetAmount, goalProgress),
    [goalProgress, reserveTotal, targetAmount],
  );

  if (!supportsWebGL()) {
    return <ReserveCoreFallback {...props} />;
  }

  return (
    <section className="reserve-core" aria-label={goalTitle ? `Прогресс цели: ${goalTitle}` : 'Прогресс запаса'}>
      <div className="reserve-core__canvas" aria-hidden="true">
        <Canvas
          camera={{ fov: 37, near: 0.1, far: 30, position: [0, 0, 5.25] }}
          dpr={[1, 1.5]}
          frameloop={reducedMotion ? 'demand' : 'always'}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => gl.setClearAlpha(0)}
        >
          <ReserveCoreScene reserveTotal={reserveTotal} reducedMotion={reducedMotion} visualState={visualState} />
        </Canvas>
      </div>

      <div className="reserve-core__content">
        <p className="reserve-core__label">Накоплено</p>
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
          <p className="reserve-core__empty">Добавь цель, чтобы видеть прогресс</p>
        )}
      </div>
    </section>
  );
}
