# Stocky Fun — System Architecture

## High-Level Overview

```
┌──────────────┐     ┌───────────────┐     ┌─────────────┐
│   Browser     │────▶│  Vercel CDN   │────▶│  React SPA  │
│   (PWA)       │     │  (static)     │     │  (frontend) │
└──────┬───────┘     └───────────────┘     └──────┬──────┘
       │                                          │
       │ API calls                                │ WebSocket
       ▼                                          ▼
┌──────────────┐                          ┌─────────────┐
│  Vercel       │                          │  Binance WS │
│  Serverless   │                          │  (live OHLC)│
│  (backend)    │                          └─────────────┘
└──────┬───────┘
       │
       ├──▶ CoinGecko API (OHLC candles, prices)
       ├──▶ Stocky AI / LLM (signal generation)
       └──▶ Overshoot.ai (visual chart analysis)
```

## Frontend

| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework with hooks and context |
| TypeScript | Type safety across all components |
| Tailwind CSS | Utility-first styling with custom neon theme |
| Vite | Fast dev server and production bundler |
| Framer Motion | Swipe gestures and animations |
| TradingView | Lightweight-charts for candlestick rendering |
| vite-plugin-pwa | Service worker generation for offline PWA |

### Component Architecture

```
App.tsx
├── TradingProvider (context: signals, prices, coins)
│   ├── GamificationProvider (context: XP, levels, achievements)
│   │   └── ChatProvider (context: messages, conversations)
│   │       │
│   │       ├── ChartPanel (TradingView chart + coin tabs + price ticker)
│   │       │   └── useBinanceKlines (WebSocket for 1s/1m candles)
│   │       │
│   │       └── SwipePanels (3-panel horizontal carousel)
│   │           ├── Panel 1: Analyze
│   │           │   ├── PromptInput (prompt chips + text input)
│   │           │   └── SignalDisplay (signal, confidence, TA stats, critique)
│   │           │
│   │           ├── Panel 2: Trade
│   │           │   ├── OrderForm (buy/sell, quantity, stop-loss)
│   │           │   └── TradeHistory (positions, PnL, history)
│   │           │
│   │           └── Panel 3: Chat
│   │               ├── ChatList (conversation tabs)
│   │               ├── ChatThread (message feed)
│   │               └── Leaderboard (XP rankings)
│   │
│   └── SwipeHint (first-visit overlay)
└── InstallPrompt (PWA install popup)
```

### State Management

- **TradingContext** — selected coin, live price, last signal, analysis state, critique results
- **ChatContext** — conversations, messages, user profile, XP, achievements, daily quests
- **GamificationProvider** — XP awards, level-up detection, achievement unlocks, confetti triggers
- **localStorage** — trade history, chat messages, user profile, swipe hint state, install dismiss state

## Backend

