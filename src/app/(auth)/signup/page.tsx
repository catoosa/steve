"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, orgName }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    setConfirmed(true);
    setLoading(false);
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Check your email</h1>
          <p className="text-white/60 mb-2">
            We've sent a confirmation link to
          </p>
          <p className="text-white font-semibold mb-6">{email}</p>
          <p className="text-white/40 text-sm mb-8">
            Click the link in the email to activate your account and access your dashboard. Check your spam folder if you don't see it.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full rounded-lg border border-white/20 px-4 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image src="/skawk-logo.png" alt="Skawk" width={120} height={40} className="h-10 w-auto mx-auto" />
          </Link>
          <p className="text-white/60 mt-3">Create your account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xl">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Acme Research"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Min. 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-all glow-orange"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-white/50 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
