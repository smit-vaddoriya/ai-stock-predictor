"use client";
import type { PortfolioSummary } from "@/lib/portfolio";

export default function PortfolioSummaryCards({ data }: { data: PortfolioSummary }) {
  const pnlPositive = data.totalUnrealizedPnl >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card label="Portfolio Value" value={`$${data.totalPortfolioValue.toLocaleString()}`} />
      <Card
        label="Unrealized P&L"
        value={`${pnlPositive ? "+" : ""}$${data.totalUnrealizedPnl.toLocaleString()}`}
        tone={pnlPositive ? "up" : "down"}
      />
      <Card
        label="Return"
        value={`${pnlPositive ? "+" : ""}${data.totalUnrealizedPnlPct}%`}
        tone={pnlPositive ? "up" : "down"}
      />
      <Card label="Available Cash" value={`$${data.cash.toLocaleString()}`} />
    </div>
  );
}

function Card({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
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
      <div className={`font-mono-data font-semibold text-lg ${toneClass}`}>{value}</div>
    </div>
  );
}