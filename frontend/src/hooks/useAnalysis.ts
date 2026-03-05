import { useCallback } from 'react';
import { api } from '../lib/api';
import { useTradingContext } from '../context/TradingContext';

export function useAnalysis() {
  const { setLastSignal, setIsAnalyzing, overshootResult, showToast } = useTradingContext();

  const analyze = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await api.analyze(prompt, overshootResult);
      setLastSignal(result);
    } catch (err) {
      console.error('[analysis]', err);
      showToast(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [setLastSignal, setIsAnalyzing, overshootResult, showToast]);

  return { analyze };
}
