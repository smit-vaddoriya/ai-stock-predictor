import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { calculatePortfolioRisk } from "@/lib/risk";
import { getCachedChart } from "@/lib/marketData";

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: user.userId },
      include: { holdings: true },
    });

    if (!portfolio || portfolio.holdings.length === 0) {
      return NextResponse.json({
        volatilityAnnualizedPct: 0,
        sharpeRatio: 0,
        maxDrawdownPct: 0,
        bestDayPct: 0,
        worstDayPct: 0,
        note: "Add holdings to see risk metrics.",
      });
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
        const weight = totalValue === 0 ? 1 / portfolio.holdings.length : (h.shares * h.avgCost) / totalValue;
        return { symbol: h.symbol, closes, weight };
      })
    );

    const risk = calculatePortfolioRisk(holdingsCloses);
    return NextResponse.json(risk);
  } catch (error) {
    console.error("Error calculating portfolio risk:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}