import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Eye, Zap, AlertTriangle, Clock } from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import { COINS } from '../lib/coins';

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? 'bg-accent-green' : pct >= 50 ? 'bg-accent-amber' : 'bg-accent-red';
  const label = pct >= 70 ? 'High' : pct >= 50 ? 'Medium' : 'Low';
  const labelColor = pct >= 70 ? 'text-accent-green' : pct >= 50 ? 'text-accent-amber' : 'text-accent-red';
  const explanation = pct >= 70
    ? 'Strong conviction — indicators align'
    : pct >= 50
      ? 'Moderate — some conflicting signals'
      : 'Low — indicators are mixed or unclear';

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-muted font-heading">Confidence</span>
        <span className={`text-[11px] font-semibold font-mono ${labelColor}`}>{label} · {pct}%</span>
      </div>
      <div className="h-2 bg-border-strong rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted font-heading">{explanation}</p>
    </div>
  );
}

function TimeAgo({ timestamp }: { timestamp: number }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 10000);
    return () => clearInterval(t);
  }, []);

  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  let label: string;
  if (seconds < 10) label = 'just now';
  else if (seconds < 60) label = `${seconds}s ago`;
  else if (seconds < 3600) label = `${Math.floor(seconds / 60)}m ago`;
  else label = `${Math.floor(seconds / 3600)}h ago`;

  return (
    <span className="flex items-center gap-1 text-[10px] text-muted font-heading">
      <Clock size={9} />
      {label}
    </span>
  );
}

