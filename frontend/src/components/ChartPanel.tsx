import { useState, useEffect } from 'react';
import { RefreshCw, Eye, EyeOff, Monitor, Maximize2, Minimize2 } from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import { loadTradesForCoin } from '../lib/tradesStore';
import type { StoredTrade } from '../lib/tradesStore';
import { api } from '../lib/api';
import { COINS, COIN_KEYS, geckoUrl, tvUrl } from '../lib/coins';
import type { CoinKey } from '../lib/coins';

type ChartSource = 'gecko' | 'tradingview';

const COIN_NAMES: Record<CoinKey, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  BNB: 'BNB Chain',
  HYPE: 'Hyperliquid',
};

export default function ChartPanel() {
  const [key, setKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [chartSource, setChartSource] = useState<ChartSource>('gecko');
  const [openTrades, setOpenTrades] = useState<StoredTrade[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const { overshootStatus, startVision, chartFocusMode, setChartFocusMode, tradesVersion, selectedCoin, setSelectedCoin } = useTradingContext();

  const coin = COINS[selectedCoin];
  const hasGecko = !!(coin.geckoNet && coin.geckoPool);

  // When coin changes, pick best available source and reload
  useEffect(() => {
    if (!hasGecko) setChartSource('tradingview');
    setLoaded(false);
    setKey(k => k + 1);
    setLivePrice(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoin]);

  const chartUrl = chartSource === 'gecko' && hasGecko ? geckoUrl(coin)! : tvUrl(coin);
  const chartLabel = chartSource === 'gecko' && hasGecko
    ? `${coin.geckoLabel} · 15m`
    : `${coin.symbol}/USDT · Binance · 15m`;
  const chartSourceLabel = chartSource === 'gecko' && hasGecko ? 'GeckoTerminal' : 'TradingView';

  // Sync open positions from localStorage whenever trades change
  useEffect(() => {
    setOpenTrades(loadTradesForCoin(selectedCoin).slice(0, 3));
  }, [tradesVersion, selectedCoin]);

  // Poll live price for PnL overlay — re-runs when coin changes
  useEffect(() => {
    let cancelled = false;
    const update = async () => {
      try {
        const p = await api.getPrice(coin.id);
        if (!cancelled) setLivePrice(p);
      } catch { /* silent */ }
    };
    update();
    const t = setInterval(update, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, [coin.id]);

  const switchSource = (src: ChartSource) => {
    if (src === chartSource) return;
    setChartSource(src);
    setLoaded(false);
    setKey(k => k + 1);
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Hero header row */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-paper flex-shrink-0">
        {/* Left: Coin name + subtitle */}
        <div className="flex flex-col gap-0.5">
          <span className="font-heading font-bold text-xl uppercase tracking-tight text-white leading-none">
            {coin.symbol}/USD
          </span>
          <span className="text-[10px] text-muted font-heading uppercase tracking-widest">
            {COIN_NAMES[selectedCoin]} · {chartSourceLabel} · 15m
          </span>
        </div>

        {/* Right: Live price */}
        <div className="flex flex-col items-end gap-0.5">
          {livePrice !== null ? (
            <>
              <span className="font-mono font-bold text-xl text-white leading-none text-glow-green">
                ${livePrice.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted font-heading uppercase tracking-widest">
                Live Price · USD
              </span>
            </>
          ) : (
            <>
              <span className="font-mono font-bold text-xl text-muted leading-none">—</span>
              <span className="text-[10px] text-muted font-heading uppercase tracking-widest">Fetching...</span>
            </>
          )}
        </div>
      </div>

      {/* Toolbar row */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border-subtle bg-paper flex-shrink-0">
        {/* Coin tabs */}
        <div className="flex items-center gap-0.5 flex-shrink-0 overflow-x-auto scrollbar-hide">
          {COIN_KEYS.map(c => (
            <button
              key={c}
              onClick={() => { if (c !== selectedCoin) { setSelectedCoin(c); } }}
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

        <span className="text-muted text-[10px] truncate flex-1 min-w-0 font-heading hidden md:block">{chartLabel}</span>

        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          {/* Source toggle */}
          <div className="flex rounded-full overflow-hidden border border-border-subtle text-[10px] font-heading">
            {hasGecko && (
              <button
                onClick={() => switchSource('gecko')}
                className={`px-2.5 py-1 transition-all ${chartSource === 'gecko' ? 'bg-accent-green/10 text-accent-green' : 'text-muted hover:text-white'}`}
              >
                Gecko
              </button>
            )}
            <button
              onClick={() => switchSource('tradingview')}
              className={`px-2.5 py-1 transition-all ${chartSource === 'tradingview' || !hasGecko ? 'bg-surface text-white' : 'text-muted hover:text-white'}`}
            >
              TV
            </button>
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

          <button
            onClick={() => { setLoaded(false); setKey(k => k + 1); }}
            className="text-muted hover:text-white transition-colors p-1 rounded"
            title="Refresh chart"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div id="chart-container" className="relative flex-1">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-body z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-border-strong border-t-accent-green rounded-full animate-spin" />
              <span className="text-muted text-sm font-heading">Loading {coin.symbol} chart...</span>
            </div>
          </div>
        )}

        <iframe
          key={key}
          src={chartUrl}
          title={`${coin.symbol}/USD ${chartSourceLabel} Chart`}
          frameBorder="0"
          allowFullScreen
          onLoad={() => setLoaded(true)}
          className="w-full h-full"
          style={{ border: 'none' }}
        />

        {/* Open positions overlay */}
        {loaded && openTrades.length > 0 && (
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

        {/* Vision banner */}
        {loaded && overshootStatus !== 'active' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
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

        {/* Vision active indicator */}
        {overshootStatus === 'active' && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-inner bg-accent-purple/10 border border-accent-purple/30 backdrop-blur-sm">
            <Eye size={11} className="text-accent-purple animate-pulse" />
            <span className="text-[10px] text-accent-purple font-medium font-heading">Vision ON</span>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-1.5 bg-paper border-t border-border-subtle">
        <p className="text-muted-dim text-[10px] text-center font-heading tracking-wide">
          Not financial advice · Paper trading only · Predictions are probabilistic
        </p>
      </div>
    </div>
  );
}
