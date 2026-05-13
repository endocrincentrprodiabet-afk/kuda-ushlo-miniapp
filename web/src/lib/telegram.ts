import { getCategoryTotals, getTodayExpenses, getWeekExpenses, sumExpenses } from './calculations';
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

export function sendTelegramReport(expenses: Expense[], settings: Settings): string {
  const report = buildTelegramReport(expenses, settings);
  window.Telegram?.WebApp?.sendData?.(report);
  return report;
}
