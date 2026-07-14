import { MoneyFlowDiagram } from '../components/MoneyFlowDiagram';
import { getMoneyFlowSummaryCopy } from '../content/uiCopy';
import {
  getMonthlyBudgetStats,
  getMonthlySpendingLimit,
  getReserveTotal,
  getWorkingBudget,
} from '../lib/calculations';
import { formatMoney } from '../lib/format';
import { getMoneyFlowMetrics } from '../lib/moneyFlow';
import type { Expense, IncomeEntry, ReserveClosure, ReserveTopUp, Settings } from '../types';

type MoneyFlowScreenProps = {
  expenses: Expense[];
  incomeEntries: IncomeEntry[];
  reserveClosures: ReserveClosure[];
  reserveTopUps: ReserveTopUp[];
  settings: Settings;
  onBack: () => void;
};

export function MoneyFlowScreen({
  expenses,
  incomeEntries,
  reserveClosures,
  reserveTopUps,
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
    reserveTotal: getReserveTotal(reserveClosures, reserveTopUps),
  });
  const summary = getMoneyFlowSummaryCopy({
    spendingLimit: formatMoney(metrics.spendingLimit, settings.currency),
    usedPercent: metrics.spendingLimit > 0 ? (metrics.monthSpent / metrics.spendingLimit) * 100 : 0,
    isOverBudget: metrics.isOverBudget,
    deficit: formatMoney(metrics.deficit, settings.currency),
  });

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
            Как деньги распределяются между накоплениями и расходами
          </p>
        </div>
      </header>

      <section className="money-flow-card" aria-label="Схема потока месяца">
        <MoneyFlowDiagram currency={settings.currency} metrics={metrics} />
      </section>

      {metrics.hasBudget ? (
        <section className="money-flow-summary" aria-labelledby="money-flow-summary-title">
          <h2 id="money-flow-summary-title">Кратко</h2>
          <div>
            {summary.map((line, index) => (
              <p className={index > 0 ? 'money-flow-summary__deficit' : ''} key={line}>{line}</p>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
