import { useEffect } from 'react';
import { TradingProvider, useTradingContext } from './context/TradingContext';
import ChartPanel from './components/ChartPanel';
import PromptInput from './components/PromptInput';
import SignalDisplay from './components/SignalDisplay';
import OrderForm from './components/OrderForm';
import TradeHistory from './components/TradeHistory';
import { useOvershoot } from './hooks/useOvershoot';
import { CheckCircle, XCircle } from 'lucide-react';

function Toast() {
  const { toast } = useTradingContext();
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in ${
      toast.type === 'success' ? 'bg-green-900 border border-green-700 text-green-200' : 'bg-red-900 border border-red-700 text-red-200'
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
        overshootStatus === 'active' ? 'bg-purple-400 animate-pulse' : 'bg-red-500'
      }`} />
      <span className={overshootStatus === 'active' ? 'text-purple-400' : 'text-red-400'}>
        Vision {overshootStatus === 'active' ? 'on' : 'err'}
      </span>
    </span>
  );
}

function AppInner() {
  const { setStartVision } = useTradingContext();
  const { startVision } = useOvershoot();

  // Register startVision into context once — stable callback, runs once
  useEffect(() => { setStartVision(startVision); }, [startVision, setStartVision]);

  return (
    <div className="h-screen w-screen bg-[#111827] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#1f2937] border-b border-[#374151] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white text-xs font-black">S</div>
          <span className="text-white font-bold text-base tracking-tight">Stocky Fun</span>
          <span className="text-[#6b7280] text-xs">BTC/USD · Paper Trading</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#6b7280]">
          <OvershootStatusDot />
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
          <span>IST timezone</span>
        </div>
      </div>

      {/* Main layout: 60/40 split */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Chart (60%) */}
        <div className="w-[60%] h-full border-r border-[#374151]">
          <ChartPanel />
        </div>

        {/* Right: Controls (40%) */}
        <div className="w-[40%] h-full flex flex-col min-h-0 overflow-y-auto">
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
  return (
    <TradingProvider>
      <AppInner />
    </TradingProvider>
  );
}
