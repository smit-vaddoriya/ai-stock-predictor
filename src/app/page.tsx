"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import TickerTape from "./components/TickerTape";
import PortfolioSummaryCards from "./components/PortfolioSummaryCards";
import RiskPanel from "./components/RiskPanel";
import TradePanel from "./components/TradePanel";
import type { WatchlistItem } from "@prisma/client";
import type { StockApiResponse } from "@/types";
import type { PortfolioSummary } from "@/lib/portfolio";
import type { RiskMetrics } from "@/lib/risk";

interface TickerQuote {
  symbol: string;
  lastClose: number;
  trend: "up" | "down" | "flat";
}

export default function Home() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [tickerData, setTickerData] = useState<TickerQuote[]>([]);
  const [symbolInput, setSymbolInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [risk, setRisk] = useState<(RiskMetrics & { note?: string }) | null>(null);

  const loadPortfolio = useCallback(async () => {
    setPortfolioLoading(true);
    try {
      const res = await fetch("/api/portfolio");
      const data = await res.json();
      if (res.ok) setPortfolio(data);
    } catch {
      // Non-fatal — dashboard still works without portfolio data.
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

  const loadRisk = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio/risk");
      const data = await res.json();
      if (res.ok) setRisk(data);
    } catch {
      // Non-fatal.
    }
  }, []);

  const loadWatchlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/watchlist");
      const items = await res.json();

      if (!res.ok || !Array.isArray(items)) {
        setError(items?.error || "Failed to load your watchlist. Try logging in again.");
        setWatchlist([]);
        setLoading(false);
        return;
      }

      setWatchlist(items);

      const quotes = await Promise.all(
        items.map(async (item: WatchlistItem): Promise<TickerQuote | null> => {
          try {
            const r = await fetch(`/api/stock/${item.symbol}?range=1mo&days=1`);
            if (!r.ok) return null;
            const data: StockApiResponse = await r.json();
            return {
              symbol: data.symbol,
              lastClose: data.lastClose,
              trend: data.meta.trend,
            };
          } catch {
            return null;
          }
        })
      );
      setTickerData(quotes.filter((q): q is TickerQuote => q !== null));
    } catch {
      setError("Failed to load your watchlist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatchlist();
    loadPortfolio();
    loadRisk();
  }, [loadWatchlist, loadPortfolio, loadRisk]);

  const handleTradeComplete = () => {
    loadPortfolio();
    loadRisk();
  };

  const addSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbolInput.trim()) return;
    setAddLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbolInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add symbol.");
      } else {
        setSymbolInput("");
        await loadWatchlist();
      }
    } catch {
      setError("Could not add symbol.");
    } finally {
      setAddLoading(false);
    }
  };

  const removeSymbol = async (symbol: string) => {
    await fetch(`/api/watchlist/${symbol}`, { method: "DELETE" });
    loadWatchlist();
  };

  return (
    <div className="min-h-[calc(100vh-73px)]">
      <TickerTape items={tickerData} />

      <div className="container mx-auto px-6 py-10 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
          <p className="text-[var(--text-muted)] text-sm">
            Your paper trading portfolio, risk metrics, and watchlist forecasts.
          </p>
        </div>

        {portfolioLoading ? (
          <p className="text-[var(--text-muted)] text-sm mb-8">Loading portfolio…</p>
        ) : portfolio ? (
          <PortfolioSummaryCards data={portfolio} />
        ) : null}

        {risk && <RiskPanel data={risk} />}

        {portfolio && <TradePanel data={portfolio} onTradeComplete={handleTradeComplete} />}

        <div className="mb-6 mt-10">
          <h2 className="text-lg font-bold tracking-tight mb-1">Watchlist</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Track tickers and view statistical price forecasts, powered by real
            historical data and AI-generated commentary.
          </p>
        </div>

        <form onSubmit={addSymbol} className="flex gap-2 mb-8">
          <input
            type="text"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
            placeholder="Add a ticker, e.g. AAPL"
            className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)] font-mono-data"
          />
          <button
            type="submit"
            disabled={addLoading}
            className="bg-[var(--accent-brand)] hover:bg-[var(--accent-brand-hover)] transition rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {addLoading ? "Adding..." : "Add"}
          </button>
        </form>

        {error && (
          <div className="mb-6 text-sm text-[var(--accent-loss)] bg-[var(--accent-loss)]/10 border border-[var(--accent-loss)]/30 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
            <span>{error}</span>
            <Link
              href="/login"
              className="whitespace-nowrap text-xs underline hover:no-underline"
            >
              Go to login
            </Link>
          </div>
        )}

        {loading ? (
          <p className="text-[var(--text-muted)] text-sm">Loading your watchlist…</p>
        ) : watchlist.length === 0 ? (
          <div className="border border-dashed border-[var(--border-subtle)] rounded-xl px-6 py-12 text-center">
            <p className="text-[var(--text-muted)] text-sm">
              Nothing here yet. Add a ticker above to get your first forecast.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {watchlist.map((item) => {
              const quote = tickerData.find((t) => t.symbol === item.symbol);
              return (
                <Link
                  key={item.symbol}
                  href={`/stock/${item.symbol}`}
                  className="group relative bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-hover)] border border-[var(--border-subtle)] rounded-xl px-5 py-4 transition"
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeSymbol(item.symbol);
                    }}
                    className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--accent-loss)] text-xs opacity-0 group-hover:opacity-100 transition"
                    aria-label={`Remove ${item.symbol}`}
                  >
                    ✕
                  </button>
                  <div className="font-mono-data font-semibold text-lg">
                    {item.symbol}
                  </div>
                  {quote ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-mono-data">
                        ${quote.lastClose?.toFixed(2)}
                      </span>
                      <span
                        className={
                          quote.trend === "up"
                            ? "text-[var(--accent-gain)] text-xs"
                            : quote.trend === "down"
                            ? "text-[var(--accent-loss)] text-xs"
                            : "text-[var(--text-muted)] text-xs"
                        }
                      >
                        {quote.trend === "up" ? "▲ Uptrend" : quote.trend === "down" ? "▼ Downtrend" : "— Flat"}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--text-muted)] mt-1">
                      Loading quote…
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}