import Groq from 'groq-sdk';
import type { TASummary } from './ta';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] as const;

export interface AnalysisResult {
  prediction: 'up' | 'down';
  confidence: number;
  signal: 'buy' | 'sell' | 'hold';
  rationale: string;
  keyLevels?: string;
  modelUsed?: string;
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

async function callGroqWithRetry(
  model: string,
  messages: Groq.Chat.ChatCompletionMessageParam[]
): Promise<Groq.Chat.ChatCompletion> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {
    model,
    messages,
    temperature: 0.3,
    max_tokens: 300,
    response_format: { type: 'json_object' },
  };
  try {
    return await groq.chat.completions.create(params);
  } catch (err) {
    if (err instanceof Groq.APIConnectionError) {
      await new Promise(r => setTimeout(r, 1500));
      return await groq.chat.completions.create(params);
    }
    throw err;
  }
}

export async function analyzeWithGroq(
  ta: TASummary,
  userPrompt: string,
  overshootResult?: string
): Promise<AnalysisResult> {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildUserMessage(ta, userPrompt, overshootResult) },
  ];

  let completion: Groq.Chat.ChatCompletion | null = null;
  let modelUsed: string = MODELS[0];
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      completion = await callGroqWithRetry(model, messages);
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
