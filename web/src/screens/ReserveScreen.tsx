import { lazy, Suspense, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatedMoney } from '../components/AnimatedMoney';
import { ReserveCoreErrorBoundary } from '../components/reserve3d/ReserveCoreErrorBoundary';
import { ReserveConstellationFallback } from '../components/reserve3d/ReserveConstellationFallback';
import { ReserveGoalDeleteModal } from '../components/reserve3d/ReserveGoalDeleteModal';
import { ReserveGoalModal } from '../components/reserve3d/ReserveGoalModal';
import {
  getAllocatedReserveTotal,
  getCurrentMonthKey,
  getGoalProgress,
  getMonthlySpendingLimit,
  getMonthExpenses,
  getReserveClosuresTotal,
  getReserveHistoryItems,
  getReserveTotal,
  getReserveTopUpsForMonth,
  getReserveTopUpsTotal,
  getSuggestedMonthlySavings,
  getUnallocatedReserve,
  getWorkingBudget,
  reconcileReserveGoalAllocations,
  sumExpenses,
} from '../lib/calculations';
import { MAX_RESERVE_GOALS } from '../lib/constants';
import { formatMoney } from '../lib/format';
import type { ReserveConstellationData } from '../lib/reserveVisual';
import type { Expense, IncomeEntry, ReserveClosure, ReserveGoal, ReserveTopUp, Settings } from '../types';

const ReserveConstellation3D = lazy(() => import('../components/reserve3d/ReserveConstellation3D'));

type ReserveScreenProps = {
  expenses: Expense[];
  settings: Settings;
  incomeEntries: IncomeEntry[];
  reserveGoals: ReserveGoal[];
  reserveClosures: ReserveClosure[];
  reserveTopUps: ReserveTopUp[];
  onSaveReserveGoals: (goals: ReserveGoal[]) => void;
  onSaveReserveClosures: (closures: ReserveClosure[]) => void;
  onOpenReserveTopUp: (topUp: ReserveTopUp | null) => void;
  onDeleteReserveTopUp: (topUp: ReserveTopUp) => void;
};

function parseMoneyInput(value: string): number {
  const parsedValue = Number(value.replace(',', '.'));
  return Number.isFinite(parsedValue) ? Math.max(0, Math.round(parsedValue)) : 0;
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getHistoryDateLabel(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatProgressPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function createReserveGoalId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `reserve-goal-${crypto.randomUUID()}`;
  }

  return `reserve-goal-${Date.now()}`;
}

