import {
  formatDate,
  formatDayLabel,
  getWeekRangeLabel,
  getWeekStart,
  isToday,
  isWithinCurrentWeek,
  toDateInputValue,
} from '../lib/date';
import { formatMoney } from '../lib/format';
import type { Expense, HistoryFilter, IncomeEntry, Settings } from '../types';

type HistoryScreenProps = {
  expenses: Expense[];
  incomeEntries: IncomeEntry[];
  settings: Settings;
  filter: HistoryFilter;
  onFilterChange: (filter: HistoryFilter) => void;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteIncomeEntry: (id: string) => void;
  onEditIncomeEntry: (entry: IncomeEntry) => void;
};

const filters: Array<{ value: HistoryFilter; label: string }> = [
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: 'Неделя' },
  { value: 'all', label: 'Все' },
];

type HistoryOperation =
  | {
      kind: 'expense';
      id: string;
      date: string;
      createdAt: string;
      expense: Expense;
    }
  | {
      kind: 'income';
      id: string;
      date: string;
      createdAt: string;
      incomeEntry: IncomeEntry;
    };

type DayGroup = {
  date: string;
  operations: HistoryOperation[];
};

type WeekGroup = {
  weekStart: string;
  title: string;
  days: DayGroup[];
};

const incomeKindLabels: Record<NonNullable<IncomeEntry['kind']>, string> = {
  salary: 'Зарплата',
  bonus: 'Премия',
  side: 'Подработка',
  other: 'Другое',
};

function getIncomeTitle(entry: IncomeEntry): string {
  if (entry.kind && incomeKindLabels[entry.kind]) {
    return incomeKindLabels[entry.kind];
  }

  return entry.type === 'salary' ? 'Зарплата' : 'Начисление';
}

