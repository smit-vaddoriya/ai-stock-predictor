import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { forecastNextDays, simpleMovingAverage } from "@/lib/predict";
import { getCachedChart } from "@/lib/marketData";
import type { HistoryPoint, ForecastPoint } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const symbol = params.symbol?.toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "6mo";
    const forecastDays = Math.min(
      30,
      Math.max(1, parseInt(searchParams.get("days") || "7", 10))
    );

    const period2 = new Date();
    const period1 = subtractFromRange(period2, range);

    const history = await getCachedChart(symbol, period1, period2);
    const quotes = history.quotes;

    if (quotes.length < 15) {
      return NextResponse.json(
        { error: `Not enough historical data for "${symbol}". Check the ticker.` },
        { status: 404 }
      );
    }

    const closes = quotes.map((q) => q.close);
    const dates = quotes.map((q) => q.date);

    const sma10 = simpleMovingAverage(closes, 10);
    const sma20 = simpleMovingAverage(closes, 20);
    const { forecast, meta } = forecastNextDays(closes, forecastDays);

    const lastDate = new Date(dates[dates.length - 1]);
    const forecastDates = forecast.map((_, i) => {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + i + 1);
      return d.toISOString().split("T")[0];
    });

    const historySeries: HistoryPoint[] = quotes.map((q, i) => ({
      date: new Date(q.date).toISOString().split("T")[0],
      close: Number(q.close.toFixed(2)),
      sma10: sma10[i],
      sma20: sma20[i],
    }));

    const forecastSeries: ForecastPoint[] = forecast.map((price, i) => ({
      date: forecastDates[i],
      forecast: price,
    }));

    return NextResponse.json({
      symbol,
      lastClose: Number(closes[closes.length - 1].toFixed(2)),
      history: historySeries,
      forecast: forecastSeries,
      meta,
    });
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return NextResponse.json(
      { error: `Could not fetch data for "${symbol}". It may be an invalid ticker or Twelve Data rate limit was hit.` },
      { status: 502 }
    );
  }
}

function subtractFromRange(fromDate: Date, range: string): Date {
  const d = new Date(fromDate);
  switch (range) {
    case "1mo":
      d.setMonth(d.getMonth() - 1);
      break;
    case "3mo":
      d.setMonth(d.getMonth() - 3);
      break;
    case "1y":
      d.setFullYear(d.getFullYear() - 1);
      break;
    case "2y":
      d.setFullYear(d.getFullYear() - 2);
      break;
    case "6mo":
    default:
      d.setMonth(d.getMonth() - 6);
      break;
  }
  return d;
}