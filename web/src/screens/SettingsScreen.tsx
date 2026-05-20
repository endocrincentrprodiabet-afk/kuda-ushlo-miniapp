import { CSSProperties, FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatedMoney } from '../components/AnimatedMoney';
import {
  getMonthlySpendingLimitFromWorkingBudget,
  getPlannedDailyTargetFromWorkingBudget,
  getWorkingBudget,
} from '../lib/calculations';
import { formatDate, toDateInputValue } from '../lib/date';
import { formatMoney } from '../lib/format';
import type { IncomeEntry, Settings } from '../types';

type SettingsScreenProps = {
  settings: Settings;
  incomeEntries: IncomeEntry[];
  onSaveSettings: (settings: Settings) => void;
  onOpenAddIncome: () => void;
  onClearData: () => void;
};

const SAVINGS_STEP = 5000;

function parseMoneyInput(value: string): number {
  return Math.max(0, Number(value.replace(',', '.')) || 0);
}

function snapSavingsGoal(value: number, workingBudget: number): number {
  if (workingBudget <= 0) {
    return 0;
  }

  const rounded = Math.round(Math.max(0, value) / SAVINGS_STEP) * SAVINGS_STEP;

  return Math.min(rounded, workingBudget);
}

function addMonths(value: string, months: number): string {
  const date = new Date(`${value}T00:00:00`);
  const day = date.getDate();

  date.setMonth(date.getMonth() + months);

  if (date.getDate() !== day) {
    date.setDate(0);
  }

  return toDateInputValue(date);
}

function getNextIncomeAfter(settings: Pick<Settings, 'incomeFrequency' | 'nextIncomeDate' | 'secondIncomeDate'>): string {
  if (settings.incomeFrequency !== 'biweekly') {
    return addMonths(settings.nextIncomeDate, 1);
  }

  let candidate = addMonths(settings.nextIncomeDate, 1);

  while (candidate <= settings.secondIncomeDate) {
    candidate = addMonths(candidate, 1);
  }

  return candidate;
}

function getSavingsWarningContent(savingsGoal: number, workingBudget: number): { title: string; text: string } {
  const savingsPercent = workingBudget > 0 ? (savingsGoal / workingBudget) * 100 : 0;

  if (savingsPercent >= 95) {
    return {
      title: 'Почти все деньги уходят в запас',
      text: 'На расходы почти ничего не останется. Если это не случайность, можно сохранить такой план.',
    };
  }

  if (savingsPercent >= 75) {
    return {
      title: 'Большая часть денег отложена',
      text: 'Проверь, комфортно ли будет жить с таким лимитом на расходы.',
    };
  }

  return {
    title: 'Проверь план',
    text: 'На расходы остается небольшая часть денег в работе. Проверь, что план реалистичен для месяца.',
  };
}

