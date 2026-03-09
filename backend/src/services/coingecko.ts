export interface OHLCCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function fetchBTCOHLC(days: number = 1): Promise<OHLCCandle[]> {
  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=${days}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const raw = (await res.json()) as [number, number, number, number, number][];
  return raw.map(([timestamp, open, high, low, close]) => ({
    timestamp,
    open,
    high,
    low,
    close,
  }));
}

export async function fetchBTCCurrentPrice(): Promise<number> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`CoinGecko price error: ${res.status}`);
  const data = (await res.json()) as { bitcoin: { usd: number } };
  return data.bitcoin.usd;
}
