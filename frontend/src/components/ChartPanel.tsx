import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Monitor, Maximize2, Minimize2 } from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import { loadTradesForCoin } from '../lib/tradesStore';
import type { StoredTrade } from '../lib/tradesStore';
import { COINS, COIN_KEYS } from '../lib/coins';
import type { CoinKey } from '../lib/coins';
import NeonChart from './NeonChart';
import PriceTicker from './PriceTicker';
import type { Interval } from '../hooks/useBinanceKlines';

const COIN_NAMES: Record<CoinKey, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  BNB: 'BNB Chain',
  HYPE: 'Hyperliquid',
  GOLD: 'Gold (XAU)',
};

const INTERVALS: { label: string; value: Interval }[] = [
  { label: '1s', value: '1s' },
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
];

export default function ChartPanel() {
  const [interval, setInterval_] = useState<Interval>('1m');
  const [openTrades, setOpenTrades] = useState<StoredTrade[]>([]);
  const { overshootStatus, startVision, chartFocusMode, setChartFocusMode, tradesVersion, selectedCoin, setSelectedCoin, livePrice, setLivePrice } = useTradingContext();

  const coin = COINS[selectedCoin];

  // Reset price when coin changes
  useEffect(() => {
    setLivePrice(null);
  }, [selectedCoin, setLivePrice]);

  // Sync open positions
  useEffect(() => {
    setOpenTrades(loadTradesForCoin(selectedCoin).slice(0, 3));
  }, [tradesVersion, selectedCoin]);

  // Price update from NeonChart WebSocket → context
  const handlePriceUpdate = useCallback((price: number) => {
    setLivePrice(price);
  }, [setLivePrice]);

  return (
    <div className="relative h-full flex flex-col">
      {/* Hero header row — desktop only */}
      <div className="hidden lg:flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-paper flex-shrink-0">
        <div className="flex flex-col gap-0.5">
          <span className="font-heading font-bold text-xl uppercase tracking-tight text-white leading-none">
            {coin.symbol}/USD
          </span>
          <span className="text-[10px] text-muted font-heading uppercase tracking-widest">
            {COIN_NAMES[selectedCoin]} · Binance · {interval}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <PriceTicker price={livePrice} className="text-xl" />
          <span className="text-[10px] text-muted font-heading uppercase tracking-widest">
            Live Price · USD
          </span>
        </div>
      </div>

      {/* Toolbar row — desktop only */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 border-b border-border-subtle bg-paper flex-shrink-0">
        {/* Coin tabs */}
        <div className="flex items-center gap-0.5 flex-shrink-0 overflow-x-auto scrollbar-hide">
          {COIN_KEYS.map(c => (
            <button
              key={c}
              onClick={() => { if (c !== selectedCoin) setSelectedCoin(c); }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-heading transition-all border ${
                c === selectedCoin
                  ? 'bg-accent-green/10 text-accent-green border-accent-green/30 shadow-glow-green'
                  : 'text-muted hover:text-white border-transparent'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="w-px h-3.5 bg-border-subtle flex-shrink-0" />

        <span className="text-muted text-[10px] truncate flex-1 min-w-0 font-heading hidden md:block">
          {coin.symbol}/USDT · Binance · {interval}
        </span>

        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          {/* Timeframe selector */}
          <div className="flex rounded-full overflow-hidden border border-border-subtle text-[10px] font-heading">
            {INTERVALS.map(tf => (
              <button
                key={tf.value}
                onClick={() => setInterval_(tf.value)}
                className={`px-2.5 py-1 transition-all ${
                  interval === tf.value
                    ? 'bg-accent-green/10 text-accent-green'
                    : 'text-muted hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {overshootStatus === 'active' && (
            <button
              onClick={() => setChartFocusMode(!chartFocusMode)}
              className="text-muted hover:text-accent-purple transition-colors p-1 rounded"
              title={chartFocusMode ? 'Exit focus mode' : 'Expand chart for vision'}
            >
              {chartFocusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile timeframe selector */}
      <div className="flex lg:hidden items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-paper flex-shrink-0">
        <div className="flex rounded-full overflow-hidden border border-border-subtle text-[10px] font-heading">
          {INTERVALS.map(tf => (
            <button
              key={tf.value}
              onClick={() => setInterval_(tf.value)}
              className={`px-2.5 py-1 transition-all ${
                interval === tf.value
                  ? 'bg-accent-green/10 text-accent-green'
                  : 'text-muted hover:text-white'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
        <PriceTicker price={livePrice} className="text-sm" />
      </div>

      {/* Chart */}
      <div className="relative flex-1 overflow-hidden">
        <NeonChart
          coin={coin}
          interval={interval}
          onPriceUpdate={handlePriceUpdate}
        />

        {/* Open positions overlay */}
        {openTrades.length > 0 && (
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
            {openTrades.map(t => {
              const pnl = livePrice !== null
                ? (livePrice - t.entryPrice) * t.quantity * (t.side === 'buy' ? 1 : -1)
                : null;
              const pnlPct = livePrice !== null
                ? ((livePrice - t.entryPrice) / t.entryPrice) * 100 * (t.side === 'buy' ? 1 : -1)
                : null;
              const isBuy = t.side === 'buy';
              const isProfitable = pnl !== null ? pnl >= 0 : isBuy;
              return (
                <div
                  key={t.id}
                  className={`flex flex-col px-3 py-2 rounded-inner backdrop-blur-sm border shadow-lg min-w-[148px] ${
                    isBuy ? 'bg-accent-green/5 border-accent-green/20' : 'bg-accent-red/5 border-accent-red/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isProfitable ? 'bg-accent-green' : 'bg-accent-red'}`} />
                    <span className={`text-[11px] font-bold uppercase font-heading ${isBuy ? 'text-accent-green' : 'text-accent-red'}`}>{t.side}</span>
                    <span className="text-white text-[11px] font-mono ml-auto">${t.entryPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pl-3.5">
                    <span className="text-muted text-[10px]">{t.quantity} {coin.symbol}</span>
                    {pnl !== null ? (
                      <span className={`text-[10px] font-mono font-semibold ${pnl >= 0 ? 'text-accent-green text-glow-green' : 'text-accent-red text-glow-red'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} <span className="text-[10px] opacity-75">({pnlPct!.toFixed(2)}%)</span>
                      </span>
                    ) : (
                      <span className="text-muted text-[10px]">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Vision banner — desktop only */}
        {overshootStatus !== 'active' && (
          <div className="hidden lg:block absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
            <button
              onClick={startVision}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-inner text-sm font-medium font-heading shadow-xl backdrop-blur-sm transition-all border ${
                overshootStatus === 'error'
                  ? 'bg-accent-red/10 border-accent-red/30 text-accent-red hover:bg-accent-red/20'
                  : 'bg-surface/90 border-accent-purple/30 text-accent-purple hover:bg-accent-purple/10 hover:border-accent-purple/60 hover:shadow-glow-purple'
              }`}
            >
              {overshootStatus === 'error' ? (
                <><EyeOff size={15} /> Vision failed — retry</>
              ) : (
                <><Monitor size={15} /> Enable Chart Vision <span className="text-[10px] text-accent-purple/70 ml-1">(select This Tab)</span></>
              )}
            </button>
            {overshootStatus === 'idle' && (
              <p className="text-center text-[10px] text-muted mt-1.5">AI will visually analyze this chart</p>
            )}
          </div>
        )}

        {/* Vision active indicator — desktop only */}
        {overshootStatus === 'active' && (
          <div className="hidden lg:flex absolute top-3 right-3 z-20 items-center gap-1.5 px-2 py-1 rounded-inner bg-accent-purple/10 border border-accent-purple/30 backdrop-blur-sm">
            <Eye size={11} className="text-accent-purple animate-pulse" />
            <span className="text-[10px] text-accent-purple font-medium font-heading">Vision ON</span>
          </div>
        )}
      </div>

    </div>
  );
}
