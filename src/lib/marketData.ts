import axios from "axios";

const BASE_URL = "https://api.twelvedata.com";
const API_KEY = process.env.TWELVE_DATA_API_KEY;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry<unknown>>();

async function withCache<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;
  const value = await fetcher();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export interface Quote {
  regularMarketPrice: number;
}

export interface ChartPoint {
  date: Date;
  close: number;
}

export interface ChartResult {
  quotes: ChartPoint[];
}

function assertApiKey() {
  if (!API_KEY) {
    throw new Error("TWELVE_DATA_API_KEY is not set in .env");
  }
}

interface TwelveDataErrorShape {
  status?: string;
  code?: number;
  message?: string;
}

async function fetchQuote(symbol: string): Promise<Quote> {
  assertApiKey();
  const res = await axios.get(`${BASE_URL}/quote`, {
    params: { symbol, apikey: API_KEY },
  });
  const data = res.data as TwelveDataErrorShape & { close?: string };
  if (data.status === "error" || data.code) {
    throw new Error(data.message || `Twelve Data error for ${symbol}`);
  }
  const price = parseFloat(data.close ?? "");
  if (Number.isNaN(price)) {
    throw new Error(`Could not parse price for ${symbol}`);
  }
  return { regularMarketPrice: price };
}

async function fetchChart(symbol: string, period1: Date, period2: Date): Promise<ChartResult> {
  assertApiKey();
  const startDate = period1.toISOString().slice(0, 10);
  const endDate = period2.toISOString().slice(0, 10);
  const res = await axios.get(`${BASE_URL}/time_series`, {
    params: {
      symbol,
      interval: "1day",
      start_date: startDate,
      end_date: endDate,
      order: "ASC",
      apikey: API_KEY,
    },
  });
  const data = res.data as TwelveDataErrorShape & {
    values?: { datetime: string; close: string }[];
  };
  if (data.status === "error" || data.code) {
    throw new Error(data.message || `Twelve Data error for ${symbol}`);
  }
  const values = data.values || [];
  const quotes: ChartPoint[] = values.map((v) => ({
    date: new Date(v.datetime),
    close: parseFloat(v.close),
  }));
  return { quotes };
}

/** Cached quote lookup — 30s TTL. */
export async function getCachedQuote(symbol: string): Promise<Quote> {
  return withCache(`quote:${symbol}`, 30_000, () => fetchQuote(symbol));
}

/** Cached historical chart — 5 min TTL. */
export async function getCachedChart(
  symbol: string,
  period1: Date,
  period2: Date
): Promise<ChartResult> {
  const key = `chart:${symbol}:${period1.toISOString().slice(0, 10)}:${period2
    .toISOString()
    .slice(0, 10)}`;
  return withCache(key, 5 * 60_000, () => fetchChart(symbol, period1, period2));
}