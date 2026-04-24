import { useState } from 'react';
import {
  TrendingUp, ChevronDown, ChevronUp,
  Zap, AlertTriangle, ArrowDown,
  Activity, BarChart3, Layers, Target,
} from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import type { ConfidenceBreakdown } from '../lib/api';

// Best-effort regex pluck of Entry/Stop/Target/R:R from the AI's action sentence.
function parsePlan(action: string): { entry?: string; stop?: string; target?: string; rr?: string; remainder?: string } {
  const grab = (re: RegExp): string | undefined => {
    const m = action.match(re);
    return m ? m[1] : undefined;
  };
  const entry = grab(/entry[:\s]+\$?([\d,]+(?:\.\d+)?)/i);
  const stop = grab(/stop(?:[-\s]?loss)?[:\s]+\$?([\d,]+(?:\.\d+)?)/i);
  const target = grab(/target[:\s]+\$?([\d,]+(?:\.\d+)?)/i);
  const rr = grab(/R[:\s]*R\s*[:≈=]?\s*([\d.]+\s*:\s*[\d.]+|[\d.]+)/i);
  const parsedAny = entry || stop || target || rr;
  if (!parsedAny) return { remainder: action };
  return { entry, stop, target, rr };
}

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

  const { signal, rationale, action, risk, ta, confidenceBreakdown } = lastSignal;
  const isHold = signal === 'hold';

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const scrollToOrder = () => {
    document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

      {/* Action callout with CTA button */}
      {action && !isHold && (() => {
        const plan = parsePlan(action);
        return (
          <div className="mt-md rounded-md bg-positive-muted border border-positive/30 p-md">
            <div className="flex items-center gap-xs mb-sm">
              <Zap size={12} className="text-positive-text" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-positive-text">Plan</span>
            </div>

            {plan.remainder ? (
              <p className="text-[11px] text-positive-text leading-snug">{plan.remainder}</p>
            ) : (
              <div className="grid grid-cols-2 gap-xs">
                {plan.entry && (
                  <div className="rounded bg-bg-primary/40 px-sm py-xs border border-positive/10">
                    <div className="text-[9px] uppercase tracking-wider text-positive-text/70">Entry</div>
                    <div className="text-xs font-mono font-semibold text-positive-text">${plan.entry}</div>
                  </div>
                )}
                {plan.stop && (
                  <div className="rounded bg-bg-primary/40 px-sm py-xs border border-positive/10">
                    <div className="text-[9px] uppercase tracking-wider text-positive-text/70">Stop</div>
                    <div className="text-xs font-mono font-semibold text-negative">${plan.stop}</div>
                  </div>
                )}
                {plan.target && (
                  <div className="rounded bg-bg-primary/40 px-sm py-xs border border-positive/10">
                    <div className="text-[9px] uppercase tracking-wider text-positive-text/70">Target</div>
                    <div className="text-xs font-mono font-semibold text-positive">${plan.target}</div>
                  </div>
                )}
                {plan.rr && (
                  <div className="rounded bg-bg-primary/40 px-sm py-xs border border-positive/10">
                    <div className="text-[9px] uppercase tracking-wider text-positive-text/70">R:R</div>
                    <div className="text-xs font-mono font-semibold text-positive-text">{plan.rr}</div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={scrollToOrder}
              className="mt-sm w-full flex items-center justify-center gap-2xs px-sm py-sm rounded-md bg-positive text-white text-xs font-bold uppercase tracking-wide hover:bg-positive-hover transition-colors"
            >
              <ArrowDown size={11} /> Open order ticket
            </button>
          </div>
        );
      })()}

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
