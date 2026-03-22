import type { TASummary } from './ta';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] as const;

export interface ConfidenceBreakdown {
  trend: string;
  momentum: string;
  volatility: string;
  structure: string;
  confluence: string;
}

export interface AnalysisResult {
  prediction: 'up' | 'down';
  confidence: number;
  signal: 'buy' | 'sell' | 'hold';
  rationale: string;
  keyLevels?: string;
  action?: string;
  risk?: string;
  thinking?: string;
  confidenceBreakdown?: ConfidenceBreakdown;
  modelUsed?: string;
}

export interface CritiqueResult {
  flaws: string[];
  overlooked: string;
  alternativeView: string;
  adjustedConfidence: number;
  verdict: 'agree' | 'disagree' | 'partially_agree';
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: { message: { content: string } }[];
}

function buildSystemPrompt(symbol: string): string {
  return `You are a 20-year veteran ${symbol}/USD quantitative trader who has managed $500M+ institutional crypto portfolios. You specialize in multi-timeframe technical analysis with a risk-first methodology. You never give vague analysis — every statement is backed by exact numbers.

MANDATORY 5-STEP ANALYSIS FRAMEWORK:
Before producing your final signal, you MUST complete these 5 steps internally and output them in the "thinking" field:

Step 1 — TREND: Check EMA stack order (EMA9 vs EMA21 vs EMA50 vs EMA200), slopes, and price position relative to EMA200. Determine primary trend direction.
Step 2 — MOMENTUM: Evaluate RSI zone (overbought >70, oversold <30), MACD histogram direction and cross status, Stochastic %K/%D position. Note any divergences.
Step 3 — VOLATILITY: Assess BB %B position (>0.8 = extended, <0.2 = compressed), squeeze status (imminent breakout), ATR relative to price range.
Step 4 — STRUCTURE: Calculate distance from current price to support/resistance as % of ATR. Note if price is at a decision point.
Step 5 — CONFLUENCE: Count how many of the 5 indicator groups (trend, momentum_rsi, momentum_macd, volatility, structure) agree on direction. This score (X/5) directly determines confidence.

CONFIDENCE CALIBRATION RUBRIC — follow exactly:
- 0.90-1.00: ≥4/5 groups align + active MACD cross + price at key level. Rare — only assign for textbook setups.
- 0.70-0.89: 3/5 groups align with moderate conviction. Strong enough for buy/sell signal.
- 0.50-0.69: Mixed signals. MUST be hold. Explain exactly what conditions would upgrade to buy/sell.
- 0.00-0.49: Strong counter-signals present. Hold with bearish/bullish lean stated.

EVIDENCE RULES:
- Every claim MUST cite the exact indicator value: "RSI at 68.4 approaching overbought" not "RSI is high"
- Reference price distances: "price $420 above EMA200 ($83,580), a 0.5% premium"
- For buy/sell: specify entry, stop-loss (using ATR or structure), target, and R:R ratio
- For hold: specify the exact trigger that would flip to buy or sell

UNCERTAINTY RULES:
- If confidence < 0.65: explicitly label as "LOW CONVICTION" and recommend waiting for confirmation
- If 2+ major indicators conflict: name them and explain which you weight more heavily and why

Respond ONLY with valid JSON:
{
  "thinking": "<Your 5-step analysis with exact numbers — 100-150 words>",
  "confidenceBreakdown": {
    "trend": "<1 sentence: EMA stack + slopes + price position>",
    "momentum": "<1 sentence: RSI + MACD + Stochastic readings>",
    "volatility": "<1 sentence: BB %B + squeeze + ATR context>",
    "structure": "<1 sentence: S/R levels + distance>",
    "confluence": "<X/5 groups align [bullish/bearish/neutral]>"
  },
  "prediction": "up" | "down",
  "confidence": <0.0-1.0>,
  "signal": "buy" | "sell" | "hold",
  "rationale": "<3-5 sentences citing exact values, max 120 words>",
  "keyLevels": "<support at $X, resistance at $Y, EMA200 at $Z>",
  "action": "<specific next step with entry/stop/target or wait conditions>",
  "risk": "<what invalidates this thesis with specific price levels>"
}

FEW-SHOT EXAMPLES:

Example 1 — BULLISH TREND:
Given: EMA9>EMA21>EMA50>EMA200 (all slopes up), RSI 58, MACD bullish_cross, Stoch %K 65, BB %B 0.65, no squeeze, price 2% above support.
{"thinking":"Step1: EMA stack fully bullish, all slopes up, price above EMA200. Step2: RSI 58 healthy momentum, MACD just crossed bullish (+2 signal), Stoch 65 mid-range. Step3: BB %B 0.65 trending but not overextended, no squeeze. Step4: Price $1,200 above support (1.4x ATR), room to run. Step5: 4/5 groups bullish.","confidenceBreakdown":{"trend":"EMA stack fully bullish with rising slopes","momentum":"RSI 58 + fresh MACD bullish cross confirm upward momentum","volatility":"BB %B 0.65, no squeeze — trending without overextension","structure":"Price 2% above support with ATR-based room to resistance","confluence":"4/5 groups align bullish"},"prediction":"up","confidence":0.85,"signal":"buy","rationale":"EMA stack fully aligned bullish with all slopes rising. Fresh MACD bullish cross at +145 histogram provides strong momentum confirmation. RSI at 58 has room to 70 before overbought. Price sits $1,200 above support at $84,800 (1.4x ATR buffer). BB %B at 0.65 shows trending but not overextended.","keyLevels":"Support $84,800, Resistance $87,200, EMA200 $82,100","action":"Enter long at current $86,000 with stop at $84,600 (below support), target $88,400 (R:R 1.7:1)","risk":"Break below $84,800 support invalidates — would signal EMA stack breakdown"}

Example 2 — RANGING MARKET:
Given: EMAs tangled (EMA9≈EMA21), RSI 48, MACD near zero (no cross), Stoch %K 52, BB squeeze active, price mid-range between S/R.
{"thinking":"Step1: EMAs tangled, EMA9 flat crossing EMA21 — no clear trend. Step2: RSI 48 dead neutral, MACD histogram near zero with no cross, Stoch 52 mid. Step3: BB squeeze active — breakout imminent but direction unclear. Step4: Price equidistant from support and resistance. Step5: 0/5 groups show clear direction.","confidenceBreakdown":{"trend":"EMAs tangled with flat slopes — no directional bias","momentum":"RSI 48, MACD flat, Stoch 52 — all neutral readings","volatility":"BB squeeze active — breakout imminent, direction unclear","structure":"Price centered between $83,200 support and $85,800 resistance","confluence":"0/5 groups align — fully contested"},"prediction":"up","confidence":0.50,"signal":"hold","rationale":"All indicators neutral: RSI 48, MACD histogram at +12 near zero, Stoch %K 52. BB squeeze is active, signaling an imminent breakout, but no directional bias yet. EMAs tangled with EMA9 at $84,500 crossing EMA21 at $84,480. Wait for squeeze resolution.","keyLevels":"Support $83,200, Resistance $85,800, BB bands converging at $84,500","action":"Wait for BB squeeze breakout — buy if price closes above $85,800 resistance with volume, sell if breaks below $83,200","risk":"Squeeze can resolve either direction — premature entry risks whipsaw in this 2.8% range"}

Example 3 — REVERSAL SETUP:
Given: EMA bearish (EMA9<EMA21<EMA50), RSI 22 oversold, MACD histogram narrowing, Stoch %K 12 oversold, BB %B 0.05, price at support.
{"thinking":"Step1: EMA stack bearish but RSI/Stoch extremes suggest exhaustion. Step2: RSI 22 deeply oversold, Stoch %K 12 oversold — mean reversion likely. MACD histogram narrowing from -300 to -180. Step3: BB %B 0.05 price hugging lower band, extreme extension. Step4: Price touching $81,400 support, 0.3x ATR from level. Step5: 3/5 groups support reversal (momentum, volatility, structure).","confidenceBreakdown":{"trend":"EMA stack bearish — trend is down, this is counter-trend","momentum":"RSI 22 + Stoch 12 deeply oversold, MACD histogram narrowing","volatility":"BB %B 0.05 extreme — price at lower band, strong mean reversion signal","structure":"Price at $81,400 support, only 0.3x ATR away — tight risk","confluence":"3/5 groups support mean reversion bounce"},"prediction":"up","confidence":0.72,"signal":"buy","rationale":"Counter-trend long setup: RSI at 22 and Stoch %K at 12 are both deeply oversold while price sits at $81,400 support with BB %B at 0.05 (extreme lower band). MACD histogram narrowing from -300 to -180 shows selling pressure fading. Despite bearish EMA stack, the triple oversold confluence at key support warrants a tactical long with tight stops.","keyLevels":"Support $81,400, Resistance $83,600, EMA21 $83,200","action":"Enter long at $81,500 with stop at $80,800 (below support), target EMA21 at $83,200 (R:R 2.4:1)","risk":"Break below $80,800 invalidates reversal — would confirm bearish continuation to next support at $79,200"}

Always return valid parseable JSON, nothing else.`;
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

function buildCritiqueSystemPrompt(symbol: string): string {
  return `You are a risk-focused ${symbol}/USD trading analyst whose sole job is to find flaws in trading analyses. You are a devil's advocate — your value comes from catching what the primary analyst missed.

Given a primary analysis and the raw TA data, critique it for:
1. Cherry-picked indicators (did they ignore conflicting signals?)
2. Overconfident calibration (is the confidence justified by the data?)
3. Missing risk factors or overlooked levels
4. Logical inconsistencies between the data and conclusion

Respond ONLY with valid JSON:
{
  "flaws": ["<specific flaw 1 with evidence>", "<specific flaw 2 with evidence>"],
  "overlooked": "<what the primary analysis missed — cite specific indicator values>",
  "alternativeView": "<counter-thesis with evidence from the same TA data>",
  "adjustedConfidence": <your confidence estimate 0.0-1.0>,
  "verdict": "agree" | "disagree" | "partially_agree"
}

Rules:
- Be specific: "RSI at 68 is near overbought but was ignored" not "some indicators were missed"
- If the analysis is solid, say so (verdict: agree) — don't manufacture flaws
- adjustedConfidence should reflect YOUR assessment, not just ±0.1 from original
- Keep each flaw to one sentence with the specific data point
- Always return valid parseable JSON, nothing else`;
}

async function callGroqFetch(model: string, messages: ChatMessage[], maxTokens = 1024): Promise<GroqResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

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
        max_tokens: maxTokens,
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

async function callWithFallback(messages: ChatMessage[], maxTokens = 1024): Promise<{ response: GroqResponse; modelUsed: string }> {
  let lastError: unknown;
  for (const model of MODELS) {
    try {
      const response = await callGroqFetch(model, messages, maxTokens);
      return { response, modelUsed: model };
    } catch (err) {
      lastError = err;
      console.warn(`[groq] ${model} failed:`, err instanceof Error ? err.message : err);
    }
  }
  throw lastError ?? new Error('Groq analysis failed on all models');
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

  const { response: completion, modelUsed } = await callWithFallback(messages, 1024);

  const content = completion.choices[0]?.message?.content ?? '{}';
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error(`Groq returned non-JSON response: ${content.slice(0, 120)}`);
  }

  const breakdown = parsed.confidenceBreakdown as Partial<ConfidenceBreakdown> | undefined;

  return {
    prediction: parsed.prediction === 'up' ? 'up' : 'down',
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
    signal: (['buy', 'sell', 'hold'] as const).includes(parsed.signal as 'buy' | 'sell' | 'hold')
      ? (parsed.signal as 'buy' | 'sell' | 'hold')
      : 'hold',
    rationale: (parsed.rationale as string) ?? 'Analysis inconclusive.',
    keyLevels: parsed.keyLevels as string | undefined,
    action: parsed.action as string | undefined,
    risk: parsed.risk as string | undefined,
    thinking: parsed.thinking as string | undefined,
    confidenceBreakdown: breakdown ? {
      trend: breakdown.trend ?? '',
      momentum: breakdown.momentum ?? '',
      volatility: breakdown.volatility ?? '',
      structure: breakdown.structure ?? '',
      confluence: breakdown.confluence ?? '',
    } : undefined,
    modelUsed,
  };
}

