import { useEffect, useLayoutEffect, useRef, useState, type TouchEvent } from 'react';
import { BottomNav } from './components/BottomNav';
import { ReserveTopUpDeleteModal } from './components/ReserveTopUpDeleteModal';
import { ReserveTopUpModal, type ReserveTopUpValues } from './components/ReserveTopUpModal';
import { SplashScreen } from './components/SplashScreen';
import { getDeleteOperationCopy, uiCopy } from './content/uiCopy';
import { AddExpenseScreen } from './screens/AddExpenseScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MoneyFlowScreen } from './screens/MoneyFlowScreen';
import { ReserveScreen } from './screens/ReserveScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DEFAULT_SETTINGS } from './lib/constants';
import {
  getAllocatedReserveTotal,
  getReserveTotal,
  reconcileReserveGoalAllocations,
} from './lib/calculations';
import { formatDate } from './lib/date';
import { formatMoney, formatSignedMoney } from './lib/format';
import {
  clearAllData,
  loadIncomeEntries,
  loadExpenses,
  loadReserveClosures,
  loadReserveGoals,
  loadReserveTopUps,
  loadSettings,
  saveExpenses,
  saveIncomeEntries,
  saveReserveClosures,
  saveReserveGoals,
  saveReserveTopUps,
  saveSettings,
} from './lib/storage';
import { sendTelegramReport } from './lib/telegram';
import { applyAutoIncomeEntries } from './lib/incomeSchedule';
import type {
  Expense,
  HistoryFilter,
  IncomeEntry,
  ReserveClosure,
  ReserveGoal,
  ReserveTopUp,
  Screen,
  Settings,
} from './types';

const screenOrder: Screen[] = ['home', 'add', 'history', 'reserve', 'settings'];
const swipeThreshold = 70;
type ActiveDetail = 'moneyFlow' | null;

