import { useEffect, useState } from 'react';
import type { MoneyFlowMetrics } from '../types/moneyFlow';
import { MoneyFlowEdge } from './MoneyFlowEdge';
import { MoneyFlowNode } from './MoneyFlowNode';

type MoneyFlowDiagramProps = {
  metrics: MoneyFlowMetrics;
  currency: string;
};

function useWideLayout(): boolean {
  const [isWide, setIsWide] = useState(() => window.matchMedia('(min-width: 720px)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 720px)');
    const updateLayout = () => setIsWide(mediaQuery.matches);

    updateLayout();
    mediaQuery.addEventListener('change', updateLayout);

    return () => mediaQuery.removeEventListener('change', updateLayout);
  }, []);

  return isWide;
}

export function MoneyFlowDiagram({ metrics, currency }: MoneyFlowDiagramProps) {
  const isWide = useWideLayout();
  const resultLabel = metrics.isOverBudget ? 'Перерасход' : 'Остаток';
  const resultAmount = metrics.isOverBudget ? metrics.deficit : metrics.remainingSpending;
  const resultTone = metrics.isOverBudget ? 'deficit' : 'remaining';
  const resultShare = metrics.isOverBudget
    ? metrics.spendingLimit > 0
      ? Math.min(metrics.deficit / metrics.spendingLimit, 1)
      : 1
    : metrics.remainingShare;
  const lowerFlowParent = Math.max(metrics.spendingLimit, metrics.monthSpent);

  const layout = isWide
    ? {
        viewBox: '0 0 820 360',
        aspectRatio: 820 / 360,
        nodes: {
          source: [310, 10, 200, 68],
          savings: [70, 142, 180, 68],
          spending: [570, 142, 180, 68],
          spent: [455, 278, 160, 68],
          result: [660, 278, 160, 68],
        },
        paths: {
          savings: 'M 410 78 C 410 112, 160 104, 160 142',
          spending: 'M 410 78 C 410 112, 660 104, 660 142',
          spent: 'M 660 210 C 660 244, 535 242, 535 278',
          result: 'M 660 210 C 660 238, 740 246, 740 278',
        },
      }
    : {
        viewBox: '0 0 360 558',
        aspectRatio: 360 / 558,
        nodes: {
          source: [32, 8, 296, 68],
          savings: [32, 126, 296, 68],
          spending: [32, 244, 296, 68],
          spent: [32, 362, 296, 68],
          result: [32, 480, 296, 68],
        },
        paths: {
          savings: 'M 150 76 C 150 96, 150 106, 150 126',
          spending: 'M 258 76 C 342 98, 342 218, 258 244',
          spent: 'M 150 312 C 150 332, 150 342, 150 362',
          result: 'M 258 312 C 342 334, 342 454, 258 480',
        },
      };

  const [sourceX, sourceY, sourceWidth, sourceHeight] = layout.nodes.source;
  const [savingsX, savingsY, savingsWidth, savingsHeight] = layout.nodes.savings;
  const [spendingX, spendingY, spendingWidth, spendingHeight] = layout.nodes.spending;
  const [spentX, spentY, spentWidth, spentHeight] = layout.nodes.spent;
  const [resultX, resultY, resultWidth, resultHeight] = layout.nodes.result;

  return (
    <div className={`money-flow-diagram${!metrics.hasBudget ? ' money-flow-diagram--muted' : ''}`}>
      <svg
        aria-label="Схема распределения денег текущего месяца"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        style={{ aspectRatio: layout.aspectRatio }}
        viewBox={layout.viewBox}
      >
        <MoneyFlowEdge
          amount={metrics.savingsGoal}
          enabled={metrics.hasBudget}
          id="Поток в план накоплений"
          parentAmount={metrics.workingBudget}
          path={layout.paths.savings}
          tone="savings"
        />
        <MoneyFlowEdge
          amount={metrics.spendingLimit}
          enabled={metrics.hasBudget}
          id="Поток на расходы"
          parentAmount={metrics.workingBudget}
          path={layout.paths.spending}
          tone="spending"
        />
        <MoneyFlowEdge
          amount={metrics.monthSpent}
          enabled={metrics.hasBudget}
          id="Потрачено"
          parentAmount={lowerFlowParent}
          path={layout.paths.spent}
          tone="spent"
        />
        <MoneyFlowEdge
          amount={resultAmount}
          enabled={metrics.hasBudget}
          id={resultLabel}
          parentAmount={lowerFlowParent}
          path={layout.paths.result}
          tone={resultTone}
        />

        <MoneyFlowNode
          amount={metrics.workingBudget}
          currency={currency}
          height={sourceHeight}
          label="Деньги в работе"
          muted={!metrics.hasBudget}
          tone="source"
          width={sourceWidth}
          x={sourceX}
          y={sourceY}
        />
        <MoneyFlowNode
          amount={metrics.savingsGoal}
          currency={currency}
          height={savingsHeight}
          label="План отложить"
          muted={!metrics.hasBudget}
          percentage={metrics.savingsShare}
          tone="savings"
          width={savingsWidth}
          x={savingsX}
          y={savingsY}
        />
        <MoneyFlowNode
          amount={metrics.spendingLimit}
          currency={currency}
          height={spendingHeight}
          label="На расходы"
          muted={!metrics.hasBudget}
          percentage={metrics.spendingShare}
          tone="spending"
          width={spendingWidth}
          x={spendingX}
          y={spendingY}
        />
        <MoneyFlowNode
          amount={metrics.monthSpent}
          currency={currency}
          height={spentHeight}
          label="Потрачено"
          muted={!metrics.hasBudget}
          percentage={metrics.spendingLimit > 0 ? metrics.spentShare : undefined}
          tone="spent"
          width={spentWidth}
          x={spentX}
          y={spentY}
        />
        <MoneyFlowNode
          amount={resultAmount}
          currency={currency}
          height={resultHeight}
          label={resultLabel}
          muted={!metrics.hasBudget}
          percentage={resultShare}
          tone={resultTone}
          width={resultWidth}
          x={resultX}
          y={resultY}
        />
      </svg>
      {!metrics.hasBudget ? <p className="money-flow-empty">Добавь доход, чтобы увидеть движение денег.</p> : null}
    </div>
  );
}
