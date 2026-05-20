import type { ExpenseCategory, ReserveGoal, Settings } from '../types';

export const CATEGORIES: ExpenseCategory[] = [
  'Еда',
  'Транспорт',
  'Дом',
  'Покупки',
  'Маркетплейсы',
  'Здоровье',
  'Развлечения',
  'Подписки',
  'Другое',
];

export const DEFAULT_SETTINGS: Settings = {
  dailyLimit: 0,
  monthlyBudget: 0,
  savingsGoal: 0,
  incomeFrequency: 'monthly',
  availableNow: 0,
  nextIncomeDate: new Date().toISOString().slice(0, 10),
  regularIncomeAmount: 0,
  currency: 'RUB',
};

export const DEFAULT_RESERVE_GOAL: ReserveGoal = {
  title: 'Неприкосновенный запас',
  targetAmount: 0,
};
