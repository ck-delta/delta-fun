// Delta Exchange public REST API service.
// Base: https://api.india.delta.exchange/v2  (see docs.delta.exchange)

const DELTA_BASE = process.env.DELTA_API_BASE ?? 'https://api.india.delta.exchange/v2';

export interface DeltaProduct {
  id: number;
  symbol: string;           // e.g. 'BTCUSD'
  description: string;
  contract_type: string;    // 'perpetual_futures' | 'spot' | ...
  underlying_asset: { symbol: string };
  quoting_asset: { symbol: string };
  tick_size: string;
  state: string;            // 'live' | 'expired' | ...
}

export interface DeltaCandle {
  time: number;   // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

// 2-minute cache for the product list — it changes rarely.
let productsCache: { data: DeltaProduct[]; ts: number } | null = null;
const PRODUCTS_TTL = 120_000;

export async function fetchProducts(): Promise<DeltaProduct[]> {
  const now = Date.now();
  if (productsCache && now - productsCache.ts < PRODUCTS_TTL) return productsCache.data;

  const res = await fetchWithTimeout(`${DELTA_BASE}/products?contract_types=perpetual_futures`);
  if (!res.ok) {
    if (productsCache) return productsCache.data;
    throw new Error(`Delta products HTTP ${res.status}`);
  }
  const body = (await res.json()) as { result: DeltaProduct[] };
  const data = (body.result ?? []).filter(p => p.state === 'live');
  productsCache = { data, ts: now };
  return data;
}

// Short-lived candle cache — per symbol+resolution key.
const candleCache = new Map<string, { data: DeltaCandle[]; ts: number }>();
const CANDLE_TTL = 30_000;

export async function fetchCandles(
  symbol: string,
  resolution = '5m',
  lookbackSeconds = 60 * 60 * 24 * 2, // 2 days of history
): Promise<DeltaCandle[]> {
  const key = `${symbol}:${resolution}`;
  const now = Date.now();
  const cached = candleCache.get(key);
  if (cached && now - cached.ts < CANDLE_TTL) return cached.data;

  const end = Math.floor(now / 1000);
  const start = end - lookbackSeconds;
  const url = `${DELTA_BASE}/history/candles?resolution=${encodeURIComponent(resolution)}&symbol=${encodeURIComponent(symbol)}&start=${start}&end=${end}`;

  const res = await fetchWithTimeout(url, 10000);
  if (!res.ok) {
    if (cached) return cached.data;
    throw new Error(`Delta candles HTTP ${res.status}`);
  }

  const body = (await res.json()) as {
    result: { time: number; open: number; high: number; low: number; close: number; volume: number }[];
  };
  const data = (body.result ?? [])
    .map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }))
    .sort((a, b) => a.time - b.time);

  candleCache.set(key, { data, ts: now });
  return data;
}

export async function fetchTicker(symbol: string): Promise<{ price: number; change24h: number | null }> {
  const res = await fetchWithTimeout(`${DELTA_BASE}/tickers/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Delta ticker HTTP ${res.status}`);
  const body = (await res.json()) as {
    result: { mark_price?: string; close?: string | number; change?: string; open?: string | number };
  };
  const r = body.result ?? {};
  const price = Number(r.mark_price ?? r.close ?? 0);
  const open = Number(r.open ?? 0);
  const change24h = open > 0 ? ((price - open) / open) * 100 : null;
  return { price, change24h };
}
