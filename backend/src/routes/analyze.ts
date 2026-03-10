import { Router, Request, Response } from 'express';
import { fetchOHLC } from '../services/coingecko';
import { buildTASummary } from '../services/ta';
import { analyzeWithGroq } from '../services/groq';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { prompt, overshootResult, coin, coinSymbol } = req.body as {
    prompt?: string;
    overshootResult?: string;
    coin?: string;       // CoinGecko coin ID e.g. 'ethereum'
    coinSymbol?: string; // Display symbol e.g. 'ETH'
  };

  if (!prompt) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  const coinId = coin ?? 'bitcoin';
  const symbol = coinSymbol ?? 'BTC';

  try {
    const candles = await fetchOHLC(coinId, 1);
    if (candles.length < 10) {
      res.status(503).json({ error: 'Insufficient market data' });
      return;
    }

    const ta = buildTASummary(candles);
    const result = await analyzeWithGroq(ta, prompt, symbol, overshootResult);

    res.json({ ...result, ta });
  } catch (err) {
    console.error('[analyze]', err);
    res.status(500).json({ error: 'Analysis failed', detail: String(err) });
  }
});

export default router;
