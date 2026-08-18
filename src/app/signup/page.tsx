"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to sign up.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 1200);
      }
    } catch {
      setError("Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex flex-col justify-center items-center px-6 bg-[var(--bg-primary)]">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-1">Create your account</h2>
        <p className="text-center text-sm text-[var(--text-muted)] mb-8">
          Start tracking tickers and forecasts for free.
        </p>

        {error && (
          <div className="mb-5 text-sm text-[var(--accent-loss)] bg-[var(--accent-loss)]/10 border border-[var(--accent-loss)]/30 rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 text-sm text-[var(--accent-gain)] bg-[var(--accent-gain)]/10 border border-[var(--accent-gain)]/30 rounded-lg px-4 py-3">
            Account created! Redirecting to login…
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]"
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">At least 6 characters.</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent-brand)] hover:bg-[var(--accent-brand-hover)] transition rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent-brand-hover)] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}