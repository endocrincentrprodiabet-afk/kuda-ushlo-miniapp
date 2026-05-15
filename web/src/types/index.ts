export type ExpenseCategory =
  | 'Еда'
  | 'Транспорт'
  | 'Дом'
  | 'Покупки'
  | 'Маркетплейсы'
  | 'Здоровье'
  | 'Развлечения'
  | 'Подписки'
  | 'Другое';

export type Expense = {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  date: string;
  createdAt: string;
};

export type Settings = {
  dailyLimit: number;
  monthlyBudget: number;
  savingsGoal: number;
  currency: 'RUB';
};

export type Screen = 'home' | 'add' | 'history' | 'settings';

export type HistoryFilter = 'today' | 'week' | 'all';
