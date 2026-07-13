import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { formatMoney } from '../../lib/format';
import type { ReserveGoal, Settings } from '../../types';

type ReserveGoalModalProps = {
  currency: Settings['currency'];
  currentGoal: ReserveGoal | null;
  goalCount: number;
  unallocatedReserve: number;
  onClose: () => void;
  onSave: (values: { title: string; targetAmount: number; allocatedAmount: number }) => void;
};

function parseAmount(value: string): number {
  const parsedValue = Number(value.replace(',', '.'));
  return Number.isFinite(parsedValue) ? Math.max(0, Math.round(parsedValue)) : 0;
}

export function ReserveGoalModal({
  currency,
  currentGoal,
  goalCount,
  unallocatedReserve,
  onClose,
  onSave,
}: ReserveGoalModalProps) {
  const [title, setTitle] = useState(currentGoal?.title ?? '');
  const [targetAmount, setTargetAmount] = useState(String(currentGoal?.targetAmount ?? ''));
  const [allocatedAmount, setAllocatedAmount] = useState(String(currentGoal?.allocatedAmount ?? 0));
  const [error, setError] = useState('');
  const parsedTarget = parseAmount(targetAmount);
  const parsedAllocation = parseAmount(allocatedAmount);
  const availableReserve = Math.floor(unallocatedReserve + (currentGoal?.allocatedAmount ?? 0));
  const allocationMaximum = Math.min(parsedTarget, availableReserve);
  const allocationProgress = allocationMaximum > 0 ? (Math.min(parsedAllocation, allocationMaximum) / allocationMaximum) * 100 : 0;
  const dialogTitle = currentGoal ? 'Изменить цель' : 'Новая цель';

  const sliderStyle = useMemo(
    () => ({ '--reserve-allocation-progress': `${allocationProgress}%` }) as CSSProperties,
    [allocationProgress],
  );

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

  function handleTargetChange(value: string) {
    const nextTarget = parseAmount(value);
    const nextMaximum = Math.min(nextTarget, availableReserve);
    setTargetAmount(value);
    setAllocatedAmount((current) => String(Math.min(parseAmount(current), nextMaximum)));
    setError('');
  }

  function handleAllocationChange(value: string) {
    setAllocatedAmount(String(Math.min(parseAmount(value), allocationMaximum)));
    setError('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setError('Укажи название цели.');
      return;
    }

    if (parsedTarget <= 0) {
      setError('Сумма цели должна быть больше нуля.');
      return;
    }

    if (parsedAllocation > parsedTarget || parsedAllocation > availableReserve) {
      setError('Распределение превышает доступный запас.');
      return;
    }

    if (!currentGoal && goalCount >= 6) {
      setError('Можно создать до 6 целей.');
      return;
    }

    onSave({
      title: normalizedTitle,
      targetAmount: parsedTarget,
      allocatedAmount: parsedAllocation,
    });
  }

  return createPortal(
    <div className="reserve-modal-backdrop" onMouseDown={onClose} role="presentation">
      <form
        className="confirm-modal reserve-modal reserve-goal-modal"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserve-goal-modal-title"
      >
        <div className="confirm-modal__head">
          <p className="subtitle">Цели запаса</p>
          <h2 id="reserve-goal-modal-title">{dialogTitle}</h2>
        </div>

        <label className="confirm-modal__field reserve-modal__field">
          <span>На что копим?</span>
          <input
            autoFocus
            maxLength={80}
            onChange={(event) => {
              setTitle(event.target.value);
              setError('');
            }}
            value={title}
          />
        </label>

        <label className="confirm-modal__field reserve-modal__field">
          <span>Сумма цели</span>
          <input
            inputMode="numeric"
            min="0"
            onChange={(event) => handleTargetChange(event.target.value)}
            type="number"
            value={targetAmount}
          />
        </label>

        <div className="reserve-allocation-control">
          <label className="confirm-modal__field reserve-modal__field">
            <span>Распределить из запаса</span>
            <input
              inputMode="numeric"
              max={allocationMaximum}
              min="0"
              onChange={(event) => handleAllocationChange(event.target.value)}
              type="number"
              value={allocatedAmount}
            />
          </label>
          <input
            aria-label="Распределить из запаса"
            className="reserve-allocation-slider"
            disabled={allocationMaximum <= 0}
            max={allocationMaximum}
            min="0"
            onChange={(event) => handleAllocationChange(event.target.value)}
            step="1000"
            style={sliderStyle}
            type="range"
            value={Math.min(parsedAllocation, allocationMaximum)}
          />
          <div className="reserve-allocation-caption">
            <span>0 ₽</span>
            <span>{formatMoney(allocationMaximum, currency)}</span>
          </div>
        </div>

        <p className="reserve-modal__available">
          Свободно для распределения: {formatMoney(unallocatedReserve, currency)}
        </p>
        {error ? <p className="form-error reserve-goal-modal__error">{error}</p> : null}

        <div className="confirm-modal__actions">
          <button className="secondary-button" onClick={onClose} type="button">
            Отмена
          </button>
          <button className="primary-button" type="submit">
            Сохранить цель
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
