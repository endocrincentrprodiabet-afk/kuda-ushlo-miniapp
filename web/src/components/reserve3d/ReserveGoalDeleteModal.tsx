import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatMoney } from '../../lib/format';
import type { ReserveGoal, Settings } from '../../types';

type ReserveGoalDeleteModalProps = {
  currency: Settings['currency'];
  goal: ReserveGoal;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ReserveGoalDeleteModal({ currency, goal, onCancel, onConfirm }: ReserveGoalDeleteModalProps) {
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  return createPortal(
    <div className="reserve-modal-backdrop" onMouseDown={onCancel} role="presentation">
      <section
        className="confirm-modal confirm-modal--danger reserve-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-reserve-goal-title"
      >
        <div className="confirm-modal__head">
          <p className="subtitle">Подтверждение</p>
          <h2 id="delete-reserve-goal-title">Удалить цель?</h2>
        </div>
        <p className="reserve-modal__text">
          Распределённые на неё {formatMoney(goal.allocatedAmount, currency)} вернутся в свободный запас.
        </p>
        <div className="confirm-modal__actions">
          <button className="secondary-button" onClick={onCancel} type="button">
            Отмена
          </button>
          <button className="danger-button reserve-goal-delete-button" onClick={onConfirm} type="button">
            Удалить цель
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