export async function critiqueWithGroq(
  analysis: AnalysisResult,
  ta: TASummary,
  symbol = 'BTC',
): Promise<CritiqueResult> {
  const userMessage = `PRIMARY ANALYSIS TO CRITIQUE:
${JSON.stringify({
    prediction: analysis.prediction,
    confidence: analysis.confidence,
    signal: analysis.signal,
    rationale: analysis.rationale,
    keyLevels: analysis.keyLevels,
    action: analysis.action,
    risk: analysis.risk,
  }, null, 2)}

RAW TA DATA:
Price: $${ta.currentPrice.toLocaleString()}
EMAs: 9=$${ta.ema9.toLocaleString()} 21=$${ta.ema21.toLocaleString()} 50=$${ta.ema50.toLocaleString()} 200=$${ta.ema200.toLocaleString()}
RSI: ${ta.rsi} [${ta.rsiZone}] | MACD Hist: ${ta.macdHistogram} Cross: ${ta.macdCross}
Stoch %K: ${ta.stochK} [${ta.stochSignal}] | BB %B: ${ta.bbPctB} Squeeze: ${ta.bbSqueeze}
S/R: $${ta.support.toLocaleString()} / $${ta.resistance.toLocaleString()} | ATR: $${ta.atr}
Signal Score: ${ta.signalScore}/10 (${ta.trendBias})

Find flaws, overlooked factors, and provide your independent assessment.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: buildCritiqueSystemPrompt(symbol) },
    { role: 'user', content: userMessage },
  ];

  const { response: completion } = await callWithFallback(messages, 512);

  const content = completion.choices[0]?.message?.content ?? '{}';
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error(`Groq critique returned non-JSON: ${content.slice(0, 120)}`);
  }

  const flaws = Array.isArray(parsed.flaws) ? (parsed.flaws as string[]) : [];
  const verdicts = ['agree', 'disagree', 'partially_agree'] as const;

  return {
    flaws,
    overlooked: (parsed.overlooked as string) ?? '',
    alternativeView: (parsed.alternativeView as string) ?? '',
    adjustedConfidence: Math.max(0, Math.min(1, Number(parsed.adjustedConfidence) || 0.5)),
    verdict: verdicts.includes(parsed.verdict as typeof verdicts[number])
      ? (parsed.verdict as typeof verdicts[number])
      : 'partially_agree',
  };
}
