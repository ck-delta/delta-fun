import { useEffect, useRef } from 'react';
import { useTradingContext } from '../context/TradingContext';

const OVERSHOOT_API_KEY = import.meta.env.VITE_OVERSHOOT_API_KEY as string;

export function useOvershoot() {
  const { setOvershootResult } = useTradingContext();
  const visionRef = useRef<unknown>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!OVERSHOOT_API_KEY) return;

    let cancelled = false;

    async function initOvershoot() {
      try {
        const { RealtimeVision } = await import('overshoot');

        if (cancelled) return;

        const vision = new RealtimeVision({
          apiKey: OVERSHOOT_API_KEY,
          source: { type: 'screen' },
          model: 'Qwen/Qwen2.5-VL-72B-Instruct',
          prompt: `Analyze this BTC/USD candlestick chart. Identify:
1. Current trend direction (bullish/bearish/sideways)
2. Key support and resistance price levels visible
3. Any significant candlestick patterns (doji, hammer, engulfing, etc.)
4. Whether price appears extended or range-bound
Respond in 2-3 sentences focusing on actionable insights.`,
          onResult: (result: { result?: string; success?: boolean }) => {
            if (result.success && result.result) {
              setOvershootResult(result.result);
            }
          },
        });

        visionRef.current = vision;
        activeRef.current = true;
        await (vision as { start: () => Promise<void> }).start();
      } catch (err) {
        console.warn('[Overshoot] Failed to initialize:', err);
      }
    }

    initOvershoot();

    return () => {
      cancelled = true;
      if (visionRef.current && activeRef.current) {
        (visionRef.current as { stop: () => void }).stop?.();
        activeRef.current = false;
      }
    };
  }, [setOvershootResult]);
}
