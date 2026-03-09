import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { AnalysisResponse, Trade } from '../lib/api';

interface TradingContextValue {
  lastSignal: AnalysisResponse | null;
  setLastSignal: (s: AnalysisResponse | null) => void;
  trades: Trade[];
  setTrades: (t: Trade[]) => void;
  totalPnL: number;
  setTotalPnL: (v: number) => void;
  streak: number;
  streakType: 'win' | 'loss' | 'none';
  setStreakInfo: (streak: number, type: 'win' | 'loss' | 'none') => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
  overshootStatus: 'idle' | 'active' | 'error';
  setOvershootStatus: (s: 'idle' | 'active' | 'error') => void;
  // Called by the "Enable Chart Vision" button — triggers screenshare dialog
  startVision: () => void;
  setStartVision: (fn: () => void) => void;
  lastOvershootSnapshot: string | undefined;
  setLastOvershootSnapshot: (v: string | undefined) => void;
  toast: { message: string; type: 'success' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  chartFocusMode: boolean;
  setChartFocusMode: (v: boolean) => void;
}

const TradingContext = createContext<TradingContextValue | null>(null);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [lastSignal, setLastSignal] = useState<AnalysisResponse | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [streak, setStreak] = useState(0);
  const [streakType, setStreakType] = useState<'win' | 'loss' | 'none'>('none');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overshootStatus, setOvershootStatus] = useState<'idle' | 'active' | 'error'>('idle');
  const [startVision, setStartVisionFn] = useState<() => void>(() => () => {});
  const setStartVision = useCallback((fn: () => void) => setStartVisionFn(() => fn), []);
  const [lastOvershootSnapshot, setLastOvershootSnapshot] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [chartFocusMode, setChartFocusMode] = useState(false);

  const setStreakInfo = useCallback((s: number, t: 'win' | 'loss' | 'none') => {
    setStreak(s);
    setStreakType(t);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <TradingContext.Provider value={{
      lastSignal, setLastSignal,
      trades, setTrades,
      totalPnL, setTotalPnL,
      streak, streakType, setStreakInfo,
      isAnalyzing, setIsAnalyzing,
      overshootStatus, setOvershootStatus,
      startVision, setStartVision,
      lastOvershootSnapshot, setLastOvershootSnapshot,
      toast, showToast,
      chartFocusMode, setChartFocusMode,
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
