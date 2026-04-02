"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

interface GuardRailRule {
  description: string;
  action: string;
}

interface PresetCardProps {
  title: string;
  flag: string;
  subtitle: string;
  rules: string[];
  guardRails: GuardRailRule[];
}

export function PresetCard({
  title,
  flag,
  subtitle,
  rules,
  guardRails,
}: PresetCardProps) {
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  async function handleApply() {
    setLoading(true);
    setError("");
    try {
      for (const rule of guardRails) {
        const res = await fetch("/api/guard-rails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rule),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create guard rail");
        }
      }
      setApplied(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background border border-border rounded-xl p-6 flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{flag}</span>
          <h3 className="font-semibold text-base">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <ul className="space-y-1.5">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
            {rule}
          </li>
        ))}
      </ul>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleApply}
        disabled={loading || applied}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
          applied
            ? "bg-green-500/10 text-green-600 cursor-default"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Applying...
          </>
        ) : applied ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Applied
          </>
        ) : (
          "Apply Preset"
        )}
      </button>
    </div>
  );
}
