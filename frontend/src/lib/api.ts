const API_URL = import.meta.env.VITE_API_URL ?? '';

export interface AnalysisResponse {
  prediction: 'up' | 'down';
  confidence: number;
  signal: 'buy' | 'sell' | 'hold';
  rationale: string;
  keyLevels?: string;
  modelUsed?: string;
  ta: {
    currentPrice: number;
    ema9: number;
    ema21: number;
    ema50: number;
    ema9Slope: string;
    rsi: number;
    trendBias: string;
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
  async analyze(prompt: string, overshootResult?: string): Promise<AnalysisResponse> {
    const res = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, overshootResult }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string; detail?: string };
      throw new Error(err.detail ?? err.error ?? `HTTP ${res.status}`);
    }
    return res.json();
  },

  async getPrice(): Promise<number> {
    const res = await fetch(`${API_URL}/api/market/price`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string; detail?: string };
      throw new Error(err.detail ?? err.error ?? `Price fetch failed: HTTP ${res.status}`);
    }
    const data = await res.json() as { price: number };
    return data.price;
  },
};