export function SettingsScreen({
  settings,
  incomeEntries,
  onSaveSettings,
  onOpenAddIncome,
  onClearData,
}: SettingsScreenProps) {
  const [availableNow, setAvailableNow] = useState(String(settings.availableNow || ''));
  const [incomeFrequency, setIncomeFrequency] = useState<Settings['incomeFrequency']>(settings.incomeFrequency);
  const [nextIncomeDate, setNextIncomeDate] = useState(settings.nextIncomeDate);
  const [secondIncomeDate, setSecondIncomeDate] = useState(settings.secondIncomeDate);
  const [regularIncomeAmount, setRegularIncomeAmount] = useState(String(settings.regularIncomeAmount || ''));
  const [savingsGoal, setSavingsGoal] = useState(settings.savingsGoal);
  const [saved, setSaved] = useState(false);
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
  const [clearConfirmationText, setClearConfirmationText] = useState('');
  const [savingsConfirmationOpen, setSavingsConfirmationOpen] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<Settings | null>(null);
  const [dataCleared, setDataCleared] = useState(false);
  const canClearData = clearConfirmationText.trim() === 'ОЧИСТИТЬ';

  const parsedAvailableNow = parseMoneyInput(availableNow);
  const parsedRegularIncomeAmount = parseMoneyInput(regularIncomeAmount);
  const previewSettings: Settings = {
    ...settings,
    dailyLimit: 0,
    monthlyBudget: parsedAvailableNow,
    availableNow: parsedAvailableNow,
    incomeFrequency,
    nextIncomeDate,
    secondIncomeDate,
    regularIncomeAmount: parsedRegularIncomeAmount,
    savingsGoal,
    currency: 'RUB',
  };
  const workingBudget = getWorkingBudget(previewSettings, incomeEntries);
  const clampedSavingsGoal = snapSavingsGoal(savingsGoal, workingBudget);
  const monthlySpendingLimit = getMonthlySpendingLimitFromWorkingBudget(workingBudget, clampedSavingsGoal);
  const plannedDailyTarget = getPlannedDailyTargetFromWorkingBudget(workingBudget, clampedSavingsGoal);
  const savingsPercent = workingBudget > 0 ? (clampedSavingsGoal / workingBudget) * 100 : 0;
  const nextIncomeAfter = getNextIncomeAfter(previewSettings);
  const savingsWarningContent = pendingSettings
    ? getSavingsWarningContent(pendingSettings.savingsGoal, getWorkingBudget(pendingSettings, incomeEntries))
    : null;
  const shouldShowIncomeHint = parsedAvailableNow === 0 && incomeEntries.length === 0;

  useEffect(() => {
    setAvailableNow(String(settings.availableNow || ''));
    setIncomeFrequency(settings.incomeFrequency);
    setNextIncomeDate(settings.nextIncomeDate);
    setSecondIncomeDate(settings.secondIncomeDate);
    setRegularIncomeAmount(String(settings.regularIncomeAmount || ''));
    setSavingsGoal(settings.savingsGoal);
  }, [
    settings.availableNow,
    settings.incomeFrequency,
    settings.nextIncomeDate,
    settings.secondIncomeDate,
    settings.regularIncomeAmount,
    settings.savingsGoal,
  ]);

  useEffect(() => {
    setSavingsGoal((current) => snapSavingsGoal(current, workingBudget));
  }, [workingBudget]);

  useEffect(() => {
    if (!savingsConfirmationOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [savingsConfirmationOpen]);

  function commitSettings(nextSettings: Settings) {
    onSaveSettings(nextSettings);
    setAvailableNow(String(nextSettings.availableNow || ''));
    setSavingsGoal(nextSettings.savingsGoal);
    setSaved(true);
    setDataCleared(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextWorkingBudget = getWorkingBudget(previewSettings, incomeEntries);
    const nextSavingsGoal = snapSavingsGoal(savingsGoal, nextWorkingBudget);
    const nextSettings: Settings = {
      ...previewSettings,
      monthlyBudget: nextWorkingBudget,
      savingsGoal: nextSavingsGoal,
    };

    if (nextWorkingBudget > 0 && nextSavingsGoal >= nextWorkingBudget * 0.55) {
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

  const savingsConfirmationModal =
    savingsConfirmationOpen && savingsWarningContent
      ? createPortal(
          <div className="savings-warning-backdrop" role="presentation">
            <section
              className="confirm-modal confirm-modal--savings"
              role="dialog"
              aria-modal="true"
              aria-labelledby="savings-warning-title"
            >
              <div className="confirm-modal__scroll">
                <div className="confirm-modal__head">
                  <p className="subtitle">Доходы и план</p>
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
              </div>
            </section>
          </div>,
          document.body,
        )
      : null;

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
          <section className="settings-plan">
            <div className="settings-plan__head">
              <h2>Доходы и план</h2>
              <p>Начни с суммы, которая есть сейчас. Так приложение точнее посчитает расходный коридор.</p>
            </div>

            {shouldShowIncomeHint ? (
              <p className="settings-income-hint">Внеси сумму, которая есть сейчас, чтобы приложение точнее рассчитало план.</p>
            ) : null}

            <label className="settings-plan__budget">
              <span>Доступно сейчас</span>
              <input
                inputMode="decimal"
                min="0"
                onChange={(event) => {
                  setAvailableNow(event.target.value);
                  setSaved(false);
                }}
                type="number"
                value={availableNow}
              />
            </label>

            <fieldset>
              <legend>Доход приходит</legend>
              <div className="segmented segmented--two">
                <button
                  className={incomeFrequency === 'monthly' ? 'active' : ''}
                  onClick={() => {
                    setIncomeFrequency('monthly');
                    setSaved(false);
                  }}
                  type="button"
                >
                  Раз в месяц
                </button>
                <button
                  className={incomeFrequency === 'biweekly' ? 'active' : ''}
                  onClick={() => {
                    setIncomeFrequency('biweekly');
                    setSaved(false);
                  }}
                  type="button"
                >
                  Раз в 2 недели
                </button>
              </div>
            </fieldset>

            <label>
              <span>{incomeFrequency === 'biweekly' ? 'Первая ближайшая выплата' : 'Ближайшая выплата'}</span>
              <input
                onChange={(event) => {
                  setNextIncomeDate(event.target.value);
                  setSaved(false);
                }}
                type="date"
                value={nextIncomeDate}
              />
            </label>

            {incomeFrequency === 'biweekly' ? (
              <label>
                <span>Вторая ближайшая выплата</span>
                <input
                  onChange={(event) => {
                    setSecondIncomeDate(event.target.value);
                    setSaved(false);
                  }}
                  type="date"
                  value={secondIncomeDate}
                />
              </label>
            ) : null}

            <label>
              <span>Обычная сумма выплаты</span>
              <input
                inputMode="decimal"
                min="0"
                onChange={(event) => {
                  setRegularIncomeAmount(event.target.value);
                  setSaved(false);
                }}
                type="number"
                value={regularIncomeAmount}
              />
            </label>

            <div className="income-schedule-note">
              <span>Ближайшая выплата: {formatDate(nextIncomeDate)}</span>
              {incomeFrequency === 'biweekly' ? <span>Вторая ближайшая выплата: {formatDate(secondIncomeDate)}</span> : null}
              <span>Следующая после неё: {formatDate(nextIncomeAfter)}</span>
              <p>Начисления создаются автоматически, когда дата выплаты наступила.</p>
            </div>

            <section className="income-entry-card">
              <h3>Начисления</h3>
              <p className="muted">Обычные начисления добавляются и редактируются как операции.</p>
              <button className="secondary-button" onClick={onOpenAddIncome} type="button">
                Добавить начисление
              </button>
            </section>

            <div className={`savings-panel${workingBudget <= 0 ? ' savings-panel--disabled' : ''}`}>
              <div className="settings-plan-metrics settings-plan-metrics--top">
                <div className="monthly-spending-limit">
                  <span>Деньги в работе</span>
                  <strong>
                    <AnimatedMoney amount={workingBudget} currency={settings.currency} />
                  </strong>
                </div>
              </div>

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
                    disabled={workingBudget <= 0}
                    max={workingBudget}
                    min="0"
                    onChange={(event) => {
                      setSavingsGoal(snapSavingsGoal(Number(event.target.value), workingBudget));
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

              <div className="settings-plan-metrics">
                <div className="monthly-spending-limit">
                  <span>На расходы</span>
                  <strong>
                    <AnimatedMoney amount={monthlySpendingLimit} currency={settings.currency} />
                  </strong>
                </div>
                <div className="monthly-spending-limit monthly-spending-limit--secondary">
                  <span>Плановый ориентир</span>
                  <strong>{formatMoney(plannedDailyTarget, settings.currency)} / день</strong>
                </div>
                <p className="settings-plan-note">На расходы и дневной ориентир считаются автоматически.</p>
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

      {savingsConfirmationModal}

      {clearConfirmationOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal confirm-modal--danger" role="dialog" aria-modal="true" aria-labelledby="clear-data-title">
            <div className="confirm-modal__head">
              <p className="subtitle">Подтверждение</p>
              <h2 id="clear-data-title">Очистить все данные?</h2>
            </div>

            <p className="confirm-modal__warning">Будут удалены все расходы, поступления и настройки. Это действие нельзя отменить.</p>

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
