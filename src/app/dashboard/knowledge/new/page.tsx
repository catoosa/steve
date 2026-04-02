"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

export default function NewKnowledgeBasePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create knowledge base");
      }

      const data = await res.json();
      const kbId = data.id || data.knowledge_base_id;

      if (kbId) {
        router.push(`/dashboard/knowledge/${kbId}`);
      } else {
        router.push("/dashboard/knowledge");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard/knowledge"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-card transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a knowledge base to store documents your AI agents can
            reference.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="kb-name"
            className="block text-sm font-medium mb-1.5"
          >
            Name
          </label>
          <input
            id="kb-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Product FAQ, Company Policies, Sales Scripts"
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div>
          <label
            htmlFor="kb-description"
            className="block text-sm font-medium mb-1.5"
          >
            Description
          </label>
          <textarea
            id="kb-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe what this knowledge base contains and how agents should use it."
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {submitting ? "Creating..." : "Create Knowledge Base"}
          </button>
          <Link
            href="/dashboard/knowledge"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-card transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
