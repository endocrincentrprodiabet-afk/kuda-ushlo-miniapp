import { useEffect, useRef, useState } from 'react';
import { normalizeFlowWidth } from '../lib/moneyFlow';
import type { MoneyFlowTone } from './MoneyFlowNode';

type MoneyFlowEdgeProps = {
  id: string;
  path: string;
  amount: number;
  parentAmount: number;
  tone: MoneyFlowTone;
  enabled: boolean;
  reducedMotion: boolean;
};

export function MoneyFlowEdge({ id, path, amount, parentAmount, tone, enabled, reducedMotion }: MoneyFlowEdgeProps) {
  const previousAmount = useRef(amount);
  const [isBoosted, setIsBoosted] = useState(false);
  const width = normalizeFlowWidth(amount, parentAmount);
  const ratio = parentAmount > 0 ? Math.min(1, Math.max(0, amount / parentAmount)) : 0;
  const duration = 5.8 - ratio * 1.5;
  const isActive = enabled && amount > 0 && parentAmount > 0;

  useEffect(() => {
    if (previousAmount.current === amount || reducedMotion) {
      previousAmount.current = amount;
      return;
    }

    previousAmount.current = amount;
    setIsBoosted(true);
    const timeoutId = window.setTimeout(() => setIsBoosted(false), 520);

    return () => window.clearTimeout(timeoutId);
  }, [amount, reducedMotion]);

  return (
    <g className={`money-flow-edge money-flow-edge--${tone}${isActive ? ' money-flow-edge--active' : ''}${isBoosted ? ' money-flow-edge--boosted' : ''}`}>
      <path className="money-flow-edge__base" d={path} style={{ strokeWidth: width }} />
      {isActive && !reducedMotion ? (
        <>
          <path
            className="money-flow-edge__signal"
            d={path}
            pathLength="100"
            style={{ animationDuration: `${duration}s`, strokeWidth: Math.min(width, 3) }}
          />
          <circle className="money-flow-edge__particle" r="2.4">
            <animateMotion dur={`${duration + 0.8}s`} path={path} repeatCount="indefinite" />
          </circle>
        </>
      ) : null}
      <title>{`${id}: ${Math.round(amount)} из ${Math.round(parentAmount)}`}</title>
    </g>
  );
}
