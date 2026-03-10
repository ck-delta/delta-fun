import { useCallback } from 'react';
import { api } from '../lib/api';
import { useTradingContext } from '../context/TradingContext';
import { overshootStore } from '../lib/overshootStore';
import { COINS } from '../lib/coins';

export function useAnalysis() {
  const { setLastSignal, setIsAnalyzing, setLastOvershootSnapshot, showToast, selectedCoin } = useTradingContext();

  const analyze = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;

    // Snapshot at submit time from the module store — no stale closure, no re-render dependency
    const overshootSnapshot = overshootStore.latestResult;
    const coin = COINS[selectedCoin];

    setIsAnalyzing(true);
    try {
      const result = await api.analyze(prompt, coin.id, coin.symbol, overshootSnapshot);
      setLastSignal(result);
      setLastOvershootSnapshot(overshootSnapshot);
    } catch (err) {
      console.error('[analysis]', err);
      showToast(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  // overshootStore is a module ref, not React state — selectedCoin included in deps
  }, [setLastSignal, setIsAnalyzing, setLastOvershootSnapshot, showToast, selectedCoin]);

  return { analyze };
}
