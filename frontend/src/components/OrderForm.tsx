import { useState, useEffect } from 'react';
import { ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../lib/api';
import { addTrade } from '../lib/tradesStore';
import { useTradingContext } from '../context/TradingContext';
import { COINS } from '../lib/coins';

export default function OrderForm() {
  const { lastSignal, showToast, bumpTradesVersion, selectedCoin } = useTradingContext();
  const coin = COINS[selectedCoin];
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('0.001');
  const [stopLoss, setStopLoss] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState(false);
  const [placing, setPlacing] = useState(false);

  // Auto-set side from signal
  useEffect(() => {
    if (lastSignal?.signal === 'buy') setSide('buy');
    else if (lastSignal?.signal === 'sell') setSide('sell');
  }, [lastSignal]);

  // Fetch live price — 30s interval, re-runs when coin changes
  useEffect(() => {
    let cancelled = false;
    setCurrentPrice(null);
    const update = async () => {
      try {
        const p = await api.getPrice(coin.id);
        if (!cancelled) { setCurrentPrice(p); setPriceError(false); }
      } catch { if (!cancelled) setPriceError(true); }
    };
    update();
    const t = setInterval(update, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, [coin.id]);

  const handlePlace = async () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Enter a valid quantity', 'error');
      return;
    }
    setPlacing(true);
    try {
      const entryPrice = await api.getPrice(coin.id);
      setCurrentPrice(entryPrice);
      setPriceError(false);

      addTrade({
        id: `T${Date.now()}`,
        side,
        quantity: qty,
        entryPrice,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        timestamp: Date.now(),
        signal: lastSignal?.signal,
        coin: selectedCoin,
      });
      bumpTradesVersion();
      showToast(`Paper ${side.toUpperCase()} placed at $${entryPrice.toLocaleString()}`, 'success');
      setStopLoss('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Order failed', 'error');
    } finally {
      setPlacing(false);
    }
  };

  const orderValue = currentPrice && parseFloat(quantity) > 0
    ? (currentPrice * parseFloat(quantity)).toLocaleString('en-US', { maximumFractionDigits: 2 })
    : null;

  return (
    <div className="p-4 border-b border-border-subtle">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingCart size={14} className="text-accent-blue" />
        <span className="section-label text-white">Paper Trade</span>
        {lastSignal && (
          <span className="ml-auto text-[10px] text-muted font-heading">Signal auto-set</span>
        )}
      </div>

      {/* Buy / Sell toggle */}
      <div className="flex rounded-full bg-body p-1 border border-border-subtle mb-3">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold font-heading rounded-full transition-all ${
            side === 'buy' ? 'bg-accent-green text-black shadow-glow-green' : 'text-muted hover:text-white'
          }`}
        >
          <TrendingUp size={14} /> BUY
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold font-heading rounded-full transition-all ${
            side === 'sell' ? 'bg-accent-red text-white shadow-glow-red' : 'text-muted hover:text-white'
          }`}
        >
          <TrendingDown size={14} /> SELL
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-2 mb-3">
        <div>
          <label className="text-[11px] text-muted block mb-1 font-heading tracking-wide uppercase">Symbol</label>
          <div className="bg-body border border-border-subtle rounded-inner px-4 py-2.5 text-sm text-muted font-mono">
            {coin.symbol} / USD (Paper)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-muted block mb-1 font-heading tracking-wide uppercase">Quantity</label>
            <div className="relative">
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                step="0.001"
                min="0.001"
                className="w-full bg-paper border border-border-subtle rounded-inner px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-accent-green focus:shadow-glow-green transition-all pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted font-heading font-bold pointer-events-none">{coin.symbol}</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted block mb-1 font-heading tracking-wide uppercase">Stop Loss</label>
            <div className="relative">
              <input
                type="number"
                value={stopLoss}
                onChange={e => setStopLoss(e.target.value)}
                placeholder="Optional"
                className="w-full bg-paper border border-border-subtle rounded-inner px-4 py-2.5 text-sm text-white font-mono placeholder-muted-dim focus:outline-none focus:border-accent-green focus:shadow-glow-green transition-all pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted font-heading font-bold pointer-events-none">USD</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between text-[11px] text-muted font-heading">
          <span>Market price</span>
          <span className={`font-mono ${priceError ? 'text-accent-red' : 'text-white'}`}>
            {priceError ? 'Unavailable' : currentPrice ? `$${currentPrice.toLocaleString()}` : 'Loading...'}
          </span>
        </div>
        {orderValue && (
          <div className="flex justify-between text-[11px] text-muted font-heading">
            <span>Order value</span>
            <span className="text-white font-mono">≈ ${orderValue}</span>
          </div>
        )}
      </div>

      <button
        onClick={handlePlace}
        disabled={placing}
        className={`w-full py-3 rounded-inner text-sm font-bold font-heading uppercase tracking-wider transition-all ${
          side === 'buy'
            ? 'bg-accent-green hover:bg-accent-green/90 text-black shadow-glow-green hover:shadow-glow-green-strong'
            : 'bg-accent-red hover:bg-accent-red/90 text-white shadow-glow-red'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {placing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Placing...
          </span>
        ) : (
          `Place Paper ${side.toUpperCase()}`
        )}
      </button>
    </div>
  );
}
