import { useEffect, useRef } from 'react';
import { useTradingContext } from '../context/TradingContext';
import { overshootStore } from '../lib/overshootStore';

const OVERSHOOT_API_KEY = import.meta.env.VITE_OVERSHOOT_API_KEY as string;

export function useOvershoot() {
  const { setOvershootStatus } = useTradingContext();
  const visionRef = useRef<unknown>(null);
  const activeRef = useRef(false);
  const firstResultRef = useRef(false);

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
              // Write directly to the module store — NO React state update, zero re-renders
              overshootStore.latestResult = result.result;

              // Flip status to 'active' only once (single re-render ever from Overshoot)
              if (!firstResultRef.current) {
                firstResultRef.current = true;
                setOvershootStatus('active');
              }
            }
          },
        });

        visionRef.current = vision;
        activeRef.current = true;
        await (vision as { start: () => Promise<void> }).start();
      } catch (err) {
        console.warn('[Overshoot] Failed to initialize:', err);
        setOvershootStatus('error');
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
  }, [setOvershootStatus]);
}
