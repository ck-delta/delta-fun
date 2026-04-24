import type { DeltaProduct } from './products';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export interface ConfidenceBreakdown {
  trend: string;
  momentum: string;
  volatility: string;
  structure: string;
  confluence: string;
}

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

export interface TradePlan {
  entry: number;
  stop: number;
  target: number;
  rr: string;
  note?: string;
}

export interface AnalysisResponse {
  prediction: 'up' | 'down';
  confidence: number;
  signal: 'buy' | 'sell' | 'hold';
  rationale: string;
  keyLevels?: string;
  action?: string;
  plan?: TradePlan;
  risk?: string;
  thinking?: string;
  confidenceBreakdown?: ConfidenceBreakdown;
  modelUsed?: string;
  ta: TASummary;
}

export interface Candle {
  time: number;   // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function httpJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
    throw new Error(err.detail ?? err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getProducts(): Promise<DeltaProduct[]> {
    const { products } = await httpJson<{ products: DeltaProduct[] }>(`${API_URL}/api/market/products`);
    return products;
  },

  async getCandles(symbol: string, resolution = '5m'): Promise<Candle[]> {
    const { candles } = await httpJson<{ candles: Candle[] }>(
      `${API_URL}/api/market/candles?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}`,
    );
    return candles;
  },

  async getTicker(symbol: string): Promise<{ price: number; change24h: number | null }> {
    return httpJson(`${API_URL}/api/market/ticker?symbol=${encodeURIComponent(symbol)}`);
  },

  async analyze(symbol: string, prompt?: string): Promise<AnalysisResponse> {
    return httpJson(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, prompt }),
    });
  },
};
