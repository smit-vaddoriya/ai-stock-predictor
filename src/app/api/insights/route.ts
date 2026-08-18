import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { generateInsight } from "@/lib/groq";

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { symbol, lastClose, meta, forecast } = await request.json();
    if (!symbol || !meta || !forecast) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const forecastValues: number[] = forecast.map(
      (f: { forecast?: number } | number) =>
        typeof f === "number" ? f : f.forecast ?? 0
    );
    const text = await generateInsight({
      symbol,
      meta,
      lastClose,
      forecast: forecastValues,
    });

    return NextResponse.json({ insight: text });
  } catch (error) {
    console.error("Error generating insight:", error);
    return NextResponse.json(
      { error: "Could not generate AI insight right now. Check GROQ_API_KEY." },
      { status: 500 }
    );
  }
}