import { useEffect, useRef, useState } from 'react';
import { api, type Candle } from '../lib/api';

export type Resolution = '1m' | '5m' | '15m' | '1h';

const WS_URL = 'wss://socket.india.delta.exchange';

export interface UseDeltaCandlesResult {
  candles: Candle[];
  lastPrice: number | null;
  isConnected: boolean;
}

/**
 * Fetches historical candles via REST and subscribes to Delta Exchange
 * WebSocket for live ticker + candle updates.
 */
export function useDeltaCandles(symbol: string, resolution: Resolution = '5m'): UseDeltaCandlesResult {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retriesRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    // 1. Historical candles
    const hydrate = async () => {
      try {
        const hist = await api.getCandles(symbol, resolution);
        if (cancelled) return;
        setCandles(hist);
        if (hist.length > 0) setLastPrice(hist[hist.length - 1].close);
      } catch (err) {
        console.warn('[delta] candles history failed:', err);
      }
    };

    // 2. Live updates via WS
    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) { ws.close(); return; }
        setIsConnected(true);
        retriesRef.current = 0;
        ws.send(JSON.stringify({
          type: 'subscribe',
          payload: {
            channels: [
              { name: 'v2/ticker', symbols: [symbol] },
              { name: `candlestick_${resolution}`, symbols: [symbol] },
            ],
          },
        }));
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        let msg: Record<string, unknown>;
        try { msg = JSON.parse(event.data); } catch { return; }

        // Ticker updates → live price
        if (msg.type === 'v2/ticker' && typeof msg.mark_price === 'string') {
          const p = Number(msg.mark_price);
          if (Number.isFinite(p)) setLastPrice(p);
          return;
        }

        // Candle updates → upsert the matching bar
        if (msg.type === `candlestick_${resolution}` || msg.type === 'candlestick') {
          const candle: Candle = {
            time: Math.floor(
              typeof msg.candle_start_time === 'number'
                ? msg.candle_start_time / 1_000_000 // microseconds → seconds
                : Date.now() / 1000,
            ),
            open: Number(msg.open ?? 0),
            high: Number(msg.high ?? 0),
            low: Number(msg.low ?? 0),
            close: Number(msg.close ?? 0),
            volume: Number(msg.volume ?? 0),
          };
          if (!Number.isFinite(candle.close) || candle.close <= 0) return;
          setLastPrice(candle.close);
          setCandles(prev => {
            if (prev.length === 0) return [candle];
            const last = prev[prev.length - 1];
            if (last.time === candle.time) {
              return [...prev.slice(0, -1), candle];
            }
            if (candle.time > last.time) {
              const next = [...prev, candle];
              return next.length > 500 ? next.slice(-500) : next;
            }
            return prev;
          });
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setIsConnected(false);
        const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 30_000);
        retriesRef.current += 1;
        reconnectRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => { ws.close(); };
    };

    hydrate().then(() => { if (!cancelled) connect(); });

    return () => {
      cancelled = true;
      setIsConnected(false);
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null; }
    };
  }, [symbol, resolution]);

  return { candles, lastPrice, isConnected };
}
