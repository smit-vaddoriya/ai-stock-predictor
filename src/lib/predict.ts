export function simpleMovingAverage(closes: number[], window = 10): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < window - 1) {
      result.push(null);
      continue;
    }
    const slice = closes.slice(i - window + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / window;
    result.push(Number(avg.toFixed(2)));
  }
  return result;
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r2: number;
}

export function linearRegression(closes: number[]): LinearRegressionResult {
  const n = closes.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = closes.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (closes[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yPred = slope * xs[i] + intercept;
    ssRes += (closes[i] - yPred) ** 2;
    ssTot += (closes[i] - yMean) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

export interface ForecastResult {
  forecast: number[];
  meta: {
    slope: number;
    r2: number;
    avgDailyReturnPct: number;
    trend: "up" | "down" | "flat";
  };
}

export function forecastNextDays(closes: number[], days = 7): ForecastResult {
  const n = closes.length;
  const { slope, intercept, r2 } = linearRegression(closes);

  const recentWindow = closes.slice(-11);
  const dailyReturns: number[] = [];
  for (let i = 1; i < recentWindow.length; i++) {
    dailyReturns.push((recentWindow[i] - recentWindow[i - 1]) / recentWindow[i - 1]);
  }
  const avgDailyReturn =
    dailyReturns.reduce((a, b) => a + b, 0) / (dailyReturns.length || 1);

  const lastClose = closes[n - 1];
  const forecast: number[] = [];
  let cursor = lastClose;

  for (let i = 1; i <= days; i++) {
    const trendPrice = slope * (n - 1 + i) + intercept;
    const momentumPrice = cursor * (1 + avgDailyReturn);
    const trendWeight = Math.max(0.3, Math.min(0.7, r2));
    const blended = trendWeight * trendPrice + (1 - trendWeight) * momentumPrice;
    forecast.push(Number(blended.toFixed(2)));
    cursor = blended;
  }

  return {
    forecast,
    meta: {
      slope: Number(slope.toFixed(4)),
      r2: Number(r2.toFixed(4)),
      avgDailyReturnPct: Number((avgDailyReturn * 100).toFixed(3)),
      trend: slope > 0 ? "up" : slope < 0 ? "down" : "flat",
    },
  };
}