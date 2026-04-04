"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Workflow = {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  enabled: boolean;
  created_at: string;
  workflow_steps: { id: string }[];
};

const TRIGGER_BADGES: Record<string, { label: string; className: string }> = {
  call_completed: {
    label: "Call Completed",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  call_no_answer: {
    label: "No Answer",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  call_voicemail: {
    label: "Voicemail",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
};

export default function WorkflowsList({
  workflows: initial,
}: {
  workflows: Workflow[];
}) {
  const [workflows, setWorkflows] = useState(initial);
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = workflows.filter(
    (w) => !search || w.name.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleEnabled(workflow: Workflow) {
    setTogglingId(workflow.id);
    const supabase = createClient();
    const newEnabled = !workflow.enabled;
    const { error } = await supabase
      .from("workflows")
      .update({ enabled: newEnabled })
      .eq("id", workflow.id);

    if (!error) {
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === workflow.id ? { ...w, enabled: newEnabled } : w
        )
      );
    }
    setTogglingId(null);
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
        />
      </div>

      <div className="bg-background border border-border rounded-xl divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Zap className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              {search
                ? "No workflows match your search."
                : "No workflows yet."}
            </p>
          </div>
        ) : (
          filtered.map((w) => {
            const badge = TRIGGER_BADGES[w.trigger_type] ?? {
              label: w.trigger_type,
              className: "bg-muted text-muted-foreground border-border",
            };
            const stepCount = w.workflow_steps?.length ?? 0;

            return (
              <div
                key={w.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
              >
                <Link
                  href={`/dashboard/workflows/${w.id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium truncate">{w.name}</span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  {w.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {w.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>
                      {stepCount} step{stepCount !== 1 ? "s" : ""}
                    </span>
                    <span>
                      Created{" "}
                      {new Date(w.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={() => toggleEnabled(w)}
                  disabled={togglingId === w.id}
                  className={`relative ml-4 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-50 ${
                    w.enabled ? "bg-primary" : "bg-muted"
                  }`}
                  aria-label={w.enabled ? "Disable workflow" : "Enable workflow"}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      w.enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