function createReserveTopUpId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `reserve-top-up-${crypto.randomUUID()}`;
  }

  return `reserve-top-up-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

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
  const [reserveClosures, setReserveClosures] = useState<ReserveClosure[]>(() => loadReserveClosures());
  const [reserveTopUps, setReserveTopUps] = useState<ReserveTopUp[]>(() => loadReserveTopUps());
  const [reserveGoals, setReserveGoals] = useState<ReserveGoal[]>(() =>
    loadReserveGoals(getReserveTotal(reserveClosures, reserveTopUps)),
  );
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('today');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [incomeEntryToDelete, setIncomeEntryToDelete] = useState<IncomeEntry | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncomeEntry, setEditingIncomeEntry] = useState<IncomeEntry | null>(null);
  const [addScreenMode, setAddScreenMode] = useState<'expense' | 'income'>('expense');
  const [editReturnScreen, setEditReturnScreen] = useState<Screen>('history');
  const [reserveTopUpEditor, setReserveTopUpEditor] = useState<ReserveTopUp | null | undefined>(undefined);
  const [reserveTopUpToDelete, setReserveTopUpToDelete] = useState<ReserveTopUp | null>(null);
  const [appMessage, setAppMessage] = useState('');
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
    saveReserveGoals(reserveGoals);
  }, [reserveGoals]);

  useEffect(() => {
    saveReserveClosures(reserveClosures);
  }, [reserveClosures]);

  useEffect(() => {
    saveReserveTopUps(reserveTopUps);
  }, [reserveTopUps]);

  useEffect(() => {
    if (!appMessage) {
      return;
    }

    const timer = window.setTimeout(() => setAppMessage(''), 2400);

    return () => window.clearTimeout(timer);
  }, [appMessage]);

  const reserveTotal = getReserveTotal(reserveClosures, reserveTopUps);

  useEffect(() => {
    setReserveGoals((current) => reconcileReserveGoalAllocations(current, reserveTotal));
  }, [reserveTotal]);

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
    setAppMessage(uiCopy.toasts.expenseAdded);
  }

  function handleAddIncomeEntry(entry: IncomeEntry) {
    setIncomeEntries((current) => [entry, ...current]);
    setAppMessage(uiCopy.toasts.incomeAdded);
  }

  function handleUpdateExpense(expense: Expense) {
    setExpenses((current) => current.map((item) => (item.id === expense.id ? expense : item)));
    setEditingExpense(null);
    setAppMessage(uiCopy.toasts.changesSaved);
  }

  function handleUpdateIncomeEntry(entry: IncomeEntry) {
    setIncomeEntries((current) => current.map((item) => (item.id === entry.id ? entry : item)));
    setEditingIncomeEntry(null);
    setAppMessage(uiCopy.toasts.changesSaved);
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
    setAppMessage(uiCopy.toasts.expenseDeleted);
  }

  function handleConfirmDeleteIncomeEntry() {
    if (!incomeEntryToDelete) {
      return;
    }

    const id = incomeEntryToDelete.id;
    setIncomeEntries((current) => current.filter((entry) => entry.id !== id));
    setIncomeEntryToDelete(null);
    setAppMessage(uiCopy.toasts.incomeDeleted);
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

  function handleOpenReserveTopUp(topUp: ReserveTopUp | null = null) {
    setReserveTopUpEditor(topUp);
  }

  function handleSaveReserveTopUp(values: ReserveTopUpValues) {
    const now = new Date().toISOString();
    const nextTopUp: ReserveTopUp = reserveTopUpEditor
      ? {
          ...reserveTopUpEditor,
          ...values,
          updatedAt: now,
        }
      : {
          id: createReserveTopUpId(),
          ...values,
          createdAt: now,
          updatedAt: now,
        };
    const nextTopUps = reserveTopUpEditor
      ? reserveTopUps.map((topUp) => (topUp.id === reserveTopUpEditor.id ? nextTopUp : topUp))
      : [nextTopUp, ...reserveTopUps];
    const nextReserveTotal = getReserveTotal(reserveClosures, nextTopUps);

    setReserveTopUps(nextTopUps);
    setReserveGoals((current) => reconcileReserveGoalAllocations(current, nextReserveTotal));
    setReserveTopUpEditor(undefined);
    setAppMessage(reserveTopUpEditor ? uiCopy.toasts.topUpChanged : uiCopy.toasts.reserveToppedUp);
  }

  function handleConfirmDeleteReserveTopUp() {
    if (!reserveTopUpToDelete) {
      return;
    }

    const nextTopUps = reserveTopUps.filter((topUp) => topUp.id !== reserveTopUpToDelete.id);
    const nextReserveTotal = getReserveTotal(reserveClosures, nextTopUps);

    setReserveTopUps(nextTopUps);
    setReserveGoals((current) => reconcileReserveGoalAllocations(current, nextReserveTotal));
    setReserveTopUpToDelete(null);
    setAppMessage(uiCopy.toasts.topUpDeleted);
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
    setReserveGoals([]);
    setReserveClosures([]);
    setReserveTopUps([]);
    setReserveTopUpEditor(undefined);
    setReserveTopUpToDelete(null);
    setAppMessage(uiCopy.toasts.dataCleared);
  }

  function handleSendReport() {
    sendTelegramReport(expenses, settings, incomeEntries);
    setAppMessage(uiCopy.toasts.reportCreated);
  }

  function handleSaveSettings(nextSettings: Settings) {
    setSettings(nextSettings);
    setAppMessage(uiCopy.toasts.settingsSaved);
  }

  function handleChangeCurrency(currency: Settings['currency']) {
    setSettings((current) => ({ ...current, currency }));
    setAppMessage(uiCopy.toasts.currencyChanged);
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
          />
        ) : null}

        {!activeDetail && screen === 'add' ? (
          <AddExpenseScreen
            currency={settings.currency}
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
            onChangeCurrency={handleChangeCurrency}
            onSaveSettings={handleSaveSettings}
            onOpenAddIncome={handleOpenAddIncome}
            onOpenReserveTopUp={() => handleOpenReserveTopUp()}
            onClearData={handleClearData}
          />
        ) : null}

        {!activeDetail && screen === 'reserve' ? (
          <ReserveScreen
            expenses={expenses}
            settings={settings}
            incomeEntries={incomeEntries}
            reserveGoals={reserveGoals}
            reserveClosures={reserveClosures}
            reserveTopUps={reserveTopUps}
            onSaveReserveGoals={setReserveGoals}
            onSaveReserveClosures={setReserveClosures}
            onOpenReserveTopUp={handleOpenReserveTopUp}
            onDeleteReserveTopUp={setReserveTopUpToDelete}
            onNotify={setAppMessage}
          />
        ) : null}

        {activeDetail === 'moneyFlow' ? (
          <MoneyFlowScreen
            expenses={expenses}
            incomeEntries={incomeEntries}
            onBack={handleCloseMoneyFlow}
            reserveClosures={reserveClosures}
            reserveTopUps={reserveTopUps}
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
              <h2 id="delete-expense-title">{getDeleteOperationCopy('expense').title}</h2>
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
            <p className="confirm-modal__warning">{getDeleteOperationCopy('expense').body}</p>
            <div className="confirm-modal__actions">
              <button className="secondary-button" onClick={() => setExpenseToDelete(null)} type="button">
                Отмена
              </button>
              <button className="danger-button" onClick={handleConfirmDeleteExpense} type="button">
                {getDeleteOperationCopy('expense').action}
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
              <h2 id="delete-income-title">{getDeleteOperationCopy('income').title}</h2>
            </div>
            <div className="confirm-modal__expense">
              <div>
                <span>Сумма</span>
                <strong>{formatSignedMoney(incomeEntryToDelete.amount, settings.currency)}</strong>
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
            <p className="confirm-modal__warning">{getDeleteOperationCopy('income').body}</p>
            <div className="confirm-modal__actions">
              <button className="secondary-button" onClick={() => setIncomeEntryToDelete(null)} type="button">
                Отмена
              </button>
              <button className="danger-button" onClick={handleConfirmDeleteIncomeEntry} type="button">
                {getDeleteOperationCopy('income').action}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {reserveTopUpEditor !== undefined ? (
        <ReserveTopUpModal
          currency={settings.currency}
          currentTopUp={reserveTopUpEditor}
          onClose={() => setReserveTopUpEditor(undefined)}
          onSave={handleSaveReserveTopUp}
        />
      ) : null}

      {reserveTopUpToDelete ? (
        <ReserveTopUpDeleteModal
          currency={settings.currency}
          onCancel={() => setReserveTopUpToDelete(null)}
          onConfirm={handleConfirmDeleteReserveTopUp}
          topUp={reserveTopUpToDelete}
          willAdjustAllocations={
            getAllocatedReserveTotal(reserveGoals) >
            getReserveTotal(
              reserveClosures,
              reserveTopUps.filter((topUp) => topUp.id !== reserveTopUpToDelete.id),
            )
          }
        />
      ) : null}

      {appMessage ? (
        <div className="app-toast" role="status" aria-live="polite">
          {appMessage}
        </div>
      ) : null}
    </>
  );
}
