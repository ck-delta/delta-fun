import { Router, Request, Response } from 'express';
import { fetchCandles } from '../services/delta';
import { buildTASummary } from '../services/ta';
import { analyzeWithOpenRouter } from '../services/openrouter';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { prompt, symbol } = req.body as { prompt?: string; symbol?: string };

  if (!symbol) {
    res.status(400).json({ error: 'symbol is required (e.g. BTCUSD)' });
    return;
  }

  const userPrompt = prompt?.trim() || `Give me a current signal on ${symbol}.`;

  try {
    const candles = await fetchCandles(symbol, '5m');
    if (candles.length < 30) {
      res.status(503).json({ error: 'Insufficient market data' });
      return;
    }

    const ta = buildTASummary(candles);
    const result = await analyzeWithOpenRouter(ta, userPrompt, symbol);

    if (result.confidence < 0.6) {
      result.rationale += ' \u26a0\ufe0f Low conviction — consider waiting for confirmation.';
    }

    res.json({ ...result, ta });
  } catch (err) {
    console.error('[analyze]', err);
    res.status(500).json({ error: 'Analysis failed', detail: String(err) });
  }
});

export default router;
