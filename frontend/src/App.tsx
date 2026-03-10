import { useEffect, useState } from 'react';
import { TradingProvider, useTradingContext } from './context/TradingContext';
import { COINS } from './lib/coins';
import ChartPanel from './components/ChartPanel';
import PromptInput from './components/PromptInput';
import SignalDisplay from './components/SignalDisplay';
import OrderForm from './components/OrderForm';
import TradeHistory from './components/TradeHistory';
import LoadingScreen from './components/LoadingScreen';
import { useOvershoot } from './hooks/useOvershoot';
import { CheckCircle, XCircle } from 'lucide-react';

function Toast() {
  const { toast } = useTradingContext();
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-inner shadow-2xl text-sm font-medium animate-fade-in ${
      toast.type === 'success'
        ? 'bg-accent-green/10 border border-accent-green/30 text-accent-green'
        : 'bg-accent-red/10 border border-accent-red/30 text-accent-red'
    }`}>
      {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
      {toast.message}
    </div>
  );
}

function OvershootStatusDot() {
  const { overshootStatus } = useTradingContext();
  if (overshootStatus === 'idle') return null;
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${
        overshootStatus === 'active' ? 'bg-accent-purple animate-pulse' : 'bg-accent-red'
      }`} />
      <span className={overshootStatus === 'active' ? 'text-accent-purple' : 'text-accent-red'}>
        Vision {overshootStatus === 'active' ? 'on' : 'err'}
      </span>
    </span>
  );
}

function AppInner() {
  const { setStartVision, chartFocusMode, selectedCoin } = useTradingContext();
  const coin = COINS[selectedCoin];
  const { startVision } = useOvershoot();

  // Register startVision into context once — stable callback, runs once
  useEffect(() => { setStartVision(startVision); }, [startVision, setStartVision]);

  return (
    <div className="h-screen w-screen bg-body flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-5 py-2.5 bg-paper border-b border-border-subtle flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="Stocky Fun" className="w-7 h-7 flex-shrink-0" />
          <span className="text-white font-heading font-bold text-sm tracking-tight">Stocky Fun</span>
          <span className="text-muted text-[11px] font-mono hidden sm:inline">{coin.symbol}/USD · Paper</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-muted font-heading">
          <OvershootStatusDot />
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse shadow-glow-green" />
            Live
          </span>
          <span className="hidden md:inline">IST</span>
        </div>
      </div>

      {/* Main layout: stacked on mobile, 60/40 on desktop */}
      <div className={`flex flex-col lg:flex-row flex-1 min-h-0`}>
        {/* Chart */}
        <div className={`border-b lg:border-b-0 lg:border-r border-border-subtle transition-all duration-300 ${
          chartFocusMode ? 'w-full h-full' : 'h-[50vh] lg:h-full w-full lg:w-[60%]'
        }`}>
          <ChartPanel />
        </div>

        {/* Controls — scrollable, hidden in focus mode */}
        <div className={`flex flex-col min-h-0 overflow-y-auto transition-all duration-300 ${
          chartFocusMode ? 'h-0 lg:w-0 overflow-hidden' : 'flex-1 lg:flex-none lg:w-[40%]'
        }`}>
          <PromptInput />
          <SignalDisplay />
          <OrderForm />
          <TradeHistory />
        </div>
      </div>

      <Toast />
    </div>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <TradingProvider>
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}
      <AppInner />
    </TradingProvider>
  );
}
