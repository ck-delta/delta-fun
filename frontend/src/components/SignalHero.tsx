import { TrendingUp, TrendingDown, Minus, Sparkles, ArrowDown } from 'lucide-react';
import { useTradingContext } from '../context/TradingContext';
import { displayBase } from '../lib/products';

export default function SignalHero() {
  const { lastSignal, isAnalyzing, analysisError, selectedSymbol } = useTradingContext();

  if (isAnalyzing && !lastSignal) {
    return (
      <div className="rounded-2xl bg-bg-surface-alt border border-divider p-lg animate-pulse">
        <div className="flex items-center gap-sm text-fg-secondary">
          <Sparkles size={14} className="text-brand-text" />
          <span className="text-xs uppercase tracking-wide">Analysing {displayBase(selectedSymbol)} · Sonnet 4.6</span>
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

  const { signal, prediction, confidence, ta } = lastSignal;

  const tone =
    signal === 'buy'
      ? {
          bg: 'bg-positive-muted',
          border: 'border-positive/40',
          pill: 'bg-positive text-white',
          accent: 'text-positive',
          label: 'BUY',
          Icon: TrendingUp,
        }
      : signal === 'sell'
        ? {
            bg: 'bg-negative-muted',
            border: 'border-negative/40',
            pill: 'bg-negative text-white',
            accent: 'text-negative',
            label: 'SELL',
            Icon: TrendingDown,
          }
        : {
            bg: 'bg-warning-muted',
            border: 'border-warning/40',
            pill: 'bg-warning text-grey-700',
            accent: 'text-warning',
            label: 'HOLD',
            Icon: Minus,
          };

  const confPct = Math.round(confidence * 100);
  const confTone = confPct >= 70 ? 'bg-positive' : confPct >= 55 ? 'bg-warning' : 'bg-negative';

  const scrollToOrder = () => {
    document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={`rounded-2xl border-2 ${tone.bg} ${tone.border} p-lg shadow-xl animate-fade-in`}>
      {/* Top strip: label + pill */}
      <div className="flex items-center justify-between mb-md">
        <div className="flex items-center gap-sm">
          <Sparkles size={14} className={tone.accent} />
          <span className="text-[10px] uppercase tracking-widest font-bold text-fg-secondary">AI Signal</span>
          <span className="text-[10px] text-fg-tertiary">· Sonnet 4.6</span>
        </div>
        <span className={`flex items-center gap-2xs px-md py-xs rounded-pill text-xs font-bold uppercase tracking-wider ${tone.pill} shadow-md`}>
          <tone.Icon size={14} strokeWidth={3} />
          {tone.label}
        </span>
      </div>

      {/* Direction — hero */}
      <div className="flex items-baseline gap-md mb-md">
        <span className={`text-4xl font-extrabold font-mono tracking-tight ${tone.accent}`}>
          {prediction === 'up' ? '↑ UP' : '↓ DOWN'}
        </span>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-fg-tertiary">Bias</span>
          <span className="text-xs font-bold uppercase text-fg-primary">
            {ta.trendBias}
            <span className="ml-xs font-mono text-fg-secondary">
              {ta.signalScore >= 0 ? '+' : ''}{ta.signalScore}
            </span>
          </span>
        </div>
      </div>

      {/* Confidence — larger bar */}
      <div>
        <div className="flex justify-between text-[11px] mb-xs">
          <span className="uppercase tracking-wider font-semibold text-fg-secondary">Confidence</span>
          <span className={`font-mono font-bold ${tone.accent}`}>{confPct}%</span>
        </div>
        <div className="h-[10px] rounded-pill bg-bg-sub-surface overflow-hidden">
          <div className={`h-full ${confTone} transition-all duration-500`} style={{ width: `${confPct}%` }} />
        </div>
      </div>

      {/* CTA — always present, strongest button on the page */}
      {signal !== 'hold' && (
        <button
          onClick={scrollToOrder}
          className={`mt-md w-full flex items-center justify-center gap-xs px-md py-md rounded-lg text-sm font-bold uppercase tracking-wider shadow-lg transition-transform active:scale-[0.98] ${tone.pill} hover:brightness-110`}
        >
          <ArrowDown size={14} strokeWidth={3} />
          {signal === 'buy' ? `Open long ${displayBase(selectedSymbol)} · 10×` : `Open short ${displayBase(selectedSymbol)} · 10×`}
        </button>
      )}
    </div>
  );
}
