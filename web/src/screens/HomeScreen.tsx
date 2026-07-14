import { useEffect, useState } from 'react';
import { WeekDetailsSheet } from '../components/WeekDetailsSheet';
import { getIncomeEntryLabel, getIncomeEntryNote, uiCopy } from '../content/uiCopy';
import {
  getBudgetUsagePercent,
  getCategoryTotals,
  getCurrentDailyTarget,
  getCurrentWeekExpenses,
  getLargestCategory,
  getMonthlyBudgetStats,
  getMonthlySpendingLimit,
  getMonthWeeklyBudgetStats,
  getTodayExpenses,
  getWeekExpenses,
  getWorkingBudget,
  sumExpenses,
} from '../lib/calculations';
import { formatDate, formatScheduledIncomeDate } from '../lib/date';
import { formatCompactMoney, formatMoney, formatSignedMoney } from '../lib/format';
import { getNextScheduledIncomeDate } from '../lib/incomeSchedule';
import type { Expense, IncomeEntry, Screen, Settings } from '../types';

type HomeScreenProps = {
  expenses: Expense[];
  settings: Settings;
  incomeEntries: IncomeEntry[];
  onNavigate: (screen: Screen) => void;
  onOpenMoneyFlow: () => void;
  onSendReport: () => void;
};

