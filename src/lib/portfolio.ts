import { getCachedQuote } from "@/lib/marketData";12

export interface EnrichedHolding {
  symbol: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
}

export interface PortfolioSummary {
  cash: number;
  holdings: EnrichedHolding[];
  totalMarketValue: number;
  totalCostBasis: number;
  totalPortfolioValue: number;
  totalUnrealizedPnl: number;
  totalUnrealizedPnlPct: number;
}

/**
 * Fetches the current price for a symbol. Used to enrich raw holdings
 * (shares + avgCost) with live market value and P&L.
 */
export async function getCurrentPrice(symbol: string): Promise<number> {
  const quote = await getCachedQuote(symbol);
  const price = quote?.regularMarketPrice;
  if (typeof price !== "number") {
    throw new Error(`Could not fetch a current price for ${symbol}`);
  }
  return price;
}

export async function enrichHoldings(
  holdings: { symbol: string; shares: number; avgCost: number }[]
): Promise<EnrichedHolding[]> {
  return Promise.all(
    holdings.map(async (h) => {
      const currentPrice = await getCurrentPrice(h.symbol);
      const marketValue = currentPrice * h.shares;
      const costBasis = h.avgCost * h.shares;
      const unrealizedPnl = marketValue - costBasis;
      const unrealizedPnlPct = costBasis === 0 ? 0 : (unrealizedPnl / costBasis) * 100;
      return {
        symbol: h.symbol,
        shares: h.shares,
        avgCost: h.avgCost,
        currentPrice: Number(currentPrice.toFixed(2)),
        marketValue: Number(marketValue.toFixed(2)),
        costBasis: Number(costBasis.toFixed(2)),
        unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
        unrealizedPnlPct: Number(unrealizedPnlPct.toFixed(2)),
      };
    })
  );
}

export function summarize(
  cash: number,
  holdings: EnrichedHolding[]
): PortfolioSummary {
  const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCostBasis = holdings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalUnrealizedPnl = totalMarketValue - totalCostBasis;
  const totalUnrealizedPnlPct =
    totalCostBasis === 0 ? 0 : (totalUnrealizedPnl / totalCostBasis) * 100;

  return {
    cash: Number(cash.toFixed(2)),
    holdings,
    totalMarketValue: Number(totalMarketValue.toFixed(2)),
    totalCostBasis: Number(totalCostBasis.toFixed(2)),
    totalPortfolioValue: Number((cash + totalMarketValue).toFixed(2)),
    totalUnrealizedPnl: Number(totalUnrealizedPnl.toFixed(2)),
    totalUnrealizedPnlPct: Number(totalUnrealizedPnlPct.toFixed(2)),
  };
}