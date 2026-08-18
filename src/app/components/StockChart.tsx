"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { HistoryPoint, ForecastPoint } from "@/types";

interface MergedPoint {
  date: string;
  close: number | null;
  sma10: number | null;
  sma20: number | null;
  forecast: number | null;
}

interface StockChartProps {
  history: HistoryPoint[];
  forecast: ForecastPoint[];
  showSma: boolean;
}

export default function StockChart({ history, forecast, showSma }: StockChartProps) {
  const merged: MergedPoint[] = [
    ...history.map((h) => ({
      date: h.date,
      close: h.close,
      sma10: h.sma10,
      sma20: h.sma20,
      forecast: null,
    })),
    ...forecast.map((f) => ({
      date: f.date,
      close: null,
      sma10: null,
      sma20: null,
      forecast: f.forecast,
    })),
  ];

  if (history.length && forecast.length) {
    merged[history.length - 1].forecast = history[history.length - 1].close;
  }

  return (
    <ResponsiveContainer width="100%" height={380}>
      <ComposedChart data={merged} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          minTickGap={40}
        />
        <YAxis
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          domain={["auto", "auto"]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--bg-panel)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 8,
            color: "var(--text-primary)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
        <Line
          type="monotone"
          dataKey="close"
          name="Close"
          stroke="#e8eaed"
          dot={false}
          strokeWidth={2}
        />
        {showSma && (
          <Line
            type="monotone"
            dataKey="sma10"
            name="SMA 10"
            stroke="var(--accent-brand)"
            dot={false}
            strokeWidth={1.5}
          />
        )}
        {showSma && (
          <Line
            type="monotone"
            dataKey="sma20"
            name="SMA 20"
            stroke="#f59e0b"
            dot={false}
            strokeWidth={1.5}
          />
        )}
        <Line
          type="monotone"
          dataKey="forecast"
          name="Forecast"
          stroke="var(--accent-gain)"
          strokeDasharray="6 4"
          dot={false}
          strokeWidth={2}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}