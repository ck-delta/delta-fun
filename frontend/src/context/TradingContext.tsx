import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { AnalysisResponse } from '../lib/api';

interface ToastState { id: number; message: string; type: 'success' | 'error' | 'info' }

interface TradingContextValue {
  selectedSymbol: string;
  setSelectedSymbol: (s: string) => void;

  livePrice: number | null;
  setLivePrice: (p: number | null) => void;

  lastSignal: AnalysisResponse | null;
  setLastSignal: (s: AnalysisResponse | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
  analysisError: string | null;
  setAnalysisError: (v: string | null) => void;

  tradesVersion: number;
  bumpTrades: () => void;

  toast: ToastState | null;
  showToast: (message: string, type?: ToastState['type']) => void;
}

const TradingContext = createContext<TradingContextValue | null>(null);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSD');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [lastSignal, setLastSignal] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [tradesVersion, setTradesVersion] = useState(0);
  const bumpTrades = useCallback(() => setTradesVersion(v => v + 1), []);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <TradingContext.Provider value={{
      selectedSymbol, setSelectedSymbol,
      livePrice, setLivePrice,
      lastSignal, setLastSignal,
      isAnalyzing, setIsAnalyzing,
      analysisError, setAnalysisError,
      tradesVersion, bumpTrades,
      toast, showToast,
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
