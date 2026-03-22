import { useEffect, useState } from 'react';
import { TradingProvider, useTradingContext } from './context/TradingContext';
import { COINS, COIN_KEYS } from './lib/coins';
import ChartPanel from './components/ChartPanel';
import PromptInput from './components/PromptInput';
import SignalDisplay from './components/SignalDisplay';
import OrderForm from './components/OrderForm';
import TradeHistory from './components/TradeHistory';
import LoadingScreen from './components/LoadingScreen';
import ProfitPopup from './components/ProfitPopup';
import SwipePanels from './components/SwipePanels';
import { useOvershoot } from './hooks/useOvershoot';
import { CheckCircle, XCircle, ChevronUp, ChevronDown, Sparkles, ShoppingCart } from 'lucide-react';
import type { CoinKey } from './lib/coins';

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
  const { setStartVision, chartFocusMode, selectedCoin, setSelectedCoin, tradesVersion, livePrice } = useTradingContext();
  const coin = COINS[selectedCoin];
  const { startVision } = useOvershoot();

  const [activePanel, setActivePanel] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  // Count open trades for the toggle label
  const [tradeCount, setTradeCount] = useState(0);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('stocky_trades');
      if (stored) {
        const trades = JSON.parse(stored) as { coin?: CoinKey }[];
        setTradeCount(trades.filter(t => (t.coin ?? 'BTC') === selectedCoin).length);
      } else {
        setTradeCount(0);
      }
    } catch { setTradeCount(0); }
  }, [tradesVersion, selectedCoin]);

  // Register startVision into context once
  useEffect(() => { setStartVision(startVision); }, [startVision, setStartVision]);

  const TAB_LABELS = [
    { label: 'AI Analysis', icon: <Sparkles size={11} /> },
    { label: 'Paper Trade', icon: <ShoppingCart size={11} /> },
  ];

  return (
    <div className="h-screen w-screen bg-body flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 md:px-5 py-1.5 bg-paper border-b border-border-subtle flex-shrink-0" style={{ paddingTop: 'max(0.375rem, env(safe-area-inset-top))' }}>
        {/* Left: Logo + coin pills */}
        <div className="flex items-center gap-2 min-w-0">
          <img src="/favicon.svg" alt="Stocky Fun" className="w-6 h-6 flex-shrink-0" />
          <span className="text-white font-heading font-bold text-sm tracking-tight hidden sm:inline">Stocky Fun</span>

          {/* Coin pills — mobile: in top bar, desktop: hidden */}
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide lg:hidden">
            {COIN_KEYS.filter(c => c !== 'HYPE').map(c => (
              <button
                key={c}
                onClick={() => { if (c !== selectedCoin) setSelectedCoin(c); }}
                className={`px-2 py-0.5 min-h-[32px] flex items-center rounded-full text-[10px] font-bold font-heading transition-all border ${
                  c === selectedCoin
                    ? 'bg-accent-green/10 text-accent-green border-accent-green/30'
                    : 'text-muted hover:text-white border-transparent'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Desktop coin label */}
          <span className="text-muted text-[11px] font-mono hidden lg:inline">{coin.symbol}/USD · Paper</span>
        </div>

        {/* Right: Price + status */}
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-muted font-heading flex-shrink-0">
          {/* Live price — mobile */}
          <div className="flex items-center gap-1.5 lg:hidden">
            {livePrice !== null && (
              <span className="font-mono font-semibold text-white text-[11px]">
                ${livePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            )}
          </div>

          <span className="hidden lg:inline-flex"><OvershootStatusDot /></span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse shadow-glow-green" />
            <span className="hidden sm:inline">Live</span>
          </span>
          <span className="hidden md:inline">IST</span>
        </div>
      </div>

      {/* Main layout */}
      <div className={`flex flex-col lg:flex-row flex-1 min-h-0`}>
        {/* Chart */}
        <div className={`border-b lg:border-b-0 lg:border-r border-border-subtle transition-all duration-300 ${
          chartFocusMode ? 'w-full h-full' : 'h-[50vh] lg:h-full w-full lg:w-[60%]'
        }`}>
          <ChartPanel />
        </div>

        {/* Mobile: Framer Motion swipeable panels */}
        <div className={`flex flex-col min-h-0 transition-all duration-300 lg:hidden ${
          chartFocusMode ? 'h-0 overflow-hidden' : 'flex-1'
        }`}>
          {/* Tab indicator bar */}
          <div className="flex items-center border-b border-border-subtle bg-paper flex-shrink-0">
            {TAB_LABELS.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActivePanel(i)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] text-[11px] font-heading font-semibold uppercase tracking-wide transition-all border-b-2 ${
                  activePanel === i
                    ? 'text-accent-green border-accent-green'
                    : 'text-muted border-transparent'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Swipeable panels */}
          <div className="flex-1 min-h-0">
            <SwipePanels
              panels={[
                <>
                  <SignalDisplay />
                  <PromptInput />
                </>,
                <OrderForm />,
              ]}
              activePanel={activePanel}
              onPanelChange={setActivePanel}
            />
          </div>

          {/* Collapsible Trade History toggle */}
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center justify-center gap-2 py-2.5 min-h-[44px] bg-paper border-t border-border-subtle text-[11px] text-muted font-heading uppercase tracking-wide hover:text-white transition-colors flex-shrink-0"
            style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
          >
            {showHistory ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            Trade History{tradeCount > 0 ? ` (${tradeCount})` : ''}
          </button>

          {showHistory && (
            <div className="max-h-[40vh] overflow-y-auto border-t border-border-subtle animate-slide-up flex-shrink-0">
              <TradeHistory />
            </div>
          )}
        </div>

        {/* Desktop: original stacked layout */}
        <div className={`hidden lg:flex flex-col min-h-0 overflow-y-auto transition-all duration-300 ${
          chartFocusMode ? 'lg:w-0 overflow-hidden' : 'lg:flex-none lg:w-[40%]'
        }`}>
          <PromptInput />
          <SignalDisplay />
          <OrderForm />
          <TradeHistory />
        </div>
      </div>

      <Toast />
      <ProfitPopup />
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
