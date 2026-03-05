import { Router, Request, Response } from 'express';
import { fetchBTCOHLC, fetchBTCCurrentPrice } from '../services/coingecko';

const router = Router();

router.get('/ohlc', async (_req: Request, res: Response) => {
  try {
    const candles = await fetchBTCOHLC(1);
    res.json({ candles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch OHLC', detail: String(err) });
  }
});

router.get('/price', async (_req: Request, res: Response) => {
  try {
    const price = await fetchBTCCurrentPrice();
    res.json({ price });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch price', detail: String(err) });
  }
});

export default router;
