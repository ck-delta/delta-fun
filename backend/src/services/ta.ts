import type { OHLCCandle } from './coingecko';

// ─── Core math ────────────────────────────────────────────────────────────────

export function calcEMA(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [];
  const seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema.push(seed);
  for (let i = period; i < values.length; i++) {
    ema.push(values[i] * k + ema[ema.length - 1] * (1 - k));
  }
  return ema;
}

export function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  const diffs = closes.slice(1).map((v, i) => v - closes[i]);
  const gains = diffs.map(d => (d > 0 ? d : 0));
  const losses = diffs.map(d => (d < 0 ? -d : 0));
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

export function emaSlope(ema: number[]): 'up' | 'down' | 'flat' {
  if (ema.length < 3) return 'flat';
  const last3 = ema.slice(-3);
  const pct = (last3[2] - last3[0]) / last3[0];
  if (pct > 0.0005) return 'up';
  if (pct < -0.0005) return 'down';
  return 'flat';
}

// ─── MACD (12, 26, 9) ─────────────────────────────────────────────────────────

function calcMACD(closes: number[]): {
  macd: number;
  signal: number;
  histogram: number;
  cross: 'bullish_cross' | 'bearish_cross' | 'none';
} {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  if (ema12.length === 0 || ema26.length === 0) {
    return { macd: 0, signal: 0, histogram: 0, cross: 'none' };
  }

  // Align: ema26 is shorter; align from the end
  const offset = ema12.length - ema26.length;
  const macdLine = ema26.map((v, i) => ema12[offset + i] - v);
  const signalLine = calcEMA(macdLine, 9);
  if (signalLine.length === 0) {
    const m = macdLine[macdLine.length - 1];
    return { macd: m, signal: m, histogram: 0, cross: 'none' };
  }

  const macd = macdLine[macdLine.length - 1];
  const sig = signalLine[signalLine.length - 1];
  const histogram = macd - sig;

  // Cross: check if previous bar had opposite relationship
  const prevMacd = macdLine[macdLine.length - 2] ?? macd;
  const prevSig = signalLine[signalLine.length - 2] ?? sig;
  let cross: 'bullish_cross' | 'bearish_cross' | 'none' = 'none';
  if (prevMacd <= prevSig && macd > sig) cross = 'bullish_cross';
  else if (prevMacd >= prevSig && macd < sig) cross = 'bearish_cross';

  return { macd, signal: sig, histogram, cross };
}

// ─── Bollinger Bands (20, 2σ) ─────────────────────────────────────────────────

function calcBollingerBands(closes: number[], period = 20, mult = 2): {
  upper: number;
  middle: number;
  lower: number;
  pctB: number;
  squeeze: boolean;
} {
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
    upper: Math.round(upper),
    middle: Math.round(mean),
    lower: Math.round(lower),
    pctB: Math.round(pctB * 100) / 100,
    squeeze: bandwidth < 0.015, // squeeze when bands < 1.5% of price
  };
}

// ─── Stochastic Oscillator (14, 3) ────────────────────────────────────────────

function calcStochastic(candles: OHLCCandle[], period = 14, smoothK = 3): {
  k: number;
  d: number;
  signal: 'overbought' | 'oversold' | 'neutral';
} {
  if (candles.length < period + smoothK) {
    return { k: 50, d: 50, signal: 'neutral' };
  }

  // Compute raw %K for the last smoothK+1 bars
  const rawKs: number[] = [];
  for (let i = candles.length - smoothK; i <= candles.length; i++) {
    if (i < period) { rawKs.push(50); continue; }
    const slice = candles.slice(i - period, i);
    const hh = Math.max(...slice.map(c => c.high));
    const ll = Math.min(...slice.map(c => c.low));
    const cl = slice[slice.length - 1].close;
    rawKs.push(hh === ll ? 50 : ((cl - ll) / (hh - ll)) * 100);
  }

  const k = rawKs[rawKs.length - 1];
  const d = rawKs.slice(-smoothK).reduce((a, b) => a + b, 0) / smoothK;

  const signal: 'overbought' | 'oversold' | 'neutral' =
    k >= 80 ? 'overbought' : k <= 20 ? 'oversold' : 'neutral';

  return { k: Math.round(k), d: Math.round(d), signal };
}

// ─── ATR (14) ─────────────────────────────────────────────────────────────────

