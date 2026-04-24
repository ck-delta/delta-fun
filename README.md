# delta-fun

Mobile-first **10× paper trading** on Delta Exchange perpetuals, powered by an AI signal
from **Claude Sonnet 4.6** via OpenRouter. Forked from
[`SirCharan/stocky-fun`](https://github.com/SirCharan/stocky-fun) and rebuilt around the
[Delta Exchange design system](https://delta.exchange).

## What it does

- Search any Delta Exchange perpetual (BTCUSD, ETHUSD, SOLUSD, …).
- Live price + 5-minute candles from Delta Exchange (REST for history, WebSocket for ticks).
- EMA 20/50/200 and Bollinger Bands overlaid on the chart.
- Compact indicator strip: RSI (14), MACD, Bollinger %B, EMA stack.
- AI signal auto-generated on every asset change with chain-of-thought reasoning.
- Paper trading with a **$10,000 USDT** wallet, **fixed 10× isolated leverage**, market
  orders, instant fill at the last WebSocket tick, and auto-liquidation at the theoretical
  liq price.
- All state lives in `localStorage` — no auth, no backend DB.

## Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind + Lightweight Charts.
- **Backend**: Express + TypeScript (serverless on Vercel).
- **Data**: [Delta Exchange public API](https://docs.delta.exchange) — `api.india.delta.exchange`.
- **AI**: [OpenRouter](https://openrouter.ai) → `anthropic/claude-sonnet-4.6`.
- **Theme**: Delta design tokens (dark default, India brand).

## Local dev

```bash
npm run install:all
cp .env.example backend/.env     # then paste your OPENROUTER_API_KEY
npm run dev                      # starts Express :3001 + Vite :5173
```

Vite proxies `/api` → backend, so the frontend talks to the real API during dev.

## Vercel deploy

- `vercel.json` wires `api/index.ts` → Express app and rewrites `/api/*` to it.
- Required env on Vercel: **`OPENROUTER_API_KEY`**.
- Optional: `OPENROUTER_MODEL` (default `anthropic/claude-sonnet-4.6`),
  `OPENROUTER_REFERER`, `DELTA_API_BASE`.

## Not implemented (intentionally)

- No community chat, XP, leaderboard, quests.
- No vision / screen-share AI.
- No limit orders, stops, or take-profits — market only.
- No real money, no Delta Exchange SSO, no account sync.

## API endpoints

| Method | Path                                    | Description                             |
|--------|-----------------------------------------|-----------------------------------------|
| `GET`  | `/api/market/products`                  | All live Delta perps.                   |
| `GET`  | `/api/market/candles?symbol=&resolution=` | OHLCV history (default 5m).           |
| `GET`  | `/api/market/ticker?symbol=`            | Latest ticker (price + 24h change).     |
| `POST` | `/api/analyze`                          | `{symbol, prompt?}` → AI signal + TA.   |
| `GET`  | `/api/health`                           | Health probe.                           |

## Disclaimer

Not financial advice. All trading is paper-only; nothing touches a real exchange. AI output
is probabilistic and should not be used for real investment decisions.

---

_Forked from [SirCharan/stocky-fun](https://github.com/SirCharan/stocky-fun) · Delta design
tokens from the Delta Exchange Figma library._
