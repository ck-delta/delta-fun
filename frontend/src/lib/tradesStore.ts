const STORAGE_KEY = 'delta_fun_trades_v1';
const WALLET_KEY = 'delta_fun_wallet_v1';
const STARTING_WALLET = 10_000; // 10,000 USDT paper wallet
export const FIXED_LEVERAGE = 10;

export interface StoredTrade {
  id: string;
  symbol: string;             // e.g. 'BTCUSD'
  side: 'buy' | 'sell';
  margin: number;             // USDT staked
  entryPrice: number;
  notional: number;           // margin * leverage
  leverage: number;
  liquidationPrice: number;
  timestamp: number;
  signal?: 'buy' | 'sell' | 'hold';
  confidence?: number;
}

export interface ClosedTrade extends StoredTrade {
  closedAt: number;
  exitPrice: number;
  realizedPnl: number;
  realizedPnlPct: number;     // pct vs margin
}

export interface LiveTrade extends StoredTrade {
  currentPrice: number;
  pnl: number;
  pnlPct: number;             // pct vs margin
  isLiquidated: boolean;
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

export function loadClosed(): ClosedTrade[] {
  try {
    return JSON.parse(localStorage.getItem(`${STORAGE_KEY}_closed`) ?? '[]') as ClosedTrade[];
  } catch {
    return [];
  }
}

function saveClosed(list: ClosedTrade[]): void {
  localStorage.setItem(`${STORAGE_KEY}_closed`, JSON.stringify(list.slice(0, 50)));
}

export function addTrade(trade: StoredTrade): void {
  const trades = loadTrades();
  trades.unshift(trade);
  saveTrades(trades);
}

export function removeTrade(id: string): void {
  saveTrades(loadTrades().filter(t => t.id !== id));
}

export function loadWallet(): number {
  const raw = localStorage.getItem(WALLET_KEY);
  if (raw === null) {
    localStorage.setItem(WALLET_KEY, String(STARTING_WALLET));
    return STARTING_WALLET;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : STARTING_WALLET;
}

export function saveWallet(value: number): void {
  localStorage.setItem(WALLET_KEY, String(value));
}

export function resetWallet(): void {
  localStorage.setItem(WALLET_KEY, String(STARTING_WALLET));
  saveTrades([]);
  saveClosed([]);
}

export function calcLiquidation(side: 'buy' | 'sell', entryPrice: number, leverage: number): number {
  // Isolated margin, ignoring fees: liq when price moves 1/leverage against you.
  const move = entryPrice / leverage;
  return side === 'buy' ? entryPrice - move : entryPrice + move;
}

export function calcPnL(trade: StoredTrade, currentPrice: number): { pnl: number; pnlPct: number } {
  const contracts = trade.notional / trade.entryPrice;
  const diff = trade.side === 'buy'
    ? currentPrice - trade.entryPrice
    : trade.entryPrice - currentPrice;
  const pnl = diff * contracts;
  const pnlPct = trade.margin > 0 ? (pnl / trade.margin) * 100 : 0;
  return { pnl, pnlPct };
}

export function enrichTrades(trades: StoredTrade[], priceBySymbol: Record<string, number>): LiveTrade[] {
  return trades.map(t => {
    const currentPrice = priceBySymbol[t.symbol] ?? t.entryPrice;
    const { pnl, pnlPct } = calcPnL(t, currentPrice);
    const isLiquidated = t.side === 'buy'
      ? currentPrice <= t.liquidationPrice
      : currentPrice >= t.liquidationPrice;
    return { ...t, currentPrice, pnl, pnlPct, isLiquidated };
  });
}

export function closeTrade(
  id: string,
  exitPrice: number,
): ClosedTrade | null {
  const trades = loadTrades();
  const idx = trades.findIndex(t => t.id === id);
  if (idx === -1) return null;
  const trade = trades[idx];
  const { pnl, pnlPct } = calcPnL(trade, exitPrice);
  const closed: ClosedTrade = {
    ...trade,
    closedAt: Date.now(),
    exitPrice,
    realizedPnl: pnl,
    realizedPnlPct: pnlPct,
  };
  trades.splice(idx, 1);
  saveTrades(trades);
  const closedList = loadClosed();
  closedList.unshift(closed);
  saveClosed(closedList);

  // Credit back margin ± pnl to wallet.
  const wallet = loadWallet();
  saveWallet(wallet + trade.margin + pnl);

  return closed;
}