function calcATR(candles: OHLCCandle[], period = 14): number {
  if (candles.length < 2) return 0;
  const trs = candles.slice(1).map((c, i) => {
    const prev = candles[i];
    return Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
  });
  const recent = trs.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

// ─── Support / Resistance (20-candle swing) ────────────────────────────────────

function findSR(candles: OHLCCandle[], lookback = 20): { support: number; resistance: number } {
  const recent = candles.slice(-lookback);
  return {
    support: Math.round(Math.min(...recent.map(c => c.low))),
    resistance: Math.round(Math.max(...recent.map(c => c.high))),
  };
}

// ─── Candle patterns ──────────────────────────────────────────────────────────

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

// ─── TASummary ────────────────────────────────────────────────────────────────

export interface TASummary {
  currentPrice: number;
  // EMAs
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
  ema9Slope: 'up' | 'down' | 'flat';
  ema21Slope: 'up' | 'down' | 'flat';
  priceVsEma9: 'above' | 'below';
  priceVsEma200: 'above' | 'below';
  // RSI
  rsi: number;
  rsiZone: 'overbought' | 'oversold' | 'neutral';
  // MACD
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  macdCross: 'bullish_cross' | 'bearish_cross' | 'none';
  // Bollinger Bands
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  bbPctB: number;
  bbSqueeze: boolean;
  // Stochastic
  stochK: number;
  stochD: number;
  stochSignal: 'overbought' | 'oversold' | 'neutral';
  // ATR & S/R
  atr: number;
  support: number;
  resistance: number;
  // Candles
  candlePattern: string;
  lastCandleColors: ('green' | 'red')[];
  // Composite
  trendBias: 'bullish' | 'bearish' | 'neutral';
  signalScore: number; // -10 to +10
}

export function buildTASummary(candles: OHLCCandle[]): TASummary {
  const closes = candles.map(c => c.close);
  const currentPrice = closes[closes.length - 1];

  // EMAs
  const ema9arr  = calcEMA(closes, 9);
  const ema21arr = calcEMA(closes, 21);
  const ema50arr = calcEMA(closes, 50);
  const ema200arr = calcEMA(closes, 200);

  const ema9   = ema9arr[ema9arr.length - 1] ?? currentPrice;
  const ema21  = ema21arr[ema21arr.length - 1] ?? currentPrice;
  const ema50  = ema50arr[ema50arr.length - 1] ?? currentPrice;
  const ema200 = ema200arr[ema200arr.length - 1] ?? currentPrice;

  const ema9Slope  = emaSlope(ema9arr);
  const ema21Slope = emaSlope(ema21arr);

  // RSI
  const rsi = calcRSI(closes);
  const rsiZone: 'overbought' | 'oversold' | 'neutral' =
    rsi >= 70 ? 'overbought' : rsi <= 30 ? 'oversold' : 'neutral';

  // MACD
  const macdResult = calcMACD(closes);

  // Bollinger Bands
  const bb = calcBollingerBands(closes);

  // Stochastic
  const stoch = calcStochastic(candles);

  // ATR
  const atr = calcATR(candles);

  // Support / Resistance
  const sr = findSR(candles);

  // Candle pattern
  const cp = candlePattern(candles);

  // ─── Composite signal score ───────────────────────────────────────────────
  // Each signal contributes +1 (bullish) or -1 (bearish); crosses get ±2
  let score = 0;
  if (ema9 > ema21)          score += 1; else score -= 1;       // EMA9 vs EMA21
  if (ema21 > ema50)         score += 1; else score -= 1;       // EMA21 vs EMA50
  if (currentPrice > ema200) score += 1; else score -= 1;       // vs long-term trend
  if (ema9Slope === 'up')    score += 1;                        // EMA9 slope
  else if (ema9Slope === 'down') score -= 1;
  if (rsi > 55)              score += 1; else if (rsi < 45) score -= 1; // RSI zone
  if (macdResult.macd > macdResult.signal) score += 1; else score -= 1; // MACD vs signal
  if (macdResult.cross === 'bullish_cross') score += 2;         // MACD cross (stronger signal)
  else if (macdResult.cross === 'bearish_cross') score -= 2;
  if (currentPrice > bb.middle) score += 1; else score -= 1;   // Price vs BB midline
  if (stoch.signal === 'oversold')   score += 1;                // Stochastic extremes
  else if (stoch.signal === 'overbought') score -= 1;
  if (cp.lastColor === 'green') score += 1; else score -= 1;   // Last candle color

  const trendBias: 'bullish' | 'bearish' | 'neutral' =
    score >= 4 ? 'bullish' : score <= -4 ? 'bearish' : 'neutral';

  return {
    currentPrice,
    ema9: Math.round(ema9),
    ema21: Math.round(ema21),
    ema50: Math.round(ema50),
    ema200: Math.round(ema200),
    ema9Slope,
    ema21Slope,
    priceVsEma9: currentPrice >= ema9 ? 'above' : 'below',
    priceVsEma200: currentPrice >= ema200 ? 'above' : 'below',
    rsi: Math.round(rsi),
    rsiZone,
    macd: Math.round(macdResult.macd * 100) / 100,
    macdSignal: Math.round(macdResult.signal * 100) / 100,
    macdHistogram: Math.round(macdResult.histogram * 100) / 100,
    macdCross: macdResult.cross,
    bbUpper: bb.upper,
    bbMiddle: bb.middle,
    bbLower: bb.lower,
    bbPctB: bb.pctB,
    bbSqueeze: bb.squeeze,
    stochK: stoch.k,
    stochD: stoch.d,
    stochSignal: stoch.signal,
    atr: Math.round(atr * 100) / 100,
    support: sr.support,
    resistance: sr.resistance,
    candlePattern: cp.pattern,
    lastCandleColors: cp.colors,
    trendBias,
    signalScore: score,
  };
}
