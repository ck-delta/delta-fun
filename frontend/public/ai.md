# Stocky Fun — How AI Signals Are Generated

## Overview

Stocky AI generates trading signals by combining real-time technical analysis (20+ indicators) with a chain-of-thought reasoning framework. Every signal includes a prediction, confidence score, actionable trade setup, and risk assessment.

## Signal Generation Pipeline

```
User Prompt (natural language)
        │
        ▼
┌─────────────────┐
│   Frontend       │ Captures prompt + overshoot snapshot (if vision enabled)
│   (React)        │
└────────┬────────┘
         │ POST /api/analyze { prompt, coin, coinSymbol, overshootResult? }
         ▼
┌─────────────────┐
│   Backend        │ 1. Fetch 1-day OHLC candles from CoinGecko
│   (Express)      │ 2. Compute TA summary (20+ indicators)
│                  │ 3. Build system prompt + user message
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Stocky AI      │ 5-step chain-of-thought analysis
│   (LLM)          │ Returns structured JSON
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Post-Process   │ - Parse JSON response
│                  │ - Clamp confidence 0.0-1.0
│                  │ - Append low-conviction warning if confidence < 0.65
│                  │ - Merge TA summary into response
└────────┬────────┘
         │
         ▼
    Signal displayed to user
```

## Technical Indicators Computed

The backend computes these indicators from OHLC candle data before every analysis:

### Exponential Moving Averages (EMAs)
- **EMA 9** — short-term trend (with slope: up/down/flat)
- **EMA 21** — medium-term trend (with slope)
- **EMA 50** — intermediate trend
- **EMA 200** — long-term trend (price above/below determines primary direction)

### Momentum
- **RSI (14)** — Relative Strength Index. Zones: overbought (>70), oversold (<30), neutral
- **MACD (12,26,9)** — MACD line, signal line, histogram. Detects bullish/bearish crossovers
- **Stochastic Oscillator (14,3)** — %K and %D values. Zones: overbought (>80), oversold (<20)

### Volatility
- **Bollinger Bands (20, 2σ)** — Upper, middle, lower bands. %B value (0=lower, 0.5=middle, 1=upper)
- **Bollinger Squeeze** — When bandwidth < 1.5% of price, signals imminent breakout
- **ATR (14)** — Average True Range for position sizing and stop placement

### Structure
- **Support** — 20-candle swing low
- **Resistance** — 20-candle swing high

### Candle Patterns
- Last 5 candle colors (green/red sequence)
- Pattern classification: strong bullish, bullish, strong bearish, bearish, potential reversal, mixed

### Composite Signal Score
Score from -10 to +10, combining all indicators:
- EMA stack alignment (+1 each)
- EMA slopes (+1 each)
- RSI direction (+1/-1)
- MACD vs signal (+1), MACD cross (+2/-2)
- Price vs BB middle (+1/-1)
- Stochastic oversold (+1)
- Last candle color (+1/-1)
- Trend bias: bullish (>=4), bearish (<=-4), neutral (between)

## AI Reasoning Framework

Stocky AI uses a mandatory 5-step analysis before generating any signal:

| Step | Analysis | Key Question |
|------|----------|-------------|
| 1 | **Trend** | EMA stack order, slopes, price vs EMA200 |
| 2 | **Momentum** | RSI zone, MACD histogram + cross, Stochastic position |
| 3 | **Volatility** | BB %B position, squeeze status, ATR context |
| 4 | **Structure** | Distance to S/R as % of ATR, decision point? |
| 5 | **Confluence** | How many of 5 indicator groups agree? → determines confidence |

## Confidence Calibration

Confidence is calibrated to a strict rubric based on indicator confluence:

| Range | Meaning | Signal |
|-------|---------|--------|
| 0.90–1.00 | 4/5+ groups align + active cross + key level | Buy or Sell |
| 0.70–0.89 | 3/5 groups with moderate conviction | Buy or Sell |
| 0.50–0.69 | Mixed signals, needs confirmation | Hold |
| 0.00–0.49 | Strong counter-signals present | Hold |

Confidence < 0.65 automatically triggers a "LOW CONVICTION" warning.

## Second Opinion (Critique)

After the primary analysis, users can request a devil's advocate critique via `POST /api/analyze/critique`. The critic:

1. Checks for cherry-picked indicators
2. Evaluates confidence calibration
3. Identifies missing risk factors
4. Provides an alternative thesis with evidence
5. Returns an adjusted confidence and verdict (agree/disagree/partially_agree)

## Response Structure

Every signal includes:

```json
{
  "thinking": "5-step chain-of-thought with exact numbers",
  "confidenceBreakdown": {
    "trend": "EMA stack analysis",
    "momentum": "RSI + MACD + Stochastic",
    "volatility": "BB + squeeze + ATR",
    "structure": "S/R levels + distance",
    "confluence": "X/5 groups align"
  },
  "prediction": "up | down",
  "confidence": 0.72,
  "signal": "buy | sell | hold",
  "rationale": "Evidence-backed 3-5 sentence explanation",
  "keyLevels": "Support, resistance, EMA200",
  "action": "Specific entry/stop/target or wait conditions",
  "risk": "What invalidates the thesis"
}
```

## Supported Assets

BTC, ETH, SOL, BNB, HYPE, GOLD (XAU) — each uses the same AI pipeline with asset-specific TA data.

## Blog

[How Stocky AI Works](https://www.charandeepkapoor.com/blog/stocky-ai)
