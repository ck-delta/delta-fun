# LLM Integration — Stocky Fun

Documentation of all AI/LLM integrations in the Stocky Fun BTC/USD trading dashboard.

---

## 1. Groq — Text Analysis & Signal Generation

**File:** `backend/src/services/groq.ts`
**Endpoint:** `POST /api/analyze`

### Model
```
llama-3.3-70b-versatile
```

### Configuration
```typescript
{
  model: 'llama-3.3-70b-versatile',
  temperature: 0.3,
  max_tokens: 300,
  response_format: { type: 'json_object' }
}
```

### System Prompt
```
You are an expert BTC/USD technical analysis assistant for a trading dashboard.
Given real-time TA indicators and a user question, respond ONLY with valid JSON:
{
  "prediction": "up" | "down",
  "confidence": <0.0–1.0>,
  "signal": "buy" | "sell" | "hold",
  "rationale": "<2-3 sentence explanation>",
  "keyLevels": "<brief mention of key EMA support/resistance>"
}
```

### User Message Structure
The user message injects real-time market context before the user's question:

```
REAL-TIME BTC/USD TECHNICAL INDICATORS:
- Price: $<currentPrice>
- EMA9: $<ema9> (slope: up|down|flat) — price is above|below EMA9
- EMA21: $<ema21> (slope: up|down|flat)
- EMA50: $<ema50>
- RSI(14): <rsi>
- Last 5 candles: [green, red, green, ...]
- Candle pattern: <pattern description>
- Overall trend bias: bullish|bearish|neutral
[VISUAL CHART ANALYSIS (Overshoot.ai): <text> — if available]

USER QUESTION: <user prompt>
```

### Response Schema
```typescript
{
  prediction: 'up' | 'down';
  confidence: number;     // 0.0–1.0
  signal: 'buy' | 'sell' | 'hold';
  rationale: string;      // 2-3 sentences
  keyLevels?: string;     // optional
}
```

### Signal Logic
- `confidence >= 0.70` → `buy` (if prediction=up) or `sell` (if prediction=down)
- `confidence < 0.70` → `hold`
- RSI > 70 → overbought warning injected into rationale
- RSI < 30 → oversold opportunity injected into rationale

---

## 2. Overshoot.ai — Visual Chart Analysis

**File:** `frontend/src/hooks/useOvershoot.ts`
**SDK:** `overshoot@2.0.0-alpha.7`

### Model
```
Qwen/Qwen2.5-VL-72B-Instruct
```

### Configuration
```typescript
{
  apiKey: VITE_OVERSHOOT_API_KEY,
  source: { type: 'screen' },   // browser screenshare of the BTC chart
  model: 'Qwen/Qwen2.5-VL-72B-Instruct',
  prompt: `...see below...`
}
```

### Vision Prompt
```
Analyze this BTC/USD candlestick chart. Identify:
1. Current trend direction (bullish/bearish/sideways)
2. Key support and resistance price levels visible
3. Any significant candlestick patterns (doji, hammer, engulfing, etc.)
4. Whether price appears extended or range-bound
Respond in 2-3 sentences focusing on actionable insights.
```

### Data Flow
1. User clicks "Enable Chart Vision" button in the chart panel
2. Browser screen-share dialog opens; user selects **This Tab**
3. Overshoot streams continuous inference from the GeckoTerminal chart
4. Results written to `overshootStore.latestResult` (module-level, no React re-renders)
5. On prompt submit, `useAnalysis` snapshots `overshootStore.latestResult` and sends to `/api/analyze`
6. Groq receives both TA indicators and the visual analysis in its user message

### Re-render Strategy
Overshoot streams results continuously (every few seconds). To prevent React re-renders on every tick, results are written to a **module-level store** (`frontend/src/lib/overshootStore.ts`) rather than React state. Only one React state update ever occurs: when the stream first activates (`overshootStatus: idle → active`).

---

## 3. CoinGecko → Technical Analysis Pipeline

**Files:** `backend/src/services/coingecko.ts`, `backend/src/services/ta.ts`

### Data Fetch
```
GET https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=1
```
Returns ~96 candles (1 day of 15-minute OHLC data). No API key required.

### Indicators Computed
| Indicator | Config | Purpose |
|---|---|---|
| EMA | periods 9, 21, 50 | Trend direction & crossovers |
| EMA Slope | last 3 values | Momentum direction |
| RSI | period 14 | Overbought/oversold |
| Candle Pattern | last 5 candles | Pattern labeling |
| Trend Bias | 5-signal vote | Overall market context |

### Trend Bias Scoring
5 boolean signals are tallied to determine `bullish` / `neutral` / `bearish`:
1. EMA9 > EMA21
2. EMA21 > EMA50
3. EMA9 slope is `up`
4. RSI > 50
5. Last candle is green

Score ≥ 4 → bullish · Score ≤ 1 → bearish · else → neutral
