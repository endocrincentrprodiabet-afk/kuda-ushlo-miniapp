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

export type CurrencyCode =
  | 'RUB'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'TRY'
  | 'CNY'
  | 'JPY'
  | 'KZT'
  | 'AED'
  | 'GEL';

export type CurrencyConfig = {
  code: CurrencyCode;
  label: string;
  shortLabel: string;
  locale: string;
  symbol: string;
  fractionDigits: number;
};

export type Settings = {
  dailyLimit: number;
  monthlyBudget: number;
  savingsGoal: number;
  incomeFrequency: 'monthly' | 'biweekly';
  availableNow: number;
  nextIncomeDate: string;
  secondIncomeDate: string;
  regularIncomeAmount: number;
  currency: CurrencyCode;
};

export type IncomeEntry = {
  id: string;
  amount: number;
  date: string;
  note: string;
  type: 'salary' | 'extra' | 'manual';
  kind?: 'salary' | 'bonus' | 'side' | 'other';
  source?: 'auto' | 'manual';
  createdAt: string;
};

export type ReserveGoal = {
  id: string;
  title: string;
  targetAmount: number;
  allocatedAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type LegacyReserveGoal = {
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

export type ReserveTopUp = {
  id: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type Screen = 'home' | 'add' | 'history' | 'reserve' | 'settings';

export type HistoryFilter = 'today' | 'week' | 'all';
