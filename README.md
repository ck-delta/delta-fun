# Stocky Fun

**AI-powered BTC/USD trading dashboard.** Real-time charts, natural language analysis, and paper trading — all in one dark-mode web app.

**Live:** https://fun.stockyai.xyz

---

## What It Does

- **Live BTC/USD chart** embedded from GeckoTerminal (WBTC/USDT on Ethereum, 15-minute candles)
- **Natural language prompts** — ask anything: "Predict the next candle color", "Is BTC overbought?"
- **AI analysis pipeline**: CoinGecko OHLC → EMA/RSI technical indicators → Groq LLM → structured signal
- **Visual chart analysis** via Overshoot.ai (optional screen-share of the chart for visual AI)
- **Buy/Sell signals** with confidence score (0–100%), Groq rationale, and Overshoot visual notes
- **Paper trading** — place BUY/SELL at live BTC price, track PnL, win/loss streaks in IST

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| LLM | Groq `llama-3.3-70b-versatile` |
| Vision AI | Overshoot.ai `Qwen2.5-VL-72B-Instruct` |
| Market Data | CoinGecko API (free tier) |
| Chart Embed | GeckoTerminal iframe |
| Deployment | Vercel (monorepo: frontend static + backend serverless) |

---

## Local Setup

```bash
# Clone and install
git clone https://github.com/SirCharan/stocky-fun.git
cd stocky-fun
npm install           # root deps (concurrently)
npm install --prefix frontend
npm install --prefix backend

# Configure environment
cp .env.example backend/.env
# Edit backend/.env and add GROQ_API_KEY

# Add to frontend/.env:
# VITE_API_URL=http://localhost:3001
# VITE_OVERSHOOT_API_KEY=your_overshoot_key

# Run both servers
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3001

---

## Environment Variables

**`backend/.env`**
```
GROQ_API_KEY=your_groq_key
PORT=3001
```

**`frontend/.env`**
```
VITE_API_URL=http://localhost:3001
VITE_OVERSHOOT_API_KEY=your_overshoot_key   # optional
```

---

## Project Structure

```
stocky-fun/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/   # ChartPanel, PromptInput, SignalDisplay, OrderForm, TradeHistory
│   │   ├── context/      # TradingContext (global state)
│   │   ├── hooks/        # useAnalysis, useOvershoot
│   │   └── lib/          # api.ts, overshootStore.ts
│   └── public/           # favicon.svg, robots.txt, sitemap.xml
├── backend/           # Express API
│   └── src/
│       ├── routes/       # analyze, market, trades
│       └── services/     # groq, coingecko, ta
├── api/               # Vercel serverless entry (wraps Express)
└── vercel.json        # Vercel deployment config
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyze` | Groq + TA analysis for a prompt |
| `GET` | `/api/market/price` | Live BTC/USD price |
| `GET` | `/api/market/ohlc` | 1-day OHLC candles |
| `GET` | `/api/trades` | Paper trade history + PnL |
| `POST` | `/api/trades` | Place paper trade |

---

## Disclaimer

Not financial advice. All trading is paper (simulated) only. AI predictions are probabilistic and should not be used for real investment decisions.
