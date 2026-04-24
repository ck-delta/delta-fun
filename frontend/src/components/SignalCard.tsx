import { useState } from 'react';
import {
  TrendingUp, ChevronDown, ChevronUp,
  AlertTriangle,
  Activity, BarChart3, Layers, Target,
} from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import type { ConfidenceBreakdown } from '../lib/api';

function KeyPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col items-start gap-[2px] px-sm py-xs rounded-md bg-bg-primary border border-divider">
      <span className="text-[9px] uppercase tracking-wider text-fg-tertiary">{label}</span>
      <span className="text-[13px] font-mono font-semibold text-fg-primary truncate">{value}</span>
    </div>
  );
}

const PILLAR_META: Record<keyof ConfidenceBreakdown, { label: string; Icon: typeof TrendingUp }> = {
  trend:      { label: 'Trend',      Icon: TrendingUp },
  momentum:   { label: 'Momentum',   Icon: Activity },
  volatility: { label: 'Volatility', Icon: BarChart3 },
  structure:  { label: 'Structure',  Icon: Layers },
  confluence: { label: 'Confluence', Icon: Target },
};

function PillarCard({ k, text }: { k: keyof ConfidenceBreakdown; text: string }) {
  const { Icon, label } = PILLAR_META[k];
  return (
    <div className="flex items-start gap-sm p-sm rounded-md bg-bg-primary border border-divider">
      <Icon size={12} className="text-fg-tertiary flex-shrink-0 mt-[2px]" />
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-wider text-fg-tertiary">{label}</div>
        <div className="text-[11px] text-fg-primary/90 leading-snug">{text}</div>
      </div>
    </div>
  );
}

export default function SignalCard() {
  const { lastSignal } = useTradingContext();
  const [showRationale, setShowRationale] = useState(false);

  // Hero (signal + direction + confidence) now lives in SignalHero.
  // This card holds the supporting detail: key levels, pillars, plan, risk, rationale.
  if (!lastSignal) return null;

  const { rationale, risk, ta, confidenceBreakdown } = lastSignal;

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div className="rounded-xl bg-bg-surface-alt border border-divider p-lg animate-fade-in">
      {/* Key levels — 3 pills */}
      <div className="flex gap-xs">
        <KeyPill label="Support" value={fmt(ta.support)} />
        <KeyPill label="Resist" value={fmt(ta.resistance)} />
        <KeyPill label="EMA200" value={fmt(ta.ema200)} />
      </div>

      {/* Pillars — 2×2 grid of short one-liners */}
      {confidenceBreakdown && (
        <div className="mt-md grid grid-cols-1 sm:grid-cols-2 gap-xs">
          {(['trend', 'momentum', 'volatility', 'structure'] as const).map(k => {
            const text = confidenceBreakdown[k];
            if (!text) return null;
            return <PillarCard key={k} k={k} text={text} />;
          })}
        </div>
      )}

      {/* Risk callout */}
      {risk && (
        <div className="mt-sm rounded-md bg-warning-muted border border-warning/30 p-md">
          <div className="flex items-center gap-xs mb-xs">
            <AlertTriangle size={12} className="text-warning-text" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-warning-text">Invalidates if</span>
          </div>
          <p className="text-[11px] text-warning-text leading-snug">{risk}</p>
        </div>
      )}

      {/* Rationale — hidden by default */}
      {rationale && (
        <div className="mt-md pt-md border-t border-divider">
          <button
            onClick={() => setShowRationale(v => !v)}
            className="w-full flex items-center justify-center gap-2xs text-[11px] text-fg-tertiary hover:text-fg-primary transition-colors"
          >
            {showRationale ? 'Hide' : 'Show'} rationale
            {showRationale ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {showRationale && (
            <p className="mt-sm text-[12px] leading-relaxed text-fg-primary/80">{rationale}</p>
          )}
        </div>
      )}
    </div>
  );
}
