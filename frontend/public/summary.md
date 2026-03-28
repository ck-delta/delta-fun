# Stocky Fun — Project Summary

## Purpose

Stocky Fun is a free, open-source Progressive Web App that combines real-time cryptocurrency and gold charting with AI-powered technical analysis, paper trading, and community chat. It targets mobile-first users who want a fast, addictive trading experience without risking real money.

## Key Features

- **Real-time charts** for BTC, ETH, SOL, BNB, HYPE, and Gold (XAU) via TradingView
- **AI trading signals** powered by Stocky AI with 5-step chain-of-thought reasoning, confidence breakdown, and evidence-backed rationale
- **Second Opinion** — devil's advocate critique of every signal for balanced analysis
- **Paper trading simulator** with live PnL tracking, trade history, and win/loss streaks
- **Community chat** with Indian tier 2 market discussion (Nifty, Bank Nifty, MCX Gold, F&O)
- **Mobile-first swipeable UI** with 3-panel carousel (AI Analysis / Paper Trade / Chat)
- **PWA installable** on iPhone and Android with offline support
- **Gamification** — XP, levels, achievements, daily quests, leaderboard, confetti effects

## Supported Assets

BTC (Bitcoin), ETH (Ethereum), SOL (Solana), BNB (BNB Chain), HYPE (Hyperliquid), GOLD (Gold/XAU)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite, Framer Motion |
| Backend | Node.js, Express, TypeScript (Vercel serverless) |
| AI | Stocky AI (proprietary signal engine) |
| Vision AI | Overshoot.ai (chart pattern recognition) |
| Market Data | CoinGecko API, Binance WebSocket |
| Charts | TradingView lightweight-charts |
| Deployment | Vercel (monorepo: static frontend + serverless API) |

## How to Run Locally

```bash
git clone https://github.com/SirCharan/stocky-fun.git
cd stocky-fun
npm install && npm install --prefix frontend && npm install --prefix backend
cp .env.example backend/.env  # add GROQ_API_KEY
npm run dev
```

Frontend: http://localhost:5173 | Backend: http://localhost:3001

## Documentation

- [AI Signal Generation Guide](https://fun.stockyai.xyz/ai.md)
- [System Architecture](https://fun.stockyai.xyz/architecture.md)
- [LLM Integration Guide](https://fun.stockyai.xyz/llm.md)

## Live Site

https://fun.stockyai.xyz

## Blog

https://www.charandeepkapoor.com/blog/stocky-ai

## License

MIT
