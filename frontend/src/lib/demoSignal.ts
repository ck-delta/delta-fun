import type { AnalysisResponse } from './api';

// A set of realistic AI-signal snapshots used when ?demo=<state> is in the URL.
// Lets us screenshot any state cleanly without waiting for real market conditions.

type DemoKey = 'buy' | 'strong_buy' | 'neutral' | 'sell' | 'strong_sell';

const ETH_BUY: AnalysisResponse = {
  prediction: 'up',
  confidence: 0.78,
  signal: 'buy',
  rationale:
    'ETH reclaimed EMA50 at $3,220 after a 3% retracement from resistance, and MACD histogram has flipped positive (+2.3) with RSI 58 — healthy momentum and still room before overbought. BB squeeze at the midline has released upward and the reclaim candle printed on 1.8× the 20-bar volume, confirming accumulation.',
  keyLevels: 'support $3,220, resistance $3,310, EMA200 $3,145',
  action:
    'Entry: $3,240; Stop: $3,180; Target: $3,340; R:R 1.67:1 — enter on a 5-min close above $3,245 with MACD bullish cross still intact.',
  plan: {
    entry: 3240,
    stop: 3180,
    target: 3340,
    rr: '1.67:1',
    note: 'Wait for 5m close above $3,245 with MACD cross intact',
  },
  risk: 'A 5-min close back below $3,220 invalidates the reclaim and flips bias bearish.',
  thinking:
    '4-pillar sweep: Trend — EMA9>EMA21>EMA50 stack forming, price above EMA200. Momentum — RSI 58 healthy, MACD fresh bullish cross with +2.3 histogram. Volatility — BB squeeze released upward, %B 0.68. Structure — $20 above support, $70 below resistance — 1.3× ATR runway. 3/4 pillars align bullish, confluence strong but not extreme — Buy (not Strong Buy).',
  confidenceBreakdown: {
    trend: 'Above EMA50 $3,220; 9>21>50 stack forming.',
    momentum: 'RSI 58 healthy; MACD +2.3, fresh bull cross.',
    volatility: 'BB squeeze released upward; %B 0.68.',
    structure: '$20 above support; $70 below resistance.',
    confluence: '3/4 pillars bullish.',
  },
  modelUsed: 'anthropic/claude-sonnet-4.6',
  ta: {
    currentPrice: 3242.8,
    ema9: 3235.1,
    ema21: 3228.4,
    ema50: 3220.6,
    ema200: 3145.2,
    ema9Slope: 'up',
    ema21Slope: 'up',
    priceVsEma9: 'above',
    priceVsEma200: 'above',
    rsi: 58,
    rsiZone: 'neutral',
    macd: 4.1,
    macdSignal: 1.8,
    macdHistogram: 2.3,
    macdCross: 'bullish_cross',
    bbUpper: 3272,
    bbMiddle: 3230,
    bbLower: 3188,
    bbPctB: 0.68,
    bbSqueeze: false,
    support: 3220,
    resistance: 3310,
    candlePattern: 'bullish (4 green)',
    lastCandleColors: ['red', 'green', 'green', 'green', 'green'],
    trendBias: 'bullish',
    signalScore: 6,
  },
};

export const DEMO_SIGNALS: Record<DemoKey, { symbol: string; signal: AnalysisResponse }> = {
  buy:         { symbol: 'ETHUSD', signal: ETH_BUY },
  strong_buy:  { symbol: 'ETHUSD', signal: { ...ETH_BUY, confidence: 0.88, signal: 'buy' } },
  neutral:     { symbol: 'ETHUSD', signal: { ...ETH_BUY, confidence: 0.52, signal: 'hold' } },
  sell:        { symbol: 'ETHUSD', signal: { ...ETH_BUY, prediction: 'down', confidence: 0.74, signal: 'sell' } },
  strong_sell: { symbol: 'ETHUSD', signal: { ...ETH_BUY, prediction: 'down', confidence: 0.88, signal: 'sell' } },
};

export function readDemoFromUrl(): DemoKey | null {
  if (typeof window === 'undefined') return null;
  // Dev-only: the override is stripped from production bundles.
  if (!import.meta.env.DEV) return null;
  const v = new URL(window.location.href).searchParams.get('demo');
  if (!v) return null;
  const k = v.toLowerCase().replace(/[- ]/g, '_') as DemoKey;
  return k in DEMO_SIGNALS ? k : null;
}
