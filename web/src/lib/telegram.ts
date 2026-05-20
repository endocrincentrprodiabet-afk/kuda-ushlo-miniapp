import {
  getCategoryTotals,
  getCurrentDailyTarget,
  getMonthlySpendingLimit,
  getTodayExpenses,
  getWeekExpenses,
  getWorkingBudget,
  sortByCreatedAt,
  sumExpenses,
} from './calculations';
import { formatMoney } from './format';
import type { Expense, IncomeEntry, Settings } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        sendData: (data: string) => void;
        close?: () => void;
      };
    };
  }
}

type TelegramReportPayload = {
  type: 'expense_report';
  version: 1;
  currency: Settings['currency'];
  period: 'today';
  generatedAt: string;
  todayTotal: number;
  weekTotal: number;
  monthlyBudget: number;
  workingBudget: number;
  savingsGoal: number;
  spendingLimit: number;
  dailyLimit: number;
  dailyTarget: number;
  limitDiff: number;
  isLimitExceeded: boolean;
  categories: Array<{
    category: string;
    total: number;
  }>;
  recentExpenses: Array<{
    amount: number;
    category: string;
    note: string;
    date: string;
  }>;
};

type TelegramWebApp = NonNullable<NonNullable<Window['Telegram']>['WebApp']>;

type SendTelegramReportResult = {
  report: string;
  statusMessage: string;
  sentToTelegram: boolean;
};

function getTelegramWebApp(): TelegramWebApp | null {
  const webApp = window.Telegram?.WebApp;

  return webApp?.sendData ? webApp : null;
}

export function buildTelegramReport(expenses: Expense[], settings: Settings, incomeEntries: IncomeEntry[] = []): string {
  const todayTotal = sumExpenses(getTodayExpenses(expenses));
  const weekExpenses = getWeekExpenses(expenses);
  const weekTotal = sumExpenses(weekExpenses);
  const categoryTotals = getCategoryTotals(weekExpenses);
  const dailyTarget = getCurrentDailyTarget(expenses, settings, incomeEntries);
  const limitDiff = dailyTarget - todayTotal;
  const limitLine =
    limitDiff >= 0
      ? `Осталось на сегодня: ${formatMoney(limitDiff, settings.currency)}`
      : `Перерасход дня: ${formatMoney(Math.abs(limitDiff), settings.currency)}`;

  const categories = categoryTotals.length
    ? categoryTotals.map((item) => `${item.category}: ${formatMoney(item.total, settings.currency)}`).join('\n')
    : 'Расходов по категориям пока нет';

  return [
    'Отчёт Куда ушло?',
    `Сегодня: ${formatMoney(todayTotal, settings.currency)}`,
    `За неделю: ${formatMoney(weekTotal, settings.currency)}`,
    `Дневной ориентир: ${formatMoney(dailyTarget, settings.currency)} / день`,
    limitLine,
    '',
    'Категории за неделю:',
    categories,
  ].join('\n');
}

export function buildTelegramReportPayload(
  expenses: Expense[],
  settings: Settings,
  incomeEntries: IncomeEntry[] = [],
): TelegramReportPayload {
  const todayTotal = sumExpenses(getTodayExpenses(expenses));
  const weekExpenses = getWeekExpenses(expenses);
  const weekTotal = sumExpenses(weekExpenses);
  const workingBudget = getWorkingBudget(settings, incomeEntries);
  const spendingLimit = getMonthlySpendingLimit(settings, incomeEntries);
  const dailyTarget = getCurrentDailyTarget(expenses, settings, incomeEntries);
  const limitDiff = dailyTarget - todayTotal;

  return {
    type: 'expense_report',
    version: 1,
    currency: settings.currency,
    period: 'today',
    generatedAt: new Date().toISOString(),
    todayTotal,
    weekTotal,
    monthlyBudget: workingBudget,
    workingBudget,
    savingsGoal: Math.min(settings.savingsGoal, workingBudget),
    spendingLimit,
    dailyLimit: dailyTarget,
    dailyTarget,
    limitDiff,
    isLimitExceeded: limitDiff < 0,
    categories: getCategoryTotals(weekExpenses).map((item) => ({
      category: item.category,
      total: item.total,
    })),
    recentExpenses: sortByCreatedAt(expenses)
      .slice(0, 5)
      .map((expense) => ({
        amount: expense.amount,
        category: expense.category,
        note: expense.note,
        date: expense.date,
      })),
  };
}

export function sendTelegramReport(
  expenses: Expense[],
  settings: Settings,
  incomeEntries: IncomeEntry[] = [],
): SendTelegramReportResult {
  const report = buildTelegramReport(expenses, settings, incomeEntries);
  const payload = buildTelegramReportPayload(expenses, settings, incomeEntries);
  const webApp = getTelegramWebApp();

  if (!webApp) {
    console.log('Telegram report payload', JSON.stringify(payload));

    return {
      report,
      statusMessage: 'Отчёт сформирован. В Telegram он будет отправлен боту.',
      sentToTelegram: false,
    };
  }

  webApp.sendData(JSON.stringify(payload));
  webApp.close?.();

  return {
    report,
    statusMessage: 'Отчёт отправлен в Telegram.',
    sentToTelegram: true,
  };
}
