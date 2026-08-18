import Groq from "groq-sdk";
import type { ForecastMeta } from "@/types";

let client: Groq | undefined;

function getClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set in .env");
  }
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

interface GenerateInsightArgs {
  symbol: string;
  meta: ForecastMeta;
  lastClose: number;
  forecast: number[];
}

export async function generateInsight({
  symbol,
  meta,
  lastClose,
  forecast,
}: GenerateInsightArgs): Promise<string> {
  const groq = getClient();

  const prompt = `You are a financial analysis assistant. Based ONLY on the
data below, write a concise 3-4 sentence plain-English summary for a retail
investor. Do not invent facts. Include a brief risk disclaimer at the end
(one sentence).

Stock: ${symbol}
Last close: $${lastClose}
Trend direction (from linear regression): ${meta.trend}
Regression fit quality (R^2, 0-1): ${meta.r2}
Recent average daily return: ${meta.avgDailyReturnPct}%
${forecast.length}-day forecast (statistical model, not guaranteed): ${forecast.join(", ")}
`;

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    max_tokens: 300,
  });

  return completion.choices[0]?.message?.content ?? "No insight generated.";
}