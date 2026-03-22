import { useState, useEffect, useRef, useCallback } from 'react';
import type { CoinConfig } from '../lib/coins';
import { api } from '../lib/api';

export type Interval = '1s' | '1m' | '5m' | '15m';

export interface CandleData {
  time: number; // UTC seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

const BINANCE_WS = 'wss://stream.binance.com:9443/ws';
const BINANCE_REST = 'https://api.binance.com/api/v3/klines';

function parseRestKline(k: unknown[]): CandleData {
  return {
    time: Math.floor((k[0] as number) / 1000),
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
  };
}

function parseWsKline(k: { t: number; o: string; h: string; l: string; c: string }): CandleData {
  return {
    time: Math.floor(k.t / 1000),
    open: parseFloat(k.o),
    high: parseFloat(k.h),
    low: parseFloat(k.l),
    close: parseFloat(k.c),
  };
}

export function useBinanceKlines(coin: CoinConfig, interval: Interval) {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retriesRef = useRef(0);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // No Binance symbol — fall back to CoinGecko REST polling
    if (!coin.binanceSymbol) {
      const fakeCandleHistory: CandleData[] = [];

      const poll = async () => {
        try {
          const p = await api.getPrice(coin.id);
          if (cancelled) return;
          setLastPrice(p);

          const now = Math.floor(Date.now() / 1000);
          const candle: CandleData = { time: now, open: p, high: p, low: p, close: p };

          // Update last candle or add new
          if (fakeCandleHistory.length > 0) {
            const last = fakeCandleHistory[fakeCandleHistory.length - 1];
            const bucket = Math.floor(now / 60) * 60;
            const lastBucket = Math.floor(last.time / 60) * 60;
            if (bucket === lastBucket) {
              last.close = p;
              last.high = Math.max(last.high, p);
              last.low = Math.min(last.low, p);
              last.time = now;
            } else {
              fakeCandleHistory.push({ ...candle, time: bucket });
            }
          } else {
            fakeCandleHistory.push(candle);
          }

          setCandles([...fakeCandleHistory]);
          setIsConnected(true);
        } catch { /* silent */ }
      };

      poll();
      const t = setInterval(poll, 10000);
      return () => { cancelled = true; clearInterval(t); cleanup(); };
    }

    const symbol = coin.binanceSymbol;

    // Fetch historical candles
    const fetchHistory = async () => {
      try {
        const limit = interval === '1s' ? 120 : 300;
        const res = await fetch(`${BINANCE_REST}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`);
        if (!res.ok) throw new Error('REST failed');
        const data = await res.json();
        if (cancelled) return;
        const parsed = (data as unknown[][]).map(parseRestKline);
        setCandles(parsed);
        if (parsed.length > 0) {
          setLastPrice(parsed[parsed.length - 1].close);
        }
      } catch (err) {
        console.warn('[binance] history fetch failed:', err);
      }
    };

    // Connect WebSocket
    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(`${BINANCE_WS}/${symbol}@kline_${interval}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) { ws.close(); return; }
        setIsConnected(true);
        retriesRef.current = 0;
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.e === 'kline') {
            const candle = parseWsKline(msg.k);
            setLastPrice(candle.close);

            setCandles(prev => {
              if (prev.length === 0) return [candle];
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.time === candle.time) {
                updated[updated.length - 1] = candle;
              } else {
                updated.push(candle);
                // Keep max 500 candles
                if (updated.length > 500) updated.shift();
              }
              return updated;
            });
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setIsConnected(false);
        // Reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 30000);
        retriesRef.current++;
        reconnectRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    fetchHistory().then(() => {
      if (!cancelled) connect();
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [coin.binanceSymbol, coin.id, interval, cleanup]);

  return { candles, lastPrice, isConnected };
}
