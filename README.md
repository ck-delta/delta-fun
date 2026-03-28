<p align="center">
  <img src="frontend/public/favicon.svg" alt="Stocky Fun" width="80" />
</p>

<h1 align="center">Stocky Fun</h1>

<p align="center">
  <strong>Casino-style BTC trading PWA with AI signals, live charts, paper trading & community chat</strong>
</p>

<p align="center">
  <a href="https://fun.stockyai.xyz"><img src="https://img.shields.io/badge/Live-fun.stockyai.xyz-00ff66?style=for-the-badge&logo=vercel" alt="Live Site" /></a>
  <a href="https://github.com/SirCharan/stocky-fun"><img src="https://img.shields.io/github/stars/SirCharan/stocky-fun?style=for-the-badge&color=fbbf24" alt="Stars" /></a>
  <a href="https://github.com/SirCharan/stocky-fun/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-a855f7?style=for-the-badge" alt="License" /></a>
</p>

---

An addictive, mobile-first Progressive Web App for real-time crypto and gold technical analysis. Ask Stocky AI anything about the market, get buy/sell signals with chain-of-thought reasoning, paper trade with live PnL, and chat with the Indian trading community — all wrapped in a dark, neon-green casino aesthetic. Installable on iPhone and Android.

---

## Features

- **Live BTC/USD Charts** — TradingView and GeckoTerminal embeds with 1s/1m/5m/15m timeframes
- **AI Trading Signals** — Natural language prompts analyzed by Stocky AI with chain-of-thought reasoning and confidence breakdown
- **Technical Analysis** — RSI, MACD, Bollinger Bands, Stochastic, EMA (9/21/200), ATR, support/resistance levels
- **Paper Trading** — Simulated trading at live BTC price with PnL tracking, trade history, win/loss streaks
- **Second Opinion** — Devil's advocate critique of every AI signal
- **Community Chat** — Live messaging with Indian tier 2 market discussion (Nifty, Bank Nifty, MCX Gold, F&O)
- **Mobile-First Swipe UI** — Scroll-snap panels for AI Analysis, Paper Trade, and Chat
- **PWA Installable** — Add to Home Screen on iOS/Android with offline support
- **Gamification** — XP, levels, achievements, daily quests, leaderboard, confetti effects
- **Visual Chart AI** — Optional screen-share chart analysis via Overshoot.ai
- **Multi-Asset** — BTC, ETH, SOL, BNB, HYPE, Gold (XAU) support

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| AI | Stocky AI (proprietary signal engine) |
| Vision AI | Overshoot.ai (chart pattern recognition) |
| Market Data | CoinGecko API (free tier) |
| Charts | TradingView, GeckoTerminal |
| Deployment | Vercel (monorepo: static frontend + serverless API) |

---

## Install as PWA

**iPhone:** Open [fun.stockyai.xyz](https://fun.stockyai.xyz) in Safari > Share > Add to Home Screen

**Android:** Open in Chrome > tap "Install" banner or Menu > Add to Home Screen

---

## Local Development

```bash
git clone https://github.com/SirCharan/stocky-fun.git
cd stocky-fun
npm install
npm install --prefix frontend
npm install --prefix backend

# Configure environment
cp .env.example backend/.env
# Add GROQ_API_KEY to backend/.env

# Optional: add to frontend/.env
# VITE_API_URL=http://localhost:3001
# VITE_OVERSHOOT_API_KEY=your_key

npm run dev
```

Frontend: `http://localhost:5173` | Backend: `http://localhost:3001`

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/analyze` | AI analysis for a natural language prompt |
| `GET` | `/api/market/price?coin=bitcoin` | Live price |
| `GET` | `/api/market/ohlc?coin=bitcoin` | 1-day OHLC candles |
| `GET` | `/api/trades` | Paper trade history + PnL |
| `POST` | `/api/analyze/critique` | Second opinion on AI analysis |
| `POST` | `/api/trades` | Place paper trade |

---

## Project Structure

```
stocky-fun/
├── frontend/            # React + Vite app
│   ├── src/
│   │   ├── components/  # ChartPanel, PromptInput, SignalDisplay, OrderForm, SwipePanels, CommunityChat
│   │   ├── context/     # TradingContext, ChatContext
│   │   ├── hooks/       # useAnalysis, useOvershoot, useLenis, useDopamine
│   │   └── lib/         # api.ts, coins.ts, overshootStore.ts
│   └── public/          # PWA assets, og-image, robots.txt, llms.txt
├── backend/             # Express API
│   └── src/
│       ├── routes/      # analyze, market, trades
│       └── services/    # groq, coingecko, ta
├── api/                 # Vercel serverless entry
└── vercel.json          # Deployment config
```

---

## Disclaimer

Not financial advice. All trading is paper (simulated) only. AI predictions are probabilistic and should not be used for real investment decisions.

---

## Documentation

- [AI Signal Generation Guide](https://fun.stockyai.xyz/ai.md) — how Stocky AI produces signals
- [System Architecture](https://fun.stockyai.xyz/architecture.md) — full technical architecture
- [LLM Integration Guide](https://fun.stockyai.xyz/llm.md) — API docs for developers
- [Blog: How Stocky AI Works](https://www.charandeepkapoor.com/blog/stocky-ai)

---

<p align="center">
  Made with love by <a href="https://x.com/yourasianquant">@yourasianquant</a>
</p>
