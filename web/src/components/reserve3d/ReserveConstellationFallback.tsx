import { AnimatedMoney } from '../AnimatedMoney';
import { getGoalProgress } from '../../lib/calculations';
import { formatMoney } from '../../lib/format';
import { getGoalCategoryConfig, getGoalCategoryLabel } from '../../lib/goalCategories';
import type { ReserveConstellationData } from '../../lib/reserveVisual';

export function ReserveConstellationFallback({
  currency,
  goals,
  selectedGoalId,
}: ReserveConstellationData) {
  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId) ?? null;

  if (!selectedGoal) {
    return null;
  }

  const category = getGoalCategoryConfig(selectedGoal.goalCategory).value;
  const categoryLabel = getGoalCategoryLabel(category);
  const progress = getGoalProgress(selectedGoal);
  const remainingAmount = Math.max(0, selectedGoal.targetAmount - selectedGoal.allocatedAmount);

  return (
    <section
      className="reserve-core reserve-core--fallback reserve-constellation-fallback reserve-active-goal"
      aria-label={`Активная цель: ${selectedGoal.title}`}
    >
      <header className="reserve-active-goal__header">
        <p>{categoryLabel}</p>
        <h2>{selectedGoal.title}</h2>
      </header>

      <div className="reserve-category-fallback" data-category={category} aria-hidden="true">
        <span className="reserve-category-fallback__shape reserve-category-fallback__shape--primary" />
        <span className="reserve-category-fallback__shape reserve-category-fallback__shape--secondary" />
        <span className="reserve-category-fallback__accent" />
      </div>

      <div className="reserve-active-goal__details">
        <div className="reserve-active-goal__saved">
          <span>Накоплено</span>
          <AnimatedMoney amount={selectedGoal.allocatedAmount} currency={currency} debounceMs={0} />
        </div>
        <dl className="reserve-active-goal__metrics">
          <div>
            <dt>Сумма цели</dt>
            <dd>{formatMoney(selectedGoal.targetAmount, currency)}</dd>
          </div>
          <div>
            <dt>Осталось</dt>
            <dd>{formatMoney(remainingAmount, currency)}</dd>
          </div>
        </dl>
        <div className="reserve-active-goal__progress">
          <div>
            <span>Прогресс</span>
            <strong>{Math.round(progress * 100)}%</strong>
          </div>
          <span className="reserve-active-goal__progress-track" aria-hidden="true">
            <span style={{ width: `${progress * 100}%` }} />
          </span>
        </div>
      </div>
    </section>
  );
}
