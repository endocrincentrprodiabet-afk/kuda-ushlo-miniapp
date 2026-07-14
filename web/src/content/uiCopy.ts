import type { HistoryFilter, IncomeEntry } from '../types';

export type EmptyStateCopy = {
  title: string;
  description: string;
};

export type SavingsWarningCopy = {
  title: string;
  text: string;
};

export type DeleteOperationType = 'expense' | 'income' | 'goal' | 'topUp';

export type DeleteOperationContext = {
  amount?: string;
  willAdjustAllocations?: boolean;
};

export type DeleteOperationCopy = {
  title: string;
  body: string;
  action: string;
  additionalWarning?: string;
};

export type WeekInsightData = {
  total: number;
  target: number;
  difference: string;
  topCategory?: string;
};

export type MonthForecastData = {
  isOverPlan: boolean;
  overPlanAmount: string;
};

export type MoneyFlowSummaryData = {
  spendingLimit: string;
  usedPercent: number;
  isOverBudget: boolean;
  deficit: string;
};

export const uiCopy = {
  actions: {
    cancel: 'Отмена',
    edit: 'Изменить',
    addExpense: 'Добавить расход',
    addIncome: 'Добавить доход',
    topUpReserve: 'Пополнить сейф',
  },
  labels: {
    income: 'Доход',
    reserveTotal: 'Всего накоплено',
    allocatedTotal: 'По целям',
    unallocatedReserve: 'Свободно',
  },
  currency: {
    sectionTitle: 'Валюта',
    sectionDescription: 'Используется для отображения всех сумм в приложении.',
    selectorLabel: 'Основная валюта',
    selectTitle: 'Выбери валюту',
    confirmTitle: 'Изменить валюту?',
    confirmBody: 'Суммы останутся прежними — изменится только формат отображения.',
    confirmAction: 'Изменить валюту',
    changedToast: 'Валюта изменена',
  },
  toasts: {
    expenseAdded: 'Расход добавлен',
    incomeAdded: 'Доход добавлен',
    changesSaved: 'Изменения сохранены',
    expenseDeleted: 'Расход удалён',
    incomeDeleted: 'Доход удалён',
    goalSaved: 'Цель сохранена',
    goalDeleted: 'Цель удалена',
    reserveToppedUp: 'Сейф пополнен',
    topUpChanged: 'Пополнение изменено',
    topUpDeleted: 'Пополнение удалено',
    monthClosureSaved: 'Итог месяца сохранён',
    settingsSaved: 'Настройки сохранены',
    reportCreated: 'Отчёт сформирован',
    dataCleared: 'Данные очищены',
  },
  errors: {
    saveFailed: 'Не удалось сохранить изменения',
    invalidData: 'Проверь введённые данные',
    positiveAmount: 'Сумма должна быть больше нуля',
    invalidDate: 'Дата указана неверно',
  },
  emptyStates: {
    noIncome: {
      title: 'Доход пока не добавлен',
      description: 'Добавь доход, чтобы рассчитать расходный план.',
    },
    noRecentOperations: {
      title: 'Операций пока нет',
      description: 'Здесь появятся расходы и доходы.',
    },
    noWeekExpenses: {
      title: 'На этой неделе расходов пока нет',
      description: 'Добавь первую операцию, когда она появится.',
    },
    noReserveHistory: {
      title: 'Пополнений пока нет',
      description: 'Фактически отложенные деньги появятся здесь.',
    },
  },
} as const;

export const incomeKindLabels: Record<NonNullable<IncomeEntry['kind']>, string> = {
  salary: 'Зарплата',
  bonus: 'Премия',
  side: 'Подработка',
  other: 'Другое',
};

export function getIncomeEntryLabel(entry: IncomeEntry): string {
  if (entry.kind) {
    return incomeKindLabels[entry.kind];
  }

  return entry.type === 'salary' ? incomeKindLabels.salary : uiCopy.labels.income;
}

export function getIncomeEntryNote(entry: IncomeEntry): string {
  if (entry.note === 'Автоначисление') {
    return 'Доход по графику';
  }

  return entry.note || getIncomeEntryLabel(entry);
}

