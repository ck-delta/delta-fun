import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { AnalysisResponse } from '../lib/api';
import type { CoinKey } from '../lib/coins';

interface TradingContextValue {
  lastSignal: AnalysisResponse | null;
  setLastSignal: (s: AnalysisResponse | null) => void;
  tradesVersion: number;
  bumpTradesVersion: () => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
  overshootStatus: 'idle' | 'active' | 'error';
  setOvershootStatus: (s: 'idle' | 'active' | 'error') => void;
  startVision: () => void;
  setStartVision: (fn: () => void) => void;
  lastOvershootSnapshot: string | undefined;
  setLastOvershootSnapshot: (v: string | undefined) => void;
  analysisTimestamp: number | null;
  setAnalysisTimestamp: (v: number | null) => void;
  toast: { message: string; type: 'success' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  chartFocusMode: boolean;
  setChartFocusMode: (v: boolean) => void;
  selectedCoin: CoinKey;
  setSelectedCoin: (coin: CoinKey) => void;
  livePrice: number | null;
  setLivePrice: (p: number | null) => void;
}

const TradingContext = createContext<TradingContextValue | null>(null);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [lastSignal, setLastSignal] = useState<AnalysisResponse | null>(null);
  const [tradesVersion, setTradesVersion] = useState(0);
  const bumpTradesVersion = useCallback(() => setTradesVersion(v => v + 1), []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overshootStatus, setOvershootStatus] = useState<'idle' | 'active' | 'error'>('idle');
  const [startVision, setStartVisionFn] = useState<() => void>(() => () => {});
  const setStartVision = useCallback((fn: () => void) => setStartVisionFn(() => fn), []);
  const [lastOvershootSnapshot, setLastOvershootSnapshot] = useState<string | undefined>(undefined);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [chartFocusMode, setChartFocusMode] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<CoinKey>('BTC');
  const [livePrice, setLivePrice] = useState<number | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <TradingContext.Provider value={{
      lastSignal, setLastSignal,
      tradesVersion, bumpTradesVersion,
      isAnalyzing, setIsAnalyzing,
      overshootStatus, setOvershootStatus,
      startVision, setStartVision,
      lastOvershootSnapshot, setLastOvershootSnapshot,
      analysisTimestamp, setAnalysisTimestamp,
      toast, showToast,
      chartFocusMode, setChartFocusMode,
      selectedCoin, setSelectedCoin,
      livePrice, setLivePrice,
    }}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTradingContext() {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error('useTradingContext must be inside TradingProvider');
  return ctx;
}
