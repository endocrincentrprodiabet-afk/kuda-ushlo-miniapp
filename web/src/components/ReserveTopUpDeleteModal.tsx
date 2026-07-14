import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getDeleteOperationCopy, uiCopy } from '../content/uiCopy';
import { formatMoney } from '../lib/format';
import type { ReserveTopUp, Settings } from '../types';

type ReserveTopUpDeleteModalProps = {
  currency: Settings['currency'];
  topUp: ReserveTopUp;
  willAdjustAllocations: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ReserveTopUpDeleteModal({
  currency,
  topUp,
  willAdjustAllocations,
  onCancel,
  onConfirm,
}: ReserveTopUpDeleteModalProps) {
  const copy = getDeleteOperationCopy('topUp', {
    amount: formatMoney(topUp.amount, currency),
    willAdjustAllocations,
  });

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
        className="confirm-modal confirm-modal--danger reserve-modal reserve-top-up-delete-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-reserve-top-up-title"
      >
        <div className="confirm-modal__head">
          <p className="subtitle">Подтверждение</p>
          <h2 id="delete-reserve-top-up-title">{copy.title}</h2>
        </div>
        <p className="reserve-modal__text">{copy.body}</p>
        {copy.additionalWarning ? (
          <p className="confirm-modal__warning">{copy.additionalWarning}</p>
        ) : null}
        <div className="confirm-modal__actions">
          <button className="secondary-button" onClick={onCancel} type="button">
            {uiCopy.actions.cancel}
          </button>
          <button className="danger-button reserve-top-up-delete-button" onClick={onConfirm} type="button">
            {copy.action}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