export function getSavingsWarningCopy(percent: number): SavingsWarningCopy {
  if (percent >= 95) {
    return {
      title: 'Это было не просто смело, это было…',
      text: 'На расходы почти ничего не останется. Если это не случайность, можешь сохранить такой план.',
    };
  }

  if (percent >= 75) {
    return {
      title: 'Ого, это смелое решение',
      text: 'Ты планируешь отложить большую часть бюджета. Проверь, комфортно ли будет жить с оставшейся суммой.',
    };
  }

  return {
    title: 'Проверь план',
    text: 'На расходы останется небольшая часть бюджета. Проверь, реалистичен ли такой план на месяц.',
  };
}

export function getDeleteOperationCopy(
  type: DeleteOperationType,
  context: DeleteOperationContext = {},
): DeleteOperationCopy {
  if (type === 'expense') {
    return {
      title: 'Удалить расход?',
      body: 'Он исчезнет из истории и расчётов. Это действие нельзя отменить.',
      action: 'Удалить расход',
    };
  }

  if (type === 'income') {
    return {
      title: 'Удалить доход?',
      body: 'Деньги в работе и связанные расчёты изменятся. Это действие нельзя отменить.',
      action: 'Удалить доход',
    };
  }

  if (type === 'goal') {
    return {
      title: 'Удалить цель?',
      body: `Распределённые на неё ${context.amount ?? '0'} вернутся в свободную сумму.`,
      action: 'Удалить цель',
    };
  }

  return {
    title: 'Удалить пополнение?',
    body: `Сумма в сейфе уменьшится на ${context.amount ?? '0'}.`,
    action: 'Удалить пополнение',
    additionalWarning: context.willAdjustAllocations
      ? 'Распределения по целям будут автоматически скорректированы.'
      : undefined,
  };
}

export function getHistoryEmptyCopy(filter: HistoryFilter): EmptyStateCopy {
  if (filter === 'today') {
    return {
      title: 'Сегодня операций пока нет',
      description: 'Добавь первую операцию, когда она появится.',
    };
  }

  if (filter === 'week') {
    return {
      title: 'На этой неделе операций пока нет',
      description: 'Добавь первую операцию, когда она появится.',
    };
  }

  return {
    title: 'История пока пустая',
    description: 'Здесь появятся расходы и доходы.',
  };
}

export function getWeekInsightCopy(data: WeekInsightData): string {
  if (data.total === 0) {
    return 'На этой неделе расходов пока нет.';
  }

  if (data.target <= 0) {
    return data.topCategory
      ? `Ориентир недели не задан. Больше всего ушло на: ${data.topCategory}.`
      : 'Ориентир недели не задан.';
  }

  if (data.total > data.target) {
    return data.topCategory
      ? `Неделя выше ориентира на ${data.difference}. Основная категория — ${data.topCategory}.`
      : `Неделя выше ориентира на ${data.difference}.`;
  }

  return data.topCategory
    ? `Неделя в пределах ориентира. Больше всего ушло на: ${data.topCategory}.`
    : 'Неделя в пределах ориентира.';
}

export function getMonthForecastCopy(data: MonthForecastData): string {
  return data.isOverPlan
    ? `При текущем темпе месяц может выйти выше плана на ${data.overPlanAmount}.`
    : 'При текущем темпе месяц остаётся в плане.';
}

export function getMoneyFlowSummaryCopy(data: MoneyFlowSummaryData): string[] {
  const summary = [
    `После плана накоплений на расходы доступно ${data.spendingLimit}. За месяц использовано ${Math.round(data.usedPercent)}%.`,
  ];

  if (data.isOverBudget) {
    summary.push(`Расходный коридор превышен на ${data.deficit}.`);
  }

  return summary;
}

export function getReserveEmptyCopy(state: 'goals' | 'history'): EmptyStateCopy {
  return state === 'goals'
    ? {
        title: 'Создай цель',
        description: 'Задай сумму — в сейфе появится новая сфера.',
      }
    : uiCopy.emptyStates.noReserveHistory;
}

export function pluralizeRu(count: number, forms: readonly [string, string, string]): string {
  const absolute = Math.abs(Math.trunc(count));
  const mod100 = absolute % 100;
  const mod10 = absolute % 10;

  if (mod100 >= 11 && mod100 <= 14) {
    return forms[2];
  }

  if (mod10 === 1) {
    return forms[0];
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return forms[1];
  }

  return forms[2];
}
