import { useEffect } from 'react';
import { TradingProvider, useTradingContext } from './context/TradingContext';
import { useDeltaCandles } from './hooks/useDeltaCandles';
import { useAnalysis } from './hooks/useAnalysis';
import AssetSearch from './components/AssetSearch';
import PriceHeader from './components/PriceHeader';
import DeltaChart from './components/DeltaChart';
import IndicatorsStrip from './components/IndicatorsStrip';
import SignalCard from './components/SignalCard';
import OrderForm from './components/OrderForm';
import PositionsList from './components/PositionsList';
import Toast from './components/Toast';

function AppBody() {
  const { selectedSymbol, setLivePrice, lastSignal, tradesVersion } = useTradingContext();
  const { candles, lastPrice } = useDeltaCandles(selectedSymbol, '5m');
  const { analyze } = useAnalysis();

  // Pipe WS price → context
  useEffect(() => {
    setLivePrice(lastPrice);
  }, [lastPrice, setLivePrice]);

  // Auto-trigger AI on asset change (and once on first mount)
  useEffect(() => {
    analyze(selectedSymbol);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol]);

  const ta = lastSignal?.ta ?? null;

  return (
    <div className="min-h-screen bg-bg-sub-surface text-fg-primary">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-bg-sub-surface/90 backdrop-blur border-b border-divider safe-top">
        <div className="max-w-[640px] mx-auto px-md py-sm flex items-center justify-between gap-md">
          <div className="flex items-center gap-sm">
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white font-bold">δ</div>
            <span className="font-semibold tracking-tight">delta-fun</span>
          </div>
          <span className="text-[10px] text-fg-tertiary uppercase tracking-widest">Paper · 10×</span>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-md pb-[max(2rem,env(safe-area-inset-bottom))] pt-md space-y-md">
        <AssetSearch />
        <PriceHeader />

        <section className="rounded-xl bg-bg-surface-alt border border-divider overflow-hidden">
          <div className="flex items-center justify-between px-md py-sm border-b border-divider">
            <span className="section-label">Chart · 5m · EMA 20/50/200 · Bollinger</span>
            <span className="text-[10px] text-fg-tertiary font-mono">{candles.length} bars</span>
          </div>
          <DeltaChart candles={candles} height={320} />
        </section>

        <IndicatorsStrip ta={ta} />

        <SignalCard />
        <OrderForm />

        <section>
          <h2 className="section-label mb-sm">Positions</h2>
          <PositionsList key={tradesVersion /* rerender on mutation */ } />
        </section>

        <footer className="text-center pt-md pb-lg text-[10px] text-fg-tertiary">
          Delta Exchange data · OpenRouter (Claude Sonnet 4.6) · Paper only
        </footer>
      </main>

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <TradingProvider>
      <AppBody />
    </TradingProvider>
  );
}
