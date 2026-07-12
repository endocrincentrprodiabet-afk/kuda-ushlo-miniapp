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
  goalProgressPercent: number,
): ReserveVisualState {
  const hasGoal = targetAmount > 0;
  const goalProgress = hasGoal ? clamp(goalProgressPercent / 100, 0, 1) : 0;
  const visualProgress = hasGoal ? 0.18 + 0.82 * Math.sqrt(goalProgress) : reserveTotal > 0 ? 0.3 : 0.12;

  return {
    goalProgress,
    visualProgress,
    coreScale: 0.68 + visualProgress * 0.54,
    hasGoal,
    goalReached: hasGoal && goalProgress >= 1,
  };
}
