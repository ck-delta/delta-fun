import type { TASummary } from './ta';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-sonnet-4.6';

export interface ConfidenceBreakdown {
  trend: string;
  momentum: string;
  volatility: string;
  structure: string;
  confluence: string;
}

export interface TradePlan {
  entry: number;
  stop: number;
  target: number;
  rr: string;    // e.g. "1.3:1"
  note?: string; // short guardrail, e.g. "wait for 5m close below 77580"
}

export interface AnalysisResult {
  prediction: 'up' | 'down';
  confidence: number;       // 0–1
  signal: 'buy' | 'sell' | 'hold';
  rationale: string;
  keyLevels?: string;
  action?: string;
  plan?: TradePlan;
  risk?: string;
  thinking?: string;
  confidenceBreakdown?: ConfidenceBreakdown;
  modelUsed?: string;
}

function systemPrompt(symbol: string) {
  return `You are a veteran ${symbol} perpetuals trader on Delta Exchange. You make concise, evidence-based signals using the 4-pillar technical framework below.

4-PILLAR FRAMEWORK:
 1. TREND — EMA 9/21/50/200 stack, slopes, and price vs EMA200.
 2. MOMENTUM — RSI (overbought >70, oversold <30), MACD (cross + histogram direction).
 3. VOLATILITY — Bollinger %B (>0.8 extended, <0.2 compressed), squeeze status.
 4. STRUCTURE — Distance to support/resistance, last 5 candle pattern.

CONFIDENCE CALIBRATION (be honest):
 • 0.80–1.00 → at least 3 pillars clearly aligned + active MACD cross or tag of a key level.
 • 0.65–0.79 → 2–3 pillars align with moderate conviction. Tradable signal.
 • 0.50–0.64 → mixed. Prefer HOLD; state exactly which condition flips it to BUY or SELL.
 • 0.00–0.49 → counter-signals present. HOLD with a directional lean.

EVIDENCE RULES:
 • Every claim cites the exact indicator value — e.g. "RSI 68.4 near overbought", "price $120 above EMA200 ($24,600)".
 • For BUY/SELL: specify entry, stop (off structure or ATR-free: use support/resistance distance), target, and approximate R:R.
 • For HOLD: specify the precise trigger that would flip the bias.

Output ONLY valid JSON with this exact shape:
{
  "thinking": "<70-110 words running through the 4 pillars with exact numbers>",
  "confidenceBreakdown": {
    "trend": "<MAX 12 words. Terse. e.g. 'Below EMA200, bearish stack, slopes down.'>",
    "momentum": "<MAX 12 words. e.g. 'RSI 33 nearing oversold; MACD hist -12 deepening.'>",
    "volatility": "<MAX 12 words. e.g. 'BB squeeze at lower band; breakout imminent.'>",
    "structure": "<MAX 12 words. e.g. 'Price 120 above support; 300 below resistance.'>",
    "confluence": "<MAX 8 words. e.g. '3/4 pillars bearish'>"
  },
  "prediction": "up" | "down",
  "confidence": <0.0-1.0>,
  "signal": "buy" | "sell" | "hold",
  "rationale": "<3-4 sentences, <110 words, cite exact values>",
  "keyLevels": "<support $X, resistance $Y, EMA200 $Z>",
  "plan": {
    "entry":  <number, current or prospective entry price>,
    "stop":   <number, hard stop price>,
    "target": <number, take-profit price>,
    "rr":     "<e.g. '1.5:1' — always reward:risk as a string>",
    "note":   "<optional ≤12-word guardrail, e.g. 'wait for 5m close below 77580'>"
  },
  "action": "<MAX 18 words. Plain-English instruction. For HOLD, describe the exact trigger that flips to the plan above.>",
  "risk":   "<MAX 16 words. Single invalidation condition with a price.>"
}

IMPORTANT:
 - confidenceBreakdown values MUST be terse phrases (≤12 words each), not full sentences. Numbers stay, filler goes.
 - "plan" MUST be filled with numeric values even for HOLD — in that case, give the prospective plan for whichever side has a directional lean. Never return null/undefined for entry/stop/target.

Return only JSON. No prose outside JSON.`;
}

