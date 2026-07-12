import { useEffect, useLayoutEffect, useRef, useState, type TouchEvent } from 'react';
import { BottomNav } from './components/BottomNav';
import { SplashScreen } from './components/SplashScreen';
import { AddExpenseScreen } from './screens/AddExpenseScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MoneyFlowScreen } from './screens/MoneyFlowScreen';
import { ReserveScreen } from './screens/ReserveScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DEFAULT_RESERVE_GOAL, DEFAULT_SETTINGS } from './lib/constants';
import { formatDate } from './lib/date';
import { formatMoney } from './lib/format';
import {
  clearAllData,
  loadIncomeEntries,
  loadExpenses,
  loadReserveClosures,
  loadReserveGoal,
  loadSettings,
  saveExpenses,
  saveIncomeEntries,
  saveReserveClosures,
  saveReserveGoal,
  saveSettings,
} from './lib/storage';
import { sendTelegramReport } from './lib/telegram';
import { applyAutoIncomeEntries } from './lib/incomeSchedule';
import type { Expense, HistoryFilter, IncomeEntry, ReserveClosure, ReserveGoal, Screen, Settings } from './types';

const screenOrder: Screen[] = ['home', 'add', 'history', 'reserve', 'settings'];
const swipeThreshold = 70;
type ActiveDetail = 'moneyFlow' | null;