function sortOperationsByDate(operations: HistoryOperation[]): HistoryOperation[] {
  return [...operations].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

function groupOperationsByDay(operations: HistoryOperation[]): DayGroup[] {
  return operations.reduce<DayGroup[]>((groups, operation) => {
    const existingGroup = groups.find((group) => group.date === operation.date);

    if (existingGroup) {
      existingGroup.operations.push(operation);
      existingGroup.operations = sortOperationsByDate(existingGroup.operations);
      return groups;
    }

    return [...groups, { date: operation.date, operations: [operation] }];
  }, []);
}

function groupOperationsByWeek(operations: HistoryOperation[]): WeekGroup[] {
  return operations.reduce<WeekGroup[]>((groups, operation) => {
    const weekStart = getWeekStart(new Date(`${operation.date}T00:00:00`));
    const weekStartValue = toDateInputValue(weekStart);
    const existingGroup = groups.find((group) => group.weekStart === weekStartValue);

    if (existingGroup) {
      existingGroup.days = groupOperationsByDay([...existingGroup.days.flatMap((day) => day.operations), operation]);
      return groups;
    }

    return [
      ...groups,
      {
        weekStart: weekStartValue,
        title: getWeekRangeLabel(weekStart),
        days: groupOperationsByDay([operation]),
      },
    ];
  }, []);
}

type OperationListProps = {
  operations: HistoryOperation[];
  currency: Settings['currency'];
  emptyText: string;
  showDate?: boolean;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteIncomeEntry: (id: string) => void;
  onEditIncomeEntry: (entry: IncomeEntry) => void;
};

function OperationList({
  operations,
  currency,
  emptyText,
  showDate = true,
  onDeleteExpense,
  onEditExpense,
  onDeleteIncomeEntry,
  onEditIncomeEntry,
}: OperationListProps) {
  if (operations.length === 0) {
    return <p className="empty-state">{emptyText}</p>;
  }

  return (
    <div className="expense-list">
      {operations.map((operation) => {
        const isIncome = operation.kind === 'income';
        const title = isIncome ? getIncomeTitle(operation.incomeEntry) : operation.expense.category;
        const note = isIncome ? operation.incomeEntry.note : operation.expense.note;
        const amount = isIncome ? operation.incomeEntry.amount : operation.expense.amount;

        return (
          <article className={`expense-item${isIncome ? ' expense-item--income' : ''}`} key={`${operation.kind}-${operation.id}`}>
            <div className="expense-content">
              <div className="expense-head">
                <strong className="expense-category">{title}</strong>
                <strong className={`expense-amount${isIncome ? ' expense-amount--income' : ''}`}>
                  {isIncome ? '+' : ''}
                  {formatMoney(amount, currency)}
                </strong>
              </div>
              <div className="expense-meta">
                <span>{note || 'Без комментария'}</span>
                {showDate ? <span>{formatDate(operation.date)}</span> : null}
              </div>
            </div>
            <div className="expense-actions">
              <button
                className="expense-action-button"
                onClick={() => (isIncome ? onEditIncomeEntry(operation.incomeEntry) : onEditExpense(operation.expense))}
                type="button"
              >
                Редактировать
              </button>
              <button
                className="delete-button"
                onClick={() => (isIncome ? onDeleteIncomeEntry(operation.id) : onDeleteExpense(operation.id))}
                type="button"
              >
                Удалить
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function HistoryScreen({
  expenses,
  incomeEntries,
  settings,
  filter,
  onFilterChange,
  onDeleteExpense,
  onEditExpense,
  onDeleteIncomeEntry,
  onEditIncomeEntry,
}: HistoryScreenProps) {
  const operations: HistoryOperation[] = [
    ...expenses.map((expense) => ({
      kind: 'expense' as const,
      id: expense.id,
      date: expense.date,
      createdAt: expense.createdAt,
      expense,
    })),
    ...incomeEntries.map((incomeEntry) => ({
      kind: 'income' as const,
      id: incomeEntry.id,
      date: incomeEntry.date,
      createdAt: incomeEntry.createdAt,
      incomeEntry,
    })),
  ];
  const filteredOperations =
    filter === 'today'
      ? operations.filter((operation) => isToday(operation.date))
      : filter === 'week'
        ? operations.filter((operation) => isWithinCurrentWeek(operation.date))
        : operations;
  const sortedOperations = sortOperationsByDate(filteredOperations);
  const dayGroups = groupOperationsByDay(sortedOperations);
  const weekGroups = filter === 'all' ? groupOperationsByWeek(sortedOperations) : [];
  const currentWeekStart = toDateInputValue(getWeekStart(new Date()));
  const emptyText = 'Записей пока нет';

  return (
    <main className="screen">
      <header className="top-header">
        <div>
          <p className="subtitle">Все записи</p>
          <h1>История</h1>
        </div>
      </header>

      <div className="segmented" role="group" aria-label="Фильтр истории">
        {filters.map((item) => (
          <button
            className={item.value === filter ? 'active' : ''}
            key={item.value}
            onClick={() => onFilterChange(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="card">
        {filter === 'all' && weekGroups.length ? (
          <div className="history-week-groups">
            {weekGroups.map((week) => (
              <section className="history-week-group" key={week.weekStart}>
                <h2
                  className={`history-week-title ${
                    week.weekStart === currentWeekStart ? 'history-week-title--current' : ''
                  }`}
                >
                  {week.title}
                </h2>
                <div className="history-day-groups">
                  {week.days.map((day) => (
                    <section className="history-date-group" key={day.date}>
                      <h3 className="history-date-title">{formatDayLabel(day.date)}</h3>
                      <OperationList
                        operations={day.operations}
                        currency={settings.currency}
                        emptyText={emptyText}
                        showDate={false}
                        onDeleteExpense={onDeleteExpense}
                        onEditExpense={onEditExpense}
                        onDeleteIncomeEntry={onDeleteIncomeEntry}
                        onEditIncomeEntry={onEditIncomeEntry}
                      />
                    </section>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : dayGroups.length ? (
          <div className="history-groups">
            {filter === 'week' ? <h2 className="history-week-title history-week-title--current">Эта неделя</h2> : null}
            {dayGroups.map((day) => {
              const showDayTitle = filter !== 'today';

              return (
                <section className="history-date-group" key={day.date}>
                  {showDayTitle ? <h3 className="history-date-title">{formatDayLabel(day.date)}</h3> : null}
                  <OperationList
                    operations={day.operations}
                    currency={settings.currency}
                    emptyText={emptyText}
                    showDate={!showDayTitle}
                    onDeleteExpense={onDeleteExpense}
                    onEditExpense={onEditExpense}
                    onDeleteIncomeEntry={onDeleteIncomeEntry}
                    onEditIncomeEntry={onEditIncomeEntry}
                  />
                </section>
              );
            })}
          </div>
        ) : (
          <OperationList
            operations={[]}
            currency={settings.currency}
            emptyText={emptyText}
            onDeleteExpense={onDeleteExpense}
            onEditExpense={onEditExpense}
            onDeleteIncomeEntry={onDeleteIncomeEntry}
            onEditIncomeEntry={onEditIncomeEntry}
          />
        )}
      </section>
    </main>
  );
}
