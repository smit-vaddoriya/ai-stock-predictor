export interface RiskMetrics {
  volatilityAnnualizedPct: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  bestDayPct: number;
  worstDayPct: number;
}

/**
 * Computes standard risk metrics from a series of daily closing prices.
 * All formulas are the standard textbook definitions — useful to be able
 * to explain each one in an interview:
 *
 * - Daily returns: (close[i] - close[i-1]) / close[i-1]
 * - Volatility: stdev(daily returns) * sqrt(252) [252 trading days/year],
 *   expressed as a percentage
 * - Sharpe ratio: (mean daily return - risk-free rate) / stdev(daily return),
 *   annualized. We assume a 0% risk-free rate for simplicity (reasonable
 *   for a portfolio project; real desks use the T-bill rate).
 * - Max drawdown: largest peak-to-trough decline over the period
 */
export function calculateRiskMetrics(closes: number[]): RiskMetrics {
  const dailyReturns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    dailyReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }

  if (dailyReturns.length === 0) {
    return {
      volatilityAnnualizedPct: 0,
      sharpeRatio: 0,
      maxDrawdownPct: 0,
      bestDayPct: 0,
      worstDayPct: 0,
    };
  }

  const meanReturn =
    dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;

  const variance =
    dailyReturns.reduce((sum, r) => sum + (r - meanReturn) ** 2, 0) /
    dailyReturns.length;
  const dailyStdev = Math.sqrt(variance);

  const TRADING_DAYS_PER_YEAR = 252;
  const volatilityAnnualizedPct =
    dailyStdev * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100;

  const sharpeRatio =
    dailyStdev === 0
      ? 0
      : (meanReturn / dailyStdev) * Math.sqrt(TRADING_DAYS_PER_YEAR);

  // Max drawdown: track the running peak, measure the worst decline from it.
  let peak = closes[0];
  let maxDrawdown = 0;
  for (const price of closes) {
    if (price > peak) peak = price;
    const drawdown = (price - peak) / peak;
    if (drawdown < maxDrawdown) maxDrawdown = drawdown;
  }

  const bestDayPct = Math.max(...dailyReturns) * 100;
  const worstDayPct = Math.min(...dailyReturns) * 100;

  return {
    volatilityAnnualizedPct: Number(volatilityAnnualizedPct.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    maxDrawdownPct: Number((maxDrawdown * 100).toFixed(2)),
    bestDayPct: Number(bestDayPct.toFixed(2)),
    worstDayPct: Number(worstDayPct.toFixed(2)),
  };
}

/**
 * Weighted portfolio volatility/risk approximation: pools each holding's
 * daily returns weighted by its portfolio share, then applies the same
 * formulas. This ignores cross-asset correlation (a true covariance-matrix
 * approach is a good "stretch" upgrade to mention in an interview), but
 * gives a solid, honest first-order risk estimate.
 */
export function calculatePortfolioRisk(
  holdingsCloses: { symbol: string; closes: number[]; weight: number }[]
): RiskMetrics {
  const maxLen = Math.max(...holdingsCloses.map((h) => h.closes.length));
  const blendedReturns: number[] = [];

  for (let i = 1; i < maxLen; i++) {
    let dayReturn = 0;
    let weightSum = 0;
    for (const h of holdingsCloses) {
      if (i < h.closes.length) {
        const r = (h.closes[i] - h.closes[i - 1]) / h.closes[i - 1];
        dayReturn += r * h.weight;
        weightSum += h.weight;
      }
    }
    if (weightSum > 0) blendedReturns.push(dayReturn / weightSum);
  }

  // Reconstruct a synthetic price series from blended returns so we can
  // reuse calculateRiskMetrics (which expects prices, not returns).
  const syntheticCloses = [100];
  for (const r of blendedReturns) {
    syntheticCloses.push(syntheticCloses[syntheticCloses.length - 1] * (1 + r));
  }

  return calculateRiskMetrics(syntheticCloses);
}