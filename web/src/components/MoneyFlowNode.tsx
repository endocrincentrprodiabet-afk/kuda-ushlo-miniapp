import { useEffect, useRef, useState } from 'react';
import { AnimatedMoney } from './AnimatedMoney';

export type MoneyFlowTone = 'source' | 'savings' | 'spending' | 'spent' | 'remaining' | 'deficit';

type MoneyFlowNodeProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  amount: number;
  currency: string;
  tone: MoneyFlowTone;
  percentage?: number;
  muted?: boolean;
};

export function MoneyFlowNode({
  x,
  y,
  width,
  height,
  label,
  amount,
  currency,
  tone,
  percentage,
  muted = false,
}: MoneyFlowNodeProps) {
  const previousAmount = useRef(amount);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (previousAmount.current === amount) {
      return;
    }

    previousAmount.current = amount;
    setIsPulsing(true);
    const timeoutId = window.setTimeout(() => setIsPulsing(false), 460);

    return () => window.clearTimeout(timeoutId);
  }, [amount]);

  const percentLabel = percentage === undefined ? '' : `, ${Math.round(percentage * 100)} процентов`;

  return (
    <foreignObject height={height} width={width} x={x} y={y}>
      <div
        aria-label={`${label}: ${Math.round(amount)} ${currency}${percentLabel}`}
        className={`money-flow-node money-flow-node--${tone}${muted ? ' money-flow-node--muted' : ''}${isPulsing ? ' money-flow-node--pulse' : ''}`}
        role="group"
      >
        <span className="money-flow-node__label">{label}</span>
        <AnimatedMoney amount={amount} currency={currency} debounceMs={0} />
        {percentage === undefined ? null : (
          <span className="money-flow-node__share">{Math.round(percentage * 100)}%</span>
        )}
      </div>
    </foreignObject>
  );
}
