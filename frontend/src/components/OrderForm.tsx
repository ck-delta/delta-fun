import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import {
  FIXED_LEVERAGE, addTrade, calcLiquidation, loadWallet, saveWallet,
} from '../lib/tradesStore';

const QUICK_MARGINS = [50, 100, 250, 500, 1000];

export default function OrderForm() {
  const { selectedSymbol, livePrice, lastSignal, showToast, bumpTrades, tradesVersion } = useTradingContext();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [margin, setMargin] = useState('100');
  const [wallet, setWallet] = useState<number>(() => loadWallet());
  const [placing, setPlacing] = useState(false);

  useEffect(() => { setWallet(loadWallet()); }, [tradesVersion]);

  // Mirror AI signal side by default
  useEffect(() => {
    if (lastSignal?.signal === 'buy') setSide('buy');
    else if (lastSignal?.signal === 'sell') setSide('sell');
  }, [lastSignal]);

  const marginNum = Number(margin) || 0;
  const notional = marginNum * FIXED_LEVERAGE;
  const liq = livePrice ? calcLiquidation(side, livePrice, FIXED_LEVERAGE) : null;
  const contracts = livePrice && marginNum > 0 ? notional / livePrice : 0;
  const canPlace = !placing && marginNum > 0 && marginNum <= wallet && livePrice !== null;

  const handlePlace = () => {
    if (!livePrice) { showToast('Waiting for live price…', 'error'); return; }
    if (marginNum <= 0) { showToast('Enter a margin amount', 'error'); return; }
    if (marginNum > wallet) { showToast('Not enough USDT in paper wallet', 'error'); return; }

    setPlacing(true);
    try {
      const liquidation = calcLiquidation(side, livePrice, FIXED_LEVERAGE);
      addTrade({
        id: `T${Date.now()}`,
        symbol: selectedSymbol,
        side,
        margin: marginNum,
        entryPrice: livePrice,
        notional,
        leverage: FIXED_LEVERAGE,
        liquidationPrice: liquidation,
        timestamp: Date.now(),
        signal: lastSignal?.signal,
        confidence: lastSignal?.confidence,
      });
      const nextWallet = wallet - marginNum;
      saveWallet(nextWallet);
      setWallet(nextWallet);
      bumpTrades();
      showToast(`${side.toUpperCase()} ${selectedSymbol} @ $${livePrice.toFixed(2)} · 10x`, 'success');
    } finally {
      setPlacing(false);
    }
  };

  const sideBtn = (target: 'buy' | 'sell') => {
    const active = side === target;
    const Icon = target === 'buy' ? TrendingUp : TrendingDown;
    const activeCls = target === 'buy'
      ? 'bg-positive text-white'
      : 'bg-negative text-white';
    return (
      <button
        onClick={() => setSide(target)}
        className={`flex-1 flex items-center justify-center gap-2xs py-sm rounded-md text-xs font-bold uppercase tracking-wide transition-colors ${
          active ? activeCls : 'text-fg-tertiary hover:text-fg-primary'
        }`}
      >
        <Icon size={12} /> {target === 'buy' ? 'Long' : 'Short'}
      </button>
    );
  };

  return (
    <div id="order-form" className="rounded-xl bg-bg-surface-alt border border-divider p-lg scroll-mt-md">
      <div className="flex items-center justify-between mb-sm">
        <span className="section-label">Paper trade · 10× isolated</span>
        <span className="text-[11px] font-mono text-fg-tertiary">
          Wallet <span className="text-fg-primary">${wallet.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </span>
      </div>

      <div className="flex items-center gap-2xs p-2xs rounded-lg bg-bg-primary border border-divider mb-md">
        {sideBtn('buy')}
        {sideBtn('sell')}
      </div>

      <label className="block text-[11px] uppercase tracking-wide text-fg-tertiary mb-2xs">Margin (USDT)</label>
      <div className="relative mb-sm">
        <input
          type="number"
          inputMode="decimal"
          min={1}
          step={1}
          value={margin}
          onChange={e => setMargin(e.target.value)}
          className="w-full px-md py-sm rounded-lg bg-bg-primary border border-divider focus:border-brand-border outline-none text-fg-primary font-mono"
        />
        <span className="absolute right-md top-1/2 -translate-y-1/2 text-xs text-fg-tertiary font-mono">USDT</span>
      </div>

      <div className="flex flex-wrap gap-2xs mb-md">
        {QUICK_MARGINS.map(v => (
          <button
            key={v}
            onClick={() => setMargin(String(v))}
            disabled={v > wallet}
            className="flex-1 min-w-[56px] px-sm py-2xs rounded-md text-xs font-mono border border-divider text-fg-secondary hover:border-brand-border hover:text-fg-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ${v}
          </button>
        ))}
        <button
          onClick={() => setMargin(String(Math.floor(wallet)))}
          className="px-sm py-2xs rounded-md text-xs font-mono border border-divider text-brand-text hover:bg-brand-muted transition-colors"
        >
          Max
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-sm text-xs mb-md">
        <div className="flex justify-between rounded-md bg-bg-primary px-sm py-xs">
          <dt className="text-fg-tertiary">Entry</dt>
          <dd className="font-mono text-fg-primary">
            {livePrice !== null ? `$${livePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}
          </dd>
        </div>
        <div className="flex justify-between rounded-md bg-bg-primary px-sm py-xs">
          <dt className="text-fg-tertiary">Notional</dt>
          <dd className="font-mono text-fg-primary">${notional.toLocaleString(undefined, { maximumFractionDigits: 2 })}</dd>
        </div>
        <div className="flex justify-between rounded-md bg-bg-primary px-sm py-xs">
          <dt className="text-fg-tertiary">Size</dt>
          <dd className="font-mono text-fg-primary">{contracts ? contracts.toFixed(4) : '—'}</dd>
        </div>
        <div className="flex justify-between rounded-md bg-bg-primary px-sm py-xs">
          <dt className="text-fg-tertiary">Liq price</dt>
          <dd className={`font-mono ${side === 'buy' ? 'text-negative' : 'text-positive'}`}>
            {liq !== null ? `$${liq.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}
          </dd>
        </div>
      </dl>

      <button
        onClick={handlePlace}
        disabled={!canPlace}
        className={`w-full py-md rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${
          side === 'buy'
            ? 'bg-positive hover:bg-positive-hover text-white disabled:bg-positive/30'
            : 'bg-negative hover:bg-negative-hover text-white disabled:bg-negative/30'
        } disabled:cursor-not-allowed`}
      >
        {placing
          ? 'Placing…'
          : side === 'buy'
            ? `Long ${selectedSymbol.replace(/USDT?$/, '')} · 10×`
            : `Short ${selectedSymbol.replace(/USDT?$/, '')} · 10×`}
      </button>
      <p className="mt-sm text-[10px] text-fg-tertiary text-center leading-tight">
        Paper only. No real orders, no real margin. Reset wallet anytime.
      </p>
    </div>
  );
}
