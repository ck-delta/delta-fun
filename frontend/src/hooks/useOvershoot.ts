import { useRef, useCallback } from 'react';
import { useTradingContext } from '../context/TradingContext';
import { overshootStore } from '../lib/overshootStore';

const OVERSHOOT_API_KEY = import.meta.env.VITE_OVERSHOOT_API_KEY as string;

export function useOvershoot() {
  const { setOvershootStatus } = useTradingContext();
  const visionRef = useRef<unknown>(null);
  const activeRef = useRef(false);
  const firstResultRef = useRef(false);

  const startVision = useCallback(async () => {
    if (!OVERSHOOT_API_KEY || activeRef.current) return;

    setOvershootStatus('idle'); // reset in case of retry

    // Patch getDisplayMedia to pre-select current tab (Chrome 89+)
    let originalGetDisplayMedia: typeof navigator.mediaDevices.getDisplayMedia | null = null;
    const restoreGetDisplayMedia = () => {
      if (originalGetDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
        originalGetDisplayMedia = null;
      }
    };

    try {
      originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getDisplayMedia = (constraints?: DisplayMediaStreamOptions) =>
        originalGetDisplayMedia!({
          ...constraints,
          preferCurrentTab: true,
          selfBrowserSurface: 'include',
        } as DisplayMediaStreamOptions & { preferCurrentTab?: boolean; selfBrowserSurface?: string });

      const { RealtimeVision } = await import('overshoot');

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
          restoreGetDisplayMedia();
          if (result.success && result.result) {
            overshootStore.latestResult = result.result;
            if (!firstResultRef.current) {
              firstResultRef.current = true;
              setOvershootStatus('active');
            }
          }
        },
        onError: () => {
          restoreGetDisplayMedia();
          setOvershootStatus('error');
          activeRef.current = false;
        },
      });

      visionRef.current = vision;
      activeRef.current = true;
      await (vision as { start: () => Promise<void> }).start();
    } catch (err) {
      restoreGetDisplayMedia();
      console.warn('[Overshoot] Failed to start:', err);
      setOvershootStatus('error');
      activeRef.current = false;
    }
  }, [setOvershootStatus]);

  const stopVision = useCallback(() => {
    if (visionRef.current && activeRef.current) {
      (visionRef.current as { stop: () => void }).stop?.();
      activeRef.current = false;
      firstResultRef.current = false;
      overshootStore.latestResult = undefined;
      setOvershootStatus('idle');
    }
  }, [setOvershootStatus]);

  return { startVision, stopVision };
}
