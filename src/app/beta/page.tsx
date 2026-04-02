"use client";

import { useState } from "react";
import Image from "next/image";

export default function BetaPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/beta-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      window.location.href = "/";
    } else {
      setError("Incorrect password");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end">
      <div className="w-full max-w-sm text-center">
        <Image
          src="/skawk-logo.png"
          alt="Skawk"
          width={120}
          height={40}
          className="h-10 w-auto mx-auto mb-8"
        />
        <h1 className="text-2xl font-bold text-white mb-2">Coming Soon</h1>
        <p className="text-white/50 text-sm mb-8">
          Skawk is currently in private beta. Enter your access code to continue.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            placeholder="Access code"
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition-all glow-orange"
          >
            {loading ? "Checking..." : "Enter"}
          </button>
        </form>
        <p className="text-white/30 text-xs mt-6">
          hello@skawk.io
        </p>
      </div>
    </div>
  );
}
