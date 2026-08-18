import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { getCurrentPrice } from "@/lib/portfolio";

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { symbol: rawSymbol, side, shares: rawShares } = await request.json();
    const symbol = rawSymbol?.toUpperCase()?.trim();
    const shares = Number(rawShares);

    if (!symbol || (side !== "BUY" && side !== "SELL") || !shares || shares <= 0) {
      return NextResponse.json({ error: "Invalid trade request" }, { status: 400 });
    }

    const price = await getCurrentPrice(symbol);

    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: user.userId },
      include: { holdings: true },
    });
    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    const existingHolding = portfolio.holdings.find((h) => h.symbol === symbol);
    const cost = price * shares;

    if (side === "BUY") {
      if (cost > portfolio.cash) {
        return NextResponse.json(
          { error: `Not enough cash. Need $${cost.toFixed(2)}, have $${portfolio.cash.toFixed(2)}.` },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        const newShares = (existingHolding?.shares ?? 0) + shares;
        const newAvgCost = existingHolding
          ? (existingHolding.avgCost * existingHolding.shares + cost) / newShares
          : price;

        await tx.holding.upsert({
          where: {
            portfolioId_symbol: { portfolioId: portfolio.id, symbol },
          },
          create: {
            portfolioId: portfolio.id,
            symbol,
            shares,
            avgCost: price,
          },
          update: {
            shares: newShares,
            avgCost: newAvgCost,
          },
        });

        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: { cash: portfolio.cash - cost },
        });

        await tx.trade.create({
          data: { userId: user.userId, symbol, side: "BUY", shares, price },
        });
      });
    } else {
      if (!existingHolding || existingHolding.shares < shares) {
        return NextResponse.json(
          { error: `You only own ${existingHolding?.shares ?? 0} shares of ${symbol}.` },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        const remainingShares = existingHolding.shares - shares;

        if (remainingShares === 0) {
          await tx.holding.delete({ where: { id: existingHolding.id } });
        } else {
          await tx.holding.update({
            where: { id: existingHolding.id },
            data: { shares: remainingShares },
          });
        }

        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: { cash: portfolio.cash + cost },
        });

        await tx.trade.create({
          data: { userId: user.userId, symbol, side: "SELL", shares, price },
        });
      });
    }

    return NextResponse.json({ ok: true, symbol, side, shares, price });
  } catch (error) {
    console.error("Error executing trade:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}