| Technology | Purpose |
|-----------|---------|
| Express | HTTP server with JSON API routes |
| TypeScript | Type safety with shared interfaces |
| Vercel Serverless | Zero-config deployment via `api/index.ts` |

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/analyze` | AI signal generation from prompt + TA data |
| `POST` | `/api/analyze/critique` | Second opinion on an analysis |
| `GET` | `/api/market/price?coin=ID` | Live price from CoinGecko |
| `GET` | `/api/market/ohlc?coin=ID` | 1-day OHLC candle data |

### AI Pipeline

1. Receive user prompt + coin ID
2. Fetch OHLC candles from CoinGecko (minimum 10 required)
3. Compute TA summary: EMAs, RSI, MACD, Stochastic, Bollinger Bands, ATR, S/R, candle patterns, signal score
4. Build system prompt (quant trader persona + 5-step framework + few-shot examples)
5. Call Stocky AI with TA data + user question
6. Parse structured JSON response
7. Post-process: clamp confidence, append low-conviction warning if < 0.65
8. Return merged signal + TA summary

See [ai.md](https://fun.stockyai.xyz/ai.md) for detailed AI signal documentation.

## Market Data

### CoinGecko (REST)
- OHLC candles for TA computation
- Price polling for coins without Binance pairs (HYPE, GOLD)
- 24h price change data

### Binance WebSocket
- Real-time 1-second and 1-minute kline streams
- Used for BTC, ETH, SOL, BNB live chart updates
- Automatic reconnection on disconnect

## Charts

TradingView lightweight-charts render candlestick data with multiple timeframes:

| Timeframe | Data Source |
|-----------|-----------|
| 1s | Binance WebSocket (real-time) |
| 1m | Binance WebSocket + OHLC history |
| 5m | CoinGecko OHLC |
| 15m | CoinGecko OHLC |

For HYPE and GOLD (no Binance pair), charts fall back to CoinGecko REST polling.

## Chat System

- **7 default conversations**: General, Whale Alerts, Meme & Vibes, Leaderboard, + 3 DM bots
- **Fake message generator**: pools of Indian tier 2 market messages (Nifty, Bank Nifty, MCX Gold, F&O, IPOs, PSU banks)
- **Auto-activity**: new fake messages every 20-90 seconds in public groups
- **DM auto-replies**: CryptoMentor (advice), TradingBot (signals), MarketFriend (casual)
- **Persistence**: localStorage for user messages and profile

## Gamification

- **XP system**: messages (+5-15 XP), reactions received (+2-10 XP), streak multiplier
- **10 levels**: Newbie → Lurker → Chatter → ... → Legend → Diamond Hands
- **10 achievements**: First Words, Getting Chatty, Motormouth, Chat Legend, etc.
- **Daily quests**: "Send 5 messages", "React 10 times" → bonus XP
- **Leaderboard**: top 10 users by XP (fake + real user ranking)
- **Effects**: confetti burst on level-up, profit popup on trades, scale animations on reactions

## PWA

- **Service Worker**: Workbox-generated via vite-plugin-pwa, precaches all static assets
- **Manifest**: standalone display, dark theme, custom icons (SVG + PNG)
- **Install Prompt**: detects `beforeinstallprompt` on Android, shows iOS guide on Safari
- **Offline**: cached assets load instantly, API calls fail gracefully

## Supported Assets

| Asset | CoinGecko ID | Binance WS | TradingView |
|-------|-------------|------------|-------------|
| BTC | bitcoin | btcusdt | BINANCE:BTCUSDT |
| ETH | ethereum | ethusdt | BINANCE:ETHUSDT |
| SOL | solana | solusdt | BINANCE:SOLUSDT |
| BNB | binancecoin | bnbusdt | BINANCE:BNBUSDT |
| HYPE | hyperliquid | — | BYBIT:HYPEUSDT |
| GOLD | tether-gold | — | TVC:GOLD |

## File Structure

```
stocky-fun/
├── frontend/
│   ├── src/
│   │   ├── components/    ChartPanel, PromptInput, SignalDisplay, OrderForm,
│   │   │                  SwipePanels, CommunityChat, ChatList, ChatThread,
│   │   │                  Leaderboard, PriceTicker, InstallPrompt, SwipeHint
│   │   ├── context/       TradingContext, ChatContext, GamificationProvider
│   │   ├── hooks/         useAnalysis, useBinanceKlines, useOvershoot,
│   │   │                  useLenis, useDopamine, useInstallPrompt
│   │   └── lib/           api.ts, coins.ts, chatTypes.ts, tradesStore.ts
│   └── public/            PWA assets, SEO files, documentation
├── backend/
│   └── src/
│       ├── routes/        analyze.ts, market.ts
│       └── services/      groq.ts, coingecko.ts, ta.ts
├── api/                   Vercel serverless entry point
└── vercel.json            Deployment configuration
```

## Deployment

Deployed as a Vercel monorepo:
- **Frontend**: static build (`frontend/dist`) served from CDN
- **Backend**: serverless function (`api/index.ts`) with 30s timeout, 512MB memory
- **Domain**: fun.stockyai.xyz with automatic HTTPS
