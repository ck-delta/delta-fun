import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? 'bg-accent-green' : pct >= 50 ? 'bg-accent-amber' : 'bg-accent-red';
  const label = pct >= 70 ? 'High' : pct >= 50 ? 'Medium' : 'Low';
  const labelColor = pct >= 70 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-[#9ca3af]">Confidence</span>
        <span className={`text-[11px] font-semibold ${labelColor}`}>{label} · {pct}%</span>
      </div>
      <div className="h-1.5 bg-[#374151] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SignalDisplay() {
  const { lastSignal, isAnalyzing, lastOvershootSnapshot } = useTradingContext();
  const [showOvershoot, setShowOvershoot] = useState(false);

  if (isAnalyzing) {
    return (
      <div className="p-4 border-b border-[#374151]">
        <div className="bg-[#1e2636] rounded-xl p-4 border border-[#374151] animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-[#374151]" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-[#374151] rounded w-24" />
              <div className="h-3 bg-[#374151] rounded w-16" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-[#374151] rounded" />
            <div className="h-3 bg-[#374151] rounded w-4/5" />
          </div>
          <p className="text-center text-[#6b7280] text-xs mt-3">Analyzing with Groq + TA...</p>
        </div>
      </div>
    );
  }

  if (!lastSignal) {
    return (
      <div className="px-4 py-2.5 border-b border-[#374151]">
        <div className="flex items-center gap-2.5 px-3 py-2 bg-[#1e2636] rounded-lg border border-dashed border-[#374151]">
          <TrendingUp size={14} className="text-[#6b7280] flex-shrink-0" />
          <p className="text-[#6b7280] text-xs">Enter a prompt above to get AI-powered BTC analysis</p>
        </div>
      </div>
    );
  }

  const isUp = lastSignal.prediction === 'up';
  const signalColor = {
    buy: 'text-green-400 bg-green-400/10 border-green-400/30',
    sell: 'text-red-400 bg-red-400/10 border-red-400/30',
    hold: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  }[lastSignal.signal];

  const animationClass = isUp ? 'animate-pulse-green' : 'animate-pulse-red';
  const borderColor = isUp ? 'border-green-500/40' : 'border-red-500/40';

  return (
    <div className="p-4 border-b border-[#374151]">
      <div className={`bg-[#1e2636] rounded-xl p-4 border ${borderColor} ${animationClass} animate-fade-in`}>
        {/* Top row: prediction + signal */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUp ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
              {isUp
                ? <TrendingUp size={20} className="text-green-400" />
                : <TrendingDown size={20} className="text-red-400" />
              }
            </div>
            <div>
              <p className={`text-xl font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? '↑ UP' : '↓ DOWN'}
              </p>
              <p className="text-[10px] text-[#6b7280] uppercase tracking-wide">
                {lastSignal.ta.trendBias} · RSI {lastSignal.ta.rsi}
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border uppercase tracking-wide ${signalColor}`}>
            {lastSignal.signal}
          </span>
        </div>

        {/* Confidence bar */}
        <div className="mb-3">
          <ConfidenceBar value={lastSignal.confidence} />
        </div>

        {/* TA quick stats */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-[10px]">
          <div className="bg-[#111827] rounded p-1.5 text-center">
            <p className="text-[#6b7280]">EMA9</p>
            <p className="text-white font-mono">${lastSignal.ta.ema9.toLocaleString()}</p>
          </div>
          <div className="bg-[#111827] rounded p-1.5 text-center">
            <p className="text-[#6b7280]">EMA21</p>
            <p className="text-white font-mono">${lastSignal.ta.ema21.toLocaleString()}</p>
          </div>
          <div className="bg-[#111827] rounded p-1.5 text-center">
            <p className="text-[#6b7280]">Price</p>
            <p className="text-white font-mono">${lastSignal.ta.currentPrice.toLocaleString()}</p>
          </div>
        </div>

        {/* Rationale */}
        <p className="text-[#d1d5db] text-xs leading-relaxed mb-2">{lastSignal.rationale}</p>

        {lastSignal.keyLevels && (
          <p className="text-[#9ca3af] text-[11px] italic">{lastSignal.keyLevels}</p>
        )}

        {/* Overshoot visual notes — from snapshot taken at submit time */}
        {lastOvershootSnapshot && (
          <div className="mt-3 border-t border-[#374151] pt-3">
            <button
              onClick={() => setShowOvershoot(v => !v)}
              className="flex items-center gap-1.5 text-[11px] text-[#9ca3af] hover:text-white transition-colors"
            >
              <Eye size={12} />
              Visual analysis (Overshoot.ai)
              {showOvershoot ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showOvershoot && (
              <p className="mt-2 text-[11px] text-[#9ca3af] leading-relaxed">{lastOvershootSnapshot}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
