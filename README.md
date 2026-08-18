# FinSight AI

AI-powered financial intelligence platform: stock analysis, portfolio
management, AI forecasting, news sentiment, an AI financial assistant,
document RAG, risk analysis, budgeting, paper trading, backtesting, and
subscriptions.

This repo is a pnpm/Turborepo monorepo currently at the **foundation**
stage — architecture, auth, database schema, API/AI-service scaffolding,
and a dashboard shell are in place. Feature implementation is intentionally
not built out yet; see `docs/` for what exists and why.

## Stack

TypeScript, Next.js 15, React 19, Tailwind CSS, shadcn/ui, PostgreSQL,
Prisma, Redis, Python/FastAPI, Docker, Zod, TanStack Query, React Hook
Form, Stripe (planned), Vitest, Playwright, pytest.

## Structure

```
apps/web           Next.js app (UI + REST API)
apps/ai-service     FastAPI service (prediction/sentiment/risk/backtesting/rag/agents)
packages/database   Prisma schema + client + seed
packages/shared     zod schemas, shared types, constants, Redis, rate limiting
packages/config     shared tsconfig/eslint base
services/           planned standalone workers (market-data, notifications, jobs)
infrastructure/docker  Dockerfiles for web + ai-service
tests/e2e           Playwright smoke tests
docs/               architecture, API, AI service, and database notes
```

## Getting started

```bash
corepack enable        # or: npm install -g pnpm
pnpm install

cp .env.example .env    # fill in DATABASE_URL/SESSION_SECRET etc.
docker compose up -d postgres redis

pnpm db:generate
pnpm db:migrate
pnpm db:seed

pnpm dev                # apps/web on :3000
```

AI service:

```bash
cd apps/ai-service
python -m venv .venv
.venv/Scripts/activate   # source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test                        # Vitest (apps/web, packages/shared)
pnpm --filter @finsight/e2e test # Playwright (requires the dev server)
cd apps/ai-service && pytest
```

## Default seeded login

`admin@finsight.local` / `ChangeMe123!` — change this before deploying
anywhere real.
