import { useState } from 'react';
import {
  Sparkles, ArrowDown, ChevronDown, ChevronUp,
  Activity, BarChart3, Layers, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import { displayBase } from '../lib/products';
import type { ConfidenceBreakdown } from '../lib/api';

type StateKey = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

// Classify the AI signal into a 5-state label using signal + confidence.
function classify(signal: 'buy' | 'sell' | 'hold', confidence: number): StateKey {
  if (signal === 'buy')  return confidence >= 0.8 ? 'STRONG_BUY'  : 'BUY';
  if (signal === 'sell') return confidence >= 0.8 ? 'STRONG_SELL' : 'SELL';
  return 'NEUTRAL';
}

interface StateTone {
  bg: string;
  border: string;
  accent: string;
  tileBorder: string;
  confBar: string;
  ctaBg: string;
  label: string;
}

const TONE: Record<StateKey, StateTone> = {
  STRONG_BUY: {
    bg: 'bg-positive-muted',
    border: 'border-positive',
    accent: 'text-positive',
    tileBorder: 'border-positive/15',
    confBar: 'bg-positive',
    ctaBg: 'bg-positive hover:brightness-110 text-white',
    label: 'Strong Buy',
  },
  BUY: {
    bg: 'bg-positive-muted',
    border: 'border-positive/40',
    accent: 'text-positive',
    tileBorder: 'border-positive/15',
    confBar: 'bg-positive',
    ctaBg: 'bg-positive hover:brightness-110 text-white',
    label: 'Buy',
  },
  NEUTRAL: {
    bg: 'bg-warning-muted',
    border: 'border-warning/40',
    accent: 'text-warning',
    tileBorder: 'border-warning/15',
    confBar: 'bg-warning',
    ctaBg: 'bg-brand hover:bg-brand-hover text-white',
    label: 'Neutral',
  },
  SELL: {
    bg: 'bg-negative-muted',
    border: 'border-negative/40',
    accent: 'text-negative',
    tileBorder: 'border-negative/15',
    confBar: 'bg-negative',
    ctaBg: 'bg-negative hover:brightness-110 text-white',
    label: 'Sell',
  },
  STRONG_SELL: {
    bg: 'bg-negative-muted',
    border: 'border-negative',
    accent: 'text-negative',
    tileBorder: 'border-negative/15',
    confBar: 'bg-negative',
    ctaBg: 'bg-negative hover:brightness-110 text-white',
    label: 'Strong Sell',
  },
};

const fmtPrice = (n: number) =>
  `$${n.toLocaleString(undefined, { maximumFractionDigits: n >= 100 ? 2 : 4 })}`;

// Fallback: best-effort regex pluck of Entry/Stop/Target/R:R from an action sentence.
function parsePlanFromAction(action: string): { entry?: string; stop?: string; target?: string; rr?: string } | null {
  const grab = (re: RegExp): string | undefined => action.match(re)?.[1];
  const priced = (s?: string) => (s ? `$${s}` : undefined);
  const entry  = priced(grab(/entry[:\s]+\$?([\d,]+(?:\.\d+)?)/i));
  const stop   = priced(grab(/stop(?:[-\s]?loss)?[:\s]+\$?([\d,]+(?:\.\d+)?)/i));
  const target = priced(grab(/target[:\s]+\$?([\d,]+(?:\.\d+)?)/i));
  const rr     = grab(/R[:\s]*R\s*[:≈=]?\s*([\d.]+\s*:\s*[\d.]+|[\d.]+)/i);
  if (!entry && !stop && !target && !rr) return null;
  return { entry, stop, target, rr };
}

function PlanTile({
  label, value, valueClass, borderClass,
}: {
  label: string; value: string; valueClass: string; borderClass: string;
}) {
  return (
    <div className={`rounded-md bg-bg-sub-surface/60 px-sm py-xs border ${borderClass}`}>
      <div className="text-[9px] uppercase tracking-wider text-fg-tertiary">{label}</div>
      <div className={`text-xs font-mono font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}

const PILLAR_META: Record<keyof ConfidenceBreakdown, { label: string; Icon: typeof TrendingUp }> = {
  trend:      { label: 'Trend',      Icon: TrendingUp },
  momentum:   { label: 'Momentum',   Icon: Activity },
  volatility: { label: 'Volatility', Icon: BarChart3 },
  structure:  { label: 'Structure',  Icon: Layers },
  confluence: { label: 'Confluence', Icon: TrendingUp },
};

export default function SignalHero() {
  const { lastSignal, isAnalyzing, analysisError, selectedSymbol } = useTradingContext();
  const [showLogic, setShowLogic] = useState(false);

  if (isAnalyzing && !lastSignal) {
    return (
      <div className="rounded-2xl bg-bg-surface-alt border border-divider p-lg animate-pulse">
        <div className="flex items-center gap-sm text-fg-secondary">
          <Sparkles size={14} className="text-brand-text" />
          <span className="text-xs uppercase tracking-wide">Analysing {displayBase(selectedSymbol)}</span>
        </div>
        <div className="mt-md h-[36px] rounded-md bg-bg-primary" />
        <div className="mt-sm h-[10px] rounded-pill bg-bg-primary" />
      </div>
    );
  }

  if (analysisError && !lastSignal) {
    return (
      <div className="rounded-2xl bg-negative-muted border-2 border-negative/40 p-lg">
        <p className="text-sm text-negative-text font-semibold">AI signal unavailable</p>
        <p className="text-xs text-fg-tertiary mt-xs">{analysisError}</p>
      </div>
    );
  }

  if (!lastSignal) return null;

  const {
    signal, confidence, action, rationale, risk, confidenceBreakdown,
    plan: structuredPlan,
  } = lastSignal;
  const state = classify(signal, confidence);
  const tone = TONE[state];

  const confPct = Math.round(confidence * 100);

  const scrollToOrder = () => {
    document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const plan: { entry?: string; stop?: string; target?: string; rr?: string } | null = structuredPlan
    ? {
        entry: fmtPrice(structuredPlan.entry),
        stop: fmtPrice(structuredPlan.stop),
        target: fmtPrice(structuredPlan.target),
        rr: structuredPlan.rr,
      }
    : action
      ? parsePlanFromAction(action)
      : null;

  const asset = displayBase(selectedSymbol);

  return (
    <div className={`rounded-2xl border-2 ${tone.bg} ${tone.border} p-lg shadow-xl animate-fade-in`}>
      {/* Top strip */}
      <div className="flex items-center gap-sm mb-md">
        <Sparkles size={14} className={tone.accent} />
        <span className="text-[10px] uppercase tracking-widest font-bold text-fg-secondary">AI Signal</span>
      </div>

      {/* State label — big & bold, no icon */}
      <div className="mb-md">
        <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight uppercase leading-none ${tone.accent}`}>
          {tone.label}
        </span>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex justify-between text-[11px] mb-xs">
          <span className="uppercase tracking-wider font-semibold text-fg-secondary">Confidence</span>
          <span className={`font-mono font-bold ${tone.accent}`}>{confPct}%</span>
        </div>
        <div className="h-[10px] rounded-pill bg-bg-sub-surface overflow-hidden">
          <div className={`h-full ${tone.confBar} transition-all duration-500`} style={{ width: `${confPct}%` }} />
        </div>
      </div>

      {/* Plan grid (Entry / Stop / Target / R:R) */}
      {plan && (
        <div className="mt-md grid grid-cols-2 gap-xs">
          {plan.entry && (
            <PlanTile label="Entry" value={plan.entry} valueClass={tone.accent} borderClass={tone.tileBorder} />
          )}
          {plan.stop && (
            <PlanTile label="Stop" value={plan.stop} valueClass="text-negative" borderClass={tone.tileBorder} />
          )}
          {plan.target && (
            <PlanTile label="Target" value={plan.target} valueClass="text-positive" borderClass={tone.tileBorder} />
          )}
          {plan.rr && (
            <PlanTile label="R:R" value={plan.rr} valueClass={tone.accent} borderClass={tone.tileBorder} />
          )}
        </div>
      )}

      {/* Single CTA — always visible, "Trade <ASSET> now" */}
      <button
        onClick={scrollToOrder}
        className={`mt-md w-full flex items-center justify-center gap-xs px-md py-md rounded-lg text-sm font-bold uppercase tracking-wider shadow-lg transition-transform active:scale-[0.98] ${tone.ctaBg}`}
      >
        <ArrowDown size={14} strokeWidth={3} />
        Trade {asset} now
      </button>

      {/* Show Logic — collapsible reasoning */}
      <div className="mt-md pt-md border-t border-divider/60">
        <button
          onClick={() => setShowLogic(v => !v)}
          className={`w-full flex items-center justify-center gap-2xs text-[11px] font-semibold uppercase tracking-wider ${tone.accent} hover:brightness-125 transition-all`}
        >
          {showLogic ? 'Hide logic' : 'Show logic'}
          {showLogic ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showLogic && (
          <div className="mt-md space-y-sm animate-fade-in">
            {rationale && (
              <p className="text-[12px] leading-relaxed text-fg-primary/90">{rationale}</p>
            )}

            {confidenceBreakdown && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-xs">
                {(['trend', 'momentum', 'volatility', 'structure'] as const).map(k => {
                  const text = confidenceBreakdown[k];
                  if (!text) return null;
                  const { Icon, label } = PILLAR_META[k];
                  return (
                    <div key={k} className="flex items-start gap-sm p-sm rounded-md bg-bg-sub-surface/60 border border-divider/60">
                      <Icon size={11} className="text-fg-tertiary flex-shrink-0 mt-[2px]" />
                      <div className="min-w-0">
                        <div className="text-[9px] uppercase tracking-wider text-fg-tertiary">{label}</div>
                        <div className="text-[11px] text-fg-primary/90 leading-snug">{text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {risk && (
              <div className="flex items-start gap-xs p-sm rounded-md bg-warning-muted/50 border border-warning/30">
                <AlertTriangle size={12} className="text-warning-text flex-shrink-0 mt-[2px]" />
                <div className="min-w-0">
                  <div className="text-[9px] uppercase tracking-wider text-warning-text/80">Invalidates if</div>
                  <div className="text-[11px] text-warning-text leading-snug">{risk}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
