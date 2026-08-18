import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.watchlistItem.findMany({
      where: { userId: user.userId },
      orderBy: { addedAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { symbol } = await request.json();
    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }
    const normalizedSymbol = symbol.toUpperCase().trim();

    const existing = await prisma.watchlistItem.findUnique({
      where: {
        userId_symbol: { userId: user.userId, symbol: normalizedSymbol },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Already in your watchlist" }, { status: 409 });
    }

    await prisma.watchlistItem.create({
      data: { userId: user.userId, symbol: normalizedSymbol },
    });

    return NextResponse.json({ ok: true, symbol: normalizedSymbol }, { status: 201 });
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}