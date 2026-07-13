export type ReserveCoreData = {
  reserveTotal: number;
  goalTitle: string;
  targetAmount: number;
  goalProgress: number;
  remainingToGoal: number;
  currency: string;
};

export type ReserveVisualState = {
  goalProgress: number;
  visualProgress: number;
  coreScale: number;
  hasGoal: boolean;
  goalReached: boolean;
};

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getReserveVisualState(
  reserveTotal: number,
  targetAmount: number,
): ReserveVisualState {
  const hasGoal = targetAmount > 0;
  const goalProgress = hasGoal ? clamp(reserveTotal / targetAmount, 0, 1) : 0;
  const coreScale = goalProgress <= 0 ? 0 : Math.cbrt(goalProgress);

  return {
    goalProgress,
    visualProgress: goalProgress,
    coreScale: coreScale * 0.86,
    hasGoal,
    goalReached: hasGoal && goalProgress >= 1,
  };
}
