"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What's in my portfolio right now?",
  "How risky is my portfolio?",
  "What's the trend on AAPL?",
  "What's on my watchlist?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setError(null);
    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
      } else {
        setMessages([...nextMessages, { role: "assistant", content: json.reply }]);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-10 max-w-3xl flex flex-col h-[calc(100vh-73px)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">AI Financial Analyst</h1>
        <p className="text-[var(--text-muted)] text-sm">
          Ask about your portfolio, risk, watchlist, or any stock — it looks up real data
          before answering.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-5 mb-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Try asking one of these:
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-sm bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-brand)] rounded-lg px-4 py-2.5 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
              m.role === "user"
                ? "self-end bg-[var(--accent-brand)] text-white"
                : "self-start bg-[var(--bg-primary)] border border-[var(--border-subtle)]"
            }`}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="self-start bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-muted)]">
            Thinking…
          </div>
        )}

        {error && (
          <div className="self-start text-sm text-[var(--accent-loss)] bg-[var(--accent-loss)]/10 border border-[var(--accent-loss)]/30 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your portfolio, risk, or a stock…"
          className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--accent-brand)] hover:bg-[var(--accent-brand-hover)] transition rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>

      <p className="text-[10px] text-[var(--text-muted)] mt-3">
        Educational analysis only — not personalized financial advice.
      </p>
    </div>
  );
}