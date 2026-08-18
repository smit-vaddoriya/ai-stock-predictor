"use client";

interface TickerItem {
  symbol: string;
  lastClose: number;
  trend: "up" | "down" | "flat";
}

export default function TickerTape({ items }: { items: TickerItem[] }) {
  if (!items || items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-[var(--border-subtle)] bg-[var(--bg-panel)]">
      <div className="ticker-track py-2.5">
        {doubled.map((item, i) => (
          <div
            key={`${item.symbol}-${i}`}
            className="flex items-center gap-2 px-6 whitespace-nowrap text-sm font-mono-data"
          >
            <span className="font-semibold text-[var(--text-primary)]">
              {item.symbol}
            </span>
            <span className="text-[var(--text-muted)]">
              ${item.lastClose?.toFixed(2)}
            </span>
            <span
              className={
                item.trend === "up"
                  ? "text-[var(--accent-gain)]"
                  : item.trend === "down"
                  ? "text-[var(--accent-loss)]"
                  : "text-[var(--text-muted)]"
              }
            >
              {item.trend === "up" ? "▲" : item.trend === "down" ? "▼" : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}