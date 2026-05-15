import { DEFAULT_SETTINGS } from './constants';
import type { Expense, Settings } from '../types';

const EXPENSES_KEY = 'kuda-ushlo.expenses';
const SETTINGS_KEY = 'kuda-ushlo.settings';

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

export function clearAllData(): void {
  localStorage.removeItem(EXPENSES_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}
