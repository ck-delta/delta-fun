const STORAGE_KEY = 'stocky_trades';

export interface StoredTrade {
  id: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  stopLoss?: number;
  timestamp: number;
  signal?: string;
}

export interface LiveTrade extends StoredTrade {
  currentPrice: number;
  pnl: number;
  pnlPct: number;
}

export function loadTrades(): StoredTrade[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as StoredTrade[];
  } catch {
    return [];
  }
}

export function saveTrades(trades: StoredTrade[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}

export function addTrade(trade: StoredTrade): void {
  const trades = loadTrades();
  trades.unshift(trade);
  saveTrades(trades);
}

export function removeTrade(id: string): void {
  saveTrades(loadTrades().filter(t => t.id !== id));
}

export function clearTrades(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function calcPnL(trade: StoredTrade, currentPrice: number): { pnl: number; pnlPct: number } {
  const diff = trade.side === 'buy'
    ? currentPrice - trade.entryPrice
    : trade.entryPrice - currentPrice;
  return {
    pnl: diff * trade.quantity,
    pnlPct: (diff / trade.entryPrice) * 100,
  };
}

export function enrichTrades(trades: StoredTrade[], currentPrice: number): LiveTrade[] {
  return trades.map(t => ({ ...t, currentPrice, ...calcPnL(t, currentPrice) }));
}

export function calcStreak(trades: StoredTrade[], currentPrice: number): { streak: number; streakType: 'win' | 'loss' | 'none' } {
  if (trades.length === 0) return { streak: 0, streakType: 'none' };
  const enriched = enrichTrades(trades, currentPrice);
  const firstType = enriched[0].pnl >= 0 ? 'win' : 'loss';
  let streak = 0;
  for (const t of enriched) {
    const isWin = t.pnl >= 0;
    if ((firstType === 'win' && isWin) || (firstType === 'loss' && !isWin)) streak++;
    else break;
  }
  return { streak, streakType: firstType };
}
