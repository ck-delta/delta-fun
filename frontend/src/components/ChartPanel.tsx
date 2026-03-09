import { useState, useEffect } from 'react';
import { RefreshCw, Eye, EyeOff, Monitor, Maximize2, Minimize2 } from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import { loadTrades } from '../lib/tradesStore';
import type { StoredTrade } from '../lib/tradesStore';

const GECKO_URL =
  'https://www.geckoterminal.com/eth/pools/0x9db9e0e53058c89e5b94e29621a205198648425b?embed=1&info=0&swaps=0&light_chart=0&chart_type=price&resolution=15m&bg_color=111827';

const TRADINGVIEW_URL =
  'https://s.tradingview.com/widgetembed/?symbol=BINANCE%3ABTCUSDT&interval=15&theme=dark&style=1&timezone=Asia%2FCalcutta&hide_side_toolbar=0&allow_symbol_change=0&save_image=0&hidevolume=0';

type ChartSource = 'gecko' | 'tradingview';

export default function ChartPanel() {
  const [key, setKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [chartSource, setChartSource] = useState<ChartSource>('gecko');
  const [openTrades, setOpenTrades] = useState<StoredTrade[]>([]);
  const { overshootStatus, startVision, chartFocusMode, setChartFocusMode, tradesVersion } = useTradingContext();

  const chartUrl = chartSource === 'gecko' ? GECKO_URL : TRADINGVIEW_URL;
  const chartLabel = chartSource === 'gecko' ? 'WBTC·USDT · Ethereum · 15m' : 'BTCUSDT · Binance · 15m';
  const chartSourceLabel = chartSource === 'gecko' ? 'GeckoTerminal' : 'TradingView';

  // Sync open positions from localStorage whenever trades change
  useEffect(() => {
    setOpenTrades(loadTrades().slice(0, 3)); // show up to 3
  }, [tradesVersion]);

  const switchSource = (src: ChartSource) => {
    if (src === chartSource) return;
    setChartSource(src);
    setLoaded(false);
    setKey(k => k + 1);
  };

  return (
    <div className="relative h-full flex flex-col bg-[#111827]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#374151] bg-[#1f2937]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-white font-semibold text-sm tracking-wide">BTC / USD</span>
          <span className="text-[#6b7280] text-xs">{chartLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Chart source toggle */}
          <div className="flex rounded-lg overflow-hidden border border-[#374151] text-[11px]">
            <button
              onClick={() => switchSource('gecko')}
              className={`px-2.5 py-1 transition-colors ${chartSource === 'gecko' ? 'bg-orange-500/20 text-orange-300' : 'text-[#6b7280] hover:text-white'}`}
            >
              Gecko
            </button>
            <button
              onClick={() => switchSource('tradingview')}
              className={`px-2.5 py-1 transition-colors ${chartSource === 'tradingview' ? 'bg-blue-500/20 text-blue-300' : 'text-[#6b7280] hover:text-white'}`}
            >
              TradingView
            </button>
          </div>

          <span className="text-[#6b7280] text-xs">via {chartSourceLabel}</span>

          {/* Focus mode — only when vision active */}
          {overshootStatus === 'active' && (
            <button
              onClick={() => setChartFocusMode(!chartFocusMode)}
              className="text-[#6b7280] hover:text-purple-300 transition-colors p-1 rounded"
              title={chartFocusMode ? 'Exit focus mode' : 'Expand chart for vision'}
            >
              {chartFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}

          <button
            onClick={() => { setLoaded(false); setKey(k => k + 1); }}
            className="text-[#6b7280] hover:text-white transition-colors p-1 rounded"
            title="Refresh chart"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div id="chart-container" className="relative flex-1">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111827] z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#374151] border-t-orange-400 rounded-full animate-spin" />
              <span className="text-[#6b7280] text-sm">Loading chart...</span>
            </div>
          </div>
        )}

        <iframe
          key={key}
          src={chartUrl}
          title={`BTC/USD ${chartSourceLabel} Chart`}
          frameBorder="0"
          allowFullScreen
          onLoad={() => setLoaded(true)}
          className="w-full h-full"
          style={{ border: 'none' }}
        />

        {/* Open positions overlay */}
        {loaded && openTrades.length > 0 && (
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
            {openTrades.map(t => (
              <div
                key={t.id}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg backdrop-blur-sm border text-[10px] font-medium shadow-lg ${
                  t.side === 'buy'
                    ? 'bg-green-950/80 border-green-700/50 text-green-300'
                    : 'bg-red-950/80 border-red-700/50 text-red-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${t.side === 'buy' ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="uppercase font-bold">{t.side}</span>
                <span className="text-white font-mono">${t.entryPrice.toLocaleString()}</span>
                <span className="text-[#9ca3af]">{t.quantity} BTC</span>
              </div>
            ))}
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
              <p className="text-center text-[10px] text-[#6b7280] mt-1.5">AI will visually analyze this BTC chart</p>
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
