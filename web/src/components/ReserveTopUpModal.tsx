import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { toDateInputValue } from '../lib/date';
import type { ReserveTopUp } from '../types';

export type ReserveTopUpValues = Pick<ReserveTopUp, 'amount' | 'date' | 'note'>;

type ReserveTopUpModalProps = {
  currentTopUp: ReserveTopUp | null;
  onClose: () => void;
  onSave: (values: ReserveTopUpValues) => void;
};

function isValidDateValue(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function ReserveTopUpModal({ currentTopUp, onClose, onSave }: ReserveTopUpModalProps) {
  const [amount, setAmount] = useState(String(currentTopUp?.amount ?? ''));
  const [date, setDate] = useState(currentTopUp?.date ?? toDateInputValue(new Date()));
  const [note, setNote] = useState(currentTopUp?.note ?? '');
  const [error, setError] = useState('');
  const isEditing = Boolean(currentTopUp);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount.replace(',', '.'));
    const normalizedAmount = Number.isFinite(parsedAmount)
      ? Math.min(Number.MAX_SAFE_INTEGER, Math.round(parsedAmount))
      : 0;

    if (!amount.trim() || !Number.isFinite(parsedAmount) || normalizedAmount <= 0) {
      setError('Укажи сумму больше нуля.');
      return;
    }

    if (!isValidDateValue(date)) {
      setError('Укажи корректную дату.');
      return;
    }

    onSave({
      amount: normalizedAmount,
      date,
      note: note.trim(),
    });
  }

  return createPortal(
    <div className="reserve-modal-backdrop" onMouseDown={onClose} role="presentation">
      <form
        className="confirm-modal reserve-modal reserve-top-up-modal"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserve-top-up-modal-title"
        aria-describedby={error ? 'reserve-top-up-modal-error' : undefined}
      >
        <div className="confirm-modal__head">
          <p className="subtitle">Накопления</p>
          <h2 id="reserve-top-up-modal-title">
            {isEditing ? 'Изменить пополнение' : 'Пополнить сейф'}
          </h2>
        </div>

        <label className="confirm-modal__field reserve-modal__field">
          <span>Сумма</span>
          <input
            autoFocus
            inputMode="decimal"
            min="1"
            onChange={(event) => {
              setAmount(event.target.value);
              setError('');
            }}
            step="1"
            type="number"
            value={amount}
          />
        </label>

        <label className="confirm-modal__field reserve-modal__field">
          <span>Дата</span>
          <input
            onChange={(event) => {
              setDate(event.target.value);
              setError('');
            }}
            type="date"
            value={date}
          />
        </label>

        <label className="confirm-modal__field reserve-modal__field">
          <span>Комментарий — необязательный</span>
          <textarea
            maxLength={180}
            onChange={(event) => {
              setNote(event.target.value);
              setError('');
            }}
            rows={3}
            value={note}
          />
        </label>

        {error ? (
          <p className="form-error reserve-top-up-modal__error" id="reserve-top-up-modal-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="confirm-modal__actions">
          <button className="secondary-button" onClick={onClose} type="button">
            Отмена
          </button>
          <button
            aria-label={isEditing ? 'Сохранить изменения пополнения' : 'Пополнить сейф'}
            className="primary-button"
            type="submit"
          >
            {isEditing ? 'Сохранить изменения' : 'Пополнить сейф'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
