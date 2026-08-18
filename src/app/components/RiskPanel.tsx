"use client";
import type { RiskMetrics } from "@/lib/risk";

export default function RiskPanel({ data }: { data: RiskMetrics & { note?: string } }) {
  if (data.note) {
    return (
      <div className="bg-[var(--bg-panel)] border border-dashed border-[var(--border-subtle)] rounded-xl px-5 py-4 mb-8 text-sm text-[var(--text-muted)]">
        {data.note}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold mb-3 text-[var(--text-muted)]">
        Portfolio Risk (trailing 6 months)
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Metric label="Volatility (annualized)" value={`${data.volatilityAnnualizedPct}%`} />
        <Metric
          label="Sharpe Ratio"
          value={data.sharpeRatio.toString()}
          tone={data.sharpeRatio >= 1 ? "up" : data.sharpeRatio < 0 ? "down" : undefined}
        />
        <Metric label="Max Drawdown" value={`${data.maxDrawdownPct}%`} tone="down" />
        <Metric label="Best Day" value={`+${data.bestDayPct}%`} tone="up" />
        <Metric label="Worst Day" value={`${data.worstDayPct}%`} tone="down" />
      </div>
    </div>
  );
}

function Metric({
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
      <div className={`font-mono-data font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}