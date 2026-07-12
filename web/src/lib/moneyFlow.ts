import { getMonthlySpendingLimitFromWorkingBudget } from './calculations';
import type { MoneyFlowMetrics } from '../types/moneyFlow';

type MoneyFlowInput = {
  workingBudget: number;
  savingsGoal: number;
  monthSpent: number;
  reserveTotal: number;
};

function normalizeAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function getSafeShare(amount: number, parentAmount: number): number {
  if (parentAmount <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, amount / parentAmount));
}

export function getMoneyFlowMetrics(input: MoneyFlowInput): MoneyFlowMetrics {
  const workingBudget = normalizeAmount(input.workingBudget);
  const savingsGoal = Math.min(normalizeAmount(input.savingsGoal), workingBudget);
  const spendingLimit = getMonthlySpendingLimitFromWorkingBudget(workingBudget, savingsGoal);
  const monthSpent = normalizeAmount(input.monthSpent);
  const remainingSpending = Math.max(spendingLimit - monthSpent, 0);
  const deficit = Math.max(monthSpent - spendingLimit, 0);
  const hasBudget = workingBudget > 0;

  return {
    workingBudget,
    savingsGoal,
    spendingLimit,
    monthSpent,
    remainingSpending,
    deficit,
    reserveTotal: normalizeAmount(input.reserveTotal),
    savingsShare: getSafeShare(savingsGoal, workingBudget),
    spendingShare: getSafeShare(spendingLimit, workingBudget),
    spentShare: getSafeShare(monthSpent, spendingLimit),
    remainingShare: getSafeShare(remainingSpending, spendingLimit),
    hasBudget,
    isOverBudget: deficit > 0,
  };
}

export function normalizeFlowWidth(amount: number, parentAmount: number): number {
  const normalizedAmount = normalizeAmount(amount);
  const normalizedParent = normalizeAmount(parentAmount);

  if (normalizedAmount <= 0 || normalizedParent <= 0) {
    return 1;
  }

  return 2 + getSafeShare(normalizedAmount, normalizedParent) * 8;
}
