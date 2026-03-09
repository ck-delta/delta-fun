# Stocky Fun — Summary

**Live URL:** https://fun.stockyai.xyz
**GitHub:** https://github.com/SirCharan/stocky-fun

## What Is It?

Stocky Fun is a web-based BTC/USD trading dashboard that combines real-time charting with AI-powered market analysis and paper trading. It's designed to be engaging and fast — type a natural language question about BTC, get a structured AI signal in seconds.

## Key Features

- **Real-time BTC/USD chart** — GeckoTerminal iframe (WBTC/USDT Ethereum pool, 15m candles, dark mode)
- **Natural language analysis** — e.g. "Predict next 15min direction based on EMA crossover"
- **AI signal card** — UP/DOWN prediction, confidence bar, buy/sell/hold recommendation
- **TA indicators** — EMA (9/21/50), RSI(14), candle patterns computed from CoinGecko OHLC
- **Groq LLM** — llama-3.3-70b-versatile synthesizes TA data with the user's prompt
- **Overshoot.ai vision** — optional screenshare of the chart for visual pattern recognition
- **Paper trading** — place buy/sell at live price, track PnL and win/loss streaks (IST timezone)

## AI Stack

| Component | Service | Model |
|---|---|---|
| Text analysis | Groq | llama-3.3-70b-versatile |
| Visual chart analysis | Overshoot.ai | Qwen2.5-VL-72B-Instruct |
| Market data | CoinGecko | free tier OHLC API |

## Architecture

Single Vercel deployment: React frontend (static) + Express backend (serverless function). API routes rewritten from `/api/*` to the Express serverless handler.

## Built With

React 18, Vite, TypeScript, Tailwind CSS, Node.js, Express, Groq SDK, Overshoot SDK v2 alpha.
