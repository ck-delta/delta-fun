import { useEffect, useRef } from 'react';
import { useTradingContext } from '../context/TradingContext';
import { displayBase } from '../lib/products';

export default function PriceHeader() {
  const { selectedSymbol, livePrice } = useTradingContext();
  const prevPrice = useRef<number | null>(null);

  useEffect(() => {
    prevPrice.current = livePrice;
  }, [livePrice]);

  const delta = prevPrice.current !== null && livePrice !== null
    ? livePrice - prevPrice.current
    : 0;
  const deltaClass = delta > 0 ? 'text-positive' : delta < 0 ? 'text-negative' : 'text-fg-primary';

  return (
    <div className="flex items-baseline justify-between px-md py-sm rounded-xl bg-bg-surface-alt border border-divider">
      <div className="flex items-baseline gap-sm">
        <span className="text-[10px] uppercase tracking-wider text-fg-tertiary">{displayBase(selectedSymbol)}/USDT</span>
        <span className="flex items-center gap-2xs text-[10px] text-positive">
          <span className="w-[6px] h-[6px] rounded-full bg-positive animate-pulse-dot" />
          Live
        </span>
      </div>
      <span className={`font-mono text-xl font-semibold tabular-nums ${deltaClass}`}>
        {livePrice !== null
          ? `$${livePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
          : '—'}
      </span>
    </div>
  );
}
