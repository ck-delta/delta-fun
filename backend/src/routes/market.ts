import { Router, Request, Response } from 'express';
import { fetchOHLC, fetchCurrentPrice } from '../services/coingecko';

const router = Router();

router.get('/ohlc', async (req: Request, res: Response) => {
  const coinId = (req.query.coin as string) ?? 'bitcoin';
  try {
    const candles = await fetchOHLC(coinId, 1);
    res.json({ candles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch OHLC', detail: String(err) });
  }
});

router.get('/price', async (req: Request, res: Response) => {
  const coinId = (req.query.coin as string) ?? 'bitcoin';
  try {
    const price = await fetchCurrentPrice(coinId);
    res.json({ price });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch price', detail: String(err) });
  }
});

export default router;
