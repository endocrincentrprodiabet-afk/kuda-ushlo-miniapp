import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getMonthForecastCopy, getWeekInsightCopy } from '../content/uiCopy';
import type { MonthWeeklyBudgetStat } from '../lib/calculations';
import { formatMoney } from '../lib/format';
import type { Settings } from '../types';

type WeekDetailsSheetProps = {
  week: MonthWeeklyBudgetStat;
  monthlySpendingLimit: number;
  monthTotal: number;
  settings: Settings;
  onClose: () => void;
};

function getDateFromInput(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function formatWeekRange(startDateValue: string, endDateValue: string): string {
  const startDate = getDateFromInput(startDateValue);
  const endDate = getDateFromInput(endDateValue);
  const dayFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric' });
  const dayMonthFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${dayFormatter.format(startDate)}–${dayMonthFormatter.format(endDate)}`;
  }

  return `${dayMonthFormatter.format(startDate)} – ${dayMonthFormatter.format(endDate)}`;
}

function getMonthForecast(monthTotal: number, monthlySpendingLimit: number, date = new Date()) {
  const daysPassedInMonth = date.getDate();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const averageDailySpend = daysPassedInMonth > 0 ? monthTotal / daysPassedInMonth : 0;
  const projectedMonthTotal = averageDailySpend * daysInMonth;

  return {
    projectedMonthTotal,
    isOverPlan: monthlySpendingLimit > 0 && projectedMonthTotal > monthlySpendingLimit,
    overPlanAmount: Math.max(0, projectedMonthTotal - monthlySpendingLimit),
  };
}

export function WeekDetailsSheet({
  week,
  monthlySpendingLimit,
  monthTotal,
  settings,
  onClose,
}: WeekDetailsSheetProps) {
  const forecast = getMonthForecast(monthTotal, monthlySpendingLimit);
  const weekBalance = week.target > 0 ? Math.abs(week.target - week.total) : 0;
  const insight = getWeekInsightCopy({
    total: week.total,
    target: week.target,
    difference: formatMoney(Math.max(0, week.total - week.target), settings.currency),
    topCategory: week.categoryTotals[0]?.category,
  });

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div className="week-details-overlay" onClick={onClose} role="presentation">
      <section
        className="week-details-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="week-details-title"
      >
        <div className="week-details-header">
          <div>
            <p className="subtitle">{formatWeekRange(week.startDate, week.endDate)}</p>
            <h2 id="week-details-title">Неделя {week.index}</h2>
          </div>
          <button className="text-button" onClick={onClose} type="button">
            Закрыть
          </button>
        </div>

        <div className="week-details-scroll">
        <div className="weekly-summary">
          <div>
            <strong>{formatMoney(week.total, settings.currency)}</strong>
            <span>Потрачено за неделю</span>
          </div>
          {week.target > 0 ? (
            <>
              <p>Ориентир недели: {formatMoney(week.target, settings.currency)}</p>
              <p className={week.isOverTarget ? 'weekly-summary__over' : 'weekly-summary__safe'}>
                {week.isOverTarget ? 'Выше ориентира' : 'Осталось в ориентире'}: {formatMoney(weekBalance, settings.currency)}
              </p>
            </>
          ) : (
            <p>Ориентир недели не задан</p>
          )}
        </div>

        <div className="week-details-block">
          <h3>Категории недели</h3>
          {week.categoryTotals.length && week.total > 0 ? (
            <div className="week-category-bars">
              {week.categoryTotals.map((item) => (
                <div className="week-category-bar" key={item.category}>
                  <div>
                    <span>{item.category}</span>
                    <span>{formatMoney(item.total, settings.currency)}</span>
                  </div>
                  <div className="week-category-bar__track">
                    <span style={{ width: `${Math.min(100, (item.total / week.total) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">На этой неделе расходов пока нет.</p>
          )}
        </div>

        <div className="forecast-block">
          <h3>Прогноз месяца</h3>
          {monthlySpendingLimit > 0 ? (
            <>
              <p>
                Прогноз: {formatMoney(forecast.projectedMonthTotal, settings.currency)} из{' '}
                {formatMoney(monthlySpendingLimit, settings.currency)}
              </p>
              <span>
                {getMonthForecastCopy({
                  isOverPlan: forecast.isOverPlan,
                  overPlanAmount: formatMoney(forecast.overPlanAmount, settings.currency),
                })}
              </span>
            </>
          ) : (
            <span>Прогноз появится после настройки месячного плана.</span>
          )}
        </div>

        <div className="insight-block">
          <h3>Подсказка недели</h3>
          <p>{insight}</p>
        </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
