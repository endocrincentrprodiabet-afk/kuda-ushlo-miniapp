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

export function getMonthExpenses(expenses: Expense[], date = new Date()): Expense[] {
  const year = date.getFullYear();
  const month = date.getMonth();

  return expenses.filter((expense) => {
    const expenseDate = new Date(`${expense.date}T00:00:00`);

    return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
  });
}

export function getDaysLeftInMonth(date = new Date()): number {
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  return Math.max(1, lastDayOfMonth - date.getDate() + 1);
}

export function getMonthlyBudgetStats(expenses: Expense[], monthlyBudget: number, date = new Date()) {
  const monthTotal = sumExpenses(getMonthExpenses(expenses, date));
  const balance = monthlyBudget - monthTotal;
  const daysLeft = getDaysLeftInMonth(date);
  const comfortDailyPace = balance > 0 ? balance / daysLeft : 0;

  return {
    monthTotal,
    balance,
    overBudget: Math.max(0, -balance),
    daysLeft,
    comfortDailyPace,
  };
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
