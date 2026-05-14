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

export function getMonthWeeklyTotals(expenses: Expense[], date = new Date()): number[] {
  const totals = [0, 0, 0, 0, 0];

  getMonthExpenses(expenses, date).forEach((expense) => {
    const expenseDate = new Date(`${expense.date}T00:00:00`);
    const weekIndex = Math.min(4, Math.floor((expenseDate.getDate() - 1) / 7));

    totals[weekIndex] += expense.amount;
  });

  return totals;
}

export type MonthWeeklyBudgetStat = {
  weekIndex: number;
  total: number;
  startDay: number;
  endDay: number;
  daysCount: number;
  target: number;
  fillPercent: number;
  isOverTarget: boolean;
};

export function getMonthWeeklyBudgetStats(
  expenses: Expense[],
  monthlyBudget: number,
  date = new Date(),
): MonthWeeklyBudgetStat[] {
  const totals = getMonthWeeklyTotals(expenses, date);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const dailyMonthlyTarget = monthlyBudget > 0 ? monthlyBudget / daysInMonth : 0;
  const maxWeeklyTotal = Math.max(...totals, 1);

  return totals.map((total, index) => {
    const startDay = index * 7 + 1;
    const endDay = Math.min(startDay + 6, daysInMonth);
    const daysCount = Math.max(0, endDay - startDay + 1);
    const target = monthlyBudget > 0 ? dailyMonthlyTarget * daysCount : maxWeeklyTotal;
    const rawFillPercent = target > 0 ? (total / target) * 100 : 0;

    return {
      weekIndex: index + 1,
      total,
      startDay,
      endDay,
      daysCount,
      target,
      fillPercent: Math.min(rawFillPercent, 100),
      isOverTarget: monthlyBudget > 0 && target > 0 && total > target,
    };
  });
}

export function getMonthProgressPercent(date = new Date()): number {
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  return (date.getDate() / daysInMonth) * 100;
}

export function getBudgetUsagePercent(monthTotal: number, monthlyBudget: number): number {
  if (monthlyBudget <= 0) {
    return 0;
  }

  return (monthTotal / monthlyBudget) * 100;
}

export function getMonthBalanceStatus(
  budgetPercent: number,
  monthPercent: number,
): 'within-month' | 'ahead-of-month' {
  return budgetPercent <= monthPercent + 5 ? 'within-month' : 'ahead-of-month';
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

export function sortExpensesByDate(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}
