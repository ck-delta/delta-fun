import type { DeltaCandle } from './delta';

// ─── Math helpers ────────────────────────────────────────────────────────

export function calcEMA(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const ema = [seed];
  for (let i = period; i < values.length; i++) {
    ema.push(values[i] * k + ema[ema.length - 1] * (1 - k));
  }
  return ema;
}

export function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  const diffs = closes.slice(1).map((v, i) => v - closes[i]);
  const recent = diffs.slice(-period);
  const avgGain = recent.reduce((a, d) => a + (d > 0 ? d : 0), 0) / period;
  const avgLoss = recent.reduce((a, d) => a + (d < 0 ? -d : 0), 0) / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

export function emaSlope(ema: number[]): 'up' | 'down' | 'flat' {
  if (ema.length < 3) return 'flat';
  const last = ema[ema.length - 1];
  const prev = ema[ema.length - 3];
  const pct = (last - prev) / prev;
  if (pct > 0.0005) return 'up';
  if (pct < -0.0005) return 'down';
  return 'flat';
}

// ─── MACD (12, 26, 9) ───────────────────────────────────────────────────

function calcMACD(closes: number[]) {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  if (ema12.length === 0 || ema26.length === 0) {
    return { macd: 0, signal: 0, histogram: 0, cross: 'none' as const };
  }
  const offset = ema12.length - ema26.length;
  const macdLine = ema26.map((v, i) => ema12[offset + i] - v);
  const signalLine = calcEMA(macdLine, 9);
  if (signalLine.length === 0) {
    const m = macdLine[macdLine.length - 1];
    return { macd: m, signal: m, histogram: 0, cross: 'none' as const };
  }
  const macd = macdLine[macdLine.length - 1];
  const sig = signalLine[signalLine.length - 1];
  const histogram = macd - sig;
  const prevMacd = macdLine[macdLine.length - 2] ?? macd;
  const prevSig = signalLine[signalLine.length - 2] ?? sig;
  let cross: 'bullish_cross' | 'bearish_cross' | 'none' = 'none';
  if (prevMacd <= prevSig && macd > sig) cross = 'bullish_cross';
  else if (prevMacd >= prevSig && macd < sig) cross = 'bearish_cross';
  return { macd, signal: sig, histogram, cross };
}

// ─── Bollinger Bands (20, 2σ) ───────────────────────────────────────────

function calcBollingerBands(closes: number[], period = 20, mult = 2) {
  const price = closes[closes.length - 1];
  if (closes.length < period) {
    return { upper: price, middle: price, lower: price, pctB: 0.5, squeeze: false };
  }
  const recent = closes.slice(-period);
  const mean = recent.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(recent.reduce((s, v) => s + (v - mean) ** 2, 0) / period);
  const upper = mean + mult * std;
  const lower = mean - mult * std;
  const pctB = std === 0 ? 0.5 : (price - lower) / (upper - lower);
  const bandwidth = std === 0 ? 0 : (upper - lower) / mean;
  return {
    upper,
    middle: mean,
    lower,
    pctB: Math.max(0, Math.min(1, Math.round(pctB * 100) / 100)),
    squeeze: bandwidth < 0.015,
  };
}

// ─── Swing S/R ──────────────────────────────────────────────────────────

function findSR(candles: DeltaCandle[], lookback = 20) {
  const recent = candles.slice(-lookback);
  return {
    support: Math.min(...recent.map(c => c.low)),
    resistance: Math.max(...recent.map(c => c.high)),
  };
}

// ─── Candle pattern (last 5) ────────────────────────────────────────────

function candlePattern(candles: DeltaCandle[]) {
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
  return { colors, pattern, lastColor: colors[colors.length - 1] ?? ('green' as const) };
}

// ─── TA Summary ─────────────────────────────────────────────────────────

