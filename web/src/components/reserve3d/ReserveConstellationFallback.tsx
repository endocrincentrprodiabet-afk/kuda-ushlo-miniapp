import type { CSSProperties } from 'react';
import { AnimatedMoney } from '../AnimatedMoney';
import { getGoalProgress } from '../../lib/calculations';
import { formatMoney } from '../../lib/format';
import type { ReserveConstellationData } from '../../lib/reserveVisual';

export function ReserveConstellationFallback({
  allocatedTotal,
  currency,
  goals,
  onAddGoal,
  onDeleteSelectedGoal,
  onEditSelectedGoal,
  onSelectGoal,
  reserveTotal,
  selectedGoalId,
  unallocatedReserve,
}: ReserveConstellationData) {
  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId) ?? null;

  return (
    <section className="reserve-core reserve-core--fallback reserve-constellation-fallback">
      <div className="reserve-constellation-fallback__visual" aria-label="Схема целей без 3D">
        <div className="reserve-constellation-fallback__free">
          <span>Свободно</span>
          <strong>{formatMoney(unallocatedReserve, currency)}</strong>
        </div>
        {goals.length ? (
          <div className="reserve-constellation-fallback__goals">
            {goals.map((goal) => {
              const progress = getGoalProgress(goal);
              const style = { '--goal-progress': `${progress * 100}%` } as CSSProperties;

              return (
                <button
                  className={goal.id === selectedGoalId ? 'is-selected' : ''}
                  key={goal.id}
                  onClick={() => onSelectGoal(goal.id)}
                  style={style}
                  type="button"
                >
                  <span>{goal.title}</span>
                  <strong>{Math.round(progress * 100)}%</strong>
                </button>
              );
            })}
          </div>
        ) : (
          <p>Добавь цель, чтобы собрать свою систему накоплений.</p>
        )}
      </div>

      <div className="reserve-core__content reserve-constellation__content">
        <p className="reserve-core__label">Общий запас</p>
        <AnimatedMoney amount={reserveTotal} className="reserve-core__amount" currency={currency} debounceMs={180} />
        <div className="reserve-constellation__totals">
          <span>Распределено: {formatMoney(allocatedTotal, currency)}</span>
          <span>Свободно: {formatMoney(unallocatedReserve, currency)}</span>
        </div>
        {selectedGoal ? (
          <div className="reserve-constellation-fallback__actions">
            <strong>{selectedGoal.title}</strong>
            <span>
              {formatMoney(selectedGoal.allocatedAmount, currency)} из {formatMoney(selectedGoal.targetAmount, currency)}
            </span>
            {goals.length < 6 ? (
              <button className="text-button" onClick={onAddGoal} type="button">
                Добавить
              </button>
            ) : null}
            <button className="text-button" onClick={onEditSelectedGoal} type="button">
              Изменить
            </button>
            <button className="delete-button" onClick={onDeleteSelectedGoal} type="button">
              Удалить
            </button>
          </div>
        ) : (
          <button className="secondary-button" disabled={goals.length >= 6} onClick={onAddGoal} type="button">
            Добавить цель
          </button>
        )}
      </div>
    </section>
  );
}
