import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { enrichHoldings, summarize } from "@/lib/portfolio";

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let portfolio = await prisma.portfolio.findUnique({
      where: { userId: user.userId },
      include: { holdings: true },
    });

    // First-time visitor: create their paper-trading account with $100k.
    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: { userId: user.userId },
        include: { holdings: true },
      });
    }

    const enriched = await enrichHoldings(portfolio.holdings);
    const summary = summarize(portfolio.cash, enriched);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}