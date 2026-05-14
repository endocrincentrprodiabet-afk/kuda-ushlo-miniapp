import { FormEvent, useState } from 'react';
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedLimit = Math.max(0, Number(dailyLimit.replace(',', '.')) || 0);
    const parsedMonthlyBudget = Math.max(0, Number(monthlyBudget.replace(',', '.')) || 0);
    onSaveSettings({ dailyLimit: parsedLimit, monthlyBudget: parsedMonthlyBudget, currency: 'RUB' });
    setDailyLimit(String(parsedLimit));
    setMonthlyBudget(String(parsedMonthlyBudget));
    setSaved(true);
  }

  return (
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
        <button className="secondary-button danger" onClick={onClearData} type="button">
          Очистить все данные
        </button>
      </section>
    </main>
  );
}
