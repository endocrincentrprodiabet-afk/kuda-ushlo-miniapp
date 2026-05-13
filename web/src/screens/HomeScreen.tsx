import { ExpenseList } from '../components/ExpenseList';
import { getCategoryTotals, getLargestCategory, getTodayExpenses, getWeekExpenses, sortByCreatedAt, sumExpenses } from '../lib/calculations';
import { formatMoney } from '../lib/format';
import type { Expense, Screen, Settings } from '../types';

type HomeScreenProps = {
  expenses: Expense[];
  settings: Settings;
  onNavigate: (screen: Screen) => void;
  onSendReport: () => void;
  reportStatus: string;
};

export function HomeScreen({ expenses, settings, onNavigate, onSendReport, reportStatus }: HomeScreenProps) {
  const todayTotal = sumExpenses(getTodayExpenses(expenses));
  const weekExpenses = getWeekExpenses(expenses);
  const weekTotal = sumExpenses(weekExpenses);
  const largestCategory = getLargestCategory(weekExpenses);
  const categoryTotals = getCategoryTotals(weekExpenses);
  const recentExpenses = sortByCreatedAt(expenses).slice(0, 4);
  const limitDiff = settings.dailyLimit - todayTotal;
  const hasDailyLimit = settings.dailyLimit > 0;
  const dailyBalanceTitle = limitDiff >= 0 ? 'Запас дня' : 'Перерасход';
  const dailyBalanceCaption = limitDiff >= 0 ? 'Ты в пределах лимита' : 'Лимит превышен';

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
        <p>
          {hasDailyLimit
            ? limitDiff >= 0
              ? `Осталось ${formatMoney(limitDiff, settings.currency)} из дневного лимита`
              : `Лимит превышен на ${formatMoney(Math.abs(limitDiff), settings.currency)}`
            : 'Дневной лимит можно задать в настройках'}
        </p>
      </section>

      {hasDailyLimit ? (
        <section className={`balance-card ${limitDiff >= 0 ? 'balance-card--safe' : 'balance-card--over'}`}>
          <div>
            <span>{dailyBalanceTitle}</span>
            <strong>{formatMoney(Math.abs(limitDiff), settings.currency)}</strong>
          </div>
          <p>{dailyBalanceCaption}</p>
        </section>
      ) : null}

      <div className="grid-two">
        <section className="card">
          <span className="muted">Дневной лимит</span>
          <strong>{formatMoney(settings.dailyLimit, settings.currency)}</strong>
        </section>
        <section className="card">
          <span className="muted">За неделю</span>
          <strong>{formatMoney(weekTotal, settings.currency)}</strong>
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
    </main>
  );
}