export function ReserveScreen({
  expenses,
  settings,
  incomeEntries,
  reserveGoals,
  reserveClosures,
  reserveTopUps,
  onSaveReserveGoals,
  onSaveReserveClosures,
  onOpenReserveTopUp,
  onDeleteReserveTopUp,
}: ReserveScreenProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(() => reserveGoals[0]?.id ?? null);
  const [goalEditor, setGoalEditor] = useState<ReserveGoal | null | undefined>(undefined);
  const [goalToDelete, setGoalToDelete] = useState<ReserveGoal | null>(null);
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [closureAmount, setClosureAmount] = useState('');
  const reserveTotal = getReserveTotal(reserveClosures, reserveTopUps);
  const allocatedTotal = getAllocatedReserveTotal(reserveGoals);
  const unallocatedReserve = getUnallocatedReserve(reserveTotal, reserveGoals);
  const selectedGoal = reserveGoals.find((goal) => goal.id === selectedGoalId) ?? null;
  const currentMonthKey = getCurrentMonthKey();
  const currentMonthTotal = sumExpenses(getMonthExpenses(expenses));
  const workingBudget = getWorkingBudget(settings, incomeEntries);
  const spendingLimit = getMonthlySpendingLimit(settings, incomeEntries);
  const grossSuggestedSavings = getSuggestedMonthlySavings(workingBudget, currentMonthTotal);
  const plannedSavings = Math.min(settings.savingsGoal, workingBudget);
  const currentClosure = reserveClosures.find((closure) => closure.month === currentMonthKey) ?? null;
  const currentMonthTopUps = getReserveTopUpsForMonth(reserveTopUps, currentMonthKey);
  const currentMonthTopUpsTotal = getReserveTopUpsTotal(currentMonthTopUps);
  const suggestedClosureAmount = Math.max(grossSuggestedSavings - currentMonthTopUpsTotal, 0);
  const actualSavedForMonth =
    getReserveClosuresTotal(currentClosure ? [currentClosure] : []) + currentMonthTopUpsTotal;
  const reserveHistoryItems = getReserveHistoryItems(reserveClosures, reserveTopUps);
  const planDiff = actualSavedForMonth - plannedSavings;
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
  const atGoalLimit = reserveGoals.length >= MAX_RESERVE_GOALS;

  useEffect(() => {
    setSelectedGoalId((current) => {
      if (current && reserveGoals.some((goal) => goal.id === current)) {
        return current;
      }

      return reserveGoals[0]?.id ?? null;
    });
  }, [reserveGoals]);

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

  function handleOpenAddGoal() {
    if (!atGoalLimit) {
      setGoalEditor(null);
    }
  }

  function handleOpenEditGoal() {
    if (selectedGoal) {
      setGoalEditor(selectedGoal);
    }
  }

  function handleSaveGoal(values: { title: string; targetAmount: number; allocatedAmount: number }) {
    const now = new Date().toISOString();

    if (goalEditor) {
      const nextGoals = reserveGoals.map((goal) =>
        goal.id === goalEditor.id
          ? {
              ...goal,
              ...values,
              allocatedAmount: Math.min(values.allocatedAmount, values.targetAmount),
              updatedAt: now,
            }
          : goal,
      );
      onSaveReserveGoals(reconcileReserveGoalAllocations(nextGoals, reserveTotal));
      setSelectedGoalId(goalEditor.id);
      setGoalEditor(undefined);
      return;
    }

    if (atGoalLimit) {
      return;
    }

    const nextGoal: ReserveGoal = {
      id: createReserveGoalId(),
      ...values,
      allocatedAmount: Math.min(values.allocatedAmount, values.targetAmount, unallocatedReserve),
      createdAt: now,
      updatedAt: now,
    };
    onSaveReserveGoals(reconcileReserveGoalAllocations([...reserveGoals, nextGoal], reserveTotal));
    setSelectedGoalId(nextGoal.id);
    setGoalEditor(undefined);
  }

  function handleConfirmDeleteGoal() {
    if (!goalToDelete) {
      return;
    }

    const deletedIndex = reserveGoals.findIndex((goal) => goal.id === goalToDelete.id);
    const nextGoals = reserveGoals.filter((goal) => goal.id !== goalToDelete.id);
    const nextSelectedGoal = nextGoals[deletedIndex] ?? nextGoals[Math.max(0, deletedIndex - 1)] ?? null;
    onSaveReserveGoals(nextGoals);
    setSelectedGoalId(nextSelectedGoal?.id ?? null);
    setGoalToDelete(null);
  }

  function handleOpenClosureModal() {
    setClosureAmount(String(currentClosure?.actualSaved ?? suggestedClosureAmount));
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

  const constellationProps: ReserveConstellationData = {
    allocatedTotal,
    currency: settings.currency,
    goals: reserveGoals,
    onAddGoal: handleOpenAddGoal,
    onDeleteSelectedGoal: () => selectedGoal && setGoalToDelete(selectedGoal),
    onEditSelectedGoal: handleOpenEditGoal,
    onSelectGoal: setSelectedGoalId,
    reserveTotal,
    selectedGoalId,
    unallocatedReserve,
  };

  const constellationFallback = <ReserveConstellationFallback {...constellationProps} />;
  const closureModal = closureModalOpen
    ? createPortal(
        <div className="reserve-modal-backdrop" onMouseDown={() => setClosureModalOpen(false)} role="presentation">
          <form
            className="confirm-modal reserve-modal"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={handleConfirmClosure}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reserve-closure-title"
          >
            <div className="confirm-modal__head">
              <p className="subtitle">Запас месяца</p>
              <h2 id="reserve-closure-title">Зафиксировать итог месяца?</h2>
            </div>
            <p className="reserve-modal__text">
              Для фиксации осталось: {formatMoney(suggestedClosureAmount, settings.currency)}
            </p>
            {currentMonthTopUpsTotal > 0 ? (
              <p className="reserve-modal__text">
                Пополнения за месяц уже учтены: {formatMoney(currentMonthTopUpsTotal, settings.currency)}
              </p>
            ) : null}
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
            <p className="subtitle">Накопления и цели</p>
            <h1>Сейф</h1>
          </div>
        </header>

        <ReserveCoreErrorBoundary fallback={constellationFallback}>
          <Suspense fallback={constellationFallback}>
            <ReserveConstellation3D {...constellationProps} />
          </Suspense>
        </ReserveCoreErrorBoundary>

        <section className="card reserve-summary-card" aria-label="Сводка накоплений">
          <div>
            <span>Всего накоплено</span>
            <AnimatedMoney amount={reserveTotal} currency={settings.currency} />
          </div>
          <div>
            <span>По целям</span>
            <AnimatedMoney amount={allocatedTotal} currency={settings.currency} />
          </div>
          <div>
            <span>Свободно</span>
            <AnimatedMoney amount={unallocatedReserve} currency={settings.currency} />
          </div>
          <button
            className="secondary-button reserve-summary-card__top-up"
            aria-label="Пополнить сейф"
            onClick={() => onOpenReserveTopUp(null)}
            type="button"
          >
            Пополнить сейф
          </button>
        </section>

        <section className={`card reserve-goals-card${reserveGoals.length ? '' : ' reserve-goals-card--empty'}`}>
          <div className="reserve-goals-card__header">
            <div className="section-title">
              <h2>Цели</h2>
              <span>{reserveGoals.length} / {MAX_RESERVE_GOALS}</span>
            </div>
            {reserveGoals.length ? (
              <button className="secondary-button reserve-goals-card__add" disabled={atGoalLimit} onClick={handleOpenAddGoal} type="button">
                Добавить цель
              </button>
            ) : null}
          </div>

          {atGoalLimit ? <p className="reserve-goals-card__limit">Можно создать до 6 целей.</p> : null}
          {unallocatedReserve > 0 ? (
            <p className="reserve-goals-card__free">
              Свободно для распределения: {formatMoney(unallocatedReserve, settings.currency)}
            </p>
          ) : null}

          {reserveGoals.length ? (
            <div className="reserve-goals-list">
              {reserveGoals.map((goal) => {
                const progress = getGoalProgress(goal);
                const remainingAmount = Math.max(0, goal.targetAmount - goal.allocatedAmount);
                const progressStyle = { '--goal-progress': `${progress * 100}%` } as CSSProperties;

                return (
                  <button
                    className={`reserve-goal-item${goal.id === selectedGoalId ? ' is-selected' : ''}`}
                    key={goal.id}
                    onClick={() => setSelectedGoalId(goal.id)}
                    style={progressStyle}
                    type="button"
                  >
                    <span className="reserve-goal-item__title">{goal.title}</span>
                    <span className="reserve-goal-item__amounts">
                      {formatMoney(goal.allocatedAmount, settings.currency)} из {formatMoney(goal.targetAmount, settings.currency)}
                    </span>
                    <strong>{formatProgressPercent(progress)}</strong>
                    <span className="reserve-goal-item__track" aria-hidden="true"><span /></span>
                    <span className="reserve-goal-item__remaining">
                      Осталось: {formatMoney(remainingAmount, settings.currency)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="reserve-goals-empty">
              <p className="reserve-goals-empty__kicker">Первая цель</p>
              <h3>Создай цель</h3>
              <p className="reserve-goals-empty__description">
                Задай сумму — в сейфе появится новая сфера.
              </p>
              <button
                aria-label="Добавить первую цель"
                className="primary-button reserve-goals-empty__action"
                onClick={handleOpenAddGoal}
                type="button"
              >
                Добавить цель
              </button>
            </div>
          )}

          {selectedGoal ? (
            <article className="reserve-selected-goal">
              <div className="reserve-selected-goal__head">
                <div>
                  <span>Выбранная цель</span>
                  <h3>{selectedGoal.title}</h3>
                </div>
                <strong>{formatProgressPercent(getGoalProgress(selectedGoal))}</strong>
              </div>
              <dl>
                <div>
                  <dt>Распределено</dt>
                  <dd>{formatMoney(selectedGoal.allocatedAmount, settings.currency)}</dd>
                </div>
                <div>
                  <dt>Сумма цели</dt>
                  <dd>{formatMoney(selectedGoal.targetAmount, settings.currency)}</dd>
                </div>
                <div>
                  <dt>Осталось</dt>
                  <dd>{formatMoney(Math.max(0, selectedGoal.targetAmount - selectedGoal.allocatedAmount), settings.currency)}</dd>
                </div>
              </dl>
              <div className="reserve-selected-goal__actions">
                <button className="primary-button" onClick={handleOpenEditGoal} type="button">Распределить</button>
                <button className="secondary-button" onClick={handleOpenEditGoal} type="button">Изменить</button>
                <button className="delete-button" onClick={() => setGoalToDelete(selectedGoal)} type="button">Удалить</button>
              </div>
            </article>
          ) : reserveGoals.length ? (
            <div className="reserve-goals-select-state" role="status">
              <h3>Выбери цель</h3>
              <p>Нажми на карточку или сферу, чтобы посмотреть детали.</p>
            </div>
          ) : null}
        </section>

        <section className="card reserve-close-card reserve-fix-card">
          <div className="section-title">
            <h2>Зафиксировать месяц</h2>
            <span>{getMonthLabel(currentMonthKey)}</span>
          </div>

          {canCloseMonth ? (
            currentClosure ? (
              <div className="reserve-fix-summary">
                <div className="reserve-fix-status-row">
                  <p className="reserve-fix-status">Месяц уже зафиксирован</p>
                  <button className="reserve-fix-edit-button" onClick={handleOpenClosureModal} type="button">Изменить</button>
                </div>
                <div className="reserve-fix-metrics">
                  <div className="reserve-fix-row">
                    <span>Отложено за месяц</span>
                    <strong className="reserve-fix-value">{formatMoney(actualSavedForMonth, settings.currency)}</strong>
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
                      <span>Отложено за месяц</span>
                      <AnimatedMoney amount={actualSavedForMonth} className="reserve-fix-value" currency={settings.currency} debounceMs={180} />
                    </div>
                    <div className="reserve-fix-row">
                      <span>План</span>
                      <strong className="reserve-fix-value">{formatMoney(plannedSavings, settings.currency)}</strong>
                    </div>
                  </div>
                  <div className="reserve-fix-divider" aria-hidden="true" />
                  <p className={planInsightClassName}>{planInsightText}</p>
                </div>
                <button className="primary-button" onClick={handleOpenClosureModal} type="button">Зафиксировать месяц</button>
              </>
            )
          ) : (
            <p className="empty-state">Настрой месячный бюджет, чтобы фиксировать накопления.</p>
          )}
        </section>

        <section className="card reserve-history-card">
          <div className="section-title">
            <h2>История пополнений</h2>
            <span>{reserveHistoryItems.length ? `${reserveHistoryItems.length}` : ''}</span>
          </div>
          {reserveHistoryItems.length ? (
            <div className="reserve-history-list">
              {reserveHistoryItems.map((item) =>
                item.type === 'topUp' ? (
                  <article className="reserve-history-item reserve-history-item--top-up" key={`top-up-${item.id}`}>
                    <div>
                      <span className="reserve-history-item__type">Пополнение</span>
                      <h3>{getHistoryDateLabel(item.topUp.date)}</h3>
                      {item.topUp.note ? <span>{item.topUp.note}</span> : null}
                      <div className="reserve-history-item__actions">
                        <button className="expense-action-button" onClick={() => onOpenReserveTopUp(item.topUp)} type="button">
                          Изменить
                        </button>
                        <button className="delete-button" onClick={() => onDeleteReserveTopUp(item.topUp)} type="button">
                          Удалить
                        </button>
                      </div>
                    </div>
                    <strong>+{formatMoney(item.amount, settings.currency)}</strong>
                  </article>
                ) : (
                  <article className="reserve-history-item reserve-history-item--closure" key={`closure-${item.id}`}>
                    <div>
                      <span className="reserve-history-item__type">Фиксация месяца</span>
                      <h3>{getMonthLabel(item.closure.month)}</h3>
                      <span>План: {formatMoney(item.closure.plannedSavings, settings.currency)}</span>
                    </div>
                    <strong>+{formatMoney(item.amount, settings.currency)}</strong>
                  </article>
                ),
              )}
            </div>
          ) : (
            <p className="empty-state">Пополнений и фиксаций пока нет</p>
          )}
        </section>
      </main>

      {goalEditor !== undefined ? (
        <ReserveGoalModal
          currency={settings.currency}
          currentGoal={goalEditor}
          goalCount={reserveGoals.length}
          onClose={() => setGoalEditor(undefined)}
          onSave={handleSaveGoal}
          unallocatedReserve={unallocatedReserve}
        />
      ) : null}
      {goalToDelete ? (
        <ReserveGoalDeleteModal
          currency={settings.currency}
          goal={goalToDelete}
          onCancel={() => setGoalToDelete(null)}
          onConfirm={handleConfirmDeleteGoal}
        />
      ) : null}
      {closureModal}
    </>
  );
}
