import { DEFAULT_RESERVE_GOAL, DEFAULT_SETTINGS, MAX_RESERVE_GOALS } from './constants';
import { reconcileReserveGoalAllocations, sanitizeReserveGoal } from './calculations';
import { toDateInputValue } from './date';
import { normalizeCurrencyCode } from './currency';
import type {
  Expense,
  IncomeEntry,
  LegacyReserveGoal,
  ReserveClosure,
  ReserveGoal,
  ReserveTopUp,
  Settings,
} from '../types';

const EXPENSES_KEY = 'kuda-ushlo.expenses';
const SETTINGS_KEY = 'kuda-ushlo.settings';
const INCOME_ENTRIES_KEY = 'kuda-ushlo.incomeEntries';
const RESERVE_GOAL_KEY = 'kuda-ushlo.reserveGoal';
const RESERVE_GOALS_KEY = 'kuda-ushlo.reserveGoals';
const RESERVE_CLOSURES_KEY = 'kuda-ushlo.reserveClosures';
const RESERVE_TOP_UPS_KEY = 'kuda-ushlo.reserveTopUps';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);

  return toDateInputValue(date);
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
    currency: normalizeCurrencyCode(rawSettings.currency),
  };
  const monthlyBudget = Math.max(0, Number(settings.monthlyBudget) || 0);
  const availableNow =
    rawSettings.availableNow === undefined ? monthlyBudget : Math.max(0, Number(settings.availableNow) || 0);
  const incomeFrequency = settings.incomeFrequency === 'biweekly' ? 'biweekly' : 'monthly';
  const nextIncomeDate =
    typeof settings.nextIncomeDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(settings.nextIncomeDate)
      ? settings.nextIncomeDate
      : toDateInputValue(new Date());
  const secondIncomeDate =
    typeof settings.secondIncomeDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(settings.secondIncomeDate)
      ? settings.secondIncomeDate
      : addDays(nextIncomeDate, 14);

  return {
    ...settings,
    dailyLimit: 0,
    monthlyBudget,
    incomeFrequency,
    availableNow,
    nextIncomeDate,
    secondIncomeDate,
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
  const secondIncomeDate =
    typeof settings.secondIncomeDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(settings.secondIncomeDate)
      ? settings.secondIncomeDate
      : addDays(nextIncomeDate, 14);

  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      ...settings,
      dailyLimit: 0,
      monthlyBudget,
      incomeFrequency,
      availableNow,
      nextIncomeDate,
      secondIncomeDate,
      regularIncomeAmount: Math.max(0, Number(settings.regularIncomeAmount) || 0),
      savingsGoal,
      currency: normalizeCurrencyCode(settings.currency),
    }),
  );
}

