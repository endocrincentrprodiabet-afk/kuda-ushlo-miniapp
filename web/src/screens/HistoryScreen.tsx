import { ExpenseList } from '../components/ExpenseList';
import { getTodayExpenses, getWeekExpenses, sortByCreatedAt } from '../lib/calculations';
import { formatDate } from '../lib/date';
import type { Expense, HistoryFilter, Settings } from '../types';

type HistoryScreenProps = {
  expenses: Expense[];
  settings: Settings;
  filter: HistoryFilter;
  onFilterChange: (filter: HistoryFilter) => void;
  onDeleteExpense: (id: string) => void;
};

const filters: Array<{ value: HistoryFilter; label: string }> = [
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: 'Неделя' },
  { value: 'all', label: 'Все' },
];

export function HistoryScreen({ expenses, settings, filter, onFilterChange, onDeleteExpense }: HistoryScreenProps) {
  const filteredExpenses =
    filter === 'today' ? getTodayExpenses(expenses) : filter === 'week' ? getWeekExpenses(expenses) : expenses;
  const sortedExpenses = sortByCreatedAt(filteredExpenses);
  const groupedExpenses = sortedExpenses.reduce<Array<{ date: string; expenses: Expense[] }>>((groups, expense) => {
    const existingGroup = groups.find((group) => group.date === expense.date);

    if (existingGroup) {
      existingGroup.expenses.push(expense);
      return groups;
    }

    return [...groups, { date: expense.date, expenses: [expense] }];
  }, []);

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
        {groupedExpenses.length ? (
          <div className="history-groups">
            {groupedExpenses.map((group) => (
              <section className="history-date-group" key={group.date}>
                <h2 className="history-date-title">{formatDate(group.date)}</h2>
                <ExpenseList
                  expenses={group.expenses}
                  currency={settings.currency}
                  emptyText="В выбранном периоде расходов нет"
                  onDelete={onDeleteExpense}
                />
              </section>
            ))}
          </div>
        ) : (
          <ExpenseList
            expenses={[]}
            currency={settings.currency}
            emptyText="В выбранном периоде расходов нет"
            onDelete={onDeleteExpense}
          />
        )}
      </section>
    </main>
  );
}
