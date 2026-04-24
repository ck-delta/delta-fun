import type { TASummary } from '../lib/api';

interface IndicatorsStripProps {
  ta: TASummary | null;
}

function Pill({ label, value, tone }: { label: string; value: string; tone: 'pos' | 'neg' | 'warn' | 'neutral' }) {
  const toneClasses: Record<typeof tone, string> = {
    pos:     'bg-positive-muted text-positive border-positive/30',
    neg:     'bg-negative-muted text-negative border-negative/30',
    warn:    'bg-warning-muted text-warning border-warning/30',
    neutral: 'bg-bg-primary text-fg-secondary border-divider',
  };
  return (
    <div className={`flex flex-col gap-[2px] px-md py-sm rounded-lg border ${toneClasses[tone]}`}>
      <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-sm font-mono font-semibold">{value}</span>
    </div>
  );
}

export default function IndicatorsStrip({ ta }: IndicatorsStripProps) {
  if (!ta) {
    return (
      <div className="grid grid-cols-4 gap-xs">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-[52px] rounded-lg bg-bg-primary border border-divider animate-pulse" />
        ))}
      </div>
    );
  }

  const rsiTone: 'pos' | 'neg' | 'warn' | 'neutral' =
    ta.rsiZone === 'oversold' ? 'pos' : ta.rsiZone === 'overbought' ? 'neg' : 'neutral';

  const macdTone: 'pos' | 'neg' | 'neutral' =
    ta.macdHistogram > 0 ? 'pos' : ta.macdHistogram < 0 ? 'neg' : 'neutral';

  const bbTone: 'pos' | 'neg' | 'warn' | 'neutral' =
    ta.bbSqueeze ? 'warn' : ta.bbPctB > 0.8 ? 'neg' : ta.bbPctB < 0.2 ? 'pos' : 'neutral';

  const emaTone: 'pos' | 'neg' | 'neutral' =
    ta.ema9 > ta.ema21 && ta.ema21 > ta.ema50
      ? 'pos'
      : ta.ema9 < ta.ema21 && ta.ema21 < ta.ema50
        ? 'neg'
        : 'neutral';

  const emaValue = emaTone === 'pos' ? '9>21>50' : emaTone === 'neg' ? '9<21<50' : 'Mixed';
  const macdSuffix = ta.macdCross === 'bullish_cross' ? ' ▲' : ta.macdCross === 'bearish_cross' ? ' ▼' : '';

  return (
    <div className="grid grid-cols-4 gap-xs">
      <Pill label="RSI 14" value={`${ta.rsi}`} tone={rsiTone} />
      <Pill label="MACD" value={`${ta.macdHistogram >= 0 ? '+' : ''}${ta.macdHistogram}${macdSuffix}`} tone={macdTone} />
      <Pill label="BB %B" value={ta.bbSqueeze ? `${ta.bbPctB} ⚡` : `${ta.bbPctB}`} tone={bbTone} />
      <Pill label="EMA Stack" value={emaValue} tone={emaTone} />
    </div>
  );
}
