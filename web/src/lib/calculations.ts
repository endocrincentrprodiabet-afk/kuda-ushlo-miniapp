import { getWeekEnd, isToday, isWithinCurrentWeek, isWithinLastSevenDays, toDateInputValue } from './date';
import type {
  Expense,
  ExpenseCategory,
  IncomeEntry,
  ReserveClosure,
  ReserveGoal,
  ReserveTopUp,
  Settings,
} from '../types';

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

export function getMonthIncomeEntries(incomeEntries: IncomeEntry[], date = new Date()): IncomeEntry[] {
  const year = date.getFullYear();
  const month = date.getMonth();

  return incomeEntries.filter((entry) => {
    const entryDate = new Date(`${entry.date}T00:00:00`);

    return entryDate.getFullYear() === year && entryDate.getMonth() === month;
  });
}

export function getDaysLeftInMonth(date = new Date()): number {
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  return Math.max(1, lastDayOfMonth - date.getDate() + 1);
}

export function getDaysLeftInMonthIncludingToday(date = new Date()): number {
  return getDaysLeftInMonth(date);
}

export function getDaysInMonth(date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getWorkingBudget(
  settings: Pick<Settings, 'availableNow' | 'monthlyBudget'>,
  incomeEntries: IncomeEntry[] = [],
  date = new Date(),
): number {
  const availableNow =
    settings.availableNow === undefined ? Math.max(settings.monthlyBudget || 0, 0) : Math.max(settings.availableNow, 0);
  const monthIncome = getMonthIncomeEntries(incomeEntries, date).reduce((total, entry) => total + entry.amount, 0);

  return availableNow + monthIncome;
}

export function getMonthlySpendingLimitFromWorkingBudget(workingBudget: number, savingsGoal: number): number {
  const normalizedWorkingBudget = Math.max(workingBudget, 0);
  const normalizedSavingsGoal = Math.min(Math.max(savingsGoal, 0), normalizedWorkingBudget);

  return Math.max(normalizedWorkingBudget - normalizedSavingsGoal, 0);
}

export function getMonthlySpendingLimit(
  settings: Pick<Settings, 'monthlyBudget' | 'savingsGoal' | 'availableNow'>,
  incomeEntries: IncomeEntry[] = [],
  date = new Date(),
): number {
  const workingBudget = getWorkingBudget(settings, incomeEntries, date);

  return getMonthlySpendingLimitFromWorkingBudget(workingBudget, settings.savingsGoal);
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

export function getPlannedDailyTargetFromWorkingBudget(
  workingBudget: number,
  savingsGoal: number,
  date = new Date(),
): number {
  const monthlySpendingLimit = getMonthlySpendingLimitFromWorkingBudget(workingBudget, savingsGoal);

  if (monthlySpendingLimit <= 0) {
    return 0;
  }

  return monthlySpendingLimit / getDaysInMonth(date);
}

export function getPlannedDailyTarget(
  settings: Pick<Settings, 'monthlyBudget' | 'savingsGoal' | 'availableNow'>,
  incomeEntries: IncomeEntry[] = [],
  date = new Date(),
): number {
  const workingBudget = getWorkingBudget(settings, incomeEntries, date);

  return getPlannedDailyTargetFromWorkingBudget(workingBudget, settings.savingsGoal, date);
}

export function getCurrentDailyTarget(
  expenses: Expense[],
  settings: Pick<Settings, 'monthlyBudget' | 'savingsGoal' | 'availableNow'>,
  incomeEntries: IncomeEntry[] = [],
  date = new Date(),
): number {
  const workingBudget = getWorkingBudget(settings, incomeEntries, date);
  const monthlySpendingLimit = getMonthlySpendingLimitFromWorkingBudget(workingBudget, settings.savingsGoal);

  if (monthlySpendingLimit <= 0) {
    return 0;
  }

  const spentBeforeToday = getSpentBeforeToday(expenses, date);
  const remainingBeforeToday = Math.max(monthlySpendingLimit - spentBeforeToday, 0);
  const daysLeftIncludingToday = getDaysLeftInMonthIncludingToday(date);

  return remainingBeforeToday / daysLeftIncludingToday;
}

export function getAutoDailyTarget(
  expenses: Expense[],
  settings: Pick<Settings, 'monthlyBudget' | 'savingsGoal' | 'availableNow'>,
  incomeEntries: IncomeEntry[] = [],
  date = new Date(),
): number {
  return getCurrentDailyTarget(expenses, settings, incomeEntries, date);
}

export function getMonthlyBudgetStats(expenses: Expense[], monthlyBudget: number, date = new Date()) {
  const monthTotal = sumExpenses(getMonthExpenses(expenses, date));
  const balance = monthlyBudget - monthTotal;
  const daysLeft = getDaysLeftInMonth(date);
  const comfortDailyPace = monthlyBudget > 0 ? Math.max(balance, 0) / Math.max(daysLeft, 1) : 0;

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

function normalizeReserveAmount(value: unknown): number {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.round(amount)))
    : 0;
}

export function getReserveClosuresTotal(reserveClosures: ReserveClosure[]): number {
  return reserveClosures.reduce(
    (total, closure) =>
      Math.min(Number.MAX_SAFE_INTEGER, total + normalizeReserveAmount(closure.actualSaved)),
    0,
  );
}

export function getReserveTopUpsTotal(reserveTopUps: ReserveTopUp[]): number {
  return reserveTopUps.reduce(
    (total, topUp) =>
      Math.min(Number.MAX_SAFE_INTEGER, total + normalizeReserveAmount(topUp.amount)),
    0,
  );
}

export function getReserveTotal(
  reserveClosures: ReserveClosure[],
  reserveTopUps: ReserveTopUp[],
): number {
  return Math.min(
    Number.MAX_SAFE_INTEGER,
    getReserveClosuresTotal(reserveClosures) + getReserveTopUpsTotal(reserveTopUps),
  );
}

export function getReserveTopUpsForMonth(
  reserveTopUps: ReserveTopUp[],
  monthKey: string,
): ReserveTopUp[] {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return [];
  }

  return reserveTopUps.filter((topUp) => topUp.date.slice(0, 7) === monthKey);
}

