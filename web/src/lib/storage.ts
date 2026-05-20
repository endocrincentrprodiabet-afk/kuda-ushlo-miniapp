import { DEFAULT_RESERVE_GOAL, DEFAULT_SETTINGS } from './constants';
import { toDateInputValue } from './date';
import type { Expense, IncomeEntry, ReserveClosure, ReserveGoal, Settings } from '../types';

const EXPENSES_KEY = 'kuda-ushlo.expenses';
const SETTINGS_KEY = 'kuda-ushlo.settings';
const INCOME_ENTRIES_KEY = 'kuda-ushlo.incomeEntries';
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
  const rawSettings = readJson<Partial<Settings>>(SETTINGS_KEY, DEFAULT_SETTINGS);
  const settings = {
    ...DEFAULT_SETTINGS,
    ...rawSettings,
    currency: 'RUB' as const,
  };
  const monthlyBudget = Math.max(0, Number(settings.monthlyBudget) || 0);
  const availableNow =
    rawSettings.availableNow === undefined ? monthlyBudget : Math.max(0, Number(settings.availableNow) || 0);
  const incomeFrequency = settings.incomeFrequency === 'biweekly' ? 'biweekly' : 'monthly';
  const nextIncomeDate =
    typeof settings.nextIncomeDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(settings.nextIncomeDate)
      ? settings.nextIncomeDate
      : toDateInputValue(new Date());

  return {
    ...settings,
    dailyLimit: 0,
    monthlyBudget,
    incomeFrequency,
    availableNow,
    nextIncomeDate,
    regularIncomeAmount: Math.max(0, Number(settings.regularIncomeAmount) || 0),
    savingsGoal: Math.max(0, Number(settings.savingsGoal) || 0),
  };
}

export function saveSettings(settings: Settings): void {
  const availableNow = Math.max(0, Number(settings.availableNow) || 0);
  const monthlyBudget = Math.max(0, Number(settings.monthlyBudget) || 0);
  const savingsGoal = Math.max(0, Number(settings.savingsGoal) || 0);
  const incomeFrequency = settings.incomeFrequency === 'biweekly' ? 'biweekly' : 'monthly';
  const nextIncomeDate =
    typeof settings.nextIncomeDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(settings.nextIncomeDate)
      ? settings.nextIncomeDate
      : toDateInputValue(new Date());

  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      ...settings,
      dailyLimit: 0,
      monthlyBudget,
      incomeFrequency,
      availableNow,
      nextIncomeDate,
      regularIncomeAmount: Math.max(0, Number(settings.regularIncomeAmount) || 0),
      savingsGoal,
      currency: 'RUB' as const,
    }),
  );
}

function normalizeIncomeEntry(entry: Partial<IncomeEntry>): IncomeEntry | null {
  if (!entry.id || !entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    return null;
  }

  return {
    id: entry.id,
    amount: Math.max(0, Number(entry.amount) || 0),
    date: entry.date,
    note: typeof entry.note === 'string' ? entry.note : '',
    type: entry.type === 'salary' ? 'salary' : 'extra',
    createdAt: entry.createdAt || new Date().toISOString(),
  };
}

export function loadIncomeEntries(): IncomeEntry[] {
  return readJson<Array<Partial<IncomeEntry>>>(INCOME_ENTRIES_KEY, [])
    .map(normalizeIncomeEntry)
    .filter((entry): entry is IncomeEntry => Boolean(entry));
}

export function saveIncomeEntries(entries: IncomeEntry[]): void {
  localStorage.setItem(INCOME_ENTRIES_KEY, JSON.stringify(entries.map(normalizeIncomeEntry).filter(Boolean)));
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
  localStorage.removeItem(INCOME_ENTRIES_KEY);
  localStorage.removeItem(RESERVE_GOAL_KEY);
  localStorage.removeItem(RESERVE_CLOSURES_KEY);
}