function isSwipeBlocked(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return true;
  }

  return Boolean(
    target.closest(
      'input, textarea, button, select, [role="button"], .modal-backdrop, .confirm-modal, .week-details-overlay, .week-details-sheet, .reserve-core__canvas',
    ),
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashLeaving, setIsSplashLeaving] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [activeDetail, setActiveDetail] = useState<ActiveDetail>(null);
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(() => loadIncomeEntries());
  const [reserveGoal, setReserveGoal] = useState<ReserveGoal>(() => loadReserveGoal());
  const [reserveClosures, setReserveClosures] = useState<ReserveClosure[]>(() => loadReserveClosures());
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('today');
  const [reportStatus, setReportStatus] = useState('');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [incomeEntryToDelete, setIncomeEntryToDelete] = useState<IncomeEntry | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncomeEntry, setEditingIncomeEntry] = useState<IncomeEntry | null>(null);
  const [addScreenMode, setAddScreenMode] = useState<'expense' | 'income'>('expense');
  const [editReturnScreen, setEditReturnScreen] = useState<Screen>('history');
  const swipeStartRef = useRef<{ x: number; y: number; blocked: boolean } | null>(null);
  const homeScrollPositionRef = useRef(0);
  const restoreHomeScrollRef = useRef(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => {
      setIsSplashLeaving(true);
    }, 1520);
    const hideTimer = window.setTimeout(() => {
      setShowSplash(false);
    }, 1800);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveIncomeEntries(incomeEntries);
  }, [incomeEntries]);

  useEffect(() => {
    setIncomeEntries((current) => {
      const nextEntries = applyAutoIncomeEntries(settings, current);

      return nextEntries === current ? current : nextEntries;
    });
  }, [
    settings.incomeFrequency,
    settings.nextIncomeDate,
    settings.secondIncomeDate,
    settings.regularIncomeAmount,
    screen,
  ]);

  useEffect(() => {
    saveReserveGoal(reserveGoal);
  }, [reserveGoal]);

  useEffect(() => {
    saveReserveClosures(reserveClosures);
  }, [reserveClosures]);

  useLayoutEffect(() => {
    if (activeDetail) {
      window.scrollTo({ top: 0 });
    }
  }, [activeDetail]);

  useEffect(() => {
    if (activeDetail || !restoreHomeScrollRef.current) {
      return;
    }

    restoreHomeScrollRef.current = false;
    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: homeScrollPositionRef.current });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeDetail]);

  function handleAddExpense(expense: Expense) {
    setExpenses((current) => [expense, ...current]);
  }

  function handleAddIncomeEntry(entry: IncomeEntry) {
    setIncomeEntries((current) => [entry, ...current]);
  }

  function handleUpdateExpense(expense: Expense) {
    setExpenses((current) => current.map((item) => (item.id === expense.id ? expense : item)));
    setEditingExpense(null);
  }

  function handleUpdateIncomeEntry(entry: IncomeEntry) {
    setIncomeEntries((current) => current.map((item) => (item.id === entry.id ? entry : item)));
    setEditingIncomeEntry(null);
  }

  function handleRequestDeleteExpense(id: string) {
    setExpenseToDelete(expenses.find((expense) => expense.id === id) ?? null);
  }

  function handleRequestDeleteIncomeEntry(id: string) {
    setIncomeEntryToDelete(incomeEntries.find((entry) => entry.id === id) ?? null);
  }

  function handleConfirmDeleteExpense() {
    if (!expenseToDelete) {
      return;
    }

    const id = expenseToDelete.id;
    setExpenses((current) => current.filter((expense) => expense.id !== id));
    setExpenseToDelete(null);
  }

  function handleConfirmDeleteIncomeEntry() {
    if (!incomeEntryToDelete) {
      return;
    }

    const id = incomeEntryToDelete.id;
    setIncomeEntries((current) => current.filter((entry) => entry.id !== id));
    setIncomeEntryToDelete(null);
  }

  function handleEditExpense(expense: Expense) {
    setEditingExpense(expense);
    setEditingIncomeEntry(null);
    setEditReturnScreen('history');
    setScreen('add');
  }

  function handleEditIncomeEntry(entry: IncomeEntry) {
    setEditingIncomeEntry(entry);
    setEditingExpense(null);
    setAddScreenMode('income');
    setEditReturnScreen('history');
    setScreen('add');
  }

  function handleOpenAddIncome() {
    setEditingExpense(null);
    setEditingIncomeEntry(null);
    setAddScreenMode('income');
    setScreen('add');
  }

  function handleNavigate(nextScreen: Screen) {
    setActiveDetail(null);
    if (nextScreen !== 'add') {
      setEditingExpense(null);
      setEditingIncomeEntry(null);
    }

    if (nextScreen === 'add' && screen !== 'add' && !editingExpense && !editingIncomeEntry) {
      setAddScreenMode('expense');
    }

    setScreen(nextScreen);
  }

  function handleOpenMoneyFlow() {
    homeScrollPositionRef.current = window.scrollY;
    setActiveDetail('moneyFlow');
  }

  function handleCloseMoneyFlow() {
    restoreHomeScrollRef.current = true;
    setActiveDetail(null);
  }

  function handleClearData() {
    clearAllData();
    setExpenses([]);
    setSettings(DEFAULT_SETTINGS);
    setIncomeEntries([]);
    setReserveGoal(DEFAULT_RESERVE_GOAL);
    setReserveClosures([]);
    setReportStatus('');
  }

  function handleSendReport() {
    const result = sendTelegramReport(expenses, settings, incomeEntries);
    setReportStatus(result.statusMessage);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (activeDetail) {
      swipeStartRef.current = null;
      return;
    }

    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    swipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      blocked: isSwipeBlocked(event.target),
    };
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const swipeStart = swipeStartRef.current;
    swipeStartRef.current = null;

    if (!swipeStart || swipeStart.blocked) {
      return;
    }

    const touch = event.changedTouches[0];

    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = touch.clientY - swipeStart.y;

    if (Math.abs(deltaX) <= swipeThreshold || Math.abs(deltaX) <= Math.abs(deltaY) * 1.5) {
      return;
    }

    const currentIndex = screenOrder.indexOf(screen);
    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    const nextScreen = screenOrder[nextIndex];

    if (nextScreen) {
      handleNavigate(nextScreen);
    }
  }

  return (
    <>
      {showSplash ? <SplashScreen isLeaving={isSplashLeaving} /> : null}

      <div
        className={`app-shell${showSplash ? ' app-shell--loading' : ' app-shell--ready'}${activeDetail ? ' app-shell--detail' : ''}`}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
      >
        {!activeDetail && screen === 'home' ? (
          <HomeScreen
            expenses={expenses}
            settings={settings}
            incomeEntries={incomeEntries}
            onNavigate={handleNavigate}
            onOpenMoneyFlow={handleOpenMoneyFlow}
            onSendReport={handleSendReport}
            reportStatus={reportStatus}
          />
        ) : null}

        {!activeDetail && screen === 'add' ? (
          <AddExpenseScreen
            editExpense={editingExpense}
            editIncomeEntry={editingIncomeEntry}
            initialMode={addScreenMode}
            onAddExpense={handleAddExpense}
            onAddIncomeEntry={handleAddIncomeEntry}
            onUpdateExpense={handleUpdateExpense}
            onUpdateIncomeEntry={handleUpdateIncomeEntry}
            onNavigate={handleNavigate}
            returnScreen={editReturnScreen}
          />
        ) : null}

        {!activeDetail && screen === 'history' ? (
          <HistoryScreen
            expenses={expenses}
            incomeEntries={incomeEntries}
            settings={settings}
            filter={historyFilter}
            onFilterChange={setHistoryFilter}
            onDeleteExpense={handleRequestDeleteExpense}
            onEditExpense={handleEditExpense}
            onDeleteIncomeEntry={handleRequestDeleteIncomeEntry}
            onEditIncomeEntry={handleEditIncomeEntry}
          />
        ) : null}

        {!activeDetail && screen === 'settings' ? (
          <SettingsScreen
            settings={settings}
            incomeEntries={incomeEntries}
            onSaveSettings={setSettings}
            onOpenAddIncome={handleOpenAddIncome}
            onClearData={handleClearData}
          />
        ) : null}

        {!activeDetail && screen === 'reserve' ? (
          <ReserveScreen
            expenses={expenses}
            settings={settings}
            incomeEntries={incomeEntries}
            reserveGoal={reserveGoal}
            reserveClosures={reserveClosures}
            onSaveReserveGoal={setReserveGoal}
            onSaveReserveClosures={setReserveClosures}
          />
        ) : null}

        {activeDetail === 'moneyFlow' ? (
          <MoneyFlowScreen
            expenses={expenses}
            incomeEntries={incomeEntries}
            onBack={handleCloseMoneyFlow}
            reserveClosures={reserveClosures}
            settings={settings}
          />
        ) : null}

        {!activeDetail ? <BottomNav currentScreen={screen} onNavigate={handleNavigate} /> : null}
      </div>

      {expenseToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-expense-title">
            <div className="confirm-modal__head">
              <p className="subtitle">Подтверждение</p>
              <h2 id="delete-expense-title">Удалить расход?</h2>
            </div>
            <div className="confirm-modal__expense">
              <div>
                <span>Категория</span>
                <strong>{expenseToDelete.category}</strong>
              </div>
              <div>
                <span>Сумма</span>
                <strong>{formatMoney(expenseToDelete.amount, settings.currency)}</strong>
              </div>
              {expenseToDelete.note ? (
                <div>
                  <span>Комментарий</span>
                  <strong>{expenseToDelete.note}</strong>
                </div>
              ) : null}
              <div>
                <span>Дата</span>
                <strong>{formatDate(expenseToDelete.date)}</strong>
              </div>
            </div>
            <p className="confirm-modal__warning">Это действие нельзя отменить.</p>
            <div className="confirm-modal__actions">
              <button className="secondary-button" onClick={() => setExpenseToDelete(null)} type="button">
                Отмена
              </button>
              <button className="danger-button" onClick={handleConfirmDeleteExpense} type="button">
                Удалить
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {incomeEntryToDelete ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-income-title">
            <div className="confirm-modal__head">
              <p className="subtitle">Подтверждение</p>
              <h2 id="delete-income-title">Удалить начисление?</h2>
            </div>
            <div className="confirm-modal__expense">
              <div>
                <span>Сумма</span>
                <strong>+{formatMoney(incomeEntryToDelete.amount, settings.currency)}</strong>
              </div>
              {incomeEntryToDelete.note ? (
                <div>
                  <span>Комментарий</span>
                  <strong>{incomeEntryToDelete.note}</strong>
                </div>
              ) : null}
              <div>
                <span>Дата</span>
                <strong>{formatDate(incomeEntryToDelete.date)}</strong>
              </div>
            </div>
            <p className="confirm-modal__warning">Это действие нельзя отменить.</p>
            <div className="confirm-modal__actions">
              <button className="secondary-button" onClick={() => setIncomeEntryToDelete(null)} type="button">
                Отмена
              </button>
              <button className="danger-button" onClick={handleConfirmDeleteIncomeEntry} type="button">
                Удалить
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
