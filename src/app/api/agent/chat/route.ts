import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getUserFromRequest } from "@/lib/auth";
import { toolDefinitions, executeTool } from "@/lib/agentTools";

let groq: Groq | undefined;
function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: unknown;
  tool_call_id?: string;
  name?: string;
}

const SYSTEM_PROMPT = `You are an AI financial analyst assistant inside a paper-trading app.
You have tools to look up the user's real portfolio, risk metrics, watchlist, and live
stock data — use them whenever a question depends on real numbers instead of guessing.
Be concise (3-6 sentences unless asked for detail). Always end any investment-related
answer with a brief reminder that this is educational analysis, not personalized
financial advice. Never invent numbers — only state facts returned by your tools.`;

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { messages }: { messages: ChatMessage[] } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    let conversation: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    const MAX_TOOL_ROUNDS = 5;
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await getGroqClient().chat.completions.create({
        model: "openai/gpt-oss-120b",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: conversation as any,
        tools: toolDefinitions,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 600,
      });

      const choice = completion.choices[0];
      const message = choice.message;

      const toolCalls = message.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        // No more tools requested — this is the final answer.
        return NextResponse.json({ reply: message.content ?? "No response generated." });
      }

      // Model wants to call one or more tools. Append its request, then
      // execute each tool and append the results before looping again.
      conversation = [
        ...conversation,
        {
          role: "assistant",
          content: message.content ?? "",
          tool_calls: toolCalls,
        },
      ];

      for (const call of toolCalls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          // leave args empty if parsing fails
        }
        const result = await executeTool(call.function.name, args, user.userId);
        conversation.push({
          role: "tool",
          tool_call_id: call.id,
          name: call.function.name,
          content: JSON.stringify(result),
        });
      }
    }

    return NextResponse.json(
      { error: "The assistant took too many steps to answer. Try rephrasing your question." },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error in agent chat route:", error);
    return NextResponse.json(
      { error: "Could not get a response right now. Check GROQ_API_KEY." },
      { status: 500 }
    );
  }
}