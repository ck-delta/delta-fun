import { useCallback } from 'react';
import { api } from '../lib/api';
import { useTradingContext } from '../context/TradingContext';

export function useAnalysis() {
  const { setLastSignal, setIsAnalyzing, setAnalysisError, showToast } = useTradingContext();

  const analyze = useCallback(async (symbol: string, prompt?: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await api.analyze(symbol, prompt);
      setLastSignal(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAnalysisError(msg);
      showToast(`Analysis failed: ${msg}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [setLastSignal, setIsAnalyzing, setAnalysisError, showToast]);

  return { analyze };
}
