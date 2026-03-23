import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TrendingUp, TrendingDown, ChevronDown, ChevronUp, Eye, Zap, AlertTriangle,
  Clock, ShieldCheck, Shield, ShieldAlert, Scale, Brain, Activity, BarChart3, Layers, Target,
} from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import { COINS } from '../lib/coins';
import { api } from '../lib/api';
import type { ConfidenceBreakdown } from '../lib/api';
import { fireBuyConfetti } from '../hooks/useDopamine';

/* ── helpers ── */

// CRITICAL IMPROVEMENT: Animated count-up for confidence percentage
function useCountUp(target: number, duration = 600): number {
  const [current, setCurrent] = useState(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (target === prevTarget.current && current !== 0) return;
    prevTarget.current = target;
    const start = performance.now();
    let rafId: number;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  return current;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const displayPct = useCountUp(pct);
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
        <span className={`text-[11px] font-semibold font-mono ${labelColor}`}>{label} · {displayPct}%</span>
      </div>
      <div className="h-2 bg-border-strong rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
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

function ReliabilityBadge({ confidence, signalScore }: { confidence: number; signalScore: number }) {
  const absScore = Math.abs(signalScore);
  const isGreen = confidence >= 0.75 && absScore >= 4;
  const isYellow = !isGreen && (confidence >= 0.60 || absScore >= 3);

  if (isGreen) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-accent-green font-heading">
        <ShieldCheck size={11} />
        Reliable
      </span>
    );
  }
  if (isYellow) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-accent-amber font-heading">
        <Shield size={11} />
        Moderate
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] text-accent-red font-heading">
      <ShieldAlert size={11} />
      Low
    </span>
  );
}

const BREAKDOWN_ICONS: Record<keyof ConfidenceBreakdown, typeof TrendingUp> = {
  trend: TrendingUp,
  momentum: Activity,
  volatility: BarChart3,
  structure: Layers,
  confluence: Target,
};

const BREAKDOWN_LABELS: Record<keyof ConfidenceBreakdown, string> = {
  trend: 'Trend',
  momentum: 'Momentum',
  volatility: 'Volatility',
  structure: 'Structure',
  confluence: 'Confluence',
};

/* ── main component ── */

