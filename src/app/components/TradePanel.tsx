"use client";
import { useState } from "react";
import type { PortfolioSummary } from "@/lib/portfolio";

interface TradePanelProps {
  data: PortfolioSummary;
  onTradeComplete: () => void;
}

export default function TradePanel({ data, onTradeComplete }: TradePanelProps) {
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submitTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!symbol.trim() || !shares || Number(shares) <= 0) {
      setError("Enter a valid symbol and share count.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portfolio/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.trim(), side, shares: Number(shares) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Trade failed.");
      } else {
        setSuccess(
          `${side === "BUY" ? "Bought" : "Sold"} ${json.shares} shares of ${json.symbol} at $${json.price}`
        );
        setSymbol("");
        setShares("");
        onTradeComplete();
      }
    } catch {
      setError("Trade failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-5 mb-8">
      <h2 className="text-sm font-semibold mb-3">Paper Trade</h2>
      <form onSubmit={submitTrade} className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Symbol"
          className="w-28 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm font-mono-data focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]"
        />
        <input
          type="number"
          min="0.0001"
          step="any"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          placeholder="Shares"
          className="w-28 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm font-mono-data focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]"
        />
        <div className="flex gap-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg p-1">
          <button
            type="button"
            onClick={() => setSide("BUY")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${
              side === "BUY" ? "bg-[var(--accent-gain)] text-black" : "text-[var(--text-muted)]"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setSide("SELL")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${
              side === "SELL" ? "bg-[var(--accent-loss)] text-black" : "text-[var(--text-muted)]"
            }`}
          >
            Sell
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--accent-brand)] hover:bg-[var(--accent-brand-hover)] transition rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit"}
        </button>
      </form>
      {error && <p className="text-xs text-[var(--accent-loss)] mt-2">{error}</p>}
      {success && <p className="text-xs text-[var(--accent-gain)] mt-2">{success}</p>}

      {data.holdings.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <th className="py-2 pr-4">Symbol</th>
                <th className="py-2 pr-4">Shares</th>
                <th className="py-2 pr-4">Avg Cost</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Value</th>
                <th className="py-2 pr-4">P&L</th>
              </tr>
            </thead>
            <tbody className="font-mono-data">
              {data.holdings.map((h) => (
                <tr key={h.symbol} className="border-b border-[var(--border-subtle)]/50">
                  <td className="py-2 pr-4 font-semibold">{h.symbol}</td>
                  <td className="py-2 pr-4">{h.shares}</td>
                  <td className="py-2 pr-4">${h.avgCost.toFixed(2)}</td>
                  <td className="py-2 pr-4">${h.currentPrice.toFixed(2)}</td>
                  <td className="py-2 pr-4">${h.marketValue.toLocaleString()}</td>
                  <td
                    className={`py-2 pr-4 ${
                      h.unrealizedPnl >= 0 ? "text-[var(--accent-gain)]" : "text-[var(--accent-loss)]"
                    }`}
                  >
                    {h.unrealizedPnl >= 0 ? "+" : ""}
                    ${h.unrealizedPnl.toLocaleString()} ({h.unrealizedPnlPct}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}