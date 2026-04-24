import { Router, Request, Response } from 'express';
import { fetchProducts, fetchCandles, fetchTicker } from '../services/delta';

const router = Router();

router.get('/products', async (_req: Request, res: Response) => {
  try {
    const products = await fetchProducts();
    // Trim payload — the UI only needs a compact subset.
    const compact = products.map(p => ({
      id: p.id,
      symbol: p.symbol,
      description: p.description,
      contract_type: p.contract_type,
      underlying: p.underlying_asset?.symbol ?? '',
      quoting: p.quoting_asset?.symbol ?? '',
    }));
    res.json({ products: compact });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products', detail: String(err) });
  }
});

router.get('/candles', async (req: Request, res: Response) => {
  const symbol = (req.query.symbol as string) ?? 'BTCUSD';
  const resolution = (req.query.resolution as string) ?? '5m';
  try {
    const candles = await fetchCandles(symbol, resolution);
    res.json({ candles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candles', detail: String(err) });
  }
});

router.get('/ticker', async (req: Request, res: Response) => {
  const symbol = (req.query.symbol as string) ?? 'BTCUSD';
  try {
    const ticker = await fetchTicker(symbol);
    res.json(ticker);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ticker', detail: String(err) });
  }
});

export default router;
