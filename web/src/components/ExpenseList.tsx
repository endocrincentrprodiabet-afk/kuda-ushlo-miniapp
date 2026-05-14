import { formatDate } from '../lib/date';
import { formatMoney } from '../lib/format';
import type { Expense } from '../types';

type ExpenseListProps = {
  expenses: Expense[];
  currency: string;
  emptyText: string;
  showDate?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (expense: Expense) => void;
};

export function ExpenseList({ expenses, currency, emptyText, showDate = true, onDelete, onEdit }: ExpenseListProps) {
  if (expenses.length === 0) {
    return <p className="empty-state">{emptyText}</p>;
  }

  return (
    <div className="expense-list">
      {expenses.map((expense) => (
        <article className="expense-item" key={expense.id}>
          <div className="expense-content">
            <div className="expense-head">
              <strong className="expense-category">{expense.category}</strong>
              <strong className="expense-amount">{formatMoney(expense.amount, currency)}</strong>
            </div>
            <div className="expense-meta">
              <span>{expense.note || 'Без комментария'}</span>
              {showDate ? <span>{formatDate(expense.date)}</span> : null}
            </div>
          </div>
          {onDelete || onEdit ? (
            <div className="expense-actions">
              {onEdit ? (
                <button className="expense-action-button" onClick={() => onEdit(expense)} type="button">
                  Редактировать
                </button>
              ) : null}
              {onDelete ? (
                <button className="delete-button" onClick={() => onDelete(expense.id)} type="button">
                  Удалить
                </button>
              ) : null}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
