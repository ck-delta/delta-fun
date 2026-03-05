import type { OHLCCandle } from './coingecko';

export function calcEMA(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [];
  // seed with SMA
  const seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema.push(seed);
  for (let i = period; i < values.length; i++) {
    ema.push(values[i] * k + ema[ema.length - 1] * (1 - k));
  }
  return ema;
}

export function calcRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  const diffs = closes.slice(1).map((v, i) => v - closes[i]);
  const gains = diffs.map(d => (d > 0 ? d : 0));
  const losses = diffs.map(d => (d < 0 ? -d : 0));
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function emaSlope(ema: number[]): 'up' | 'down' | 'flat' {
  if (ema.length < 3) return 'flat';
  const last3 = ema.slice(-3);
  const rise = last3[2] - last3[0];
  const pct = rise / last3[0];
  if (pct > 0.0005) return 'up';
  if (pct < -0.0005) return 'down';
  return 'flat';
}

export function candlePattern(candles: OHLCCandle[]): {
  colors: ('green' | 'red')[];
  pattern: string;
  lastColor: 'green' | 'red';
} {
  const recent = candles.slice(-5);
  const colors = recent.map(c => (c.close >= c.open ? 'green' : 'red') as 'green' | 'red');
  const greenCount = colors.filter(c => c === 'green').length;

  let pattern = 'mixed';
  if (greenCount === 5) pattern = 'strong bullish (5 green)';
  else if (greenCount === 4) pattern = 'bullish (4 green)';
  else if (greenCount === 0) pattern = 'strong bearish (5 red)';
  else if (greenCount === 1) pattern = 'bearish (4 red)';
  else if (colors[4] === 'green' && colors[3] === 'red') pattern = 'potential reversal up';
  else if (colors[4] === 'red' && colors[3] === 'green') pattern = 'potential reversal down';

  return { colors, pattern, lastColor: colors[colors.length - 1] };
}

export interface TASummary {
  currentPrice: number;
  ema9: number;
  ema21: number;
  ema50: number;
  ema9Slope: 'up' | 'down' | 'flat';
  ema21Slope: 'up' | 'down' | 'flat';
  rsi: number;
  candlePattern: string;
  lastCandleColors: ('green' | 'red')[];
  trendBias: 'bullish' | 'bearish' | 'neutral';
  priceVsEma9: 'above' | 'below';
}

export function buildTASummary(candles: OHLCCandle[]): TASummary {
  const closes = candles.map(c => c.close);
  const currentPrice = closes[closes.length - 1];

  const ema9arr = calcEMA(closes, 9);
  const ema21arr = calcEMA(closes, 21);
  const ema50arr = calcEMA(closes, 50);

  const ema9 = ema9arr[ema9arr.length - 1] ?? currentPrice;
  const ema21 = ema21arr[ema21arr.length - 1] ?? currentPrice;
  const ema50 = ema50arr[ema50arr.length - 1] ?? currentPrice;

  const ema9Slope = emaSlope(ema9arr);
  const ema21Slope = emaSlope(ema21arr);
  const rsi = calcRSI(closes);
  const cp = candlePattern(candles);

  const bullishSignals = [
    ema9 > ema21,
    ema21 > ema50,
    ema9Slope === 'up',
    rsi > 50,
    cp.lastColor === 'green',
  ].filter(Boolean).length;

  const trendBias: 'bullish' | 'bearish' | 'neutral' =
    bullishSignals >= 4 ? 'bullish' : bullishSignals <= 1 ? 'bearish' : 'neutral';

  return {
    currentPrice,
    ema9: Math.round(ema9),
    ema21: Math.round(ema21),
    ema50: Math.round(ema50),
    ema9Slope,
    ema21Slope,
    rsi: Math.round(rsi),
    candlePattern: cp.pattern,
    lastCandleColors: cp.colors,
    trendBias,
    priceVsEma9: currentPrice >= ema9 ? 'above' : 'below',
  };
}