export default function SignalDisplay() {
  const { lastSignal, isAnalyzing, lastOvershootSnapshot, analysisTimestamp, selectedCoin } = useTradingContext();
  const [showOvershoot, setShowOvershoot] = useState(false);
  const coin = COINS[selectedCoin];

  if (isAnalyzing) {
    return (
      <div className="p-4 border-b border-border-subtle">
        <div className="bg-surface rounded-inner p-4 border border-border-subtle animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-lg bg-border-strong" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-border-strong rounded w-28" />
              <div className="h-3 bg-border-strong rounded w-20" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-border-strong rounded" />
            <div className="h-3 bg-border-strong rounded w-4/5" />
          </div>
          <p className="text-center text-muted text-xs mt-3 font-heading">Analyzing {coin.symbol} with Groq + TA...</p>
        </div>
      </div>
    );
  }

  if (!lastSignal) {
    return (
      <div className="px-4 py-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-2.5 px-3 py-2 bg-surface rounded-inner border border-dashed border-border-strong">
          <TrendingUp size={14} className="text-muted flex-shrink-0" />
          <p className="text-muted text-xs font-heading">Enter a prompt above to get AI-powered {coin.symbol} analysis</p>
        </div>
      </div>
    );
  }

  const isUp = lastSignal.prediction === 'up';
  const signalGlow = {
    buy: 'shadow-glow-green',
    sell: 'shadow-glow-red',
    hold: '',
  }[lastSignal.signal];
  const signalColor = {
    buy: `text-accent-green bg-accent-green/15 border-accent-green/40 ${signalGlow}`,
    sell: `text-accent-red bg-accent-red/15 border-accent-red/40 ${signalGlow}`,
    hold: 'text-accent-amber bg-accent-amber/15 border-accent-amber/40',
  }[lastSignal.signal];

  const borderColor = isUp ? 'border-accent-green/40' : 'border-accent-red/40';
  const modelName = lastSignal.modelUsed?.replace(/-versatile|-instant/g, '') ?? 'groq';

  return (
    <div className="p-4 border-b border-border-subtle">
      <div className={`bg-surface rounded-inner p-4 border ${borderColor} animate-fade-in`}>
        {/* Top row: prediction + signal — BIGGER */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${isUp ? 'bg-accent-green/10' : 'bg-accent-red/10'}`}>
              {isUp
                ? <TrendingUp size={28} className="text-accent-green" />
                : <TrendingDown size={28} className="text-accent-red" />
              }
            </div>
            <div>
              <p className={`text-2xl font-bold font-heading leading-tight ${isUp ? 'text-accent-green text-glow-green' : 'text-accent-red text-glow-red'}`}>
                {isUp ? '↑ UP' : '↓ DOWN'}
              </p>
              <p className="text-[10px] text-muted uppercase tracking-wide font-heading">
                {lastSignal.ta.trendBias} · RSI {lastSignal.ta.rsi} · Score {lastSignal.ta.signalScore > 0 ? '+' : ''}{lastSignal.ta.signalScore}
              </p>
            </div>
          </div>
          <span className={`text-sm font-bold font-heading px-4 py-2 rounded-full border uppercase tracking-wider ${signalColor}`}>
            {lastSignal.signal}
          </span>
        </div>

        {/* Confidence bar */}
        <div className="mb-3">
          <ConfidenceBar value={lastSignal.confidence} />
        </div>

        {/* Metadata row: model + timestamp */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[10px] text-muted font-mono">
            Model: {modelName}
          </span>
          {analysisTimestamp && <TimeAgo timestamp={analysisTimestamp} />}
        </div>

        {/* Signal score */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-muted font-heading">Signal Score</span>
          <div className="flex-1 h-2 bg-border-strong rounded-full overflow-hidden">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 text-[11px]">
          <div className="bg-body rounded-lg p-2 text-center">
            <p className="text-muted font-heading mb-0.5">RSI</p>
            <p className={`font-mono font-semibold ${lastSignal.ta.rsiZone === 'overbought' ? 'text-accent-red' : lastSignal.ta.rsiZone === 'oversold' ? 'text-accent-green' : 'text-white'}`}>
              {lastSignal.ta.rsi}
            </p>
          </div>
          <div className="bg-body rounded-lg p-2 text-center">
            <p className="text-muted font-heading mb-0.5">MACD</p>
            <p className={`font-mono font-semibold ${lastSignal.ta.macdHistogram >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {lastSignal.ta.macdHistogram > 0 ? '+' : ''}{lastSignal.ta.macdHistogram}
            </p>
          </div>
          <div className="bg-body rounded-lg p-2 text-center">
            <p className="text-muted font-heading mb-0.5">Stoch %K</p>
            <p className={`font-mono font-semibold ${lastSignal.ta.stochSignal === 'oversold' ? 'text-accent-green' : lastSignal.ta.stochSignal === 'overbought' ? 'text-accent-red' : 'text-white'}`}>
              {lastSignal.ta.stochK}
            </p>
          </div>
          <div className="bg-body rounded-lg p-2 text-center">
            <p className="text-muted font-heading mb-0.5">BB %B</p>
            <p className={`font-mono font-semibold ${lastSignal.ta.bbPctB > 0.8 ? 'text-accent-red' : lastSignal.ta.bbPctB < 0.2 ? 'text-accent-green' : 'text-white'}`}>
              {lastSignal.ta.bbPctB}{lastSignal.ta.bbSqueeze ? ' !' : ''}
            </p>
          </div>
          <div className="bg-body rounded-lg p-2 text-center">
            <p className="text-muted font-heading mb-0.5">Support</p>
            <p className="text-white font-mono">${lastSignal.ta.support.toLocaleString()}</p>
          </div>
          <div className="bg-body rounded-lg p-2 text-center">
            <p className="text-muted font-heading mb-0.5">Resist</p>
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
        <p className="text-white/80 text-[13px] leading-relaxed mb-2">{lastSignal.rationale}</p>

        {lastSignal.keyLevels && (
          <p className="text-muted text-[11px] italic mb-2">{lastSignal.keyLevels}</p>
        )}

        {/* Action box */}
        {lastSignal.action && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-inner bg-accent-green/5 border border-accent-green/20 mb-2">
            <Zap size={12} className="text-accent-green flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-accent-green leading-relaxed">{lastSignal.action}</p>
          </div>
        )}

        {/* Risk box */}
        {lastSignal.risk && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-inner bg-accent-amber/5 border border-accent-amber/20 mb-2">
            <AlertTriangle size={12} className="text-accent-amber flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-accent-amber/80 leading-relaxed">{lastSignal.risk}</p>
          </div>
        )}

        {/* Overshoot visual notes */}
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
