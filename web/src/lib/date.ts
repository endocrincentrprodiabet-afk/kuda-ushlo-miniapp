export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isToday(value: string): boolean {
  return value === toDateInputValue(new Date());
}

export function isWithinLastSevenDays(value: string): boolean {
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  return date >= start && date < end;
}

export function getWeekStart(date: Date): Date {
  const day = date.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday);
}

export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);

  return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
}

export function isWithinCurrentWeek(value: string): boolean {
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  const start = getWeekStart(today);
  const end = getWeekEnd(today);

  return date >= start && date <= end;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDayLabel(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${value}T00:00:00`));
}

export function formatScheduledIncomeDate(date: Date, today = new Date()): string {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrow = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() + 1);

  if (dayStart.getTime() === todayStart.getTime()) {
    return 'сегодня';
  }

  if (dayStart.getTime() === tomorrow.getTime()) {
    return 'завтра';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: dayStart.getFullYear() === todayStart.getFullYear() ? undefined : 'numeric',
  }).format(dayStart);
}

function formatWeekRangePart(date: Date, includeMonth: boolean): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: includeMonth ? 'long' : undefined,
  }).format(date);
}

export function getWeekRangeLabel(weekStart: Date): string {
  const todayWeekStart = getWeekStart(new Date());
  const previousWeekStart = new Date(
    todayWeekStart.getFullYear(),
    todayWeekStart.getMonth(),
    todayWeekStart.getDate() - 7,
  );
  const weekEnd = getWeekEnd(weekStart);
  const weekStartValue = toDateInputValue(weekStart);

  if (weekStartValue === toDateInputValue(todayWeekStart)) {
    return 'Эта неделя';
  }

  if (weekStartValue === toDateInputValue(previousWeekStart)) {
    return 'Прошлая неделя';
  }

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${formatWeekRangePart(weekStart, false)}–${formatWeekRangePart(weekEnd, true)}`;
  }

  return `${formatWeekRangePart(weekStart, true)} – ${formatWeekRangePart(weekEnd, true)}`;
}
