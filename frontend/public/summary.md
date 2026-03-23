# Stocky Fun — Project Summary

## Purpose

Stocky Fun is a free, open-source Progressive Web App that combines real-time cryptocurrency charting with AI-powered technical analysis and paper trading. It targets mobile-first users who want a fast, addictive trading experience without risking real money.

## Key Features

- **Real-time BTC/USD charts** via TradingView and GeckoTerminal embeds
- **AI trading signals** powered by Groq LLM (Llama 3.3 70B) with RSI, MACD, Bollinger Bands, Stochastic, EMA, ATR analysis
- **Paper trading simulator** with live PnL tracking, trade history, and win/loss streaks
- **Community chat** with live messaging
- **Mobile-first swipeable UI** with scroll-snap panels (AI Analysis / Paper Trade / Chat)
- **PWA installable** on iPhone and Android with offline support
- **Gamification** with confetti, profit popups, and dopamine-driven UX

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite, Framer Motion |
| Backend | Node.js, Express, TypeScript (Vercel serverless) |
| AI | Groq LLM (llama-3.3-70b-versatile) |
| Vision AI | Overshoot.ai (Qwen2.5-VL-72B-Instruct) |
| Market Data | CoinGecko API |
| Charts | TradingView, GeckoTerminal |
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

## Live Site

https://fun.stockyai.xyz

## License

MIT
