# Stocky Fun — LLM Integration Guide

## What is Stocky Fun?

Stocky Fun is an open-source, casino-style Progressive Web App for real-time crypto and gold technical analysis, AI-powered trading signals, paper trading, and community chat. It runs at [fun.stockyai.xyz](https://fun.stockyai.xyz).

## Supported Assets

BTC (Bitcoin), ETH (Ethereum), SOL (Solana), BNB (BNB Chain), HYPE (Hyperliquid), GOLD (Gold/XAU)

## AI Analysis API

### Endpoint

```
POST https://fun.stockyai.xyz/api/analyze
Content-Type: application/json
```

### Request

```json
{
  "prompt": "Should I buy BTC now?",
  "coin": "bitcoin",
  "coinSymbol": "BTC"
}
```

Supported coin IDs: `bitcoin`, `ethereum`, `solana`, `binancecoin`, `hyperliquid`, `tether-gold`

### Response

```json
{
  "prediction": "up",
  "confidence": 0.72,
  "signal": "buy",
  "rationale": "EMA stack fully aligned bullish. RSI at 58 with room to 70. Fresh MACD bullish cross confirms momentum...",
  "keyLevels": "Support $84,800, Resistance $87,200, EMA200 $82,100",
  "action": "Enter long at $86,000 with stop at $84,600, target $88,400 (R:R 1.7:1)",
  "risk": "Break below $84,800 support invalidates — would signal EMA stack breakdown",
  "thinking": "Step1: EMA stack fully bullish... Step5: 4/5 groups bullish",
  "confidenceBreakdown": {
    "trend": "EMA stack fully bullish with rising slopes",
    "momentum": "RSI 58 + fresh MACD bullish cross confirm upward momentum",
    "volatility": "BB %B 0.65, no squeeze — trending without overextension",
    "structure": "Price 2% above support with ATR-based room to resistance",
    "confluence": "4/5 groups align bullish"
  },
  "ta": { "currentPrice": 86000, "rsi": 58, "macd": 145, "..." : "..." }
}
```

### Critique / Second Opinion Endpoint

```
POST https://fun.stockyai.xyz/api/analyze/critique
Content-Type: application/json
```

```json
{
  "analysis": { "prediction": "up", "confidence": 0.72, "signal": "buy", "rationale": "..." },
  "ta": { "currentPrice": 86000, "rsi": 58, "..." : "..." },
  "coinSymbol": "BTC"
}
```

Returns flaws, overlooked factors, alternative view, adjusted confidence, and verdict (agree/disagree/partially_agree).

### Example Prompts

- "EMA 9 direction — bullish or bearish?"
- "RSI signal — overbought, oversold, or neutral?"
- "MACD histogram — is momentum accelerating or fading?"
- "How close is price to key support or resistance?"
- "Should I buy or sell based on current RSI and EMA crossover?"

### Rate Limits

- No authentication required
- Reasonable use expected (no hard rate limit currently enforced)

## Other Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/market/price?coin=bitcoin` | Live price |
| `GET` | `/api/market/ohlc?coin=bitcoin` | 1-day OHLC candles |
| `POST` | `/api/analyze/critique` | Second opinion on analysis |

## More Documentation

- [AI Signal Generation Guide](https://fun.stockyai.xyz/ai.md) — how signals are computed
- [System Architecture](https://fun.stockyai.xyz/architecture.md)
- [Project Summary](https://fun.stockyai.xyz/summary.md)

## Tech Stack

React 19, TypeScript, Tailwind CSS, Vite, Framer Motion, Stocky AI, CoinGecko API, Binance WebSocket, TradingView charts, Vercel serverless.

## Source Code

[github.com/SirCharan/stocky-fun](https://github.com/SirCharan/stocky-fun)

## Blog

[charandeepkapoor.com/blog/stocky-ai](https://www.charandeepkapoor.com/blog/stocky-ai)
