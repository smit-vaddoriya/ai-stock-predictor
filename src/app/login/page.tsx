"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to login.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex flex-col justify-center items-center px-6 bg-[var(--bg-primary)]">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-1">Welcome back</h2>
        <p className="text-center text-sm text-[var(--text-muted)] mb-8">
          Log in to view your watchlist and forecasts.
        </p>

        {error && (
          <div className="mb-5 text-sm text-[var(--accent-loss)] bg-[var(--accent-loss)]/10 border border-[var(--accent-loss)]/30 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-6">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent-brand)] hover:bg-[var(--accent-brand-hover)] transition rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[var(--accent-brand-hover)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}