import { useEffect, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { SplashScreen } from './components/SplashScreen';
import { AddExpenseScreen } from './screens/AddExpenseScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DEFAULT_SETTINGS } from './lib/constants';
import { formatDate } from './lib/date';
import { formatMoney } from './lib/format';
import { clearAllData, loadExpenses, loadSettings, saveExpenses, saveSettings } from './lib/storage';
import { sendTelegramReport } from './lib/telegram';
import type { Expense, HistoryFilter, Screen, Settings } from './types';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashLeaving, setIsSplashLeaving] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('today');
  const [reportStatus, setReportStatus] = useState('');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editReturnScreen, setEditReturnScreen] = useState<Screen>('history');

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

  function handleAddExpense(expense: Expense) {
    setExpenses((current) => [expense, ...current]);
  }

  function handleUpdateExpense(expense: Expense) {
    setExpenses((current) => current.map((item) => (item.id === expense.id ? expense : item)));
    setEditingExpense(null);
  }

  function handleRequestDeleteExpense(id: string) {
    setExpenseToDelete(expenses.find((expense) => expense.id === id) ?? null);
  }

  function handleConfirmDeleteExpense() {
    if (!expenseToDelete) {
      return;
    }

    const id = expenseToDelete.id;
    setExpenses((current) => current.filter((expense) => expense.id !== id));
    setExpenseToDelete(null);
  }

  function handleEditExpense(expense: Expense) {
    setEditingExpense(expense);
    setEditReturnScreen('history');
    setScreen('add');
  }

  function handleNavigate(nextScreen: Screen) {
    if (nextScreen !== 'add') {
      setEditingExpense(null);
    }

    setScreen(nextScreen);
  }

  function handleClearData() {
    clearAllData();
    setExpenses([]);
    setSettings(DEFAULT_SETTINGS);
    setReportStatus('');
  }

  function handleSendReport() {
    const result = sendTelegramReport(expenses, settings);
    setReportStatus(result.statusMessage);
  }

  return (
    <>
      {showSplash ? <SplashScreen isLeaving={isSplashLeaving} /> : null}

      <div className={`app-shell${showSplash ? ' app-shell--loading' : ' app-shell--ready'}`}>
        {screen === 'home' ? (
          <HomeScreen
            expenses={expenses}
            settings={settings}
            onNavigate={handleNavigate}
            onSendReport={handleSendReport}
            reportStatus={reportStatus}
          />
        ) : null}

        {screen === 'add' ? (
          <AddExpenseScreen
            editExpense={editingExpense}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onNavigate={handleNavigate}
            returnScreen={editReturnScreen}
          />
        ) : null}

        {screen === 'history' ? (
          <HistoryScreen
            expenses={expenses}
            settings={settings}
            filter={historyFilter}
            onFilterChange={setHistoryFilter}
            onDeleteExpense={handleRequestDeleteExpense}
            onEditExpense={handleEditExpense}
          />
        ) : null}

        {screen === 'settings' ? (
          <SettingsScreen settings={settings} onSaveSettings={setSettings} onClearData={handleClearData} />
        ) : null}

        <BottomNav currentScreen={screen} onNavigate={handleNavigate} />
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
    </>
  );
}
