AI Stock Predictor

A full-stack app for tracking a stock watchlist, paper trading, and getting
AI-assisted portfolio analysis — built on entirely free-tier infrastructure.

Live demo: https://ai-stock-predictor-six.vercel.app

## What it does

- Real authentication (bcrypt password hashing, JWT sessions)
- Live stock data and historical charts (Twelve Data API)
- Statistical price forecasting — linear regression + momentum blend,
  fully explainable (see `src/lib/predict.ts`)
- Paper trading portfolio with $100,000 virtual cash — buy/sell real
  tickers at live prices
- Portfolio risk metrics — annualized volatility, Sharpe ratio, max
  drawdown (see `src/lib/risk.ts`)
- AI Financial Analyst — a tool-calling agent (Groq/Llama) that looks up
  your real portfolio, risk, and market data before answering questions
- AI-generated plain-English insights on individual stocks

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL (Neon, free tier) via Prisma
- Twelve Data — free-tier market data API
- Groq (Llama 3.3 / GPT-OSS) — free-tier AI inference
- Vercel — free-tier hosting

## How the forecast works

The price forecast is a transparent statistical model, not a black box:

1. Linear regression over recent closing prices gives the overall
   trend direction and an R² fit-quality score.
2. Momentum is estimated from the average daily % change over the
   last 10 trading sessions.
3. The two are blended — weighted more toward the regression trend when
   R² is high, more toward momentum when it's low — to project the next
   N days.

## Local setup

1. Install dependencies:
```bash
   npm install
```

2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — PostgreSQL connection string (Neon free tier works)
   - `JWT_SECRET` — any long random string
   - `GROQ_API_KEY` — free key from https://console.groq.com/keys
   - `TWELVE_DATA_API_KEY` — free key from https://twelvedata.com

3. Run migrations:
```bash
   npx prisma migrate dev
```

4. Run the dev server:
```bash
   npm run dev
```

5. Open http://localhost:3000, sign up, and add a ticker (e.g. `AAPL`)
   to your watchlist or portfolio.

## Disclaimer

This project is for educational/portfolio purposes. Forecasts are
statistical projections, not financial advice.
