import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import type { MoneyFlowMetrics } from '../types/moneyFlow';
import { MoneyFlowEdge } from './MoneyFlowEdge';
import { MoneyFlowNode } from './MoneyFlowNode';

type MoneyFlowDiagramProps = {
  metrics: MoneyFlowMetrics;
  currency: string;
};

const desktopLayout = {
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
};

const mobileLayout = {
  viewBox: '0 0 360 390',
  aspectRatio: 360 / 390,
  nodes: {
    source: [12, 8, 336, 86],
    savings: [12, 142, 160, 92],
    spending: [188, 142, 160, 92],
    spent: [12, 286, 160, 92],
    result: [188, 286, 160, 92],
  },
  paths: {
    savings: 'M 180 94 C 180 120, 92 116, 92 142',
    spending: 'M 180 94 C 180 120, 268 116, 268 142',
    spent: 'M 268 234 C 268 260, 92 258, 92 286',
    result: 'M 268 234 C 268 252, 268 266, 268 286',
  },
};

function useWideLayout(container: React.RefObject<HTMLDivElement | null>): boolean {
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 768);

  useEffect(() => {
    const element = container.current;

    if (!element) {
      return;
    }

    const updateLayout = (width: number) => setIsWide(width >= 700);
    updateLayout(element.getBoundingClientRect().width);

    if (typeof ResizeObserver === 'undefined') {
      const handleResize = () => updateLayout(element.getBoundingClientRect().width);
      window.addEventListener('resize', handleResize);

      return () => window.removeEventListener('resize', handleResize);
    }

    const observer = new ResizeObserver(([entry]) => {
      updateLayout(entry?.contentRect.width ?? element.getBoundingClientRect().width);
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [container]);

  return isWide;
}

export function MoneyFlowDiagram({ metrics, currency }: MoneyFlowDiagramProps) {
  const container = useRef<HTMLDivElement>(null);
  const isWide = useWideLayout(container);
  const reducedMotion = usePrefersReducedMotion();
  const resultLabel = metrics.isOverBudget ? 'Перерасход' : 'Остаток';
  const resultAmount = metrics.isOverBudget ? metrics.deficit : metrics.remainingSpending;
  const resultTone = metrics.isOverBudget ? 'deficit' : 'remaining';
  const resultShare = metrics.isOverBudget
    ? metrics.spendingLimit > 0
      ? Math.min(metrics.deficit / metrics.spendingLimit, 1)
      : 1
    : metrics.remainingShare;
  const lowerFlowParent = Math.max(metrics.spendingLimit, metrics.monthSpent);
  const layout = isWide ? desktopLayout : mobileLayout;

  const [sourceX, sourceY, sourceWidth, sourceHeight] = layout.nodes.source;
  const [savingsX, savingsY, savingsWidth, savingsHeight] = layout.nodes.savings;
  const [spendingX, spendingY, spendingWidth, spendingHeight] = layout.nodes.spending;
  const [spentX, spentY, spentWidth, spentHeight] = layout.nodes.spent;
  const [resultX, resultY, resultWidth, resultHeight] = layout.nodes.result;

  return (
    <div
      className={`money-flow-diagram money-flow-diagram--${isWide ? 'desktop' : 'mobile'}${
        !metrics.hasBudget ? ' money-flow-diagram--muted' : ''
      }`}
      ref={container}
    >
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
          reducedMotion={reducedMotion}
          tone="savings"
        />
        <MoneyFlowEdge
          amount={metrics.spendingLimit}
          enabled={metrics.hasBudget}
          id="Поток на расходы"
          parentAmount={metrics.workingBudget}
          path={layout.paths.spending}
          reducedMotion={reducedMotion}
          tone="spending"
        />
        <MoneyFlowEdge
          amount={metrics.monthSpent}
          enabled={metrics.hasBudget}
          id="Потрачено"
          parentAmount={lowerFlowParent}
          path={layout.paths.spent}
          reducedMotion={reducedMotion}
          tone="spent"
        />
        <MoneyFlowEdge
          amount={resultAmount}
          enabled={metrics.hasBudget}
          id={resultLabel}
          parentAmount={lowerFlowParent}
          path={layout.paths.result}
          reducedMotion={reducedMotion}
          tone={resultTone}
        />

        <MoneyFlowNode
          amount={metrics.workingBudget}
          currency={currency}
          height={sourceHeight}
          label="Деньги в работе"
          muted={!metrics.hasBudget}
          reducedMotion={reducedMotion}
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
          reducedMotion={reducedMotion}
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
          reducedMotion={reducedMotion}
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
          reducedMotion={reducedMotion}
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
          reducedMotion={reducedMotion}
          tone={resultTone}
          width={resultWidth}
          x={resultX}
          y={resultY}
        />
      </svg>
      {!metrics.hasBudget ? (
        <p className="money-flow-empty">Добавь доход, чтобы увидеть движение денег.</p>
      ) : null}
    </div>
  );
}
