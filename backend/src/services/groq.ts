import type { TASummary } from './ta';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] as const;

export interface AnalysisResult {
  prediction: 'up' | 'down';
  confidence: number;
  signal: 'buy' | 'sell' | 'hold';
  rationale: string;
  keyLevels?: string;
  action?: string;
  risk?: string;
  modelUsed?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: { message: { content: string } }[];
}

function buildSystemPrompt(symbol: string): string {
  return `You are a senior ${symbol}/USD crypto trader and technical analyst. You give specific, actionable analysis — never vague.

Respond ONLY with valid JSON in this exact format:
{
  "prediction": "up" | "down",
  "confidence": <number 0.0-1.0>,
  "signal": "buy" | "sell" | "hold",
  "rationale": "<3-5 sentence explanation with exact indicator values, price levels, and % distances>",
  "keyLevels": "<support at $X, resistance at $Y, EMA200 at $Z>",
  "action": "<specific next step: e.g. 'Enter long at $X with stop at $Y, target $Z (R:R 2.1:1)' or 'Wait for RSI to drop below 30 before entering'>",
  "risk": "<what invalidates this thesis: e.g. 'Break below $X support invalidates the bullish setup — would flip bias bearish'>"
}

RULES — follow strictly:
- confidence > 0.7 → buy or sell; confidence ≤ 0.7 → hold
- ALWAYS cite exact numbers: "RSI at 42" not "RSI neutral"; "$87,200 support" not "near support"
- For buy/sell signals: include specific entry price, stop-loss level, and target with risk-reward ratio
- For hold signals: explain exactly what would trigger a buy or sell (e.g. "buy if RSI drops below 30 while price holds $85k support")
- Never say "mixed signals" — instead explain what's bullish vs bearish specifically
- Cross-reference multiple indicators: e.g. "RSI 28 oversold + price at BB lower band ($84,500) + stochastic %K 15 = high-probability long"
- Use the composite signalScore: ≥ 4 = bullish bias, ≤ -4 = bearish bias, between = contested
- MACD bullish_cross = strong buy signal; Bollinger squeeze = imminent breakout
- Keep rationale under 120 words but be specific — vague analysis is useless
- Always return valid parseable JSON, nothing else`;
}

function buildUserMessage(ta: TASummary, userPrompt: string, symbol: string, overshootResult?: string): string {
  return `
REAL-TIME ${symbol}/USD TECHNICAL INDICATORS:
Price: $${ta.currentPrice.toLocaleString()}

EMAs:
- EMA9: $${ta.ema9.toLocaleString()} (slope: ${ta.ema9Slope}) — price ${ta.priceVsEma9}
- EMA21: $${ta.ema21.toLocaleString()} (slope: ${ta.ema21Slope})
- EMA50: $${ta.ema50.toLocaleString()}
- EMA200: $${ta.ema200.toLocaleString()} — price ${ta.priceVsEma200} (long-term trend)

Momentum:
- RSI(14): ${ta.rsi} [${ta.rsiZone}]
- MACD: ${ta.macd} | Signal: ${ta.macdSignal} | Histogram: ${ta.macdHistogram} | Cross: ${ta.macdCross}
- Stochastic %K: ${ta.stochK} | %D: ${ta.stochD} [${ta.stochSignal}]

Volatility:
- Bollinger Bands: Upper $${ta.bbUpper.toLocaleString()} / Mid $${ta.bbMiddle.toLocaleString()} / Lower $${ta.bbLower.toLocaleString()}
- BB %B: ${ta.bbPctB} (0=at lower, 0.5=middle, 1=at upper) | Squeeze: ${ta.bbSqueeze}
- ATR(14): $${ta.atr}

Structure:
- Support: $${ta.support.toLocaleString()} | Resistance: $${ta.resistance.toLocaleString()}
- Candle pattern (last 5): [${ta.lastCandleColors.join(', ')}] — ${ta.candlePattern}

Composite Signal Score: ${ta.signalScore}/10 → trend bias: ${ta.trendBias.toUpperCase()}
${overshootResult ? `\nVISUAL CHART ANALYSIS (Overshoot.ai): ${overshootResult}` : ''}

USER QUESTION: ${userPrompt}`;
}

async function callGroqFetch(model: string, messages: ChatMessage[]): Promise<GroqResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  let res: Response;
  try {
    res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Groq HTTP ${res.status}: ${body.slice(0, 120)}`);
  }

  return res.json() as Promise<GroqResponse>;
}

export async function analyzeWithGroq(
  ta: TASummary,
  userPrompt: string,
  symbol = 'BTC',
  overshootResult?: string
): Promise<AnalysisResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(symbol) },
    { role: 'user', content: buildUserMessage(ta, userPrompt, symbol, overshootResult) },
  ];

  let completion: GroqResponse | null = null;
  let modelUsed: string = MODELS[0];
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      completion = await callGroqFetch(model, messages);
      modelUsed = model;
      break;
    } catch (err) {
      lastError = err;
      console.warn(`[groq] ${model} failed:`, err instanceof Error ? err.message : err);
      // continue to next model
    }
  }

  if (!completion) {
    throw lastError ?? new Error('Groq analysis failed on all models');
  }

  const content = completion.choices[0]?.message?.content ?? '{}';
  let parsed: Partial<AnalysisResult>;
  try {
    parsed = JSON.parse(content) as Partial<AnalysisResult>;
  } catch {
    throw new Error(`Groq returned non-JSON response: ${content.slice(0, 120)}`);
  }

  return {
    prediction: parsed.prediction === 'up' ? 'up' : 'down',
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
    signal: (['buy', 'sell', 'hold'] as const).includes(parsed.signal as 'buy' | 'sell' | 'hold')
      ? (parsed.signal as 'buy' | 'sell' | 'hold')
      : 'hold',
    rationale: parsed.rationale ?? 'Analysis inconclusive.',
    keyLevels: parsed.keyLevels,
    action: parsed.action,
    risk: parsed.risk,
    modelUsed,
  };
}