export type ReserveHistoryItem =
  | {
      type: 'closure';
      id: string;
      amount: number;
      date: string;
      createdAt: string;
      closure: ReserveClosure;
    }
  | {
      type: 'topUp';
      id: string;
      amount: number;
      date: string;
      createdAt: string;
      topUp: ReserveTopUp;
    };

export function getReserveHistoryItems(
  reserveClosures: ReserveClosure[],
  reserveTopUps: ReserveTopUp[],
): ReserveHistoryItem[] {
  const closureItems: ReserveHistoryItem[] = reserveClosures.map((closure) => ({
    type: 'closure',
    id: closure.id,
    amount: normalizeReserveAmount(closure.actualSaved),
    date: /^\d{4}-\d{2}-\d{2}/.test(closure.confirmedAt)
      ? closure.confirmedAt.slice(0, 10)
      : `${closure.month}-01`,
    createdAt: closure.confirmedAt,
    closure,
  }));
  const topUpItems: ReserveHistoryItem[] = reserveTopUps.map((topUp) => ({
    type: 'topUp',
    id: topUp.id,
    amount: normalizeReserveAmount(topUp.amount),
    date: topUp.date,
    createdAt: topUp.createdAt,
    topUp,
  }));

  return [...closureItems, ...topUpItems].sort(
    (first, second) =>
      second.date.localeCompare(first.date) || second.createdAt.localeCompare(first.createdAt),
  );
}

export function getCurrentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getSuggestedMonthlySavings(monthlyBudget: number, monthTotal: number): number {
  return Math.max(Math.max(0, monthlyBudget) - Math.max(0, monthTotal), 0);
}

export function sanitizeReserveGoal(goal: Partial<ReserveGoal>): ReserveGoal | null {
  if (typeof goal.id !== 'string' || !goal.id.trim()) {
    return null;
  }

  const rawTargetAmount = Number(goal.targetAmount);
  const rawAllocatedAmount = Number(goal.allocatedAmount);
  const targetAmount = normalizeReserveAmount(rawTargetAmount);
  const allocatedAmount = Math.min(
    targetAmount,
    normalizeReserveAmount(rawAllocatedAmount),
  );
  const createdAt = typeof goal.createdAt === 'string' && goal.createdAt ? goal.createdAt : new Date(0).toISOString();
  const updatedAt = typeof goal.updatedAt === 'string' && goal.updatedAt ? goal.updatedAt : createdAt;

  return {
    id: goal.id.trim(),
    title: typeof goal.title === 'string' && goal.title.trim() ? goal.title.trim() : 'Цель',
    targetAmount,
    allocatedAmount,
    createdAt,
    updatedAt,
  };
}

export function getAllocatedReserveTotal(goals: ReserveGoal[]): number {
  return goals.reduce((total, goal) => {
    return Math.min(
      Number.MAX_SAFE_INTEGER,
      total + normalizeReserveAmount(goal.allocatedAmount),
    );
  }, 0);
}

export function getUnallocatedReserve(reserveTotal: number, goals: ReserveGoal[]): number {
  const normalizedReserveTotal = normalizeReserveAmount(reserveTotal);
  return Math.max(normalizedReserveTotal - getAllocatedReserveTotal(goals), 0);
}

export function getGoalProgress(goal: Pick<ReserveGoal, 'allocatedAmount' | 'targetAmount'>): number {
  if (goal.targetAmount <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, goal.allocatedAmount / goal.targetAmount));
}

export function reconcileReserveGoalAllocations(goals: ReserveGoal[], reserveTotal: number): ReserveGoal[] {
  const normalizedGoals = goals
    .map(sanitizeReserveGoal)
    .filter((goal): goal is ReserveGoal => Boolean(goal));
  const allocationCapacity = normalizeReserveAmount(reserveTotal);
  let excess = Math.max(0, getAllocatedReserveTotal(normalizedGoals) - allocationCapacity);

  if (excess <= 0) {
    return normalizedGoals;
  }

  const nextGoals = normalizedGoals.map((goal) => ({ ...goal }));
  const reductionOrder = nextGoals
    .map((goal, index) => ({ index, updatedAt: goal.updatedAt }))
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt) || second.index - first.index);

  for (const item of reductionOrder) {
    if (excess <= 0) {
      break;
    }

    const reduction = Math.min(nextGoals[item.index].allocatedAmount, excess);
    nextGoals[item.index].allocatedAmount = Math.max(0, nextGoals[item.index].allocatedAmount - reduction);
    excess -= reduction;
  }

  return nextGoals;
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
