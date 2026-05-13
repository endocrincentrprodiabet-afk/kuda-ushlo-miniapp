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
  return {
    ...DEFAULT_SETTINGS,
    ...readJson<Partial<Settings>>(SETTINGS_KEY, DEFAULT_SETTINGS),
    currency: 'RUB',
  };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function clearAllData(): void {
  localStorage.removeItem(EXPENSES_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}
