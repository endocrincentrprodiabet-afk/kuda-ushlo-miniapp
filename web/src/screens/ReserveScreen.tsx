import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatedMoney } from '../components/AnimatedMoney';
import {
  getCurrentMonthKey,
  getGoalProgress,
  getMonthlySpendingLimit,
  getMonthExpenses,
  getReserveTotal,
  getSuggestedMonthlySavings,
  getWorkingBudget,
  sumExpenses,
} from '../lib/calculations';
import { formatMoney } from '../lib/format';
import type { Expense, IncomeEntry, ReserveClosure, ReserveGoal, Settings } from '../types';

type ReserveScreenProps = {
  expenses: Expense[];
  settings: Settings;
  incomeEntries: IncomeEntry[];
  reserveGoal: ReserveGoal;
  reserveClosures: ReserveClosure[];
  onSaveReserveGoal: (goal: ReserveGoal) => void;
  onSaveReserveClosures: (closures: ReserveClosure[]) => void;
};

function parseMoneyInput(value: string): number {
  return Math.max(0, Number(value.replace(',', '.')) || 0);
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatProgressPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function ReserveScreen({
  expenses,
  settings,
  incomeEntries,
  reserveGoal,
  reserveClosures,
  onSaveReserveGoal,
  onSaveReserveClosures,
}: ReserveScreenProps) {
  const [goalTitle, setGoalTitle] = useState(reserveGoal.title);
  const [targetAmount, setTargetAmount] = useState(String(reserveGoal.targetAmount || ''));
  const [goalSaved, setGoalSaved] = useState(false);
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [closureAmount, setClosureAmount] = useState('');
  const reserveTotal = getReserveTotal(reserveClosures);
  const currentMonthKey = getCurrentMonthKey();
  const currentMonthTotal = sumExpenses(getMonthExpenses(expenses));
  const workingBudget = getWorkingBudget(settings, incomeEntries);
  const spendingLimit = getMonthlySpendingLimit(settings, incomeEntries);
  const actualSuggested = getSuggestedMonthlySavings(workingBudget, currentMonthTotal);
  const plannedSavings = Math.min(settings.savingsGoal, workingBudget);
  const currentClosure = reserveClosures.find((closure) => closure.month === currentMonthKey) ?? null;
  const progress = getGoalProgress(reserveTotal, reserveGoal.targetAmount);
  const cappedProgress = Math.min(100, Math.max(0, progress));
  const reserveGoalLeft = Math.max(0, reserveGoal.targetAmount - reserveTotal);
  const reserveHeroCaption =
    reserveTotal > 0
      ? 'Уже отложено. Двигаешься к цели.'
      : 'Здесь появится сумма, которую ты реально отложил.';
  const sortedClosures = useMemo(
    () => [...reserveClosures].sort((a, b) => b.month.localeCompare(a.month)),
    [reserveClosures],
  );
  const displayedMonthlySavings = currentClosure?.actualSaved ?? actualSuggested;
  const planDiff = displayedMonthlySavings - plannedSavings;
  const planDiffAbs = Math.abs(planDiff);
  const planInsightText =
    planDiff > 0
      ? `Выше плана на ${formatMoney(planDiffAbs, settings.currency)}`
      : planDiff < 0
        ? `Ниже плана на ${formatMoney(planDiffAbs, settings.currency)}`
        : 'По плану';
  const planInsightTone = planDiff > 0 ? 'positive' : planDiff < 0 ? 'negative' : 'neutral';
  const planInsightClassName = `reserve-fix-insight reserve-fix-insight--${planInsightTone}`;
  const canCloseMonth = workingBudget > 0;

  useEffect(() => {
    setGoalTitle(reserveGoal.title);
    setTargetAmount(String(reserveGoal.targetAmount || ''));
  }, [reserveGoal.title, reserveGoal.targetAmount]);

  useEffect(() => {
    if (!closureModalOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [closureModalOpen]);

  function handleSaveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSaveReserveGoal({
      title: goalTitle.trim() || 'Неприкосновенный запас',
      targetAmount: parseMoneyInput(targetAmount),
    });
    setGoalSaved(true);
  }

  function handleOpenClosureModal() {
    setClosureAmount(String(currentClosure?.actualSaved ?? actualSuggested));
    setClosureModalOpen(true);
  }

  function handleConfirmClosure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const actualSaved = parseMoneyInput(closureAmount);
    const confirmedAt = new Date().toISOString();
    const nextClosure: ReserveClosure = {
      id: currentClosure?.id ?? `reserve-${currentMonthKey}`,
      month: currentMonthKey,
      plannedSavings,
      actualSaved,
      monthlyBudget: workingBudget,
      monthTotal: currentMonthTotal,
      spendingLimit,
      confirmedAt,
    };

    const hasCurrentClosure = reserveClosures.some((closure) => closure.month === currentMonthKey);
    const nextClosures = hasCurrentClosure
      ? reserveClosures.map((closure) => (closure.month === currentMonthKey ? nextClosure : closure))
      : [nextClosure, ...reserveClosures];

    onSaveReserveClosures(nextClosures);
    setClosureModalOpen(false);
  }

  const closureModal = closureModalOpen
    ? createPortal(
        <div className="reserve-modal-backdrop" role="presentation">
          <form
            className="confirm-modal reserve-modal"
            onSubmit={handleConfirmClosure}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reserve-closure-title"
          >
            <div className="confirm-modal__head">
              <p className="subtitle">Запас месяца</p>
              <h2 id="reserve-closure-title">Зафиксировать запас?</h2>
            </div>

            <p className="reserve-modal__text">
              По расчёту ты можешь отложить: {formatMoney(actualSuggested, settings.currency)}
            </p>

            <label className="confirm-modal__field reserve-modal__field">
              <span>Сумма</span>
              <input
                autoFocus
                inputMode="decimal"
                min="0"
                onChange={(event) => setClosureAmount(event.target.value)}
                type="number"
                value={closureAmount}
              />
            </label>

            <div className="confirm-modal__actions">
              <button className="secondary-button" onClick={() => setClosureModalOpen(false)} type="button">
                Отмена
              </button>
              <button className="primary-button" type="submit">
                Зафиксировать
              </button>
            </div>
          </form>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <main className="screen reserve-screen">
        <header className="top-header">
          <div>
            <p className="subtitle">Бюджет на цели</p>
            <h1>Запас</h1>
          </div>
        </header>

        <section className="reserve-hero">
          <div className="reserve-hero__glow" aria-hidden="true" />
          <AnimatedMoney
            amount={reserveTotal}
            className="reserve-hero-amount reserve-hero__amount"
            currency={settings.currency}
            debounceMs={180}
          />
          <p className="reserve-hero-caption">{reserveHeroCaption}</p>
          {reserveGoal.targetAmount > 0 ? (
            <p className="reserve-hero-progress-note">
              {reserveGoalLeft === 0 ? 'Цель достигнута' : `До цели осталось: ${formatMoney(reserveGoalLeft, settings.currency)}`}
            </p>
          ) : null}
        </section>

        <form className="card reserve-goal-card" onSubmit={handleSaveGoal}>
          <div className="section-title">
            <h2>Цель</h2>
            {reserveGoal.targetAmount > 0 ? <span>{formatProgressPercent(progress)}</span> : null}
          </div>

          <label>
            <span>На что копим?</span>
            <input
              onChange={(event) => {
                setGoalTitle(event.target.value);
                setGoalSaved(false);
              }}
              value={goalTitle}
            />
          </label>

          <label>
            <span>Сумма цели</span>
            <input
              inputMode="decimal"
              min="0"
              onChange={(event) => {
                setTargetAmount(event.target.value);
                setGoalSaved(false);
              }}
              type="number"
              value={targetAmount}
            />
          </label>

          {reserveGoal.targetAmount > 0 ? (
            <div className="reserve-progress">
              <div className="reserve-progress__head">
                <span>
                  {formatMoney(reserveTotal, settings.currency)} из {formatMoney(reserveGoal.targetAmount, settings.currency)}
                </span>
                <strong>{progress >= 100 ? 'Цель достигнута' : formatProgressPercent(progress)}</strong>
              </div>
              <div className="month-balance-track" aria-hidden="true">
                <span style={{ width: `${cappedProgress}%` }} />
              </div>
            </div>
          ) : (
            <p className="empty-state">Добавь цель, чтобы видеть прогресс запаса.</p>
          )}

          {goalSaved ? <p className="success-text">Цель сохранена</p> : null}

          <button className="primary-button" type="submit">
            Сохранить цель
          </button>
        </form>

        <section className="card reserve-close-card reserve-fix-card">
          <div className="section-title">
            <h2>Зафиксировать месяц</h2>
            <span>{getMonthLabel(currentMonthKey)}</span>
          </div>

          {canCloseMonth ? (
            <>
              {currentClosure ? (
                <div className="reserve-fix-summary">
                  <div className="reserve-fix-status-row">
                    <p className="reserve-fix-status">Месяц уже зафиксирован</p>
                    <button className="reserve-fix-edit-button" onClick={handleOpenClosureModal} type="button">
                      Изменить
                    </button>
                  </div>
                  <div className="reserve-fix-metrics">
                    <div className="reserve-fix-row">
                      <span>Отложено</span>
                      <strong className="reserve-fix-value">{formatMoney(currentClosure.actualSaved, settings.currency)}</strong>
                    </div>
                    <div className="reserve-fix-row">
                      <span>План</span>
                      <strong className="reserve-fix-value">{formatMoney(plannedSavings, settings.currency)}</strong>
                    </div>
                  </div>
                  <div className="reserve-fix-divider" aria-hidden="true" />
                  <p className={planInsightClassName}>{planInsightText}</p>
                </div>
              ) : (
                <>
                  <div className="reserve-fix-summary">
                    <div className="reserve-fix-metrics">
                      <div className="reserve-fix-row">
                        <span>Отложено</span>
                        <AnimatedMoney
                          amount={actualSuggested}
                          className="reserve-fix-value"
                          currency={settings.currency}
                          debounceMs={180}
                        />
                      </div>
                      <div className="reserve-fix-row">
                        <span>План</span>
                        <strong className="reserve-fix-value">{formatMoney(plannedSavings, settings.currency)}</strong>
                      </div>
                    </div>
                    <div className="reserve-fix-divider" aria-hidden="true" />
                    <p className={planInsightClassName}>{planInsightText}</p>
                  </div>
                  <button className="primary-button" onClick={handleOpenClosureModal} type="button">
                    Зафиксировать месяц
                  </button>
                </>
              )}
            </>
          ) : (
            <p className="empty-state">Настрой месячный бюджет, чтобы фиксировать запас.</p>
          )}
        </section>

        <section className="card reserve-history-card">
          <div className="section-title">
            <h2>История запаса</h2>
            <span>{sortedClosures.length ? `${sortedClosures.length}` : ''}</span>
          </div>

          {sortedClosures.length ? (
            <div className="reserve-history-list">
              {sortedClosures.map((closure) => (
                <article className="reserve-history-item" key={closure.id}>
                  <div>
                    <h3>{getMonthLabel(closure.month)}</h3>
                    <span>План: {formatMoney(closure.plannedSavings, settings.currency)}</span>
                  </div>
                  <strong>{formatMoney(closure.actualSaved, settings.currency)}</strong>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">Пополнений пока нет</p>
          )}
        </section>
      </main>

      {closureModal}
    </>
  );
}
