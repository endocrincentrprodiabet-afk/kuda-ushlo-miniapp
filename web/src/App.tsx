import { useEffect, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { SplashScreen } from './components/SplashScreen';
import { AddExpenseScreen } from './screens/AddExpenseScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DEFAULT_SETTINGS } from './lib/constants';
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

  function handleDeleteExpense(id: string) {
    setExpenses((current) => current.filter((expense) => expense.id !== id));
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
            onNavigate={setScreen}
            onSendReport={handleSendReport}
            reportStatus={reportStatus}
          />
        ) : null}

        {screen === 'add' ? <AddExpenseScreen onAddExpense={handleAddExpense} onNavigate={setScreen} /> : null}

        {screen === 'history' ? (
          <HistoryScreen
            expenses={expenses}
            settings={settings}
            filter={historyFilter}
            onFilterChange={setHistoryFilter}
            onDeleteExpense={handleDeleteExpense}
          />
        ) : null}

        {screen === 'settings' ? (
          <SettingsScreen settings={settings} onSaveSettings={setSettings} onClearData={handleClearData} />
        ) : null}

        <BottomNav currentScreen={screen} onNavigate={setScreen} />
      </div>
    </>
  );
}
