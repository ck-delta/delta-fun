import { useState, useEffect, useCallback } from 'react';
import { BarChart2, Flame, X, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { loadTradesForCoin, removeTrade, enrichTrades, calcStreak } from '../lib/tradesStore';
import type { LiveTrade } from '../lib/tradesStore';
import { useTradingContext } from '../context/TradingContext';
import { COINS } from '../lib/coins';

function toIST(ts: number): string {
  return new Date(ts).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function streakLabel(streak: number, type: 'win' | 'loss' | 'none'): string {
  if (type === 'none' || streak === 0) return '';
  const emoji = type === 'win' ? '🔥' : '❄️';
  const tag = streak >= 10 ? ' LEGENDARY!' : streak >= 5 ? ' HOT!' : streak >= 3 ? ' Streak!' : '';
  return `${emoji} ${streak}x ${type}${tag}`;
}

export default function TradeHistory() {
  const { tradesVersion, bumpTradesVersion, selectedCoin } = useTradingContext();
  const coin = COINS[selectedCoin];
  const [tab, setTab] = useState<'positions' | 'history'>('positions');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>([]);
  const [closing, setClosing] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const trades = loadTradesForCoin(selectedCoin);
    if (trades.length === 0) { setLiveTrades([]); return; }
    try {
      const price = await api.getPrice(coin.id);
      setLivePrice(price);
      setLiveTrades(enrichTrades(trades, price));
    } catch {
      if (livePrice !== null) setLiveTrades(enrichTrades(trades, livePrice));
    }
  }, [livePrice, coin.id, selectedCoin]);

  // Refresh on trades change or every 30s
  useEffect(() => { void refresh(); }, [tradesVersion]);
  useEffect(() => {
    const t = setInterval(() => void refresh(), 30000);
    return () => clearInterval(t);
  }, [refresh]);

  const handleClose = async (id: string) => {
    setClosing(id);
    removeTrade(id);
    bumpTradesVersion();
    setClosing(null);
  };

  const totalPnL = liveTrades.reduce((s, t) => s + t.pnl, 0);
  const { streak, streakType } = calcStreak(loadTradesForCoin(selectedCoin), livePrice ?? 0);
  const label = streakLabel(streak, streakType);

  return (
    <div className="p-4 flex flex-col gap-3 min-h-[180px] flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={14} className="text-accent-blue" />
          <span className="section-label text-white">Trading</span>
        </div>
        <div className="flex items-center gap-3">
          {label && (
            <span className={`text-xs font-bold font-heading px-2 py-0.5 rounded-full ${
              streakType === 'win' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-blue/10 text-accent-blue'
            }`}>{label}</span>
          )}
          <span className={`text-sm font-bold font-mono ${totalPnL >= 0 ? 'text-accent-green text-glow-green' : 'text-accent-red text-glow-red'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USD
          </span>
          <button onClick={() => void refresh()} className="text-muted hover:text-white p-0.5 rounded transition-colors" title="Refresh">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-full bg-body p-1 border border-border-subtle text-[11px]">
        <button
          onClick={() => setTab('positions')}
          className={`flex-1 py-1.5 font-bold font-heading rounded-full transition-all ${tab === 'positions' ? 'bg-accent-green text-black shadow-glow-green' : 'text-muted hover:text-white'}`}
        >
          Positions ({liveTrades.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 py-1.5 font-bold font-heading rounded-full transition-all ${tab === 'history' ? 'bg-surface text-white' : 'text-muted hover:text-white'}`}
        >
          History
        </button>
      </div>

      {/* Live price indicator */}
      {livePrice && (
        <div className="flex justify-between text-[10px] text-muted font-heading">
          <span>Live {coin.symbol} price</span>
          <span className="font-mono text-white">${livePrice.toLocaleString()}</span>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {liveTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2">
            <Flame size={20} className="text-border-strong" />
            <p className="text-muted text-xs font-heading">No trades yet — place your first paper trade!</p>
          </div>
        ) : tab === 'positions' ? (
          <div className="space-y-2">
            {liveTrades.map(trade => (
              <div key={trade.id} className="bg-paper border border-border-subtle rounded-inner p-3 hover:bg-surface-hover transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-heading ${
                      trade.side === 'buy' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'
                    }`}>{trade.side}</span>
                    <span className="text-xs text-muted font-mono">{trade.quantity} {coin.symbol}</span>
                  </div>
                  <button
                    onClick={() => handleClose(trade.id)}
                    disabled={closing === trade.id}
                    className="text-muted hover:text-accent-red transition-colors p-0.5 rounded"
                    title="Close position"
                  >
                    <X size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-3 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted font-heading">Entry</span>
                    <span className="font-mono text-white/80">${trade.entryPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-heading">Current</span>
                    <span className="font-mono text-white/80">${trade.currentPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between col-span-2 mt-1">
                    <span className="text-muted font-heading">Unrealized PnL</span>
                    <span className={`font-mono font-semibold ${trade.pnl >= 0 ? 'text-accent-green text-glow-green' : 'text-accent-red text-glow-red'}`}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)} USD
                      <span className="text-muted text-[9px] ml-1">({trade.pnlPct >= 0 ? '+' : ''}{trade.pnlPct.toFixed(2)}%)</span>
                    </span>
                  </div>
                  {trade.stopLoss && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted font-heading">Stop Loss</span>
                      <span className="font-mono text-accent-amber">${trade.stopLoss.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="text-[9px] text-muted-dim mt-2 font-mono">{toIST(trade.timestamp)}</div>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted border-b border-border-subtle">
                <th className="text-left pb-2 font-bold font-heading text-[10px] uppercase tracking-wide">Side</th>
                <th className="text-right pb-2 font-bold font-heading text-[10px] uppercase tracking-wide">Entry</th>
                <th className="text-right pb-2 font-bold font-heading text-[10px] uppercase tracking-wide">Qty</th>
                <th className="text-right pb-2 font-bold font-heading text-[10px] uppercase tracking-wide">PnL</th>
                <th className="text-right pb-2 font-bold font-heading text-[10px] uppercase tracking-wide">Time</th>
              </tr>
            </thead>
            <tbody>
              {liveTrades.map(trade => (
                <tr key={trade.id} className="border-b border-border-subtle/50 hover:bg-surface-hover transition-colors">
                  <td className="py-2">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-heading ${
                      trade.side === 'buy' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'
                    }`}>{trade.side}</span>
                  </td>
                  <td className="text-right py-2 font-mono text-white/80">${trade.entryPrice.toLocaleString()}</td>
                  <td className="text-right py-2 font-mono text-white/80">{trade.quantity}</td>
                  <td className={`text-right py-2 font-mono font-semibold ${trade.pnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                  </td>
                  <td className="text-right py-2 text-muted text-[10px] font-mono">{toIST(trade.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
