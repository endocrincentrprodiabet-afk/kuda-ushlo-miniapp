import { AnimatedMoney } from '../AnimatedMoney';
import { formatMoney } from '../../lib/format';
import { getReserveVisualState, type ReserveCoreData } from '../../lib/reserveVisual';
import type { CSSProperties } from 'react';

function getProgressText(goalProgress: number): string {
  return `${Math.round(goalProgress)}% цели`;
}

export function ReserveCoreFallback({
  reserveTotal,
  targetAmount,
  goalProgress,
  remainingToGoal,
  currency,
}: ReserveCoreData) {
  const visualState = getReserveVisualState(reserveTotal, targetAmount);
  const coreStyle = { '--reserve-fallback-core-scale': visualState.coreScale } as CSSProperties;

  return (
    <section className="reserve-core reserve-core--fallback">
      <div className="reserve-core-fallback__visual" aria-hidden="true">
        <div className="reserve-core-fallback__ring" />
        <div className="reserve-core-fallback__orb">
          <div className="reserve-core-fallback__inner" style={coreStyle} />
        </div>
      </div>
      <div className="reserve-core__content">
        <p className="reserve-core__label">Всего накоплено</p>
        <AnimatedMoney amount={reserveTotal} className="reserve-core__amount" currency={currency} debounceMs={180} />
        {targetAmount > 0 ? (
          <div className="reserve-core__status">
            <strong>{remainingToGoal === 0 ? 'Цель достигнута' : getProgressText(goalProgress)}</strong>
            {remainingToGoal > 0 ? <span>Осталось: {formatMoney(remainingToGoal, currency)}</span> : null}
          </div>
        ) : (
          <p className="reserve-core__empty">Добавь цель, чтобы видеть прогресс.</p>
        )}
      </div>
    </section>
  );
}
