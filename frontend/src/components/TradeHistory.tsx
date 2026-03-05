import { useEffect } from 'react';
import { BarChart2, Flame } from 'lucide-react';
import { api } from '../lib/api';
import { useTradingContext } from '../context/TradingContext';

function toIST(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function streakLabel(streak: number, type: 'win' | 'loss' | 'none'): string {
  if (type === 'none' || streak === 0) return '';
  const emoji = type === 'win' ? '🔥' : '❄️';
  const milestone = streak >= 10 ? ' LEGENDARY!' : streak >= 5 ? ' HOT!' : streak >= 3 ? ' Streak!' : '';
  return `${emoji} ${streak}x ${type}${milestone}`;
}

export default function TradeHistory() {
  const { trades, totalPnL, streak, streakType, setTrades, setTotalPnL, setStreakInfo } = useTradingContext();

  const refresh = async () => {
    try {
      const data = await api.getTrades();
      setTrades(data.trades);
      setTotalPnL(data.totalPnL);
      setStreakInfo(data.streak, data.streakType);
    } catch { /* silent */ }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, []);

  const label = streakLabel(streak, streakType);

  return (
    <div className="p-4 flex flex-col gap-3 min-h-0 flex-1 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={14} className="text-blue-400" />
          <span className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Trade History</span>
        </div>
        <div className="flex items-center gap-3">
          {label && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              streakType === 'win' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
            }`}>
              {label}
            </span>
          )}
          <span className={`text-sm font-bold font-mono ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USD
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2">
            <Flame size={20} className="text-[#374151]" />
            <p className="text-[#6b7280] text-xs">No trades yet — place your first paper trade!</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#6b7280] border-b border-[#374151]">
                <th className="text-left pb-2 font-medium">Side</th>
                <th className="text-right pb-2 font-medium">Entry</th>
                <th className="text-right pb-2 font-medium">Qty</th>
                <th className="text-right pb-2 font-medium">PnL</th>
                <th className="text-right pb-2 font-medium">Time (IST)</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(trade => (
                <tr key={trade.id} className="border-b border-[#1f2937] hover:bg-[#1f2937]/50 transition-colors">
                  <td className="py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      trade.side === 'buy' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                    }`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="text-right py-2 font-mono text-[#d1d5db]">
                    ${trade.entryPrice.toLocaleString()}
                  </td>
                  <td className="text-right py-2 font-mono text-[#d1d5db]">
                    {trade.quantity}
                  </td>
                  <td className={`text-right py-2 font-mono font-semibold ${
                    trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                    <span className="text-[#6b7280] text-[9px] ml-1">
                      ({trade.pnlPct >= 0 ? '+' : ''}{trade.pnlPct.toFixed(2)}%)
                    </span>
                  </td>
                  <td className="text-right py-2 text-[#6b7280]">
                    {toIST(trade.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
