"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, XCircle, CheckCircle2, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Job = {
  id: string;
  status: string;
  [key: string]: unknown;
};

export function JobDetailClient({ job }: { job: Job }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    const supabase = createClient();
    const updates: Record<string, unknown> = { status: newStatus };

    if (newStatus === "in_progress") {
      updates.actual_start = new Date().toISOString();
    }
    if (newStatus === "completed") {
      updates.actual_end = new Date().toISOString();
    }

    const { error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", job.id);

    if (!error) {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="font-semibold mb-4">Actions</h2>
      <div className="space-y-2">
        {job.status === "booked" && (
          <>
            <button
              onClick={() => updateStatus("in_progress")}
              disabled={loading}
              className="flex items-center gap-2 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Start Job
            </button>
            <button
              onClick={() => updateStatus("cancelled")}
              disabled={loading}
              className="flex items-center gap-2 w-full rounded-xl border border-destructive/30 text-destructive px-4 py-2.5 text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 transition-all"
            >
              <XCircle className="w-4 h-4" />
              Cancel Job
            </button>
          </>
        )}

        {job.status === "in_progress" && (
          <button
            onClick={() => updateStatus("completed")}
            disabled={loading}
            className="flex items-center gap-2 w-full rounded-xl bg-success px-4 py-2.5 text-sm font-bold text-white hover:bg-success/90 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Complete Job
          </button>
        )}

        {job.status === "completed" && (
          <button
            onClick={() => updateStatus("invoiced")}
            disabled={loading}
            className="flex items-center gap-2 w-full rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-600 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Receipt className="w-4 h-4" />
            )}
            Mark Invoiced
          </button>
        )}

        {(job.status === "invoiced" || job.status === "cancelled") && (
          <p className="text-sm text-muted-foreground text-center py-2">
            This job is {job.status}. No further actions available.
          </p>
        )}
      </div>
    </div>
  );
}
