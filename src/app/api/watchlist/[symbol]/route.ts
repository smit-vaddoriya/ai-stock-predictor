import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const symbol = params.symbol?.toUpperCase();
    await prisma.watchlistItem.deleteMany({
      where: { userId: user.userId, symbol },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}