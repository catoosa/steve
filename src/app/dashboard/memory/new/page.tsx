"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewMemoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [label, setLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [context, setContext] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = {};
      if (label) body.label = label;
      if (phone) body.phone_number = phone;
      if (context) body.context = context;

      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create memory");
      }

      router.push("/dashboard/memory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <Link
        href="/dashboard/memory"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Memory
      </Link>

      <h1 className="text-2xl font-bold mb-6">Create Memory Entry</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-background border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Label / Name
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Premium customer memory"
            />
            <p className="text-xs text-muted-foreground mt-1">
              A human-readable name to identify this memory entry.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phone Number (optional)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="+61412345678"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Associate this memory with a specific caller&apos;s phone number.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Context
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="This caller is a premium customer who prefers callbacks in the morning. They previously expressed interest in the enterprise plan."
            />
            <p className="text-xs text-muted-foreground mt-1">
              What should the agent remember? This context is injected into calls using this memory entry.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </span>
          ) : (
            "Create Memory"
          )}
        </button>
      </form>
    </div>
  );
}
