import { FormEvent, useEffect, useState } from 'react';
import { incomeKindLabels, uiCopy } from '../content/uiCopy';
import { CATEGORIES } from '../lib/constants';
import { toDateInputValue } from '../lib/date';
import type { CurrencyCode, Expense, ExpenseCategory, IncomeEntry, Screen } from '../types';

type AddExpenseScreenProps = {
  currency: CurrencyCode;
  onAddExpense: (expense: Expense) => void;
  onAddIncomeEntry: (entry: IncomeEntry) => void;
  onUpdateExpense: (expense: Expense) => void;
  onUpdateIncomeEntry: (entry: IncomeEntry) => void;
  onNavigate: (screen: Screen) => void;
  editExpense?: Expense | null;
  editIncomeEntry?: IncomeEntry | null;
  initialMode?: OperationMode;
  returnScreen?: Screen;
};

type OperationMode = 'expense' | 'income';
type ManualIncomeKind = 'salary' | 'bonus' | 'side' | 'other';

function getIncomeKind(entry?: IncomeEntry | null): ManualIncomeKind {
  if (entry?.kind === 'salary' || entry?.kind === 'bonus' || entry?.kind === 'side' || entry?.kind === 'other') {
    return entry.kind;
  }

  return entry?.type === 'salary' ? 'salary' : 'other';
}

export function AddExpenseScreen({
  currency,
  onAddExpense,
  onAddIncomeEntry,
  onUpdateExpense,
  onUpdateIncomeEntry,
  onNavigate,
  editExpense,
  editIncomeEntry,
  initialMode = 'expense',
  returnScreen = 'home',
}: AddExpenseScreenProps) {
  const isExpenseEditMode = Boolean(editExpense);
  const isIncomeEditMode = Boolean(editIncomeEntry);
  const isEditMode = isExpenseEditMode || isIncomeEditMode;
  const [operationMode, setOperationMode] = useState<OperationMode>(editIncomeEntry ? 'income' : initialMode);
  const [amount, setAmount] = useState(editExpense ? String(editExpense.amount) : editIncomeEntry ? String(editIncomeEntry.amount) : '');
  const [category, setCategory] = useState<ExpenseCategory>(editExpense?.category ?? CATEGORIES[0]);
  const [incomeKind, setIncomeKind] = useState<ManualIncomeKind>(getIncomeKind(editIncomeEntry));
  const [note, setNote] = useState(editExpense?.note ?? editIncomeEntry?.note ?? '');
  const [date, setDate] = useState(editExpense?.date ?? editIncomeEntry?.date ?? toDateInputValue(new Date()));
  const [error, setError] = useState('');

  useEffect(() => {
    setAmount(editExpense ? String(editExpense.amount) : editIncomeEntry ? String(editIncomeEntry.amount) : '');
    setCategory(editExpense?.category ?? CATEGORIES[0]);
    setOperationMode(editIncomeEntry ? 'income' : editExpense ? 'expense' : initialMode);
    setIncomeKind(getIncomeKind(editIncomeEntry));
    setNote(editExpense?.note ?? editIncomeEntry?.note ?? '');
    setDate(editExpense?.date ?? editIncomeEntry?.date ?? toDateInputValue(new Date()));
    setError('');
  }, [editExpense, editIncomeEntry, initialMode]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount.replace(',', '.'));

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(uiCopy.errors.positiveAmount);
      return;
    }

    const normalizedAmount = Math.round(parsedAmount * 100) / 100;

    if (editExpense) {
      onUpdateExpense({
        id: editExpense.id,
        amount: normalizedAmount,
        category,
        note: note.trim(),
        date,
        createdAt: editExpense.createdAt,
      });
    } else if (editIncomeEntry) {
      onUpdateIncomeEntry({
        id: editIncomeEntry.id,
        amount: normalizedAmount,
        date,
        note: note.trim() || incomeKindLabels[incomeKind],
        type: incomeKind === 'salary' ? 'salary' : 'extra',
        kind: incomeKind,
        source: editIncomeEntry.source ?? 'manual',
        createdAt: editIncomeEntry.createdAt,
      });
    } else if (operationMode === 'income') {
      onAddIncomeEntry({
        id: `income-${crypto.randomUUID()}`,
        amount: normalizedAmount,
        date,
        note: note.trim() || incomeKindLabels[incomeKind],
        type: incomeKind === 'salary' ? 'salary' : 'extra',
        kind: incomeKind,
        source: 'manual',
        createdAt: new Date().toISOString(),
      });
    } else {
      onAddExpense({
        id: crypto.randomUUID(),
        amount: normalizedAmount,
        category,
        note: note.trim(),
        date,
        createdAt: new Date().toISOString(),
      });
    }

    setAmount('');
    setNote('');
    setDate(toDateInputValue(new Date()));
    setOperationMode('expense');
    setIncomeKind('salary');
    setError('');
    onNavigate(isEditMode ? returnScreen : 'home');
  }

  const pageTitle = isIncomeEditMode
    ? 'Изменить доход'
    : isExpenseEditMode
      ? 'Изменить расход'
      : operationMode === 'income'
        ? 'Добавить доход'
        : 'Добавить расход';

  return (
    <main className="screen">
      <header className="top-header">
        <div>
          <p className="subtitle">Новая операция</p>
          <h1>{pageTitle}</h1>
        </div>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        {!isEditMode ? (
          <div className="segmented segmented--two operation-segmented" role="tablist" aria-label="Тип операции">
            <button
              className={operationMode === 'expense' ? 'active' : ''}
              onClick={() => setOperationMode('expense')}
              type="button"
            >
              Расход
            </button>
            <button
              className={operationMode === 'income' ? 'active' : ''}
              onClick={() => setOperationMode('income')}
              type="button"
            >
              Доход
            </button>
          </div>
        ) : null}

        <label className="amount-field">
          <span>Сумма</span>
          <div className="money-input money-input--large">
            <input
              inputMode="decimal"
              min="0"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              type="number"
              value={amount}
            />
            <span className="money-input__currency">{currency}</span>
          </div>
        </label>

        {operationMode === 'expense' && !isIncomeEditMode ? (
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
        ) : (
          <fieldset>
            <legend>Тип дохода</legend>
            <div className="chips">
              {(Object.keys(incomeKindLabels) as ManualIncomeKind[]).map((item) => (
                <button
                  className={item === incomeKind ? 'chip active' : 'chip'}
                  key={item}
                  onClick={() => setIncomeKind(item)}
                  type="button"
                >
                  {incomeKindLabels[item]}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <label>
          <span>Комментарий</span>
          <input
            onChange={(event) => setNote(event.target.value)}
            placeholder={operationMode === 'income' ? 'Например, премия' : 'Например, кофе'}
            type="text"
            value={note}
          />
        </label>

        <label>
          <span>Дата</span>
          <input onChange={(event) => setDate(event.target.value)} type="date" value={date} />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button" type="submit">
          {isEditMode ? 'Сохранить изменения' : operationMode === 'income' ? 'Сохранить доход' : 'Сохранить расход'}
        </button>
      </form>
    </main>
  );
}
