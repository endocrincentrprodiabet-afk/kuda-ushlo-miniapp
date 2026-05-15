import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '../lib/format';

type AnimatedMoneyProps = {
  amount: number;
  currency: string;
  className?: string;
  debounceMs?: number;
};

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

export function AnimatedMoney({ amount, currency, className, debounceMs = 140 }: AnimatedMoneyProps) {
  const [displayAmount, setDisplayAmount] = useState(amount);
  const previousAmountRef = useRef(amount);
  const currentAmountRef = useRef(amount);

  useEffect(() => {
    if (prefersReducedMotion()) {
      previousAmountRef.current = amount;
      currentAmountRef.current = amount;
      setDisplayAmount(amount);
      return;
    }

    const to = amount;
    const duration = 260;
    const delay = Math.max(0, debounceMs);
    let frameId = 0;
    let timeoutId = 0;

    function startAnimation() {
      const from = currentAmountRef.current;
      const startedAt = performance.now();

      function tick(now: number) {
        const progress = Math.min((now - startedAt) / duration, 1);
        const nextAmount = from + (to - from) * easeOutCubic(progress);

        currentAmountRef.current = nextAmount;
        setDisplayAmount(progress === 1 ? to : nextAmount);

        if (progress < 1) {
          frameId = requestAnimationFrame(tick);
        } else {
          previousAmountRef.current = to;
          currentAmountRef.current = to;
        }
      }

      frameId = requestAnimationFrame(tick);
    }

    timeoutId = window.setTimeout(startAnimation, delay);

    return () => {
      window.clearTimeout(timeoutId);
      cancelAnimationFrame(frameId);
      previousAmountRef.current = currentAmountRef.current;
    };
  }, [amount, debounceMs]);

  return <span className={className}>{formatMoney(Math.round(displayAmount), currency)}</span>;
}
