export interface OHLCCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Module-level TTL cache — survives across warm serverless invocations
const priceCache: { data?: number; ts?: number } = {};
const ohlcCache: { data?: OHLCCandle[]; ts?: number } = {};
const PRICE_TTL = 30_000;      // 30 seconds
const OHLC_TTL  = 5 * 60_000; // 5 minutes

function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function fetchBTCOHLC(days: number = 1): Promise<OHLCCandle[]> {
  const now = Date.now();
  if (ohlcCache.data && ohlcCache.ts && now - ohlcCache.ts < OHLC_TTL) {
    return ohlcCache.data;
  }

  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=${days}`;
  let res: Response;
  try {
    res = await fetchWithTimeout(url);
  } catch (err) {
    if (ohlcCache.data) return ohlcCache.data; // stale fallback on network error
    throw err;
  }

  if (res.status === 429) {
    if (ohlcCache.data) return ohlcCache.data; // stale fallback on rate limit
    throw new Error('CoinGecko rate limited (429). Please try again in 30 seconds.');
  }
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);

  const raw = (await res.json()) as [number, number, number, number, number][];
  const data = raw.map(([timestamp, open, high, low, close]) => ({
    timestamp, open, high, low, close,
  }));
  ohlcCache.data = data;
  ohlcCache.ts = now;
  return data;
}

export async function fetchBTCCurrentPrice(): Promise<number> {
  const now = Date.now();
  if (priceCache.data && priceCache.ts && now - priceCache.ts < PRICE_TTL) {
    return priceCache.data;
  }

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`;
  let res: Response;
  try {
    res = await fetchWithTimeout(url);
  } catch (err) {
    if (priceCache.data) return priceCache.data; // stale fallback on network error
    throw err;
  }

  if (res.status === 429) {
    if (priceCache.data) return priceCache.data; // stale fallback on rate limit
    throw new Error('CoinGecko rate limited (429). Please try again in 30 seconds.');
  }
  if (!res.ok) throw new Error(`CoinGecko price error: ${res.status}`);

  const json = (await res.json()) as { bitcoin: { usd: number } };
  priceCache.data = json.bitcoin.usd;
  priceCache.ts = now;
  return priceCache.data;
}
