# Stocky Fun — LLM Integration Guide

## What is Stocky Fun?

Stocky Fun is an open-source, casino-style Progressive Web App for real-time BTC/USD technical analysis, AI-powered trading signals, paper trading, and community chat. It runs at [fun.stockyai.xyz](https://fun.stockyai.xyz).

## AI Analysis API

### Endpoint

```
POST https://fun.stockyai.xyz/api/analyze
Content-Type: application/json
```

### Request

```json
{
  "prompt": "Is RSI confirming the current trend direction?",
  "coin": "bitcoin"
}
```

### Response

```json
{
  "prediction": "up",
  "confidence": 0.72,
  "signal": "buy",
  "rationale": "RSI 62 trending up with MACD histogram expanding...",
  "keyLevels": "Support $67,500, Resistance $69,300",
  "action": "Buy above $68,500 with stop at $67,200",
  "risk": "Break below $67,500 invalidates setup",
  "thinking": "Step-by-step reasoning...",
  "confidenceBreakdown": {
    "trend": "EMA9 > EMA21 > EMA200, all slopes positive",
    "momentum": "RSI 62 bullish, MACD expanding",
    "volatility": "BB squeeze releasing upward",
    "structure": "Price above key support",
    "confluence": "4/5 indicator groups bullish"
  },
  "modelUsed": "llama-3.3-70b-versatile",
  "ta": { ... }
}
```

### Example Prompts

- "EMA 9 direction — bullish or bearish?"
- "RSI signal — overbought, oversold, or neutral?"
- "MACD histogram — is momentum accelerating or fading?"
- "How close is price to key support or resistance?"
- "Should I buy or sell based on current RSI and EMA crossover?"

### Rate Limits

- No authentication required
- Reasonable use expected (no hard rate limit currently enforced)
- Backend uses Groq LLM (llama-3.3-70b-versatile) with CoinGecko market data

## Other Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/market/price?coin=bitcoin` | Live price |
| `GET` | `/api/market/ohlc?coin=bitcoin` | 1-day OHLC candles |

## Tech Stack

React 19, TypeScript, Tailwind CSS, Vite, Framer Motion, Groq LLM, CoinGecko API, TradingView charts, Vercel serverless.

## Source Code

[github.com/SirCharan/stocky-fun](https://github.com/SirCharan/stocky-fun)
