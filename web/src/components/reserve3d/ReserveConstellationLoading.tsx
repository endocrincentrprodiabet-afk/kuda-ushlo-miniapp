import { getGoalCategoryLabel } from '../../lib/goalCategories';
import type { ReserveConstellationData } from '../../lib/reserveVisual';

export function ReserveConstellationLoading({ goals, selectedGoalId }: ReserveConstellationData) {
  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId) ?? null;

  return (
    <section
      className="reserve-core reserve-constellation reserve-constellation--loading reserve-active-goal"
      aria-busy="true"
      aria-label="Подготовка 3D-сцены"
    >
      {selectedGoal ? (
        <header className="reserve-active-goal__header">
          <p>{getGoalCategoryLabel(selectedGoal.goalCategory)}</p>
          <h2>{selectedGoal.title}</h2>
        </header>
      ) : null}
      <div className="reserve-constellation__loading" role="status">
        <span className="reserve-constellation__loading-ring" aria-hidden="true" />
        <span>Подготовка 3D-сцены</span>
      </div>
    </section>
  );
}