export interface TASummary {
  currentPrice: number;
  ema9: number; ema21: number; ema50: number; ema200: number;
  ema9Slope: 'up' | 'down' | 'flat';
  ema21Slope: 'up' | 'down' | 'flat';
  priceVsEma9: 'above' | 'below';
  priceVsEma200: 'above' | 'below';
  rsi: number;
  rsiZone: 'overbought' | 'oversold' | 'neutral';
  macd: number; macdSignal: number; macdHistogram: number;
  macdCross: 'bullish_cross' | 'bearish_cross' | 'none';
  bbUpper: number; bbMiddle: number; bbLower: number;
  bbPctB: number; bbSqueeze: boolean;
  support: number; resistance: number;
  candlePattern: string;
  lastCandleColors: ('green' | 'red')[];
  trendBias: 'bullish' | 'bearish' | 'neutral';
  signalScore: number;
}

function round(n: number, decimals = 2) {
  const p = 10 ** decimals;
  return Math.round(n * p) / p;
}

export function buildTASummary(candles: DeltaCandle[]): TASummary {
  const closes = candles.map(c => c.close);
  const currentPrice = closes[closes.length - 1];

  const ema9arr = calcEMA(closes, 9);
  const ema21arr = calcEMA(closes, 21);
  const ema50arr = calcEMA(closes, 50);
  const ema200arr = calcEMA(closes, 200);

  const ema9 = ema9arr.at(-1) ?? currentPrice;
  const ema21 = ema21arr.at(-1) ?? currentPrice;
  const ema50 = ema50arr.at(-1) ?? currentPrice;
  const ema200 = ema200arr.at(-1) ?? currentPrice;

  const ema9Slope = emaSlope(ema9arr);
  const ema21Slope = emaSlope(ema21arr);

  const rsi = calcRSI(closes);
  const rsiZone: TASummary['rsiZone'] = rsi >= 70 ? 'overbought' : rsi <= 30 ? 'oversold' : 'neutral';

  const macd = calcMACD(closes);
  const bb = calcBollingerBands(closes);
  const sr = findSR(candles);
  const cp = candlePattern(candles);

  // Composite score — simple weighted vote across the kept indicators only
  let score = 0;
  if (ema9 > ema21) score += 1; else score -= 1;
  if (ema21 > ema50) score += 1; else score -= 1;
  if (currentPrice > ema200) score += 1; else score -= 1;
  if (ema9Slope === 'up') score += 1; else if (ema9Slope === 'down') score -= 1;
  if (rsi > 55) score += 1; else if (rsi < 45) score -= 1;
  if (macd.macd > macd.signal) score += 1; else score -= 1;
  if (macd.cross === 'bullish_cross') score += 2;
  else if (macd.cross === 'bearish_cross') score -= 2;
  if (currentPrice > bb.middle) score += 1; else score -= 1;
  if (cp.lastColor === 'green') score += 1; else score -= 1;

  const trendBias: TASummary['trendBias'] = score >= 4 ? 'bullish' : score <= -4 ? 'bearish' : 'neutral';

  return {
    currentPrice: round(currentPrice, 4),
    ema9: round(ema9, 4), ema21: round(ema21, 4), ema50: round(ema50, 4), ema200: round(ema200, 4),
    ema9Slope, ema21Slope,
    priceVsEma9: currentPrice >= ema9 ? 'above' : 'below',
    priceVsEma200: currentPrice >= ema200 ? 'above' : 'below',
    rsi: Math.round(rsi), rsiZone,
    macd: round(macd.macd, 4), macdSignal: round(macd.signal, 4), macdHistogram: round(macd.histogram, 4),
    macdCross: macd.cross,
    bbUpper: round(bb.upper, 4), bbMiddle: round(bb.middle, 4), bbLower: round(bb.lower, 4),
    bbPctB: bb.pctB, bbSqueeze: bb.squeeze,
    support: round(sr.support, 4), resistance: round(sr.resistance, 4),
    candlePattern: cp.pattern, lastCandleColors: cp.colors,
    trendBias, signalScore: score,
  };
}
