"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border-b border-indigo-500/20">
      <div className="container mx-auto flex flex-wrap px-6 py-4 flex-col md:flex-row items-center">
        <Link href="/" className="flex items-center text-white mb-4 md:mb-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            className="w-9 h-9 text-emerald-400 p-1.5 bg-emerald-500/10 rounded-lg"
            viewBox="0 0 24 24"
          >
            <path d="M3 3v18h18M7 14l4-4 3 3 5-6" />
          </svg>
          <span className="ml-3 text-xl font-bold tracking-tight">
            AI Stock <span className="text-emerald-400">Predictor</span>
          </span>
        </Link>
                <nav className="md:ml-auto flex flex-wrap items-center text-base justify-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-md hover:bg-white/10 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/assistant"
            className="px-3 py-1.5 rounded-md hover:bg-white/10 transition"
          >
            AI Analyst
          </Link>
          <button
            onClick={handleLogout}
            className="ml-3 inline-flex items-center bg-white/10 border border-white/10 py-1.5 px-4 rounded-md text-sm hover:bg-white/20 transition"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;