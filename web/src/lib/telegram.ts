import { getCategoryTotals, getTodayExpenses, getWeekExpenses, sortByCreatedAt, sumExpenses } from './calculations';
import { formatMoney } from './format';
import type { Expense, Settings } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        sendData?: (data: string) => void;
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
  dailyLimit: number;
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

function getTelegramWebApp() {
  const telegram = window.Telegram ?? (window.Telegram = {});

  if (!telegram.WebApp) {
    telegram.WebApp = {
      sendData: (data: string) => {
        console.log('Telegram.WebApp.sendData mock', data);
      },
    };
  }

  return telegram.WebApp as TelegramWebApp;
}

export function buildTelegramReport(expenses: Expense[], settings: Settings): string {
  const todayTotal = sumExpenses(getTodayExpenses(expenses));
  const weekExpenses = getWeekExpenses(expenses);
  const weekTotal = sumExpenses(weekExpenses);
  const categoryTotals = getCategoryTotals(weekExpenses);
  const limitDiff = settings.dailyLimit - todayTotal;
  const limitLine =
    limitDiff >= 0
      ? `Остаток лимита: ${formatMoney(limitDiff, settings.currency)}`
      : `Превышение лимита: ${formatMoney(Math.abs(limitDiff), settings.currency)}`;

  const categories = categoryTotals.length
    ? categoryTotals.map((item) => `${item.category}: ${formatMoney(item.total, settings.currency)}`).join('\n')
    : 'Расходов по категориям пока нет';

  return [
    'Отчёт Куда ушло?',
    `Сегодня: ${formatMoney(todayTotal, settings.currency)}`,
    `За неделю: ${formatMoney(weekTotal, settings.currency)}`,
    `Дневной лимит: ${formatMoney(settings.dailyLimit, settings.currency)}`,
    limitLine,
    '',
    'Категории за неделю:',
    categories,
  ].join('\n');
}

export function buildTelegramReportPayload(expenses: Expense[], settings: Settings): TelegramReportPayload {
  const todayTotal = sumExpenses(getTodayExpenses(expenses));
  const weekExpenses = getWeekExpenses(expenses);
  const weekTotal = sumExpenses(weekExpenses);
  const limitDiff = settings.dailyLimit - todayTotal;

  return {
    type: 'expense_report',
    version: 1,
    currency: settings.currency,
    period: 'today',
    generatedAt: new Date().toISOString(),
    todayTotal,
    weekTotal,
    dailyLimit: settings.dailyLimit,
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

export function sendTelegramReport(expenses: Expense[], settings: Settings): string {
  const report = buildTelegramReport(expenses, settings);
  const payload = buildTelegramReportPayload(expenses, settings);
  getTelegramWebApp().sendData?.(JSON.stringify(payload));
  return report;
}
