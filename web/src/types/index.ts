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
  incomeFrequency: 'monthly' | 'biweekly';
  availableNow: number;
  nextIncomeDate: string;
  regularIncomeAmount: number;
  currency: 'RUB';
};

export type IncomeEntry = {
  id: string;
  amount: number;
  date: string;
  note: string;
  type: 'salary' | 'extra';
  createdAt: string;
};

export type ReserveGoal = {
  title: string;
  targetAmount: number;
};

export type ReserveClosure = {
  id: string;
  month: string;
  plannedSavings: number;
  actualSaved: number;
  monthlyBudget: number;
  monthTotal: number;
  spendingLimit: number;
  confirmedAt: string;
};

export type Screen = 'home' | 'add' | 'history' | 'reserve' | 'settings';

export type HistoryFilter = 'today' | 'week' | 'all';
