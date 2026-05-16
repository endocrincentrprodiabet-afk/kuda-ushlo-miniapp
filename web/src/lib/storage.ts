import { DEFAULT_RESERVE_GOAL, DEFAULT_SETTINGS } from './constants';
import type { Expense, ReserveClosure, ReserveGoal, Settings } from '../types';

const EXPENSES_KEY = 'kuda-ushlo.expenses';
const SETTINGS_KEY = 'kuda-ushlo.settings';
const RESERVE_GOAL_KEY = 'kuda-ushlo.reserveGoal';
const RESERVE_CLOSURES_KEY = 'kuda-ushlo.reserveClosures';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadExpenses(): Expense[] {
  return readJson<Expense[]>(EXPENSES_KEY, []);
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function loadSettings(): Settings {
  const settings = {
    ...DEFAULT_SETTINGS,
    ...readJson<Partial<Settings>>(SETTINGS_KEY, DEFAULT_SETTINGS),
    currency: 'RUB' as const,
  };

  return {
    ...settings,
    dailyLimit: 0,
    monthlyBudget: Math.max(0, settings.monthlyBudget || 0),
    savingsGoal: Math.min(Math.max(0, settings.savingsGoal || 0), Math.max(0, settings.monthlyBudget || 0)),
  };
}

export function saveSettings(settings: Settings): void {
  const monthlyBudget = Math.max(0, settings.monthlyBudget || 0);
  const savingsGoal = Math.min(Math.max(0, settings.savingsGoal || 0), monthlyBudget);

  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      ...settings,
      dailyLimit: 0,
      monthlyBudget,
      savingsGoal: monthlyBudget > 0 ? savingsGoal : 0,
      currency: 'RUB' as const,
    }),
  );
}

export function loadReserveGoal(): ReserveGoal {
  const goal = {
    ...DEFAULT_RESERVE_GOAL,
    ...readJson<Partial<ReserveGoal>>(RESERVE_GOAL_KEY, DEFAULT_RESERVE_GOAL),
  };

  return {
    title: typeof goal.title === 'string' && goal.title.trim() ? goal.title : DEFAULT_RESERVE_GOAL.title,
    targetAmount: Math.max(0, Number(goal.targetAmount) || 0),
  };
}

export function saveReserveGoal(goal: ReserveGoal): void {
  localStorage.setItem(
    RESERVE_GOAL_KEY,
    JSON.stringify({
      title: goal.title.trim() || DEFAULT_RESERVE_GOAL.title,
      targetAmount: Math.max(0, Number(goal.targetAmount) || 0),
    }),
  );
}

function normalizeReserveClosure(closure: Partial<ReserveClosure>): ReserveClosure | null {
  if (!closure.id || !closure.month || !/^\d{4}-\d{2}$/.test(closure.month)) {
    return null;
  }

  return {
    id: closure.id,
    month: closure.month,
    plannedSavings: Math.max(0, Number(closure.plannedSavings) || 0),
    actualSaved: Math.max(0, Number(closure.actualSaved) || 0),
    monthlyBudget: Math.max(0, Number(closure.monthlyBudget) || 0),
    monthTotal: Math.max(0, Number(closure.monthTotal) || 0),
    spendingLimit: Math.max(0, Number(closure.spendingLimit) || 0),
    confirmedAt: closure.confirmedAt || new Date().toISOString(),
  };
}

export function loadReserveClosures(): ReserveClosure[] {
  return readJson<Array<Partial<ReserveClosure>>>(RESERVE_CLOSURES_KEY, [])
    .map(normalizeReserveClosure)
    .filter((closure): closure is ReserveClosure => Boolean(closure));
}

export function saveReserveClosures(closures: ReserveClosure[]): void {
  localStorage.setItem(RESERVE_CLOSURES_KEY, JSON.stringify(closures));
}

export function clearAllData(): void {
  localStorage.removeItem(EXPENSES_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(RESERVE_GOAL_KEY);
  localStorage.removeItem(RESERVE_CLOSURES_KEY);
}
