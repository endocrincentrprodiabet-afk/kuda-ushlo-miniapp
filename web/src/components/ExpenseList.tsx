import { formatDate } from '../lib/date';
import { formatMoney } from '../lib/format';
import type { Expense } from '../types';

type ExpenseListProps = {
  expenses: Expense[];
  currency: string;
  emptyText: string;
  onDelete?: (id: string) => void;
};

export function ExpenseList({ expenses, currency, emptyText, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return <p className="empty-state">{emptyText}</p>;
  }

  return (
    <div className="expense-list">
      {expenses.map((expense) => (
        <article className="expense-item" key={expense.id}>
          <div>
            <div className="expense-row">
              <strong>{expense.category}</strong>
              <strong>{formatMoney(expense.amount, currency)}</strong>
            </div>
            <p>{expense.note || 'Без комментария'}</p>
            <span>{formatDate(expense.date)}</span>
          </div>
          {onDelete ? (
            <button className="text-button danger" onClick={() => onDelete(expense.id)} type="button">
              Удалить
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}
