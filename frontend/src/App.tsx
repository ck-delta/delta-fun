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
    <div className="h-screen w-screen bg-body flex items-center justify-center p-3 md:p-5 overflow-hidden">
      {/* App window card */}
      <div className="bg-paper rounded-card border border-border-subtle shadow-app-window w-full h-full flex flex-col overflow-hidden relative">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-border-subtle flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent-green flex items-center justify-center text-black text-xs font-black font-heading flex-shrink-0">S</div>
            <span className="text-white font-heading font-bold text-sm tracking-tight">Stocky Fun</span>
            <span className="text-muted text-[11px] font-mono">{coin.symbol}/USD · Paper</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted font-heading">
            <OvershootStatusDot />
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse shadow-glow-green" />
              Live
            </span>
            <span className="hidden md:inline">IST</span>
          </div>
        </div>

        {/* Main layout: 60/40 split (or full chart in focus mode) */}
        <div className="flex flex-1 min-h-0">
          {/* Left: Chart */}
          <div className={`h-full border-r border-border-subtle transition-all duration-300 ${chartFocusMode ? 'w-full' : 'w-[60%]'}`}>
            <ChartPanel />
          </div>

          {/* Right: Controls — hidden in focus mode */}
          <div className={`h-full flex flex-col min-h-0 overflow-hidden transition-all duration-300 ${chartFocusMode ? 'w-0 overflow-hidden' : 'w-[40%]'}`}>
            <PromptInput />
            <SignalDisplay />
            <OrderForm />
            <TradeHistory />
          </div>
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