function userMessage(ta: TASummary, userPrompt: string, symbol: string) {
  return `REAL-TIME ${symbol} INDICATORS (5-minute candles, Delta Exchange):
Price: $${ta.currentPrice}
EMA9: $${ta.ema9} (slope ${ta.ema9Slope}) — price ${ta.priceVsEma9}
EMA21: $${ta.ema21} (slope ${ta.ema21Slope})
EMA50: $${ta.ema50}
EMA200: $${ta.ema200} — price ${ta.priceVsEma200}

RSI(14): ${ta.rsi} [${ta.rsiZone}]
MACD: ${ta.macd} | signal ${ta.macdSignal} | histogram ${ta.macdHistogram} | cross ${ta.macdCross}

Bollinger(20,2): upper $${ta.bbUpper} / mid $${ta.bbMiddle} / lower $${ta.bbLower}
BB %B: ${ta.bbPctB} | squeeze: ${ta.bbSqueeze}

Support $${ta.support} | Resistance $${ta.resistance}
Last 5 candles: [${ta.lastCandleColors.join(', ')}] — ${ta.candlePattern}
Composite score: ${ta.signalScore} (bias: ${ta.trendBias.toUpperCase()})

USER QUESTION: ${userPrompt}`;
}

export async function analyzeWithOpenRouter(
  ta: TASummary,
  userPrompt: string,
  symbol: string,
): Promise<AnalysisResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_REFERER ?? 'https://delta-fun.vercel.app',
        'X-Title': 'delta-fun',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 900,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt(symbol) },
          { role: 'user', content: userMessage(ta, userPrompt, symbol) },
        ],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenRouter HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const completion = (await res.json()) as {
    choices: { message: { content: string } }[];
  };

  const content = completion.choices?.[0]?.message?.content ?? '{}';
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    // Sometimes the model wraps JSON in prose — try to recover the first {...} block.
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`OpenRouter returned non-JSON: ${content.slice(0, 120)}`);
    parsed = JSON.parse(match[0]) as Record<string, unknown>;
  }

  const breakdown = parsed.confidenceBreakdown as Partial<ConfidenceBreakdown> | undefined;
  const validSignals = ['buy', 'sell', 'hold'] as const;

  const rawPlan = parsed.plan as Partial<TradePlan> | undefined;
  const plan: TradePlan | undefined =
    rawPlan && Number.isFinite(Number(rawPlan.entry)) && Number.isFinite(Number(rawPlan.stop)) && Number.isFinite(Number(rawPlan.target))
      ? {
          entry: Number(rawPlan.entry),
          stop: Number(rawPlan.stop),
          target: Number(rawPlan.target),
          rr: typeof rawPlan.rr === 'string' ? rawPlan.rr : String(rawPlan.rr ?? ''),
          note: typeof rawPlan.note === 'string' ? rawPlan.note : undefined,
        }
      : undefined;

  return {
    prediction: parsed.prediction === 'down' ? 'down' : 'up',
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
    signal: validSignals.includes(parsed.signal as typeof validSignals[number])
      ? (parsed.signal as 'buy' | 'sell' | 'hold')
      : 'hold',
    rationale: (parsed.rationale as string) ?? 'Analysis inconclusive.',
    keyLevels: parsed.keyLevels as string | undefined,
    action: parsed.action as string | undefined,
    plan,
    risk: parsed.risk as string | undefined,
    thinking: parsed.thinking as string | undefined,
    confidenceBreakdown: breakdown && {
      trend: breakdown.trend ?? '',
      momentum: breakdown.momentum ?? '',
      volatility: breakdown.volatility ?? '',
      structure: breakdown.structure ?? '',
      confluence: breakdown.confluence ?? '',
    },
    modelUsed: MODEL,
  };
}
