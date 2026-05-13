import { useEffect, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { AddExpenseScreen } from './screens/AddExpenseScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DEFAULT_SETTINGS } from './lib/constants';
import { clearAllData, loadExpenses, loadSettings, saveExpenses, saveSettings } from './lib/storage';
import { sendTelegramReport } from './lib/telegram';
import type { Expense, HistoryFilter, Screen, Settings } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('today');
  const [reportText, setReportText] = useState('');

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
    setReportText('');
  }

  function handleSendReport() {
    setReportText(sendTelegramReport(expenses, settings));
  }

  return (
    <div className="app-shell">
      {screen === 'home' ? (
        <HomeScreen
          expenses={expenses}
          settings={settings}
          onNavigate={setScreen}
          onSendReport={handleSendReport}
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
  );
}
