import { FormEvent, useState } from 'react';
import { CATEGORIES } from '../lib/constants';
import { toDateInputValue } from '../lib/date';
import type { Expense, ExpenseCategory, Screen } from '../types';

type AddExpenseScreenProps = {
  onAddExpense: (expense: Expense) => void;
  onNavigate: (screen: Screen) => void;
};

export function AddExpenseScreen({ onAddExpense, onNavigate }: AddExpenseScreenProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Еда');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount.replace(',', '.'));

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Сумма должна быть больше нуля');
      return;
    }

    onAddExpense({
      id: crypto.randomUUID(),
      amount: Math.round(parsedAmount * 100) / 100,
      category,
      note: note.trim(),
      date,
      createdAt: new Date().toISOString(),
    });

    setAmount('');
    setNote('');
    setDate(toDateInputValue(new Date()));
    setError('');
    onNavigate('home');
  }

  return (
    <main className="screen">
      <header className="top-header">
        <div>
          <p className="subtitle">Новая запись</p>
          <h1>Добавить расход</h1>
        </div>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        <label>
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
          Сохранить
        </button>
      </form>
    </main>
  );
}
