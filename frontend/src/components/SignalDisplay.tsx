import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? 'bg-accent-green' : pct >= 50 ? 'bg-accent-amber' : 'bg-accent-red';
  const label = pct >= 70 ? 'High' : pct >= 50 ? 'Medium' : 'Low';
  const labelColor = pct >= 70 ? 'text-accent-green' : pct >= 50 ? 'text-accent-amber' : 'text-accent-red';

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-muted font-heading">Confidence</span>
        <span className={`text-[11px] font-semibold font-mono ${labelColor}`}>{label} · {pct}%</span>
      </div>
      <div className="h-1.5 bg-border-strong rounded-full overflow-hidden">
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
      <div className="p-4 border-b border-border-subtle">
        <div className="bg-surface rounded-inner p-4 border border-border-subtle animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-border-strong" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-border-strong rounded w-24" />
              <div className="h-3 bg-border-strong rounded w-16" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-border-strong rounded" />
            <div className="h-3 bg-border-strong rounded w-4/5" />
          </div>
          <p className="text-center text-muted text-xs mt-3 font-heading">Analyzing with Groq + TA...</p>
        </div>
      </div>
    );
  }

  if (!lastSignal) {
    return (
      <div className="px-4 py-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-2.5 px-3 py-2 bg-surface rounded-inner border border-dashed border-border-strong">
          <TrendingUp size={14} className="text-muted flex-shrink-0" />
          <p className="text-muted text-xs font-heading">Enter a prompt above to get AI-powered BTC analysis</p>
        </div>
      </div>
    );
  }

  const isUp = lastSignal.prediction === 'up';
  const signalColor = {
    buy: 'text-accent-green bg-accent-green/10 border-accent-green/30',
    sell: 'text-accent-red bg-accent-red/10 border-accent-red/30',
    hold: 'text-accent-amber bg-accent-amber/10 border-accent-amber/30',
  }[lastSignal.signal];

  const animationClass = isUp ? 'animate-pulse-green' : 'animate-pulse-red';
  const borderColor = isUp ? 'border-accent-green/40' : 'border-accent-red/40';

  return (
    <div className="p-4 border-b border-border-subtle">
      <div className={`bg-surface rounded-inner p-4 border ${borderColor} ${animationClass} animate-fade-in`}>
        {/* Top row: prediction + signal */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUp ? 'bg-accent-green/10' : 'bg-accent-red/10'}`}>
              {isUp
                ? <TrendingUp size={20} className="text-accent-green" />
                : <TrendingDown size={20} className="text-accent-red" />
              }
            </div>
            <div>
              <p className={`text-xl font-bold font-heading ${isUp ? 'text-accent-green text-glow-green' : 'text-accent-red text-glow-red'}`}>
                {isUp ? '↑ UP' : '↓ DOWN'}
              </p>
              <p className="text-[10px] text-muted uppercase tracking-wide font-heading">
                {lastSignal.ta.trendBias} · RSI {lastSignal.ta.rsi} · Score {lastSignal.ta.signalScore > 0 ? '+' : ''}{lastSignal.ta.signalScore}
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold font-heading px-3 py-1.5 rounded-full border uppercase tracking-wide ${signalColor}`}>
            {lastSignal.signal}
          </span>
        </div>

        {/* Confidence bar */}
        <div className="mb-3">
          <ConfidenceBar value={lastSignal.confidence} />
        </div>

        {/* Signal score */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-muted font-heading">Signal Score</span>
          <div className="flex-1 h-1.5 bg-border-strong rounded-full overflow-hidden">
            {/* Map score -10..+10 to 0..100% */}
            <div
              className={`h-full rounded-full transition-all duration-700 ${lastSignal.ta.signalScore >= 0 ? 'bg-accent-green' : 'bg-accent-red'}`}
              style={{ width: `${Math.min(100, Math.max(0, (lastSignal.ta.signalScore + 10) * 5))}%` }}
            />
          </div>
          <span className={`text-[10px] font-bold font-mono ${lastSignal.ta.signalScore >= 4 ? 'text-accent-green text-glow-green' : lastSignal.ta.signalScore <= -4 ? 'text-accent-red text-glow-red' : 'text-accent-amber'}`}>
            {lastSignal.ta.signalScore > 0 ? '+' : ''}{lastSignal.ta.signalScore}
          </span>
        </div>

        {/* TA quick stats */}
        <div className="grid grid-cols-3 gap-1.5 mb-3 text-[10px]">
          <div className="bg-body rounded-lg p-1.5 text-center">
            <p className="text-muted font-heading">RSI</p>
            <p className={`font-mono font-semibold ${lastSignal.ta.rsiZone === 'overbought' ? 'text-accent-red' : lastSignal.ta.rsiZone === 'oversold' ? 'text-accent-green' : 'text-white'}`}>
              {lastSignal.ta.rsi}
            </p>
          </div>
          <div className="bg-body rounded-lg p-1.5 text-center">
            <p className="text-muted font-heading">MACD</p>
            <p className={`font-mono font-semibold ${lastSignal.ta.macdHistogram >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {lastSignal.ta.macdHistogram > 0 ? '+' : ''}{lastSignal.ta.macdHistogram}
            </p>
          </div>
          <div className="bg-body rounded-lg p-1.5 text-center">
            <p className="text-muted font-heading">Stoch %K</p>
            <p className={`font-mono font-semibold ${lastSignal.ta.stochSignal === 'oversold' ? 'text-accent-green' : lastSignal.ta.stochSignal === 'overbought' ? 'text-accent-red' : 'text-white'}`}>
              {lastSignal.ta.stochK}
            </p>
          </div>
          <div className="bg-body rounded-lg p-1.5 text-center">
            <p className="text-muted font-heading">BB %B</p>
            <p className={`font-mono font-semibold ${lastSignal.ta.bbPctB > 0.8 ? 'text-accent-red' : lastSignal.ta.bbPctB < 0.2 ? 'text-accent-green' : 'text-white'}`}>
              {lastSignal.ta.bbPctB}{lastSignal.ta.bbSqueeze ? ' 🤏' : ''}
            </p>
          </div>
          <div className="bg-body rounded-lg p-1.5 text-center">
            <p className="text-muted font-heading">Support</p>
            <p className="text-white font-mono">${lastSignal.ta.support.toLocaleString()}</p>
          </div>
          <div className="bg-body rounded-lg p-1.5 text-center">
            <p className="text-muted font-heading">Resist</p>
            <p className="text-white font-mono">${lastSignal.ta.resistance.toLocaleString()}</p>
          </div>
        </div>

        {/* MACD cross badge */}
        {lastSignal.ta.macdCross !== 'none' && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-inner text-[10px] font-semibold font-heading mb-3 ${
            lastSignal.ta.macdCross === 'bullish_cross'
              ? 'bg-accent-green/10 text-accent-green border border-accent-green/30'
              : 'bg-accent-red/10 text-accent-red border border-accent-red/30'
          }`}>
            <span>{lastSignal.ta.macdCross === 'bullish_cross' ? '▲' : '▼'}</span>
            <span>MACD {lastSignal.ta.macdCross === 'bullish_cross' ? 'Bullish' : 'Bearish'} Cross</span>
          </div>
        )}

        {/* Rationale */}
        <p className="text-white/80 text-xs leading-relaxed mb-2">{lastSignal.rationale}</p>

        {lastSignal.keyLevels && (
          <p className="text-muted text-[11px] italic">{lastSignal.keyLevels}</p>
        )}

        {/* Overshoot visual notes — from snapshot taken at submit time */}
        {lastOvershootSnapshot && (
          <div className="mt-3 border-t border-border-subtle pt-3">
            <button
              onClick={() => setShowOvershoot(v => !v)}
              className="flex items-center gap-1.5 text-[11px] text-muted hover:text-white transition-colors font-heading"
            >
              <Eye size={12} />
              Visual analysis (Overshoot.ai)
              {showOvershoot ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showOvershoot && (
              <p className="mt-2 text-[11px] text-muted leading-relaxed">{lastOvershootSnapshot}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
