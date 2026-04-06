"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Not logged in");
      setLoading(false);
      return;
    }

    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `org-${Date.now()}`;

    const { error: orgError } = await supabase.from("organizations").insert({
      name: orgName,
      slug,
      owner_id: user.id,
    });

    if (orgError) {
      setError(orgError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/skawk-logo.png" alt="Skawk" width={120} height={40} className="h-10 w-auto mx-auto" />
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">Welcome to Skawk</h1>
          <p className="text-white/60 text-sm">Set up your organization to get started.</p>
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
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Acme Inc."
            />
            <p className="text-xs text-muted-foreground mt-1.5">Your company or team name.</p>
          </div>
          <button
            type="submit"
            disabled={loading || !orgName.trim()}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-all glow-orange"
          >
            {loading ? "Creating..." : "Get Started"}
          </button>
        </form>
      </div>
    </div>
  );
}
