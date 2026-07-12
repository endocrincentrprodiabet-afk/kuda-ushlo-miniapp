import { MoneyFlowDiagram } from '../components/MoneyFlowDiagram';
import {
  getMonthlyBudgetStats,
  getMonthlySpendingLimit,
  getReserveTotal,
  getWorkingBudget,
} from '../lib/calculations';
import { formatMoney } from '../lib/format';
import { getMoneyFlowMetrics } from '../lib/moneyFlow';
import type { Expense, IncomeEntry, ReserveClosure, Settings } from '../types';

type MoneyFlowScreenProps = {
  expenses: Expense[];
  incomeEntries: IncomeEntry[];
  reserveClosures: ReserveClosure[];
  settings: Settings;
  onBack: () => void;
};

export function MoneyFlowScreen({
  expenses,
  incomeEntries,
  reserveClosures,
  settings,
  onBack,
}: MoneyFlowScreenProps) {
  const workingBudget = getWorkingBudget(settings, incomeEntries);
  const monthlySpendingLimit = getMonthlySpendingLimit(settings, incomeEntries);
  const monthTotal = getMonthlyBudgetStats(expenses, monthlySpendingLimit).monthTotal;
  const metrics = getMoneyFlowMetrics({
    workingBudget,
    savingsGoal: settings.savingsGoal,
    monthSpent: monthTotal,
    reserveTotal: getReserveTotal(reserveClosures),
  });
  const resultLabel = metrics.isOverBudget ? 'Перерасход' : 'Остаток';
  const resultAmount = metrics.isOverBudget ? metrics.deficit : metrics.remainingSpending;

  return (
    <main className="money-flow-screen">
      <header className="money-flow-screen__header">
        <button aria-label="Вернуться на главную" className="money-flow-back" onClick={onBack} type="button">
          Назад
        </button>
        <div>
          <p className="money-flow-screen__kicker">Аналитика месяца</p>
          <h1>Поток месяца</h1>
          <p className="money-flow-screen__subtitle">
            Как текущие деньги распределяются между накоплениями и расходами
          </p>
        </div>
      </header>

      <section className="money-flow-card" aria-label="Схема потока месяца">
        <MoneyFlowDiagram currency={settings.currency} metrics={metrics} />
      </section>

      <section className="money-flow-metrics" aria-labelledby="money-flow-metrics-title">
        <h2 id="money-flow-metrics-title">Основные суммы</h2>
        <dl>
          <div>
            <dt>В работе</dt>
            <dd>{formatMoney(metrics.workingBudget, settings.currency)}</dd>
          </div>
          <div>
            <dt>Отложить</dt>
            <dd>{formatMoney(metrics.savingsGoal, settings.currency)}</dd>
          </div>
          <div>
            <dt>На расходы</dt>
            <dd>{formatMoney(metrics.spendingLimit, settings.currency)}</dd>
          </div>
          <div>
            <dt>Потрачено</dt>
            <dd>{formatMoney(metrics.monthSpent, settings.currency)}</dd>
          </div>
          <div className={metrics.isOverBudget ? 'money-flow-metric--deficit' : ''}>
            <dt>{resultLabel}</dt>
            <dd>{formatMoney(resultAmount, settings.currency)}</dd>
          </div>
          <div>
            <dt>Подтверждённый запас</dt>
            <dd>{formatMoney(metrics.reserveTotal, settings.currency)}</dd>
          </div>
        </dl>
      </section>

      <section className="money-flow-summary" aria-labelledby="money-flow-summary-title">
        <h2 id="money-flow-summary-title">Кратко</h2>
        {metrics.hasBudget ? (
          <div>
            <p>В работе {formatMoney(metrics.workingBudget, settings.currency)}.</p>
            <p>{formatMoney(metrics.savingsGoal, settings.currency)} запланировано отложить.</p>
            <p>{formatMoney(metrics.spendingLimit, settings.currency)} доступны на расходы.</p>
            <p>За месяц потрачено {formatMoney(metrics.monthSpent, settings.currency)}.</p>
            <p className={metrics.isOverBudget ? 'money-flow-summary__deficit' : ''}>
              {metrics.isOverBudget
                ? `Расходный коридор превышен на ${formatMoney(metrics.deficit, settings.currency)}.`
                : `Остаток расходного коридора — ${formatMoney(metrics.remainingSpending, settings.currency)}.`}
            </p>
          </div>
        ) : (
          <p>Добавь доход, чтобы увидеть движение денег.</p>
        )}
      </section>
    </main>
  );
}
