import { CSSProperties, FormEvent, useEffect, useState } from 'react';
import { AnimatedMoney } from '../components/AnimatedMoney';
import { getMonthlySpendingLimit } from '../lib/calculations';
import type { Settings } from '../types';

type SettingsScreenProps = {
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  onClearData: () => void;
};

const SAVINGS_STEP = 5000;

function parseMoneyInput(value: string): number {
  return Math.max(0, Number(value.replace(',', '.')) || 0);
}

function snapSavingsGoal(value: number, monthlyBudget: number): number {
  if (monthlyBudget <= 0) {
    return 0;
  }

  const rounded = Math.round(Math.max(0, value) / SAVINGS_STEP) * SAVINGS_STEP;

  if (rounded > monthlyBudget) {
    return Math.floor(monthlyBudget / SAVINGS_STEP) * SAVINGS_STEP;
  }

  return rounded;
}

function getSavingsWarningContent(savingsGoal: number, monthlyBudget: number): { title: string; text: string } {
  const savingsPercent = monthlyBudget > 0 ? (savingsGoal / monthlyBudget) * 100 : 0;

  if (savingsPercent >= 95) {
    return {
      title: 'Это было не просто смело, это было...',
      text: 'На расходы почти ничего не останется. Если это не случайность, можешь сохранить такой план.',
    };
  }

  if (savingsPercent >= 75) {
    return {
      title: 'Ого, это смелое решение',
      text: 'Ты хочешь отложить большую часть месячного бюджета. Проверь, комфортно ли будет жить с таким лимитом на расходы.',
    };
  }

  return {
    title: 'Проверь план',
    text: 'Ты оставляешь на расходы совсем небольшую часть бюджета. Проверь, что этот план реалистичен для месяца.',
  };
}

