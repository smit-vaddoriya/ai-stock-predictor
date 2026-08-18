export interface JwtPayload {
  userId: string;
  email: string;
}

// ---------- Stock data / forecasting ----------

export interface HistoryPoint {
  date: string;
  close: number;
  sma10: number | null;
  sma20: number | null;
}

export interface ForecastPoint {
  date: string;
  forecast: number;
}

export interface ForecastMeta {
  slope: number;
  r2: number;
  avgDailyReturnPct: number;
  trend: "up" | "down" | "flat";
}

export interface StockApiResponse {
  symbol: string;
  lastClose: number;
  history: HistoryPoint[];
  forecast: ForecastPoint[];
  meta: ForecastMeta;
}