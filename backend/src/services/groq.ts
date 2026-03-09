import type { TASummary } from './ta';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] as const;

export interface AnalysisResult {
  prediction: 'up' | 'down';
  confidence: number;
  signal: 'buy' | 'sell' | 'hold';
  rationale: string;
  keyLevels?: string;
  modelUsed?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: { message: { content: string } }[];
}

function buildSystemPrompt(): string {
  return `You are an expert BTC/USD technical analysis assistant for a trading dashboard.
Given real-time TA indicators and a user question, respond ONLY with valid JSON in this exact format:
{
  "prediction": "up" | "down",
  "confidence": <number 0.0-1.0>,
  "signal": "buy" | "sell" | "hold",
  "rationale": "<2-3 sentence explanation referencing specific TA values>",
  "keyLevels": "<brief mention of key EMA support/resistance>"
}

Rules:
- confidence > 0.7 = buy/sell signal, else hold
- Be specific: reference actual EMA values, RSI, candle patterns
- Keep rationale under 60 words
- If RSI > 70 = overbought warning, RSI < 30 = oversold opportunity
- Always return valid parseable JSON, nothing else`;
}

function buildUserMessage(ta: TASummary, userPrompt: string, overshootResult?: string): string {
  return `
REAL-TIME BTC/USD TECHNICAL INDICATORS:
- Price: $${ta.currentPrice.toLocaleString()}
- EMA9: $${ta.ema9.toLocaleString()} (slope: ${ta.ema9Slope}) — price is ${ta.priceVsEma9} EMA9
- EMA21: $${ta.ema21.toLocaleString()} (slope: ${ta.ema21Slope})
- EMA50: $${ta.ema50.toLocaleString()}
- RSI(14): ${ta.rsi}
- Last 5 candles: [${ta.lastCandleColors.join(', ')}]
- Candle pattern: ${ta.candlePattern}
- Overall trend bias: ${ta.trendBias}
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
        max_tokens: 300,
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
  overshootResult?: string
): Promise<AnalysisResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildUserMessage(ta, userPrompt, overshootResult) },
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
    modelUsed,
  };
}