function getLocalDayStart(): Date {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function useCurrentCalendarDate(): Date {
  const [today, setToday] = useState(getLocalDayStart);

  useEffect(() => {
    const now = new Date();
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = window.setTimeout(() => setToday(getLocalDayStart()), nextDay.getTime() - now.getTime() + 100);

    return () => window.clearTimeout(timer);
  }, [today]);

  return today;
}

function formatProgressPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

function getProgressWidthPercent(percent: number): number {
  return Math.min(100, Math.max(0, percent));
}

type RecentOperation =
  | {
      id: string;
      kind: 'expense';
      title: string;
      note: string;
      amount: number;
      date: string;
      createdAt: string;
    }
  | {
      id: string;
      kind: 'income';
      title: string;
      note: string;
      amount: number;
      date: string;
      createdAt: string;
    };

function sortOperationsByDate(operations: RecentOperation[]): RecentOperation[] {
  return [...operations].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function HomeScreen({
  expenses,
  settings,
  incomeEntries,
  onNavigate,
  onOpenMoneyFlow,
  onSendReport,
}: HomeScreenProps) {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);
  const today = useCurrentCalendarDate();
  const todayTotal = sumExpenses(getTodayExpenses(expenses));
  const weekExpenses = getWeekExpenses(expenses);
  const weekTotal = sumExpenses(weekExpenses);
  const currentWeekTotal = sumExpenses(getCurrentWeekExpenses(expenses));
  const workingBudget = getWorkingBudget(settings, incomeEntries);
  const monthlySpendingLimit = getMonthlySpendingLimit(settings, incomeEntries);
  const currentDailyTarget = getCurrentDailyTarget(expenses, settings, incomeEntries);
  const monthlyStats = getMonthlyBudgetStats(expenses, monthlySpendingLimit);
  const hasWorkingBudget = workingBudget > 0;
  const hasMonthlySpendingLimit = monthlySpendingLimit > 0;
  const isMonthOverBudget = hasWorkingBudget && monthlyStats.monthTotal > monthlySpendingLimit;
  const budgetPercent = getBudgetUsagePercent(monthlyStats.monthTotal, monthlySpendingLimit);
  const monthWeeklyStats = getMonthWeeklyBudgetStats(expenses, monthlySpendingLimit);
  const selectedWeek = monthWeeklyStats.find((week) => week.index === selectedWeekIndex) ?? null;
  const normalizedSavingsGoal = Math.min(settings.savingsGoal, workingBudget);
  const nextScheduledIncomeDate = getNextScheduledIncomeDate(settings, incomeEntries, today);
  const nextScheduledIncomeCaption = nextScheduledIncomeDate
    ? `Ближайшая выплата: ${formatScheduledIncomeDate(nextScheduledIncomeDate, today)}`
    : 'Настрой даты выплат';
  const monthlyDynamicsCaption = hasWorkingBudget
    ? isMonthOverBudget
      ? `На расходы превышено на ${formatMoney(monthlyStats.overBudget, settings.currency)}`
      : hasMonthlySpendingLimit
        ? `${formatMoney(monthlyStats.monthTotal, settings.currency)} из ${formatMoney(monthlySpendingLimit, settings.currency)}`
        : `На расходы сейчас ${formatMoney(0, settings.currency)}`
    : 'Динамика появится после настройки расходного плана.';
  const largestCategory = getLargestCategory(weekExpenses);
  const categoryTotals = getCategoryTotals(weekExpenses);
  const recentOperations = sortOperationsByDate([
    ...expenses.map(
      (expense): RecentOperation => ({
        id: expense.id,
        kind: 'expense',
        title: expense.category,
        note: expense.note || 'Без комментария',
        amount: expense.amount,
        date: expense.date,
        createdAt: expense.createdAt,
      }),
    ),
    ...incomeEntries.map(
      (entry): RecentOperation => ({
        id: entry.id,
        kind: 'income',
        title: getIncomeEntryLabel(entry),
        note: getIncomeEntryNote(entry),
        amount: entry.amount,
        date: entry.date,
        createdAt: entry.createdAt,
      }),
    ),
  ]).slice(0, 4);
  const limitDiff = currentDailyTarget - todayTotal;
  const hasDailyTarget = currentDailyTarget > 0;
  const dailyBalanceTitle = limitDiff >= 0 ? 'Осталось на сегодня' : 'Перерасход сегодня';
  const dailyBalanceCaption = limitDiff >= 0 ? 'В пределах ориентира' : 'Ориентир превышен';
  const heroDailyStatus = hasDailyTarget
    ? limitDiff >= 0
      ? `Осталось на сегодня: ${formatMoney(limitDiff, settings.currency)}`
      : `Выше ориентира на ${formatMoney(Math.abs(limitDiff), settings.currency)}`
    : todayTotal > 0
      ? 'Ориентир на сегодня пока не рассчитан.'
      : 'Ориентир на сегодня появится после настройки дохода.';

  return (
    <main className="screen">
      <header className="top-header">
        <div>
          <p className="subtitle">Бюджет на каждый день</p>
          <h1>Куда ушло?</h1>
        </div>
      </header>

      <section className="hero-card">
        <span>Сегодня потрачено</span>
        <strong>{formatMoney(todayTotal, settings.currency)}</strong>
        <p>{heroDailyStatus}</p>
      </section>

      {hasDailyTarget || todayTotal > 0 ? (
        <section className={`balance-card ${limitDiff >= 0 ? 'balance-card--safe' : 'balance-card--over'}`}>
          <div>
            <span>{dailyBalanceTitle}</span>
            <strong>{formatMoney(Math.abs(limitDiff), settings.currency)}</strong>
          </div>
          <p>{dailyBalanceCaption}</p>
        </section>
      ) : null}

      {hasWorkingBudget ? (
        <section className={`month-budget-card ${isMonthOverBudget ? 'month-budget-card--over' : ''}`}>
          <div className="month-budget-head">
            <div>
              <span>Месяц</span>
              <h2>{isMonthOverBudget ? 'Перерасход месяца' : 'Осталось на месяц'}</h2>
            </div>
            <strong>
              {formatMoney(
                isMonthOverBudget ? monthlyStats.overBudget : Math.max(0, monthlyStats.balance),
                settings.currency,
              )}
            </strong>
          </div>
          <div className="month-budget-details">
            <p>
              {isMonthOverBudget
                ? `На расходы: ${formatMoney(monthlySpendingLimit, settings.currency)}`
                : nextScheduledIncomeCaption}
            </p>
            {normalizedSavingsGoal > 0 ? <p>План отложить: {formatMoney(normalizedSavingsGoal, settings.currency)}</p> : null}
          </div>
          {!isMonthOverBudget ? (
            <div className="month-budget-metric">
              <span>Темп до конца месяца</span>
              <strong>{formatMoney(monthlyStats.comfortDailyPace, settings.currency)} / день</strong>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="card">
          <div className="empty-state">
            <strong>{uiCopy.emptyStates.noIncome.title}</strong>
            <span>{uiCopy.emptyStates.noIncome.description}</span>
          </div>
        </section>
      )}

      <div className="grid-two summary-grid">
        <section className="card">
          <span className="muted">За неделю</span>
          <strong>{formatMoney(currentWeekTotal, settings.currency)}</strong>
        </section>
        <section className={`card summary-card--month ${isMonthOverBudget ? 'summary-card--month-over' : ''}`}>
          <span className="muted">За месяц</span>
          <strong>{formatMoney(monthlyStats.monthTotal, settings.currency)}</strong>
        </section>
        <section className={`card month-balance-card ${isMonthOverBudget ? 'month-balance-card--over' : ''}`}>
          <div className="month-balance-head">
            <span className="muted">Динамика месяца</span>
            <button
              aria-label="Открыть поток месяца"
              className="month-balance-flow-action"
              onClick={onOpenMoneyFlow}
              type="button"
            >
              Открыть поток
            </button>
          </div>
          <div className="month-dynamics-main">
            <div>
              <strong>{formatProgressPercent(budgetPercent)}</strong>
              <span>Использовано</span>
            </div>
            <p>{monthlyDynamicsCaption}</p>
          </div>
          <div className="month-balance-track" aria-hidden="true">
            <span style={{ width: `${getProgressWidthPercent(budgetPercent)}%` }} />
          </div>
          <div className="month-weekly-chart">
            <div className="month-weekly-chart__title">Расходы по неделям</div>
            <div className="month-weekly-bars">
              {monthWeeklyStats.map((week) => (
                <button
                  aria-label={`Открыть детали недели ${week.index}`}
                  className={`month-weekly-bar ${week.isOverTarget ? 'month-weekly-bar--over' : ''}`}
                  key={week.weekIndex}
                  onClick={() => setSelectedWeekIndex(week.index)}
                  type="button"
                >
                  <span className="month-weekly-bar__amount">
                    {formatCompactMoney(week.total, settings.currency, { showCurrency: false })}
                  </span>
                  <div className="month-weekly-bar__track">
                    <span style={{ height: week.total > 0 ? `${Math.max(8, week.cappedFillPercent)}%` : '2px' }} />
                  </div>
                  <span className="month-weekly-bar__label">{week.weekIndex}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="section-title">
          <h2>Категории недели</h2>
          <span>{largestCategory ? largestCategory.category : 'Нет данных'}</span>
        </div>
        {categoryTotals.length ? (
          <div className="category-bars">
            {categoryTotals.map((item) => (
              <div className="category-bar" key={item.category}>
                <div>
                  <span>{item.category}</span>
                  <span>{formatMoney(item.total, settings.currency)}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.max(8, (item.total / weekTotal) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>{uiCopy.emptyStates.noWeekExpenses.title}</strong>
            <span>{uiCopy.emptyStates.noWeekExpenses.description}</span>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Последние операции</h2>
          <button className="text-button" onClick={() => onNavigate('history')} type="button">
            Все операции
          </button>
        </div>
        {recentOperations.length ? (
          <div className="expense-list">
            {recentOperations.map((operation) => (
              <article className={`expense-item operation-item operation-item--${operation.kind}`} key={operation.id}>
                <div className="expense-content">
                  <div className="expense-head">
                    <strong className="expense-category">{operation.title}</strong>
                    <strong className={`expense-amount${operation.kind === 'income' ? ' expense-amount--income' : ''}`}>
                      {operation.kind === 'income'
                        ? formatSignedMoney(operation.amount, settings.currency)
                        : formatMoney(operation.amount, settings.currency)}
                    </strong>
                  </div>
                  <div className="expense-meta">
                    <span>{operation.note}</span>
                    <span>{formatDate(operation.date)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>{uiCopy.emptyStates.noRecentOperations.title}</strong>
            <span>{uiCopy.emptyStates.noRecentOperations.description}</span>
          </div>
        )}
      </section>

      <div className="actions">
        <button className="primary-button" onClick={() => onNavigate('add')} type="button">
          {uiCopy.actions.addExpense}
        </button>
        <button className="secondary-button" onClick={onSendReport} type="button">
          Отправить отчёт
        </button>
      </div>

      {selectedWeek ? (
        <WeekDetailsSheet
          week={selectedWeek}
          monthlySpendingLimit={monthlySpendingLimit}
          monthTotal={monthlyStats.monthTotal}
          settings={settings}
          onClose={() => setSelectedWeekIndex(null)}
        />
      ) : null}
    </main>
  );
}
