"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus } from "lucide-react";
import { DeleteGuardRailButton } from "./delete-button";

interface GuardRail {
  id: string;
  description: string;
  action: string;
}

function ActionBadge({ action }: { action: string }) {
  if (action === "block") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive">
        block
      </span>
    );
  }
  if (action === "warn") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
        warn
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
      {action}
    </span>
  );
}

export function GuardRailsManager() {
  const [guardRails, setGuardRails] = useState<GuardRail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [description, setDescription] = useState("");
  const [action, setAction] = useState("block");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchGuardRails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/guard-rails");
      if (!res.ok) throw new Error("Failed to load guard rails");
      const data = await res.json();
      // Bland API may return array directly or wrapped
      const list = Array.isArray(data) ? data : data?.guard_rails || data?.data || [];
      setGuardRails(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuardRails();
  }, [fetchGuardRails]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/guard-rails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create guard rail");
      }
      setDescription("");
      setAction("block");
      await fetchGuardRails();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background border border-border rounded-xl p-6 space-y-4">
      <h2 className="font-semibold">Custom Guard Rails</h2>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading guard rails...
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : guardRails.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No guard rails yet. Apply a preset above or add one below.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {guardRails.map((gr) => (
            <div
              key={gr.id}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" title={gr.description}>
                  {gr.description}
                </p>
              </div>
              <ActionBadge action={gr.action} />
              <DeleteGuardRailButton id={gr.id} />
            </div>
          ))}
        </div>
      )}

      {/* Add new guard rail form */}
      <form onSubmit={handleAdd} className="pt-2 border-t border-border space-y-3">
        <h3 className="text-sm font-medium">Add Guard Rail</h3>
        {formError && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}
        <div>
          <label className="block text-xs font-medium mb-1 text-muted-foreground">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="e.g. Always identify yourself as an AI assistant"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">
              Action
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="warn">warn</option>
              <option value="block">block</option>
              <option value="transfer">transfer</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting || !description.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
