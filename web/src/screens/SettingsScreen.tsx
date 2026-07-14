import {
  CSSProperties,
  FormEvent,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatedMoney } from '../components/AnimatedMoney';
import { getSavingsWarningCopy, uiCopy } from '../content/uiCopy';
import {
  getMonthlySpendingLimitFromWorkingBudget,
  getPlannedDailyTargetFromWorkingBudget,
  getWorkingBudget,
} from '../lib/calculations';
import { formatScheduledIncomeDate } from '../lib/date';
import { formatMoney } from '../lib/format';
import { CURRENCY_CODES, getCurrencyConfig } from '../lib/currency';
import { getNextScheduledIncomeDate } from '../lib/incomeSchedule';
import type { CurrencyCode, IncomeEntry, Settings } from '../types';

type SettingsScreenProps = {
  settings: Settings;
  incomeEntries: IncomeEntry[];
  onSaveSettings: (settings: Settings) => void;
  onOpenAddIncome: () => void;
  onOpenReserveTopUp: () => void;
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

function getDayAfter(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

export function SettingsScreen({
  settings,
  incomeEntries,
  onSaveSettings,
  onOpenAddIncome,
  onOpenReserveTopUp,
  onClearData,
}: SettingsScreenProps) {
  const [availableNow, setAvailableNow] = useState(String(settings.availableNow || ''));
  const [incomeFrequency, setIncomeFrequency] = useState<Settings['incomeFrequency']>(settings.incomeFrequency);
  const [nextIncomeDate, setNextIncomeDate] = useState(settings.nextIncomeDate);
  const [secondIncomeDate, setSecondIncomeDate] = useState(settings.secondIncomeDate);
  const [regularIncomeAmount, setRegularIncomeAmount] = useState(String(settings.regularIncomeAmount || ''));
  const [savingsGoal, setSavingsGoal] = useState(settings.savingsGoal);
  const [draftCurrency, setDraftCurrency] = useState<CurrencyCode>(settings.currency);
  const [currencySelectorOpen, setCurrencySelectorOpen] = useState(false);
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
  const [clearConfirmationText, setClearConfirmationText] = useState('');
  const [savingsConfirmationOpen, setSavingsConfirmationOpen] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<Settings | null>(null);
  const [pendingCurrency, setPendingCurrency] = useState<CurrencyCode | null>(null);
  const currencyTriggerRef = useRef<HTMLButtonElement>(null);
  const currencyOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
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
    currency: draftCurrency,
  };
  const workingBudget = getWorkingBudget(previewSettings, incomeEntries);
  const clampedSavingsGoal = snapSavingsGoal(savingsGoal, workingBudget);
  const monthlySpendingLimit = getMonthlySpendingLimitFromWorkingBudget(workingBudget, clampedSavingsGoal);
  const plannedDailyTarget = getPlannedDailyTargetFromWorkingBudget(workingBudget, clampedSavingsGoal);
  const savingsPercent = workingBudget > 0 ? (clampedSavingsGoal / workingBudget) * 100 : 0;
  const today = new Date();
  const nextIncomeDatePreview = getNextScheduledIncomeDate(previewSettings, incomeEntries, today);
  const secondIncomeDatePreview = nextIncomeDatePreview
    ? getNextScheduledIncomeDate(previewSettings, [], getDayAfter(nextIncomeDatePreview))
    : null;
  const savingsWarningContent = pendingSettings
    ? getSavingsWarningCopy(
        getWorkingBudget(pendingSettings, incomeEntries) > 0
          ? (pendingSettings.savingsGoal / getWorkingBudget(pendingSettings, incomeEntries)) * 100
          : 0,
      )
    : null;

  useEffect(() => {
    setAvailableNow(String(settings.availableNow || ''));
    setIncomeFrequency(settings.incomeFrequency);
    setNextIncomeDate(settings.nextIncomeDate);
    setSecondIncomeDate(settings.secondIncomeDate);
    setRegularIncomeAmount(String(settings.regularIncomeAmount || ''));
    setSavingsGoal(settings.savingsGoal);
    setDraftCurrency(settings.currency);
  }, [
    settings.availableNow,
    settings.incomeFrequency,
    settings.nextIncomeDate,
    settings.secondIncomeDate,
    settings.regularIncomeAmount,
    settings.savingsGoal,
    settings.currency,
  ]);

  useEffect(() => {
    setSavingsGoal((current) => snapSavingsGoal(current, workingBudget));
  }, [workingBudget]);

  useEffect(() => {
    if (!savingsConfirmationOpen && !currencySelectorOpen && !pendingCurrency) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [currencySelectorOpen, pendingCurrency, savingsConfirmationOpen]);

  useEffect(() => {
    if (!currencySelectorOpen) {
      return;
    }

    const selectedIndex = CURRENCY_CODES.indexOf(draftCurrency);
    const frameId = window.requestAnimationFrame(() => {
      currencyOptionRefs.current[Math.max(0, selectedIndex)]?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [currencySelectorOpen, draftCurrency]);

  useEffect(() => {
    if (!currencySelectorOpen && !pendingCurrency) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      if (pendingCurrency) {
        setPendingCurrency(null);
      } else {
        setCurrencySelectorOpen(false);
      }

      window.requestAnimationFrame(() => currencyTriggerRef.current?.focus());
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [currencySelectorOpen, pendingCurrency]);

  function commitSettings(nextSettings: Settings) {
    onSaveSettings(nextSettings);
    setAvailableNow(String(nextSettings.availableNow || ''));
    setSavingsGoal(nextSettings.savingsGoal);
    setDraftCurrency(nextSettings.currency);
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
  }

  function handleOpenCurrencySelector() {
    setCurrencySelectorOpen(true);
  }

  function handleCloseCurrencySelector() {
    setCurrencySelectorOpen(false);
    window.requestAnimationFrame(() => currencyTriggerRef.current?.focus());
  }

  function handleRequestCurrencyChange(currency: CurrencyCode) {
    setCurrencySelectorOpen(false);

    if (currency === draftCurrency) {
      window.requestAnimationFrame(() => currencyTriggerRef.current?.focus());
      return;
    }

    setPendingCurrency(currency);
  }

  function handleCancelCurrencyChange() {
    setPendingCurrency(null);
    window.requestAnimationFrame(() => currencyTriggerRef.current?.focus());
  }

  function handleConfirmCurrencyChange() {
    if (!pendingCurrency) {
      return;
    }

    setDraftCurrency(pendingCurrency);
    setPendingCurrency(null);
    window.requestAnimationFrame(() => currencyTriggerRef.current?.focus());
  }

  function handleCurrencyOptionKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index;

    if (event.key === 'ArrowDown') {
      nextIndex = (index + 1) % CURRENCY_CODES.length;
    } else if (event.key === 'ArrowUp') {
      nextIndex = (index - 1 + CURRENCY_CODES.length) % CURRENCY_CODES.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = CURRENCY_CODES.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    currencyOptionRefs.current[nextIndex]?.focus();
  }

  function handleCurrencyModalKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!first || !last) {
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const selectedCurrency = getCurrencyConfig(draftCurrency);

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
              <p>Начни с суммы, которая доступна сейчас — так расчёты будут точнее.</p>
            </div>

            <label className="settings-plan__budget">
              <span>Доступно сейчас</span>
              <div className="money-input">
                <input
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => {
                    setAvailableNow(event.target.value);
                  }}
                  type="number"
                  value={availableNow}
                />
                <span className="money-input__currency">{draftCurrency}</span>
              </div>
            </label>

            <fieldset>
              <legend>График дохода</legend>
              <div className="segmented segmented--two">
                <button
                  className={incomeFrequency === 'monthly' ? 'active' : ''}
                  onClick={() => {
                    setIncomeFrequency('monthly');
                  }}
                  type="button"
                >
                  Раз в месяц
                </button>
                <button
                  className={incomeFrequency === 'biweekly' ? 'active' : ''}
                  onClick={() => {
                    setIncomeFrequency('biweekly');
                  }}
                  type="button"
                >
                  Два раза в месяц
                </button>
              </div>
            </fieldset>

            <label>
              <span>Первая выплата</span>
              <input
                onChange={(event) => {
                  setNextIncomeDate(event.target.value);
                }}
                type="date"
                value={nextIncomeDate}
              />
            </label>

            {incomeFrequency === 'biweekly' ? (
              <label>
                <span>Вторая выплата</span>
                <input
                  onChange={(event) => {
                    setSecondIncomeDate(event.target.value);
                  }}
                  type="date"
                  value={secondIncomeDate}
                />
              </label>
            ) : null}

            <label>
              <span>Обычная сумма выплаты</span>
              <div className="money-input">
                <input
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => {
                    setRegularIncomeAmount(event.target.value);
                  }}
                  type="number"
                  value={regularIncomeAmount}
                />
                <span className="money-input__currency">{draftCurrency}</span>
              </div>
            </label>

            <div className="income-schedule-note">
              {nextIncomeDatePreview ? (
                <>
                  <span>Ближайшая выплата: {formatScheduledIncomeDate(nextIncomeDatePreview, today)}</span>
                  <span>
                    Следующая выплата:{' '}
                    {secondIncomeDatePreview ? formatScheduledIncomeDate(secondIncomeDatePreview, today) : 'дата не указана'}
                  </span>
                  <p>Доход добавится автоматически в дату выплаты.</p>
                </>
              ) : (
                <p>Настрой даты выплат.</p>
              )}
            </div>

            <section className="income-entry-card">
              <h3>Доходы</h3>
              <p className="muted">Доходы можно добавлять и изменять как другие операции.</p>
              <button className="secondary-button" onClick={onOpenAddIncome} type="button">
                {uiCopy.actions.addIncome}
              </button>
            </section>

            <div className={`savings-panel${workingBudget <= 0 ? ' savings-panel--disabled' : ''}`}>
              <div className="settings-plan-metrics settings-plan-metrics--top">
                <div className="monthly-spending-limit">
                  <span>Деньги в работе</span>
                  <strong>
                    <AnimatedMoney amount={workingBudget} currency={draftCurrency} />
                  </strong>
                </div>
              </div>

              <div className="savings-panel__head">
                <span className="savings-section-title">План отложить</span>
                <AnimatedMoney
                  amount={clampedSavingsGoal}
                  className="savings-goal-display"
                  currency={draftCurrency}
                  debounceMs={180}
                />
                <p className="savings-panel__helper">План не пополняет сейф автоматически.</p>
              </div>

              <button
                aria-label={uiCopy.actions.topUpReserve}
                className="secondary-button savings-panel__top-up"
                onClick={onOpenReserveTopUp}
                type="button"
              >
                {uiCopy.actions.topUpReserve}
              </button>

              <div className="savings-panel__control">
                <div className="savings-slider-wrap">
                  <input
                    aria-label="План отложить"
                    className="savings-slider"
                    disabled={workingBudget <= 0}
                    max={workingBudget}
                    min="0"
                    onChange={(event) => {
                      setSavingsGoal(snapSavingsGoal(Number(event.target.value), workingBudget));
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
                    <AnimatedMoney amount={monthlySpendingLimit} currency={draftCurrency} />
                  </strong>
                </div>
                <div className="monthly-spending-limit monthly-spending-limit--secondary">
                  <span>План на день</span>
                  <strong>{formatMoney(plannedDailyTarget, draftCurrency)} / день</strong>
                </div>
                <p className="settings-plan-note">На расходы и план на день рассчитываются автоматически.</p>
              </div>
            </div>
          </section>

          <section className="currency-settings" aria-labelledby="currency-settings-title">
            <div className="currency-settings__head">
              <h2 id="currency-settings-title">{uiCopy.currency.sectionTitle}</h2>
              <p>{uiCopy.currency.sectionDescription}</p>
            </div>
            <button
              aria-expanded={currencySelectorOpen}
              aria-haspopup="dialog"
              aria-label={`${uiCopy.currency.selectorLabel}: ${selectedCurrency.label}, ${selectedCurrency.code}`}
              className="currency-selector-trigger"
              onClick={handleOpenCurrencySelector}
              ref={currencyTriggerRef}
              type="button"
            >
              <span className="currency-option__symbol" aria-hidden="true">{selectedCurrency.symbol}</span>
              <span className="currency-selector-trigger__body">
                <small>{uiCopy.currency.selectorLabel}</small>
                <strong>{selectedCurrency.label}</strong>
              </span>
              <span className="currency-option__code">{selectedCurrency.code}</span>
            </button>
          </section>

          <button className="primary-button" type="submit">
            Сохранить настройки
          </button>
        </form>

        <section className="card">
          <h2>Данные</h2>
          <p className="muted">Все данные хранятся локально на этом устройстве.</p>
          <button className="secondary-button danger" onClick={handleOpenClearConfirmation} type="button">
            Очистить все данные
          </button>
        </section>
      </main>

      {savingsConfirmationModal}

      {currencySelectorOpen
        ? createPortal(
            <div
              className="currency-selector-backdrop"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  handleCloseCurrencySelector();
                }
              }}
              role="presentation"
            >
              <section
                aria-labelledby="currency-selector-title"
                aria-modal="true"
                className="currency-selector-modal"
                onKeyDown={handleCurrencyModalKeyDown}
                role="dialog"
              >
                <div className="currency-selector-modal__head">
                  <div>
                    <p className="subtitle">{uiCopy.currency.sectionTitle}</p>
                    <h2 id="currency-selector-title">{uiCopy.currency.selectTitle}</h2>
                  </div>
                  <button className="currency-selector-modal__close" onClick={handleCloseCurrencySelector} type="button">
                    Закрыть
                  </button>
                </div>
                <div className="currency-selector" role="listbox" aria-label={uiCopy.currency.selectorLabel}>
                  {CURRENCY_CODES.map((currencyCode, index) => {
                    const currency = getCurrencyConfig(currencyCode);
                    const isSelected = currency.code === draftCurrency;

                    return (
                      <button
                        aria-label={`${currency.label}, ${currency.code}${isSelected ? ', выбрано' : ''}`}
                        aria-selected={isSelected}
                        className={`currency-option${isSelected ? ' currency-option--selected' : ''}`}
                        key={currency.code}
                        onClick={() => handleRequestCurrencyChange(currency.code)}
                        onKeyDown={(event) => handleCurrencyOptionKeyDown(event, index)}
                        ref={(element) => {
                          currencyOptionRefs.current[index] = element;
                        }}
                        role="option"
                        type="button"
                      >
                        <span className="currency-option__symbol" aria-hidden="true">{currency.symbol}</span>
                        <span className="currency-option__label">
                          {currency.label}
                          {isSelected ? <small>Выбрано</small> : null}
                        </span>
                        <span className="currency-option__code">{currency.code}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}

      {pendingCurrency
        ? createPortal(
            <div className="modal-backdrop currency-confirmation-backdrop" role="presentation">
              <section
                className="confirm-modal confirm-modal--informational"
                role="dialog"
                aria-modal="true"
                aria-labelledby="currency-confirmation-title"
              >
                <div className="confirm-modal__head">
                  <p className="subtitle">{uiCopy.currency.sectionTitle}</p>
                  <h2 id="currency-confirmation-title">{uiCopy.currency.confirmTitle}</h2>
                </div>
                <p className="confirm-modal__warning">{uiCopy.currency.confirmBody}</p>
                <p className="currency-confirmation-change" aria-label={`${draftCurrency}, новая валюта ${pendingCurrency}`}>
                  <span>{draftCurrency}</span>
                  <span aria-hidden="true">→</span>
                  <strong>{pendingCurrency}</strong>
                </p>
                <div className="confirm-modal__actions">
                  <button autoFocus className="secondary-button" onClick={handleCancelCurrencyChange} type="button">
                    {uiCopy.actions.cancel}
                  </button>
                  <button className="primary-button" onClick={handleConfirmCurrencyChange} type="button">
                    {uiCopy.currency.confirmAction}
                  </button>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}

      {clearConfirmationOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal confirm-modal--danger" role="dialog" aria-modal="true" aria-labelledby="clear-data-title">
            <div className="confirm-modal__head">
              <p className="subtitle">Подтверждение</p>
              <h2 id="clear-data-title">Очистить все данные?</h2>
            </div>

            <p className="confirm-modal__warning">Удалятся расходы, доходы, цели, пополнения и настройки. Это действие нельзя отменить.</p>

            <label className="confirm-modal__field">
              <span>Чтобы подтвердить, введи: ОЧИСТИТЬ</span>
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
