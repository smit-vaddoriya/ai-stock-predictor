"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import StockChart from "../../components/StockChart";
import type { StockApiResponse } from "@/types";

const RANGES = [
  { value: "1mo", label: "1M" },
  { value: "3mo", label: "3M" },
  { value: "6mo", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "2y", label: "2Y" },
];

export default function StockDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol;
  const router = useRouter();

  const [range, setRange] = useState("6mo");
  const [forecastDays, setForecastDays] = useState(7);
  const [data, setData] = useState<StockApiResponse | null>(null);
  const [showSma, setShowSma] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/stock/${symbol}?range=${range}&days=${forecastDays}`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not load data for this symbol.");
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setError("Could not load data for this symbol.");
    } finally {
      setLoading(false);
    }
  }, [symbol, range, forecastDays]);

  useEffect(() => {
    loadData();
    setInsight(null);
  }, [loadData]);

  const generateInsight = async () => {
    if (!data) return;
    setInsightLoading(true);
    setInsightError(null);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: data.symbol,
          lastClose: data.lastClose,
          meta: data.meta,
          forecast: data.forecast,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setInsightError(json.error || "Could not generate insight.");
      } else {
        setInsight(json.insight);
      }
    } catch {
      setInsightError("Could not generate insight.");
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-10 max-w-5xl">
      <button
        onClick={() => router.push("/")}
        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition"
      >
        ← Back to watchlist
      </button>

      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-bold tracking-tight font-mono-data">
          {symbol}
        </h1>
        {data && (
          <div className="text-2xl font-mono-data font-semibold">
            ${data.lastClose}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 text-sm text-[var(--accent-loss)] bg-[var(--accent-loss)]/10 border border-[var(--accent-loss)]/30 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-1 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                range === r.value
                  ? "bg-[var(--accent-brand)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          Forecast days
          <input
            type="number"
            min={1}
            max={30}
            value={forecastDays}
            onChange={(e) => setForecastDays(Number(e.target.value))}
            className="w-16 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-md px-2 py-1 text-center font-mono-data text-[var(--text-primary)]"
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={showSma}
            onChange={(e) => setShowSma(e.target.checked)}
          />
          Show moving averages
        </label>
      </div>

      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 mb-6">
        {loading ? (
          <div className="h-[380px] flex items-center justify-center text-[var(--text-muted)] text-sm">
            Loading chart…
          </div>
        ) : data ? (
          <StockChart history={data.history} forecast={data.forecast} showSma={showSma} />
        ) : null}
      </div>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <MetaCard
            label="Trend (linear regression)"
            value={
              data.meta.trend === "up"
                ? "▲ Upward"
                : data.meta.trend === "down"
                ? "▼ Downward"
                : "— Flat"
            }
            tone={data.meta.trend}
          />
          <MetaCard label="Regression fit (R²)" value={data.meta.r2} />
          <MetaCard
            label="Avg. daily return"
            value={`${data.meta.avgDailyReturnPct}%`}
            tone={data.meta.avgDailyReturnPct >= 0 ? "up" : "down"}
          />
        </div>
      )}

      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">AI Insight</h2>
          <button
            onClick={generateInsight}
            disabled={!data || insightLoading}
            className="bg-[var(--accent-brand)] hover:bg-[var(--accent-brand-hover)] transition rounded-lg px-4 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {insightLoading ? "Generating…" : "Generate AI Insight"}
          </button>
        </div>
        {insightError && (
          <p className="text-xs text-[var(--accent-loss)]">{insightError}</p>
        )}
        {insight ? (
          <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-line">
            {insight}
          </p>
        ) : (
          !insightError && (
            <p className="text-xs text-[var(--text-muted)]">
              Click the button to have Gemini summarize the trend and forecast
              above in plain English.
            </p>
          )
        )}
        <p className="text-[10px] text-[var(--text-muted)] mt-4 border-t border-[var(--border-subtle)] pt-3">
          This forecast is a statistical projection for educational purposes
          only — not financial advice. Past performance does not guarantee
          future results.
        </p>
      </div>
    </div>
  );
}

function MetaCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "up" | "down" | "flat";
}) {
  const toneClass =
    tone === "up"
      ? "text-[var(--accent-gain)]"
      : tone === "down"
      ? "text-[var(--accent-loss)]"
      : "text-[var(--text-primary)]";
  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl px-4 py-3">
      <div className="text-[11px] text-[var(--text-muted)] mb-1">{label}</div>
      <div className={`font-mono-data font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}