export function SettingsScreen({ settings, onSaveSettings, onClearData }: SettingsScreenProps) {
  const [dailyLimit, setDailyLimit] = useState(String(settings.dailyLimit));
  const [monthlyBudget, setMonthlyBudget] = useState(String(settings.monthlyBudget));
  const [savingsGoal, setSavingsGoal] = useState(settings.savingsGoal);
  const [saved, setSaved] = useState(false);
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
  const [clearConfirmationText, setClearConfirmationText] = useState('');
  const [savingsConfirmationOpen, setSavingsConfirmationOpen] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<Settings | null>(null);
  const [dataCleared, setDataCleared] = useState(false);
  const canClearData = clearConfirmationText.trim() === 'ОЧИСТИТЬ';
  const parsedMonthlyBudget = parseMoneyInput(monthlyBudget);
  const clampedSavingsGoal = snapSavingsGoal(savingsGoal, parsedMonthlyBudget);
  const monthlySpendingLimit = getMonthlySpendingLimit(parsedMonthlyBudget, clampedSavingsGoal);
  const savingsPercent = parsedMonthlyBudget > 0 ? (clampedSavingsGoal / parsedMonthlyBudget) * 100 : 0;
  const savingsWarningContent = pendingSettings
    ? getSavingsWarningContent(pendingSettings.savingsGoal, pendingSettings.monthlyBudget)
    : null;

  useEffect(() => {
    setDailyLimit(String(settings.dailyLimit));
    setMonthlyBudget(String(settings.monthlyBudget));
    setSavingsGoal(settings.savingsGoal);
  }, [settings.dailyLimit, settings.monthlyBudget, settings.savingsGoal]);

  useEffect(() => {
    setSavingsGoal((current) => snapSavingsGoal(current, parsedMonthlyBudget));
  }, [parsedMonthlyBudget]);

  function commitSettings(nextSettings: Settings) {
    onSaveSettings(nextSettings);
    setDailyLimit(String(nextSettings.dailyLimit));
    setMonthlyBudget(String(nextSettings.monthlyBudget));
    setSavingsGoal(nextSettings.savingsGoal);
    setSaved(true);
    setDataCleared(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedLimit = parseMoneyInput(dailyLimit);
    const nextMonthlyBudget = parseMoneyInput(monthlyBudget);
    const nextSavingsGoal = nextMonthlyBudget > 0 ? snapSavingsGoal(savingsGoal, nextMonthlyBudget) : 0;
    const nextSettings: Settings = {
      dailyLimit: parsedLimit,
      monthlyBudget: nextMonthlyBudget,
      savingsGoal: nextSavingsGoal,
      currency: 'RUB',
    };

    if (nextMonthlyBudget > 0 && nextSavingsGoal >= nextMonthlyBudget * 0.55) {
      setPendingSettings(nextSettings);
      setSavingsConfirmationOpen(true);
      return;
    }

    commitSettings(nextSettings);
  }

  function handleConfirmSavingsSettings() {
    if (!pendingSettings) {
      return;
    }

    commitSettings(pendingSettings);
    setPendingSettings(null);
    setSavingsConfirmationOpen(false);
  }

  function handleReviewSavingsSettings() {
    setPendingSettings(null);
    setSavingsConfirmationOpen(false);
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

          <section className="settings-plan">
            <div className="settings-plan__head">
              <h2>План месяца</h2>
              <p>Эта сумма будет использоваться как основа для месячного плана.</p>
            </div>

            <label className="settings-plan__budget">
              <span>Месячный бюджет</span>
              <input
                inputMode="decimal"
                min="0"
                onChange={(event) => {
                  setMonthlyBudget(event.target.value);
                  setSaved(false);
                }}
                type="number"
                value={monthlyBudget}
              />
            </label>

            <div className={`savings-panel${parsedMonthlyBudget <= 0 ? ' savings-panel--disabled' : ''}`}>
              <div className="savings-panel__head">
                <span className="savings-section-title">Отложить</span>
                <AnimatedMoney
                  amount={clampedSavingsGoal}
                  className="savings-goal-display"
                  currency={settings.currency}
                  debounceMs={180}
                />
                <p>Сумма, которую хочешь не тратить</p>
              </div>

              <div className="savings-panel__control">
                <div className="savings-slider-wrap">
                  <input
                    aria-label="Отложить"
                    className="savings-slider"
                    disabled={parsedMonthlyBudget <= 0}
                    max={parsedMonthlyBudget}
                    min="0"
                    onChange={(event) => {
                      setSavingsGoal(snapSavingsGoal(Number(event.target.value), parsedMonthlyBudget));
                      setSaved(false);
                    }}
                    step={SAVINGS_STEP}
                    style={{ '--savings-progress': `${savingsPercent}%` } as CSSProperties}
                    type="range"
                    value={clampedSavingsGoal}
                  />
                  <div className="savings-ticks" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>

              <div className="monthly-spending-limit">
                <span>На расходы:</span>
                <strong>
                  <AnimatedMoney amount={monthlySpendingLimit} currency={settings.currency} />
                </strong>
              </div>
            </div>
          </section>

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

      {savingsConfirmationOpen && savingsWarningContent ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal confirm-modal--savings" role="dialog" aria-modal="true" aria-labelledby="savings-warning-title">
            <div className="confirm-modal__head">
              <p className="subtitle">План месяца</p>
              <h2 id="savings-warning-title">{savingsWarningContent.title}</h2>
            </div>

            <p className="confirm-modal__warning">{savingsWarningContent.text}</p>

            <div className="confirm-modal__actions">
              <button className="secondary-button" onClick={handleReviewSavingsSettings} type="button">
                Пересмотреть
              </button>
              <button className="primary-button" onClick={handleConfirmSavingsSettings} type="button">
                Да, сохранить
              </button>
            </div>
          </section>
        </div>
      ) : null}

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
              <input autoFocus onChange={(event) => setClearConfirmationText(event.target.value)} value={clearConfirmationText} />
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
