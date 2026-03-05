import { Router, Request, Response } from 'express';
import { fetchBTCCurrentPrice } from '../services/coingecko';

export interface Trade {
  id: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  currentPrice?: number;
  stopLoss?: number;
  pnl: number;
  pnlPct: number;
  timestamp: number;
  signal?: string;
  closed: boolean;
}

const trades: Trade[] = [];

function calcPnL(trade: Trade, currentPrice: number): { pnl: number; pnlPct: number } {
  const diff = trade.side === 'buy'
    ? currentPrice - trade.entryPrice
    : trade.entryPrice - currentPrice;
  const pnl = diff * trade.quantity;
  const pnlPct = (diff / trade.entryPrice) * 100;
  return { pnl, pnlPct };
}

function calcStreak(tradeList: Trade[]): { streak: number; streakType: 'win' | 'loss' | 'none' } {
  if (tradeList.length === 0) return { streak: 0, streakType: 'none' };
  const sorted = [...tradeList].sort((a, b) => b.timestamp - a.timestamp);
  const firstType = sorted[0].pnl >= 0 ? 'win' : 'loss';
  let streak = 0;
  for (const t of sorted) {
    const isWin = t.pnl >= 0;
    if ((firstType === 'win' && isWin) || (firstType === 'loss' && !isWin)) {
      streak++;
    } else {
      break;
    }
  }
  return { streak, streakType: firstType };
}

// GET /api/trades
Router().get;
const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const price = await fetchBTCCurrentPrice();
    const enriched = trades.map(t => {
      const { pnl, pnlPct } = calcPnL(t, price);
      return { ...t, currentPrice: price, pnl, pnlPct };
    });
    const totalPnL = enriched.reduce((sum, t) => sum + t.pnl, 0);
    const { streak, streakType } = calcStreak(enriched);
    res.json({ trades: enriched.reverse(), totalPnL, streak, streakType });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load trades', detail: String(err) });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const { side, quantity, stopLoss, signal } = req.body as {
    side?: string;
    quantity?: number;
    stopLoss?: number;
    signal?: string;
  };

  if (!side || !['buy', 'sell'].includes(side)) {
    res.status(400).json({ error: 'side must be buy or sell' });
    return;
  }
  if (!quantity || quantity <= 0) {
    res.status(400).json({ error: 'quantity must be positive' });
    return;
  }

  try {
    const price = await fetchBTCCurrentPrice();
    const trade: Trade = {
      id: `T${Date.now()}`,
      side: side as 'buy' | 'sell',
      quantity: Number(quantity),
      entryPrice: price,
      stopLoss: stopLoss ? Number(stopLoss) : undefined,
      pnl: 0,
      pnlPct: 0,
      timestamp: Date.now(),
      signal,
      closed: false,
    };
    trades.push(trade);
    res.json({ trade, message: `Paper ${side.toUpperCase()} order placed at $${price.toLocaleString()}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to place trade', detail: String(err) });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const idx = trades.findIndex(t => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Trade not found' });
    return;
  }
  trades.splice(idx, 1);
  res.json({ message: 'Trade removed' });
});

export default router;
