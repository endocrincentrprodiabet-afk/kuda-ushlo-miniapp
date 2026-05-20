import { useState } from 'react';
import { ExpenseList } from '../components/ExpenseList';
import { WeekDetailsSheet } from '../components/WeekDetailsSheet';
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
  sortExpensesByDate,
  sumExpenses,
} from '../lib/calculations';
import { formatMoney } from '../lib/format';
import type { Expense, IncomeEntry, Screen, Settings } from '../types';

type HomeScreenProps = {
  expenses: Expense[];
  settings: Settings;
  incomeEntries: IncomeEntry[];
  onNavigate: (screen: Screen) => void;
  onSendReport: () => void;
  reportStatus: string;
};

function formatDaysLeft(days: number): string {
  const lastTwoDigits = days % 100;
  const lastDigit = days % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${days} дней`;
  }

  if (lastDigit === 1) {
    return `${days} день`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${days} дня`;
  }

  return `${days} дней`;
}

function formatProgressPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

function getProgressWidthPercent(percent: number): number {
  return Math.min(100, Math.max(0, percent));
}

function formatCompactMoney(amount: number): string {
  if (amount <= 0) {
    return '0';
  }

  if (amount >= 1000) {
    return `${Math.round(amount / 1000)}к`;
  }

  return Math.round(amount).toString();
}

export function HomeScreen({ expenses, settings, incomeEntries, onNavigate, onSendReport, reportStatus }: HomeScreenProps) {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);
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
  const monthlyDynamicsCaption = hasWorkingBudget
    ? isMonthOverBudget
      ? `На расходы превышено на ${formatMoney(monthlyStats.overBudget, settings.currency)}`
      : hasMonthlySpendingLimit
        ? `${formatMoney(monthlyStats.monthTotal, settings.currency)} из ${formatMoney(monthlySpendingLimit, settings.currency)}`
        : 'На расходы сейчас 0 ₽'
    : 'Настрой доходы, чтобы увидеть план месяца.';
  const largestCategory = getLargestCategory(weekExpenses);
  const categoryTotals = getCategoryTotals(weekExpenses);
  const recentExpenses = sortExpensesByDate(expenses).slice(0, 4);
  const limitDiff = currentDailyTarget - todayTotal;
  const hasDailyTarget = currentDailyTarget > 0;
  const dailyBalanceTitle = limitDiff >= 0 ? 'Запас дня' : 'Перерасход';
  const dailyBalanceCaption = limitDiff >= 0 ? 'Ты в пределах ориентира' : 'Ориентир превышен';
  const heroDailyStatus = hasDailyTarget
    ? limitDiff >= 0
      ? `Осталось на сегодня: ${formatMoney(limitDiff, settings.currency)}`
      : `Перерасход дня: ${formatMoney(Math.abs(limitDiff), settings.currency)}`
    : todayTotal > 0
      ? 'Расходы есть, но доходы пока не настроены'
      : 'Настрой доходы, чтобы увидеть план месяца.';

  return (
    <main className="screen">
      <header className="top-header">
        <div>
          <p className="subtitle">Мини-бюджет на каждый день</p>
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
              <h2>{isMonthOverBudget ? 'Перерасход месяца' : 'Запас месяца'}</h2>
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
                : `До конца месяца: ${formatDaysLeft(monthlyStats.daysLeft)}`}
            </p>
            {normalizedSavingsGoal > 0 ? <p>Отложить: {formatMoney(normalizedSavingsGoal, settings.currency)}</p> : null}
          </div>
          {!isMonthOverBudget ? (
            <div className="month-budget-metric">
              <span>Комфортный темп</span>
              <strong>{formatMoney(monthlyStats.comfortDailyPace, settings.currency)} / день</strong>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="card">
          <p className="empty-state">Настрой доходы, чтобы увидеть план месяца.</p>
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
          </div>
          <div className="month-dynamics-main">
            <div>
              <strong>{formatProgressPercent(budgetPercent)}</strong>
              <span>использовано</span>
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
                  <span className="month-weekly-bar__amount">{formatCompactMoney(week.total)}</span>
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
          <p className="empty-state">За неделю расходов пока нет</p>
        )}
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Последние расходы</h2>
          <button className="text-button" onClick={() => onNavigate('history')} type="button">
            Все
          </button>
        </div>
        <ExpenseList expenses={recentExpenses} currency={settings.currency} emptyText="Расходов пока нет" />
      </section>

      <div className="actions">
        <button className="primary-button" onClick={() => onNavigate('add')} type="button">
          Добавить расход
        </button>
        <button className="secondary-button" onClick={onSendReport} type="button">
          Отправить отчёт
        </button>
        {reportStatus ? <p className="status-message">{reportStatus}</p> : null}
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
