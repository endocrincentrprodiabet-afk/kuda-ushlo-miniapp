import { FormEvent, useEffect, useState } from 'react';
import type { Settings } from '../types';

type SettingsScreenProps = {
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  onClearData: () => void;
};

export function SettingsScreen({ settings, onSaveSettings, onClearData }: SettingsScreenProps) {
  const [dailyLimit, setDailyLimit] = useState(String(settings.dailyLimit));
  const [monthlyBudget, setMonthlyBudget] = useState(String(settings.monthlyBudget));
  const [saved, setSaved] = useState(false);
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
  const [clearConfirmationText, setClearConfirmationText] = useState('');
  const [dataCleared, setDataCleared] = useState(false);
  const canClearData = clearConfirmationText.trim() === 'ОЧИСТИТЬ';

  useEffect(() => {
    setDailyLimit(String(settings.dailyLimit));
    setMonthlyBudget(String(settings.monthlyBudget));
  }, [settings.dailyLimit, settings.monthlyBudget]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedLimit = Math.max(0, Number(dailyLimit.replace(',', '.')) || 0);
    const parsedMonthlyBudget = Math.max(0, Number(monthlyBudget.replace(',', '.')) || 0);
    onSaveSettings({ dailyLimit: parsedLimit, monthlyBudget: parsedMonthlyBudget, currency: 'RUB' });
    setDailyLimit(String(parsedLimit));
    setMonthlyBudget(String(parsedMonthlyBudget));
    setSaved(true);
    setDataCleared(false);
  }

  function handleOpenClearConfirmation() {
    setClearConfirmationOpen(true);
    setDataCleared(false);
  }

  function handleCancelClearData() {
    setClearConfirmationOpen(false);
    setClearConfirmationText('');
  }

  function handleConfirmClearData() {
    if (!canClearData) {
      return;
    }

    onClearData();
    setClearConfirmationOpen(false);
    setClearConfirmationText('');
    setSaved(false);
    setDataCleared(true);
  }

  return (
    <>
      <main className="screen">
        <header className="top-header">
          <div>
            <p className="subtitle">Параметры</p>
            <h1>Настройки</h1>
          </div>
        </header>

        <form className="form-card" onSubmit={handleSubmit}>
          <label>
            <span>Дневной лимит</span>
            <input inputMode="decimal" min="0" onChange={(event) => setDailyLimit(event.target.value)} type="number" value={dailyLimit} />
          </label>

          <label>
            <span>Месячный бюджет</span>
            <input
              inputMode="decimal"
              min="0"
              onChange={(event) => setMonthlyBudget(event.target.value)}
              type="number"
              value={monthlyBudget}
            />
          </label>

          <div className="setting-row">
            <span>Валюта</span>
            <strong>{settings.currency}</strong>
          </div>

          {saved ? <p className="success-text">Настройки сохранены</p> : null}

          <button className="primary-button" type="submit">
            Сохранить настройки
          </button>
        </form>

        <section className="card">
          <h2>Данные</h2>
          <p className="muted">Данные хранятся локально на этом устройстве.</p>
          {dataCleared ? <p className="success-text settings-status">Данные очищены.</p> : null}
          <button className="secondary-button danger" onClick={handleOpenClearConfirmation} type="button">
            Очистить все данные
          </button>
        </section>
      </main>

      {clearConfirmationOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal confirm-modal--danger" role="dialog" aria-modal="true" aria-labelledby="clear-data-title">
            <div className="confirm-modal__head">
              <p className="subtitle">Подтверждение</p>
              <h2 id="clear-data-title">Очистить все данные?</h2>
            </div>

            <p className="confirm-modal__warning">Будут удалены все расходы, лимиты и настройки. Это действие нельзя отменить.</p>

            <label className="confirm-modal__field">
              <span>Чтобы подтвердить, введите: ОЧИСТИТЬ</span>
              <input
                autoFocus
                onChange={(event) => setClearConfirmationText(event.target.value)}
                value={clearConfirmationText}
              />
            </label>

            <div className="confirm-modal__actions">
              <button className="secondary-button" onClick={handleCancelClearData} type="button">
                Отмена
              </button>
              <button className="danger-button" disabled={!canClearData} onClick={handleConfirmClearData} type="button">
                Очистить данные
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
