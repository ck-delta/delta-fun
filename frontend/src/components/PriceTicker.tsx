import { useState, useEffect, useRef } from 'react';

interface PriceTickerProps {
  price: number | null;
  className?: string;
}

export default function PriceTicker({ price, className = '' }: PriceTickerProps) {
  const prevPriceRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (price === null || prevPriceRef.current === null) {
      prevPriceRef.current = price;
      return;
    }

    if (price > prevPriceRef.current) {
      setFlash('up');
    } else if (price < prevPriceRef.current) {
      setFlash('down');
    }

    prevPriceRef.current = price;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setFlash(null), 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [price]);

  if (price === null) {
    return <span className={`font-mono font-bold text-muted leading-none ${className}`}>—</span>;
  }

  const flashClass = flash === 'up'
    ? 'text-accent-green text-glow-green'
    : flash === 'down'
      ? 'text-accent-red text-glow-red'
      : 'text-white text-glow-green';

  return (
    <span className={`font-mono font-bold leading-none transition-all duration-150 ${flashClass} ${className}`}>
      ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}