export default function SignalDisplay() {
  const {
    lastSignal, isAnalyzing, lastOvershootSnapshot, analysisTimestamp, selectedCoin,
    critiqueResult, setCritiqueResult, isCritiquing, setIsCritiquing, showToast,
  } = useTradingContext();
  const [showOvershoot, setShowOvershoot] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const coin = COINS[selectedCoin];
  const prevSignalRef = useRef(lastSignal);

  // Fire confetti on strong buy signal
  useEffect(() => {
    if (lastSignal && lastSignal !== prevSignalRef.current) {
      if (lastSignal.signal === 'buy' && lastSignal.confidence > 0.75) {
        fireBuyConfetti();
      }
      prevSignalRef.current = lastSignal;
    }
  }, [lastSignal]);

  const handleCritique = useCallback(async () => {
    if (!lastSignal || isCritiquing) return;
    setIsCritiquing(true);
    setCritiqueResult(null);
    try {
      const result = await api.critique(lastSignal, coin.symbol);
      setCritiqueResult(result);
    } catch (err) {
      showToast(`Critique failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsCritiquing(false);
    }
  }, [lastSignal, isCritiquing, coin.symbol, setIsCritiquing, setCritiqueResult, showToast]);

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
          <p className="text-center text-muted text-xs mt-3 font-heading">Analyzing {coin.symbol} with Stocky AI...</p>
        </div>
      </div>
    );
  }

  if (!lastSignal) {
    return null;
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
  const _modelUsed = lastSignal.modelUsed; // kept for debugging
  const breakdown = lastSignal.confidenceBreakdown;

  return (
    <div className="p-4 border-b border-border-subtle">
      <div className={`bg-surface rounded-inner p-4 border ${borderColor} animate-fade-in`}>
        {/* Top row: prediction + signal */}
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

        {/* Metadata row: model + reliability + timestamp */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-3">
            <a href="https://www.charandeepkapoor.com/blog/stocky-ai" target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent-green/70 hover:text-accent-green font-heading transition-colors">
              Stocky AI
            </a>
            <ReliabilityBadge confidence={lastSignal.confidence} signalScore={lastSignal.ta.signalScore} />
          </div>
          {analysisTimestamp && <TimeAgo timestamp={analysisTimestamp} />}
        </div>

        {/* AI Reasoning breakdown (collapsible) */}
        {breakdown && (
          <div className="mb-3">
            <button
              onClick={() => setShowBreakdown(v => !v)}
              className="flex items-center gap-1.5 text-[11px] text-muted hover:text-white transition-colors font-heading mb-1"
            >
              <Brain size={12} />
              {showBreakdown ? 'Hide' : 'Show'} AI Reasoning
              {showBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showBreakdown && (
              <div className="space-y-1.5 mt-2 p-3 bg-body rounded-lg border border-border-subtle">
                {(Object.keys(BREAKDOWN_LABELS) as (keyof ConfidenceBreakdown)[]).map(key => {
                  const Icon = BREAKDOWN_ICONS[key];
                  const text = breakdown[key];
                  if (!text) return null;
                  return (
                    <div key={key} className="flex items-start gap-2">
                      <Icon size={12} className="text-muted flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-muted font-heading uppercase tracking-wide">{BREAKDOWN_LABELS[key]}</span>
                        <p className="text-[11px] text-white/80 leading-relaxed">{text}</p>
                      </div>
                    </div>
                  );
                })}
                {lastSignal.thinking && (
                  <details className="mt-2 border-t border-border-subtle pt-2">
                    <summary className="text-[10px] text-muted font-heading cursor-pointer hover:text-white transition-colors">
                      Raw Chain-of-Thought
                    </summary>
                    <p className="mt-1 text-[10px] text-muted/70 leading-relaxed font-mono whitespace-pre-wrap">{lastSignal.thinking}</p>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

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

        {/* Second Opinion button + critique panel */}
        <div className="mt-3 border-t border-border-subtle pt-3">
          <button
            onClick={handleCritique}
            disabled={isCritiquing}
            className={`flex items-center gap-1.5 text-[11px] font-heading px-3 py-1.5 rounded-inner border transition-all ${
              isCritiquing
                ? 'border-border-subtle text-muted cursor-wait animate-pulse'
                : critiqueResult
                  ? 'border-border-subtle text-muted hover:text-white hover:border-border-strong'
                  : 'border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10'
            }`}
          >
            <Scale size={12} />
            {isCritiquing ? 'Getting second opinion...' : critiqueResult ? 'Refresh Second Opinion' : 'Get Second Opinion'}
          </button>

          {critiqueResult && (
            <div className="mt-3 p-3 bg-body rounded-lg border border-border-subtle space-y-2">
              {/* Verdict badge */}
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold font-heading px-2.5 py-1 rounded-full border uppercase tracking-wide ${
                  critiqueResult.verdict === 'agree'
                    ? 'text-accent-green bg-accent-green/10 border-accent-green/30'
                    : critiqueResult.verdict === 'disagree'
                      ? 'text-accent-red bg-accent-red/10 border-accent-red/30'
                      : 'text-accent-amber bg-accent-amber/10 border-accent-amber/30'
                }`}>
                  {critiqueResult.verdict === 'agree' ? 'Agrees' : critiqueResult.verdict === 'disagree' ? 'Disagrees' : 'Partially Agrees'}
                </span>
                <span className="text-[10px] text-muted font-mono">
                  Adjusted: {Math.round(critiqueResult.adjustedConfidence * 100)}% vs {Math.round(lastSignal.confidence * 100)}%
                </span>
              </div>

              {/* Flaws */}
              {critiqueResult.flaws.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted font-heading uppercase tracking-wide mb-1">Flaws Found</p>
                  <ul className="space-y-0.5">
                    {critiqueResult.flaws.map((flaw, i) => (
                      <li key={i} className="text-[11px] text-accent-red/80 leading-relaxed flex items-start gap-1.5">
                        <span className="text-accent-red mt-0.5">•</span>
                        {flaw}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Overlooked */}
              {critiqueResult.overlooked && (
                <div>
                  <p className="text-[10px] text-muted font-heading uppercase tracking-wide mb-1">Overlooked</p>
                  <p className="text-[11px] text-white/70 leading-relaxed">{critiqueResult.overlooked}</p>
                </div>
              )}

              {/* Alternative view */}
              {critiqueResult.alternativeView && (
                <div>
                  <p className="text-[10px] text-muted font-heading uppercase tracking-wide mb-1">Alternative View</p>
                  <p className="text-[11px] text-white/70 leading-relaxed">{critiqueResult.alternativeView}</p>
                </div>
              )}
            </div>
          )}
        </div>

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
