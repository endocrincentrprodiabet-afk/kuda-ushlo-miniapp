import { ExpenseList } from '../components/ExpenseList';
import { getTodayExpenses, sortExpensesByDate } from '../lib/calculations';
import { formatDayLabel, getWeekRangeLabel, getWeekStart, isWithinCurrentWeek, toDateInputValue } from '../lib/date';
import type { Expense, HistoryFilter, Settings } from '../types';

type HistoryScreenProps = {
  expenses: Expense[];
  settings: Settings;
  filter: HistoryFilter;
  onFilterChange: (filter: HistoryFilter) => void;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
};

const filters: Array<{ value: HistoryFilter; label: string }> = [
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: 'Неделя' },
  { value: 'all', label: 'Все' },
];

type DayGroup = {
  date: string;
  expenses: Expense[];
};

type WeekGroup = {
  weekStart: string;
  title: string;
  days: DayGroup[];
};

function groupExpensesByDay(expenses: Expense[]): DayGroup[] {
  return expenses.reduce<DayGroup[]>((groups, expense) => {
    const existingGroup = groups.find((group) => group.date === expense.date);

    if (existingGroup) {
      existingGroup.expenses.push(expense);
      existingGroup.expenses.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return groups;
    }

    return [...groups, { date: expense.date, expenses: [expense] }];
  }, []);
}

function groupExpensesByWeek(expenses: Expense[]): WeekGroup[] {
  return expenses.reduce<WeekGroup[]>((groups, expense) => {
    const weekStart = getWeekStart(new Date(`${expense.date}T00:00:00`));
    const weekStartValue = toDateInputValue(weekStart);
    const existingGroup = groups.find((group) => group.weekStart === weekStartValue);

    if (existingGroup) {
      existingGroup.days = groupExpensesByDay([...existingGroup.days.flatMap((day) => day.expenses), expense]);
      return groups;
    }

    return [
      ...groups,
      {
        weekStart: weekStartValue,
        title: getWeekRangeLabel(weekStart),
        days: groupExpensesByDay([expense]),
      },
    ];
  }, []);
}

export function HistoryScreen({
  expenses,
  settings,
  filter,
  onFilterChange,
  onDeleteExpense,
  onEditExpense,
}: HistoryScreenProps) {
  const filteredExpenses =
    filter === 'today'
      ? getTodayExpenses(expenses)
      : filter === 'week'
        ? expenses.filter((expense) => isWithinCurrentWeek(expense.date))
        : expenses;
  const sortedExpenses = sortExpensesByDate(filteredExpenses);
  const dayGroups = groupExpensesByDay(sortedExpenses);
  const weekGroups = filter === 'all' ? groupExpensesByWeek(sortedExpenses) : [];
  const emptyText = 'Расходов пока нет';

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
                <h2 className="history-week-title">{week.title}</h2>
                <div className="history-day-groups">
                  {week.days.map((day) => (
                    <section className="history-date-group" key={day.date}>
                      <h3 className="history-date-title">{formatDayLabel(day.date)}</h3>
                      <ExpenseList
                        expenses={day.expenses}
                        currency={settings.currency}
                        emptyText={emptyText}
                        showDate={false}
                        onDelete={onDeleteExpense}
                        onEdit={onEditExpense}
                      />
                    </section>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : dayGroups.length ? (
          <div className="history-groups">
            {filter === 'week' ? <h2 className="history-week-title history-week-title--compact">Эта неделя</h2> : null}
            {dayGroups.map((day) => {
              const showDayTitle = filter !== 'today';

              return (
                <section className="history-date-group" key={day.date}>
                  {showDayTitle ? <h3 className="history-date-title">{formatDayLabel(day.date)}</h3> : null}
                  <ExpenseList
                    expenses={day.expenses}
                    currency={settings.currency}
                    emptyText={emptyText}
                    showDate={!showDayTitle}
                    onDelete={onDeleteExpense}
                    onEdit={onEditExpense}
                  />
                </section>
              );
            })}
          </div>
        ) : (
          <ExpenseList
            expenses={[]}
            currency={settings.currency}
            emptyText={emptyText}
            onDelete={onDeleteExpense}
            onEdit={onEditExpense}
          />
        )}
      </section>
    </main>
  );
}
