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
        prompt: `Analyze this crypto candlestick chart with precision. Provide:
1. PRICE LEVELS: List exact support and resistance levels visible on the chart (e.g. "$84,200 support", "$89,500 resistance")
2. PATTERN: Name any chart pattern visible (head & shoulders, double top/bottom, triangle, wedge, channel, flag). Rate pattern strength 1-10.
3. TREND: Identify trend direction — is price making higher highs/higher lows (uptrend) or lower highs/lower lows (downtrend)?
4. VOLUME: If volume bars are visible, note whether volume confirms or diverges from price action.
5. CONFLUENCE: Rate 1-10 how strongly the visual chart supports a bullish vs bearish thesis.
Format: "Levels: [prices] | Pattern: [name] ([strength]/10) | Trend: [direction] | Volume: [observation] | Confluence: [score]/10 [direction]"`,
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
