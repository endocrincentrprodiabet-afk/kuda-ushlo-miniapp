import { toDateInputValue } from './date';
import type { IncomeEntry, Settings } from '../types';

const AUTO_INCOME_NOTE = 'Автоначисление';
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isDateInputValue(value: string): boolean {
  if (!datePattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function parseDateInputValue(value: string): Date | null {
  if (!isDateInputValue(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function getLocalDayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getMonthlyOccurrence(year: number, month: number, day: number): Date {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  return new Date(year, month, Math.min(day, lastDayOfMonth));
}

function addMonths(value: string, months: number): string {
  const anchor = parseDateInputValue(value);

  return anchor
    ? toDateInputValue(
        getMonthlyOccurrence(
          anchor.getFullYear(),
          anchor.getMonth() + months,
          anchor.getDate(),
        ),
      )
    : value;
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

function hasAutoIncomeForDate(incomeEntries: IncomeEntry[], date: string): boolean {
  const autoIncomeId = getAutoIncomeId(date);

  return incomeEntries.some(
    (entry) =>
      entry.id === autoIncomeId ||
      (entry.source === 'auto' && entry.type === 'salary' && entry.date === date),
  );
}

function getNextMonthlyOccurrence(anchorValue: string, date: Date, includeDate: boolean): Date | null {
  const anchor = parseDateInputValue(anchorValue);

  if (!anchor) {
    return null;
  }

  const dayStart = getLocalDayStart(date);

  if (anchor > dayStart) {
    return anchor;
  }

  const currentMonthOccurrence = getMonthlyOccurrence(
    dayStart.getFullYear(),
    dayStart.getMonth(),
    anchor.getDate(),
  );

  if (currentMonthOccurrence > dayStart || (includeDate && currentMonthOccurrence.getTime() === dayStart.getTime())) {
    return currentMonthOccurrence;
  }

  return getMonthlyOccurrence(
    dayStart.getFullYear(),
    dayStart.getMonth() + 1,
    anchor.getDate(),
  );
}

export function getNextScheduledIncomeDate(
  settings: Pick<
    Settings,
    'incomeFrequency' | 'nextIncomeDate' | 'secondIncomeDate' | 'regularIncomeAmount'
  >,
  incomeEntries: IncomeEntry[],
  date = new Date(),
): Date | null {
  if (settings.regularIncomeAmount <= 0) {
    return null;
  }

  const today = getLocalDayStart(date);
  const todayValue = toDateInputValue(today);
  const includeToday = !hasAutoIncomeForDate(incomeEntries, todayValue);
  const anchorValues =
    settings.incomeFrequency === 'biweekly'
      ? [settings.nextIncomeDate, settings.secondIncomeDate]
      : [settings.nextIncomeDate];
  const candidates = anchorValues
    .map((anchorValue) => getNextMonthlyOccurrence(anchorValue, today, includeToday))
    .filter((candidate): candidate is Date => candidate !== null)
    .sort((first, second) => first.getTime() - second.getTime());

  if (candidates.length !== anchorValues.length) {
    return null;
  }

  return candidates[0] ?? null;
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

  const createdAt = new Date().toISOString();
  const newEntries = dueDates
    .filter((incomeDate) => !hasAutoIncomeForDate(incomeEntries, incomeDate))
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
