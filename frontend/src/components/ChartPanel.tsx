import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

const CHART_URL =
  'https://www.geckoterminal.com/eth/pools/0x9db9e0e53058c89e5b94e29621a205198648425b?embed=1&info=0&swaps=0&light_chart=0&chart_type=price&resolution=15m&bg_color=111827';

export default function ChartPanel() {
  const [key, setKey] = useState(0);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative h-full flex flex-col bg-[#111827]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#374151] bg-[#1f2937]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-white font-semibold text-sm tracking-wide">BTC / USD</span>
          <span className="text-[#6b7280] text-xs">WBTC·USDT · Ethereum · 15m</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#6b7280] text-xs">via GeckoTerminal</span>
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
          src={CHART_URL}
          title="BTC/USD GeckoTerminal Chart"
          frameBorder="0"
          allowFullScreen
          onLoad={() => setLoaded(true)}
          className="w-full h-full"
          style={{ border: 'none' }}
        />
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
