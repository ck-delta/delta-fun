import { useState, useEffect, useCallback } from 'react';
import { BarChart2, Flame, X, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { loadTrades, removeTrade, enrichTrades, calcStreak } from '../lib/tradesStore';
import type { LiveTrade } from '../lib/tradesStore';
import { useTradingContext } from '../context/TradingContext';

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
  const { tradesVersion, bumpTradesVersion } = useTradingContext();
  const [tab, setTab] = useState<'positions' | 'history'>('positions');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>([]);
  const [closing, setClosing] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const trades = loadTrades();
    if (trades.length === 0) { setLiveTrades([]); return; }
    try {
      const price = await api.getPrice();
      setLivePrice(price);
      setLiveTrades(enrichTrades(trades, price));
    } catch {
      // Use last known price if available
      if (livePrice !== null) setLiveTrades(enrichTrades(trades, livePrice));
    }
  }, [livePrice]);

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
  const { streak, streakType } = calcStreak(loadTrades(), livePrice ?? 0);
  const label = streakLabel(streak, streakType);

  return (
    <div className="p-4 flex flex-col gap-3 min-h-0 flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={14} className="text-blue-400" />
          <span className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Trading</span>
        </div>
        <div className="flex items-center gap-3">
          {label && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              streakType === 'win' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
            }`}>{label}</span>
          )}
          <span className={`text-sm font-bold font-mono ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USD
          </span>
          <button onClick={() => void refresh()} className="text-[#6b7280] hover:text-white p-0.5 rounded transition-colors" title="Refresh">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg overflow-hidden border border-[#374151] text-[11px]">
        <button
          onClick={() => setTab('positions')}
          className={`flex-1 py-1.5 font-medium transition-colors ${tab === 'positions' ? 'bg-blue-600 text-white' : 'bg-[#1f2937] text-[#6b7280] hover:text-white'}`}
        >
          Positions ({liveTrades.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 py-1.5 font-medium transition-colors ${tab === 'history' ? 'bg-[#374151] text-white' : 'bg-[#1f2937] text-[#6b7280] hover:text-white'}`}
        >
          History
        </button>
      </div>

      {/* Live price indicator */}
      {livePrice && (
        <div className="flex justify-between text-[10px] text-[#6b7280]">
          <span>Live BTC price</span>
          <span className="font-mono text-white">${livePrice.toLocaleString()}</span>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {liveTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2">
            <Flame size={20} className="text-[#374151]" />
            <p className="text-[#6b7280] text-xs">No trades yet — place your first paper trade!</p>
          </div>
        ) : tab === 'positions' ? (
          <div className="space-y-2">
            {liveTrades.map(trade => (
              <div key={trade.id} className="bg-[#1f2937] border border-[#374151] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      trade.side === 'buy' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                    }`}>{trade.side}</span>
                    <span className="text-xs text-[#9ca3af] font-mono">{trade.quantity} BTC</span>
                  </div>
                  <button
                    onClick={() => handleClose(trade.id)}
                    disabled={closing === trade.id}
                    className="text-[#6b7280] hover:text-red-400 transition-colors p-0.5 rounded"
                    title="Close position"
                  >
                    <X size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-3 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Entry</span>
                    <span className="font-mono text-[#d1d5db]">${trade.entryPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">Current</span>
                    <span className="font-mono text-[#d1d5db]">${trade.currentPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between col-span-2 mt-1">
                    <span className="text-[#6b7280]">Unrealized PnL</span>
                    <span className={`font-mono font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)} USD
                      <span className="text-[#6b7280] text-[9px] ml-1">({trade.pnlPct >= 0 ? '+' : ''}{trade.pnlPct.toFixed(2)}%)</span>
                    </span>
                  </div>
                  {trade.stopLoss && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-[#6b7280]">Stop Loss</span>
                      <span className="font-mono text-orange-400">${trade.stopLoss.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="text-[9px] text-[#6b7280] mt-2">{toIST(trade.timestamp)}</div>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#6b7280] border-b border-[#374151]">
                <th className="text-left pb-2 font-medium">Side</th>
                <th className="text-right pb-2 font-medium">Entry</th>
                <th className="text-right pb-2 font-medium">Qty</th>
                <th className="text-right pb-2 font-medium">PnL</th>
                <th className="text-right pb-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {liveTrades.map(trade => (
                <tr key={trade.id} className="border-b border-[#1f2937] hover:bg-[#1f2937]/50 transition-colors">
                  <td className="py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      trade.side === 'buy' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                    }`}>{trade.side}</span>
                  </td>
                  <td className="text-right py-2 font-mono text-[#d1d5db]">${trade.entryPrice.toLocaleString()}</td>
                  <td className="text-right py-2 font-mono text-[#d1d5db]">{trade.quantity}</td>
                  <td className={`text-right py-2 font-mono font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                  </td>
                  <td className="text-right py-2 text-[#6b7280] text-[10px]">{toIST(trade.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
