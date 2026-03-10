export interface OHLCCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Per-coin TTL caches — survive across warm serverless invocations
const priceCache = new Map<string, { data: number; ts: number }>();
const ohlcCache  = new Map<string, { data: OHLCCandle[]; ts: number }>();
const PRICE_TTL = 30_000;      // 30 seconds
const OHLC_TTL  = 5 * 60_000; // 5 minutes

function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function fetchOHLC(coinId = 'bitcoin', days = 1): Promise<OHLCCandle[]> {
  const now = Date.now();
  const cached = ohlcCache.get(coinId);
  if (cached && now - cached.ts < OHLC_TTL) return cached.data;

  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
  let res: Response;
  try {
    res = await fetchWithTimeout(url);
  } catch (err) {
    if (cached) return cached.data;
    throw err;
  }

  if (res.status === 429) {
    if (cached) return cached.data;
    throw new Error('CoinGecko rate limited (429). Please try again in 30 seconds.');
  }
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);

  const raw = (await res.json()) as [number, number, number, number, number][];
  const data = raw.map(([timestamp, open, high, low, close]) => ({
    timestamp, open, high, low, close,
  }));
  ohlcCache.set(coinId, { data, ts: now });
  return data;
}

export async function fetchCurrentPrice(coinId = 'bitcoin'): Promise<number> {
  const now = Date.now();
  const cached = priceCache.get(coinId);
  if (cached && now - cached.ts < PRICE_TTL) return cached.data;

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
  let res: Response;
  try {
    res = await fetchWithTimeout(url);
  } catch (err) {
    if (cached) return cached.data;
    throw err;
  }

  if (res.status === 429) {
    if (cached) return cached.data;
    throw new Error('CoinGecko rate limited (429). Please try again in 30 seconds.');
  }
  if (!res.ok) throw new Error(`CoinGecko price error: ${res.status}`);

  const json = (await res.json()) as Record<string, { usd: number }>;
  const price = json[coinId]?.usd;
  if (price == null) throw new Error(`CoinGecko: no price found for ${coinId}`);
  priceCache.set(coinId, { data: price, ts: now });
  return price;
}

// Backward-compat aliases
export const fetchBTCOHLC = (days = 1) => fetchOHLC('bitcoin', days);
export const fetchBTCCurrentPrice = () => fetchCurrentPrice('bitcoin');
