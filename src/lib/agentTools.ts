import { prisma } from "@/lib/prisma";
import { enrichHoldings, summarize } from "@/lib/portfolio";
import { calculatePortfolioRisk } from "@/lib/risk";
import { getCachedChart, getCachedQuote } from "@/lib/marketData";
import { forecastNextDays } from "@/lib/predict";

// JSON-schema tool definitions Groq will see and can choose to call.
export const toolDefinitions = [
  {
    type: "function" as const,
    function: {
      name: "get_portfolio",
      description:
        "Get the user's current paper-trading portfolio: cash, holdings, market value, and unrealized P&L.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_risk_metrics",
      description:
        "Get the user's portfolio risk metrics: annualized volatility, Sharpe ratio, max drawdown, best/worst day.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_watchlist",
      description: "Get the list of stock symbols the user is watching.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_stock_quote",
      description:
        "Get the current price and a short-term statistical forecast/trend for a specific stock ticker symbol.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "The stock ticker symbol, e.g. AAPL, TSLA, MSFT",
          },
        },
        required: ["symbol"],
      },
    },
  },
];

/** Executes a named tool for a given user and returns a JSON-serializable result. */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  switch (name) {
    case "get_portfolio": {
      const portfolio = await prisma.portfolio.findUnique({
        where: { userId },
        include: { holdings: true },
      });
      if (!portfolio) return { error: "No portfolio found." };
      const enriched = await enrichHoldings(portfolio.holdings);
      return summarize(portfolio.cash, enriched);
    }

    case "get_risk_metrics": {
      const portfolio = await prisma.portfolio.findUnique({
        where: { userId },
        include: { holdings: true },
      });
      if (!portfolio || portfolio.holdings.length === 0) {
        return { note: "No holdings yet, so no risk metrics are available." };
      }
      const period2 = new Date();
      const period1 = new Date();
      period1.setMonth(period1.getMonth() - 6);
      const totalValue = portfolio.holdings.reduce(
        (sum, h) => sum + h.shares * h.avgCost,
        0
      );
      const holdingsCloses = await Promise.all(
        portfolio.holdings.map(async (h) => {
          const history = await getCachedChart(h.symbol, period1, period2);
          const closes = history.quotes.map((q) => q.close);
          const weight =
            totalValue === 0
              ? 1 / portfolio.holdings.length
              : (h.shares * h.avgCost) / totalValue;
          return { symbol: h.symbol, closes, weight };
        })
      );
      return calculatePortfolioRisk(holdingsCloses);
    }

    case "get_watchlist": {
      const items = await prisma.watchlistItem.findMany({ where: { userId } });
      return items.map((i) => i.symbol);
    }

    case "get_stock_quote": {
      const symbol = String(args.symbol || "").toUpperCase();
      if (!symbol) return { error: "No symbol provided." };
      try {
        const quote = await getCachedQuote(symbol);
        const period2 = new Date();
        const period1 = new Date();
        period1.setMonth(period1.getMonth() - 6);
        const history = await getCachedChart(symbol, period1, period2);
        const closes = history.quotes.map((q) => q.close);
        if (closes.length < 15) {
          return { symbol, currentPrice: quote.regularMarketPrice };
        }
        const { meta } = forecastNextDays(closes, 5);
        return {
          symbol,
          currentPrice: quote.regularMarketPrice,
          trend: meta.trend,
          regressionFitR2: meta.r2,
          avgDailyReturnPct: meta.avgDailyReturnPct,
        };
      } catch {
        return { error: `Could not fetch data for ${symbol}.` };
      }
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}