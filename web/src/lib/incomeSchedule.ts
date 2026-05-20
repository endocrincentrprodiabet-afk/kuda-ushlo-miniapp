import { toDateInputValue } from './date';
import type { IncomeEntry, Settings } from '../types';

const AUTO_INCOME_NOTE = 'Автоначисление';
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isDateInputValue(value: string): boolean {
  return datePattern.test(value);
}

function addMonths(value: string, months: number): string {
  const date = new Date(`${value}T00:00:00`);
  const originalDay = date.getDate();

  date.setMonth(date.getMonth() + months);

  if (date.getDate() !== originalDay) {
    date.setDate(0);
  }

  return toDateInputValue(date);
}

function getDueMonthlyDates(anchorDate: string, today: string): string[] {
  if (!isDateInputValue(anchorDate) || anchorDate > today) {
    return [];
  }

  const dates: string[] = [];
  let cursor = anchorDate;
  let monthsAfterAnchor = 0;

  while (cursor <= today) {
    dates.push(cursor);
    monthsAfterAnchor += 1;
    cursor = addMonths(anchorDate, monthsAfterAnchor);
  }

  return dates;
}

export function getAutoIncomeId(date: string): string {
  return `auto-income-${date}`;
}

export function getDueIncomeDates(settings: Settings, date = new Date()): string[] {
  if (settings.regularIncomeAmount <= 0) {
    return [];
  }

  const today = toDateInputValue(date);
  const dates =
    settings.incomeFrequency === 'biweekly'
      ? [
          ...getDueMonthlyDates(settings.nextIncomeDate, today),
          ...getDueMonthlyDates(settings.secondIncomeDate, today),
        ]
      : getDueMonthlyDates(settings.nextIncomeDate, today);

  return Array.from(new Set(dates)).sort();
}

export function applyAutoIncomeEntries(
  settings: Settings,
  incomeEntries: IncomeEntry[],
  date = new Date(),
): IncomeEntry[] {
  const dueDates = getDueIncomeDates(settings, date);

  if (dueDates.length === 0) {
    return incomeEntries;
  }

  const existingIds = new Set(incomeEntries.map((entry) => entry.id));
  const existingAutoDates = new Set(
    incomeEntries.filter((entry) => entry.source === 'auto' && entry.type === 'salary').map((entry) => entry.date),
  );
  const createdAt = new Date().toISOString();
  const newEntries = dueDates
    .filter((incomeDate) => !existingIds.has(getAutoIncomeId(incomeDate)) && !existingAutoDates.has(incomeDate))
    .map(
      (incomeDate): IncomeEntry => ({
        id: getAutoIncomeId(incomeDate),
        amount: settings.regularIncomeAmount,
        date: incomeDate,
        note: AUTO_INCOME_NOTE,
        type: 'salary',
        kind: 'salary',
        source: 'auto',
        createdAt,
      }),
    );

  if (newEntries.length === 0) {
    return incomeEntries;
  }

  return [...newEntries, ...incomeEntries];
}
