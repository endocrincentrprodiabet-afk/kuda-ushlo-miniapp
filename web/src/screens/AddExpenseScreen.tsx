import { FormEvent, useEffect, useState } from 'react';
import { CATEGORIES } from '../lib/constants';
import { toDateInputValue } from '../lib/date';
import type { Expense, ExpenseCategory, Screen } from '../types';

type AddExpenseScreenProps = {
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  onNavigate: (screen: Screen) => void;
  editExpense?: Expense | null;
  returnScreen?: Screen;
};

export function AddExpenseScreen({
  onAddExpense,
  onUpdateExpense,
  onNavigate,
  editExpense,
  returnScreen = 'home',
}: AddExpenseScreenProps) {
  const isEditMode = Boolean(editExpense);
  const [amount, setAmount] = useState(editExpense ? String(editExpense.amount) : '');
  const [category, setCategory] = useState<ExpenseCategory>(editExpense?.category ?? 'Еда');
  const [note, setNote] = useState(editExpense?.note ?? '');
  const [date, setDate] = useState(editExpense?.date ?? toDateInputValue(new Date()));
  const [error, setError] = useState('');

  useEffect(() => {
    setAmount(editExpense ? String(editExpense.amount) : '');
    setCategory(editExpense?.category ?? 'Еда');
    setNote(editExpense?.note ?? '');
    setDate(editExpense?.date ?? toDateInputValue(new Date()));
    setError('');
  }, [editExpense]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount.replace(',', '.'));

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Сумма должна быть больше нуля');
      return;
    }

    const normalizedExpense: Expense = {
      id: editExpense?.id ?? crypto.randomUUID(),
      amount: Math.round(parsedAmount * 100) / 100,
      category,
      note: note.trim(),
      date,
      createdAt: editExpense?.createdAt ?? new Date().toISOString(),
    };

    if (editExpense) {
      onUpdateExpense(normalizedExpense);
    } else {
      onAddExpense(normalizedExpense);
    }

    setAmount('');
    setNote('');
    setDate(toDateInputValue(new Date()));
    setError('');
    onNavigate(isEditMode ? returnScreen : 'home');
  }

  return (
    <main className="screen">
      <header className="top-header">
        <div>
          <p className="subtitle">{isEditMode ? 'Редактирование записи' : 'Новая запись'}</p>
          <h1>{isEditMode ? 'Редактировать расход' : 'Добавить расход'}</h1>
        </div>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        <label className="amount-field">
          <span>Сумма</span>
          <input
            inputMode="decimal"
            min="0"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
            type="number"
            value={amount}
          />
        </label>

        <fieldset>
          <legend>Категория</legend>
          <div className="chips">
            {CATEGORIES.map((item) => (
              <button
                className={item === category ? 'chip active' : 'chip'}
                key={item}
                onClick={() => setCategory(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </fieldset>

        <label>
          <span>Комментарий</span>
          <input onChange={(event) => setNote(event.target.value)} placeholder="Например, кофе" type="text" value={note} />
        </label>

        <label>
          <span>Дата</span>
          <input onChange={(event) => setDate(event.target.value)} type="date" value={date} />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button" type="submit">
          {isEditMode ? 'Сохранить изменения' : 'Сохранить'}
        </button>
      </form>
    </main>
  );
}
