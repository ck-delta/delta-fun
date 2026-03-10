import { useState, useEffect } from 'react';
import { RefreshCw, Eye, EyeOff, Monitor, Maximize2, Minimize2 } from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import { loadTrades } from '../lib/tradesStore';
import type { StoredTrade } from '../lib/tradesStore';
import { api } from '../lib/api';
import { COINS, COIN_KEYS, geckoUrl, tvUrl } from '../lib/coins';
import type { CoinKey } from '../lib/coins';

type ChartSource = 'gecko' | 'tradingview';

const COIN_ACTIVE: Record<CoinKey, string> = {
  BTC: 'text-orange-300 bg-orange-500/20 border-orange-500/30',
  ETH: 'text-blue-300 bg-blue-500/20 border-blue-500/30',
  SOL: 'text-purple-300 bg-purple-500/20 border-purple-500/30',
  BNB: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30',
  HYPE: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30',
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
    setOpenTrades(loadTrades().slice(0, 3));
  }, [tradesVersion]);

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
    <div className="relative h-full flex flex-col bg-[#111827]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#374151] bg-[#1f2937]">
        {/* Coin tabs */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {COIN_KEYS.map(c => (
            <button
              key={c}
              onClick={() => { if (c !== selectedCoin) { setSelectedCoin(c); } }}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-colors border ${
                c === selectedCoin
                  ? COIN_ACTIVE[c]
                  : 'text-[#6b7280] hover:text-white border-transparent'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-[#374151] flex-shrink-0" />

        <span className="text-[#6b7280] text-[11px] truncate flex-1 min-w-0">{chartLabel}</span>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Source toggle */}
          <div className="flex rounded overflow-hidden border border-[#374151] text-[10px]">
            {hasGecko && (
              <button
                onClick={() => switchSource('gecko')}
                className={`px-2 py-1 transition-colors ${chartSource === 'gecko' ? 'bg-orange-500/20 text-orange-300' : 'text-[#6b7280] hover:text-white'}`}
              >
                Gecko
              </button>
            )}
            <button
              onClick={() => switchSource('tradingview')}
              className={`px-2 py-1 transition-colors ${chartSource === 'tradingview' || !hasGecko ? 'bg-blue-500/20 text-blue-300' : 'text-[#6b7280] hover:text-white'}`}
            >
              TV
            </button>
          </div>

          {overshootStatus === 'active' && (
            <button
              onClick={() => setChartFocusMode(!chartFocusMode)}
              className="text-[#6b7280] hover:text-purple-300 transition-colors p-1 rounded"
              title={chartFocusMode ? 'Exit focus mode' : 'Expand chart for vision'}
            >
              {chartFocusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}

          <button
            onClick={() => { setLoaded(false); setKey(k => k + 1); }}
            className="text-[#6b7280] hover:text-white transition-colors p-1 rounded"
            title="Refresh chart"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div id="chart-container" className="relative flex-1">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111827] z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#374151] border-t-orange-400 rounded-full animate-spin" />
              <span className="text-[#6b7280] text-sm">Loading {coin.symbol} chart...</span>
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
              const isGreen = t.side === 'buy';
              return (
                <div
                  key={t.id}
                  className={`flex flex-col px-3 py-2 rounded-lg backdrop-blur-sm border shadow-lg min-w-[148px] ${
                    isGreen ? 'bg-green-950/85 border-green-700/50' : 'bg-red-950/85 border-red-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isGreen ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className={`text-[11px] font-bold uppercase ${isGreen ? 'text-green-300' : 'text-red-300'}`}>{t.side}</span>
                    <span className="text-white text-[11px] font-mono ml-auto">${t.entryPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pl-3.5">
                    <span className="text-[#9ca3af] text-[10px]">{t.quantity} {coin.symbol}</span>
                    {pnl !== null ? (
                      <span className={`text-[10px] font-mono font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} <span className="text-[9px] opacity-75">({pnlPct!.toFixed(2)}%)</span>
                      </span>
                    ) : (
                      <span className="text-[#6b7280] text-[10px]">—</span>
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
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl backdrop-blur-sm transition-all border ${
                overshootStatus === 'error'
                  ? 'bg-red-950/80 border-red-700/50 text-red-300 hover:bg-red-900/90'
                  : 'bg-[#1e2636]/90 border-purple-500/30 text-purple-300 hover:bg-purple-900/40 hover:border-purple-500/60'
              }`}
            >
              {overshootStatus === 'error' ? (
                <><EyeOff size={15} /> Vision failed — retry</>
              ) : (
                <><Monitor size={15} /> Enable Chart Vision <span className="text-[10px] text-purple-400/70 ml-1">(select This Tab)</span></>
              )}
            </button>
            {overshootStatus === 'idle' && (
              <p className="text-center text-[10px] text-[#6b7280] mt-1.5">AI will visually analyze this chart</p>
            )}
          </div>
        )}

        {/* Vision active indicator */}
        {overshootStatus === 'active' && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-950/70 border border-purple-700/40 backdrop-blur-sm">
            <Eye size={11} className="text-purple-400 animate-pulse" />
            <span className="text-[10px] text-purple-400 font-medium">Vision ON</span>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-1.5 bg-[#1f2937] border-t border-[#374151]">
        <p className="text-[#6b7280] text-[10px] text-center">
          Not financial advice · Paper trading only · Predictions are probabilistic
        </p>
      </div>
    </div>
  );
}
