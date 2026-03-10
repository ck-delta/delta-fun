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
    <div className="p-4 border-b border-[#374151]">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingCart size={14} className="text-blue-400" />
        <span className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Paper Trade</span>
        {lastSignal && (
          <span className="ml-auto text-[10px] text-[#6b7280]">Signal auto-set</span>
        )}
      </div>

      {/* Buy / Sell toggle */}
      <div className="flex rounded-lg overflow-hidden border border-[#374151] mb-3">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition-colors ${
            side === 'buy' ? 'bg-green-600 text-white' : 'bg-[#1f2937] text-[#6b7280] hover:text-white'
          }`}
        >
          <TrendingUp size={14} /> BUY
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition-colors ${
            side === 'sell' ? 'bg-red-600 text-white' : 'bg-[#1f2937] text-[#6b7280] hover:text-white'
          }`}
        >
          <TrendingDown size={14} /> SELL
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-2 mb-3">
        <div>
          <label className="text-[11px] text-[#6b7280] block mb-1">Symbol</label>
          <div className="bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-sm text-[#9ca3af]">
            {coin.symbol} / USD (Paper)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-[#6b7280] block mb-1">Quantity ({coin.symbol})</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              step="0.001"
              min="0.001"
              className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#6b7280] block mb-1">Stop Loss (USD)</label>
            <input
              type="number"
              value={stopLoss}
              onChange={e => setStopLoss(e.target.value)}
              placeholder="Optional"
              className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-between text-[11px] text-[#6b7280]">
          <span>Market price</span>
          <span className={`font-mono ${priceError ? 'text-red-400' : 'text-white'}`}>
            {priceError ? 'Unavailable' : currentPrice ? `$${currentPrice.toLocaleString()}` : 'Loading...'}
          </span>
        </div>
        {orderValue && (
          <div className="flex justify-between text-[11px] text-[#6b7280]">
            <span>Order value</span>
            <span className="text-white font-mono">≈ ${orderValue}</span>
          </div>
        )}
      </div>

      <button
        onClick={handlePlace}
        disabled={placing}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
          side === 'buy'
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : 'bg-red-600 hover:bg-red-500 text-white'
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
