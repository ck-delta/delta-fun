const API_URL = import.meta.env.VITE_API_URL ?? '';

export interface AnalysisResponse {
  prediction: 'up' | 'down';
  confidence: number;
  signal: 'buy' | 'sell' | 'hold';
  rationale: string;
  keyLevels?: string;
  action?: string;
  risk?: string;
  modelUsed?: string;
  ta: {
    currentPrice: number;
    ema9: number;
    ema21: number;
    ema50: number;
    ema200: number;
    ema9Slope: string;
    ema21Slope: string;
    priceVsEma9: 'above' | 'below';
    priceVsEma200: 'above' | 'below';
    rsi: number;
    rsiZone: 'overbought' | 'oversold' | 'neutral';
    macd: number;
    macdSignal: number;
    macdHistogram: number;
    macdCross: 'bullish_cross' | 'bearish_cross' | 'none';
    bbUpper: number;
    bbMiddle: number;
    bbLower: number;
    bbPctB: number;
    bbSqueeze: boolean;
    stochK: number;
    stochD: number;
    stochSignal: 'overbought' | 'oversold' | 'neutral';
    atr: number;
    support: number;
    resistance: number;
    candlePattern: string;
    lastCandleColors: ('green' | 'red')[];
    trendBias: string;
    signalScore: number;
  };
}

export interface Trade {
  id: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  currentPrice?: number;
  stopLoss?: number;
  pnl: number;
  pnlPct: number;
  timestamp: number;
  signal?: string;
}

export const api = {
  async analyze(prompt: string, coinId: string, coinSymbol: string, overshootResult?: string): Promise<AnalysisResponse> {
    const res = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, overshootResult, coin: coinId, coinSymbol }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string; detail?: string };
      throw new Error(err.detail ?? err.error ?? `HTTP ${res.status}`);
    }
    return res.json();
  },

  async getPrice(coinId = 'bitcoin'): Promise<number> {
    const res = await fetch(`${API_URL}/api/market/price?coin=${encodeURIComponent(coinId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string; detail?: string };
      throw new Error(err.detail ?? err.error ?? `Price fetch failed: HTTP ${res.status}`);
    }
    const data = await res.json() as { price: number };
    return data.price;
  },
};