function normalizeIncomeEntry(entry: Partial<IncomeEntry>): IncomeEntry | null {
  if (!entry.id || !entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    return null;
  }

  const kind =
    entry.kind === 'salary' || entry.kind === 'bonus' || entry.kind === 'side' || entry.kind === 'other'
      ? entry.kind
      : entry.type === 'salary'
        ? 'salary'
        : undefined;

  return {
    id: entry.id,
    amount: Math.max(0, Number(entry.amount) || 0),
    date: entry.date,
    note: typeof entry.note === 'string' ? entry.note : '',
    type: entry.type === 'salary' || entry.type === 'manual' ? entry.type : 'extra',
    kind,
    source: entry.source === 'auto' ? 'auto' : 'manual',
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

export function loadReserveGoal(): LegacyReserveGoal {
  const goal = {
    ...DEFAULT_RESERVE_GOAL,
    ...readJson<Partial<LegacyReserveGoal>>(RESERVE_GOAL_KEY, DEFAULT_RESERVE_GOAL),
  };

  return {
    title: typeof goal.title === 'string' && goal.title.trim() ? goal.title : DEFAULT_RESERVE_GOAL.title,
    targetAmount: Math.max(0, Number(goal.targetAmount) || 0),
  };
}

export function saveReserveGoal(goal: LegacyReserveGoal): void {
  localStorage.setItem(
    RESERVE_GOAL_KEY,
    JSON.stringify({
      title: goal.title.trim() || DEFAULT_RESERVE_GOAL.title,
      targetAmount: Math.max(0, Number(goal.targetAmount) || 0),
    }),
  );
}

function writeReserveGoals(goals: ReserveGoal[]): void {
  try {
    localStorage.setItem(RESERVE_GOALS_KEY, JSON.stringify(goals));
  } catch {
    // Keep the current in-memory state usable when storage is unavailable.
  }
}

export function loadReserveGoals(reserveTotal: number): ReserveGoal[] {
  let storedGoalsRaw: string | null = null;

  try {
    storedGoalsRaw = localStorage.getItem(RESERVE_GOALS_KEY);
  } catch {
    return [];
  }

  if (storedGoalsRaw !== null) {
    try {
      const parsedGoals = JSON.parse(storedGoalsRaw) as Array<Partial<ReserveGoal>>;
      const normalizedGoals = Array.isArray(parsedGoals)
        ? parsedGoals
            .map(sanitizeReserveGoal)
            .filter((goal): goal is ReserveGoal => Boolean(goal))
            .slice(0, MAX_RESERVE_GOALS)
        : [];
      const reconciledGoals = reconcileReserveGoalAllocations(normalizedGoals, reserveTotal);
      writeReserveGoals(reconciledGoals);

      return reconciledGoals;
    } catch {
      writeReserveGoals([]);
      return [];
    }
  }

  const legacyGoal = loadReserveGoal();

  if (legacyGoal.targetAmount <= 0) {
    writeReserveGoals([]);
    return [];
  }

  const migratedAt = new Date().toISOString();
  const migratedGoal: ReserveGoal = {
    id: 'migrated-reserve-goal-v1',
    title: legacyGoal.title.trim() || 'Цель',
    goalCategory: 'other',
    targetAmount: legacyGoal.targetAmount,
    allocatedAmount: Math.min(Math.max(0, Math.floor(reserveTotal)), legacyGoal.targetAmount),
    createdAt: migratedAt,
    updatedAt: migratedAt,
  };

  writeReserveGoals([migratedGoal]);
  return [migratedGoal];
}

export function saveReserveGoals(goals: ReserveGoal[]): void {
  const normalizedGoals = goals
    .map(sanitizeReserveGoal)
    .filter((goal): goal is ReserveGoal => Boolean(goal))
    .slice(0, MAX_RESERVE_GOALS);
  writeReserveGoals(normalizedGoals);
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

function isValidDateValue(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function normalizeReserveTopUp(topUp: Partial<ReserveTopUp>): ReserveTopUp | null {
  const amount = Number(topUp.amount);

  if (
    typeof topUp.id !== 'string' ||
    !topUp.id.trim() ||
    !Number.isFinite(amount) ||
    Math.round(amount) <= 0 ||
    !isValidDateValue(topUp.date)
  ) {
    return null;
  }

  const createdAt =
    typeof topUp.createdAt === 'string' && topUp.createdAt
      ? topUp.createdAt
      : `${topUp.date}T00:00:00.000Z`;

  return {
    id: topUp.id.trim(),
    amount: Math.min(Number.MAX_SAFE_INTEGER, Math.round(amount)),
    date: topUp.date,
    note: typeof topUp.note === 'string' ? topUp.note.trim() : '',
    createdAt,
    updatedAt:
      typeof topUp.updatedAt === 'string' && topUp.updatedAt ? topUp.updatedAt : createdAt,
  };
}

export function loadReserveTopUps(): ReserveTopUp[] {
  const storedTopUps = readJson<unknown>(RESERVE_TOP_UPS_KEY, []);

  if (!Array.isArray(storedTopUps)) {
    return [];
  }

  return (storedTopUps as Array<Partial<ReserveTopUp>>)
    .map(normalizeReserveTopUp)
    .filter((topUp): topUp is ReserveTopUp => Boolean(topUp));
}

export function saveReserveTopUps(reserveTopUps: ReserveTopUp[]): void {
  localStorage.setItem(
    RESERVE_TOP_UPS_KEY,
    JSON.stringify(
      reserveTopUps
        .map(normalizeReserveTopUp)
        .filter((topUp): topUp is ReserveTopUp => Boolean(topUp)),
    ),
  );
}

export function clearAllData(): void {
  localStorage.removeItem(EXPENSES_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(INCOME_ENTRIES_KEY);
  localStorage.removeItem(RESERVE_GOAL_KEY);
  localStorage.removeItem(RESERVE_GOALS_KEY);
  localStorage.removeItem(RESERVE_CLOSURES_KEY);
  localStorage.removeItem(RESERVE_TOP_UPS_KEY);
}
