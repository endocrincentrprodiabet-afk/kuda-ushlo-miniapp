import { getWeekEnd, isToday, isWithinCurrentWeek, isWithinLastSevenDays, toDateInputValue } from './date';
import type { Expense, ExpenseCategory, ReserveClosure, Settings } from '../types';

export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function getTodayExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((expense) => isToday(expense.date));
}

export function getWeekExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((expense) => isWithinLastSevenDays(expense.date));
}

export function getCurrentWeekExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((expense) => isWithinCurrentWeek(expense.date));
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

export function getDaysLeftInMonthIncludingToday(date = new Date()): number {
  return getDaysLeftInMonth(date);
}

export function getMonthlySpendingLimit(settings: Pick<Settings, 'monthlyBudget' | 'savingsGoal'>): number {
  const monthlyBudget = Math.max(settings.monthlyBudget, 0);
  const savingsGoal = Math.min(Math.max(settings.savingsGoal, 0), monthlyBudget);

  return Math.max(monthlyBudget - savingsGoal, 0);
}

export function getSpentBeforeToday(expenses: Expense[], date = new Date()): number {
  const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);

  return sumExpenses(
    expenses.filter((expense) => {
      const expenseDate = new Date(`${expense.date}T00:00:00`);

      return expenseDate >= monthStart && expenseDate < todayStart;
    }),
  );
}

export function getAutoDailyTarget(
  expenses: Expense[],
  settings: Pick<Settings, 'monthlyBudget' | 'savingsGoal'>,
  date = new Date(),
): number {
  const monthlySpendingLimit = getMonthlySpendingLimit(settings);

  if (monthlySpendingLimit <= 0) {
    return 0;
  }

  const spentBeforeToday = getSpentBeforeToday(expenses, date);
  const remainingBeforeToday = Math.max(monthlySpendingLimit - spentBeforeToday, 0);
  const daysLeftIncludingToday = getDaysLeftInMonthIncludingToday(date);

  return remainingBeforeToday / daysLeftIncludingToday;
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

type MonthWeekGroup = {
  startDate: Date;
  endDate: Date;
};

function getDaysCount(startDate: Date, endDate: Date): number {
  const millisecondsInDay = 24 * 60 * 60 * 1000;

  return Math.round((endDate.getTime() - startDate.getTime()) / millisecondsInDay) + 1;
}

function mergeWeekGroups(firstGroup: MonthWeekGroup, secondGroup: MonthWeekGroup): MonthWeekGroup {
  return {
    startDate: firstGroup.startDate,
    endDate: secondGroup.endDate,
  };
}

function getMonthWeekGroups(date = new Date()): MonthWeekGroup[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const groups: MonthWeekGroup[] = [];
  let cursor = monthStart;

  while (cursor <= monthEnd) {
    const startDate = cursor > monthStart ? cursor : monthStart;
    const calendarWeekEnd = getWeekEnd(cursor);
    const endDate = calendarWeekEnd < monthEnd ? calendarWeekEnd : monthEnd;

    groups.push({ startDate, endDate });
    cursor = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);
  }

  while (groups.length > 4) {
    const firstDaysCount = getDaysCount(groups[0].startDate, groups[0].endDate);
    const lastGroup = groups[groups.length - 1];
    const lastDaysCount = getDaysCount(lastGroup.startDate, lastGroup.endDate);
    const shouldMergeFirst = firstDaysCount <= lastDaysCount;

    if (shouldMergeFirst) {
      groups.splice(0, 2, mergeWeekGroups(groups[0], groups[1]));
    } else {
      const previousGroup = groups[groups.length - 2];
      groups.splice(groups.length - 2, 2, mergeWeekGroups(previousGroup, lastGroup));
    }
  }

  return groups;
}

export function getMonthWeeklyTotals(expenses: Expense[], date = new Date()): number[] {
  const groups = getMonthWeekGroups(date);
  const totals = groups.map(() => 0);

  getMonthExpenses(expenses, date).forEach((expense) => {
    const expenseDate = new Date(`${expense.date}T00:00:00`);
    const weekIndex = groups.findIndex((group) => expenseDate >= group.startDate && expenseDate <= group.endDate);

    if (weekIndex >= 0) {
      totals[weekIndex] += expense.amount;
    }
  });

  return totals;
}

export type MonthWeeklyBudgetStat = {
  index: number;
  weekIndex: number;
  total: number;
  startDate: string;
  endDate: string;
  startDay: number;
  endDay: number;
  daysCount: number;
  target: number;
  fillPercent: number;
  cappedFillPercent: number;
  isOverTarget: boolean;
  expenses: Expense[];
  categoryTotals: Array<{ category: ExpenseCategory; total: number }>;
};

export function getMonthWeeklyBudgetStats(
  expenses: Expense[],
  monthlyBudget: number,
  date = new Date(),
): MonthWeeklyBudgetStat[] {
  const groups = getMonthWeekGroups(date);
  const totals = groups.map(() => 0);
  const expensesByGroup = groups.map((): Expense[] => []);

  getMonthExpenses(expenses, date).forEach((expense) => {
    const expenseDate = new Date(`${expense.date}T00:00:00`);
    const weekIndex = groups.findIndex((group) => expenseDate >= group.startDate && expenseDate <= group.endDate);

    if (weekIndex >= 0) {
      totals[weekIndex] += expense.amount;
      expensesByGroup[weekIndex].push(expense);
    }
  });

  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const dailyMonthlyTarget = monthlyBudget > 0 ? monthlyBudget / daysInMonth : 0;
  const maxWeeklyTotal = Math.max(...totals, 1);

  return totals.map((total, index) => {
    const group = groups[index];
    const daysCount = getDaysCount(group.startDate, group.endDate);
    const target = monthlyBudget > 0 ? dailyMonthlyTarget * daysCount : maxWeeklyTotal;
    const rawFillPercent = target > 0 ? (total / target) * 100 : 0;

    return {
      index: index + 1,
      weekIndex: index + 1,
      total,
      startDate: toDateInputValue(group.startDate),
      endDate: toDateInputValue(group.endDate),
      startDay: group.startDate.getDate(),
      endDay: group.endDate.getDate(),
      daysCount,
      target,
      fillPercent: rawFillPercent,
      cappedFillPercent: Math.min(rawFillPercent, 100),
      isOverTarget: monthlyBudget > 0 && target > 0 && total > target,
      expenses: sortExpensesByDate(expensesByGroup[index]),
      categoryTotals: getCategoryTotals(expensesByGroup[index]),
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

export function getReserveTotal(reserveClosures: ReserveClosure[]): number {
  return reserveClosures.reduce((total, closure) => total + Math.max(0, closure.actualSaved), 0);
}

export function getCurrentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getSuggestedMonthlySavings(monthlyBudget: number, monthTotal: number): number {
  return Math.max(Math.max(0, monthlyBudget) - Math.max(0, monthTotal), 0);
}

export function getGoalProgress(reserveTotal: number, targetAmount: number): number {
  if (targetAmount <= 0) {
    return 0;
  }

  return (Math.max(0, reserveTotal) / targetAmount) * 100;
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
