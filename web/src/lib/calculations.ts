import { isToday, isWithinLastSevenDays } from './date';
import type { Expense, ExpenseCategory } from '../types';

export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function getTodayExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((expense) => isToday(expense.date));
}

export function getWeekExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((expense) => isWithinLastSevenDays(expense.date));
}

export function getCategoryTotals(expenses: Expense[]): Array<{ category: ExpenseCategory; total: number }> {
  const totals = new Map<ExpenseCategory, number>();

  expenses.forEach((expense) => {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  });

  return Array.from(totals, ([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);
}

export function getLargestCategory(expenses: Expense[]): { category: ExpenseCategory; total: number } | null {
  return getCategoryTotals(expenses)[0] ?? null;
}

export function sortByCreatedAt(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
