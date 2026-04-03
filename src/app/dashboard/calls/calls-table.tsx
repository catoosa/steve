"use client";

import { useState } from "react";
import { Sparkles, Loader2, Search } from "lucide-react";
import Link from "next/link";

const EMOTION_COLORS: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  happy: "bg-success/10 text-success",
  angry: "bg-destructive/10 text-destructive",
  sad: "bg-blue-100 text-blue-600",
  fear: "bg-yellow-100 text-yellow-600",
};

const DISPOSITION_COLORS: Record<string, string> = {
  interested: "bg-success/10 text-success",
  not_interested: "bg-destructive/10 text-destructive",
  follow_up: "bg-amber-500/10 text-amber-500",
  do_not_call: "bg-destructive/10 text-destructive",
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "no_answer", label: "No Answer" },
  { value: "in-progress", label: "In Progress" },
];

function toTitleCase(str: string) {
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function DispositionBadge({ disposition }: { disposition: string }) {
  const key = disposition.toLowerCase();
  const colors = DISPOSITION_COLORS[key] || "bg-muted text-muted-foreground";
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors}`}>
      {toTitleCase(disposition)}
    </span>
  );
}

function EmotionCell({
  callId,
  initialEmotion,
}: {
  callId: string;
  initialEmotion: string | null;
}) {
  const [emotion, setEmotion] = useState<string | null>(initialEmotion);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    try {
      const res = await fetch(`/api/calls/${callId}/emotion`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        const primary =
          data.emotion?.primary_emotion ?? data.emotion?.emotion ?? "neutral";
        setEmotion(primary);
        window.location.reload();
      } else {
        console.error("Failed to analyze emotion");
      }
    } catch {
      console.error("Failed to analyze emotion");
    }
    setLoading(false);
  }

  if (emotion) {
    const key = emotion.toLowerCase();
    const colors = EMOTION_COLORS[key] || EMOTION_COLORS.neutral;
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors}`}>
        {emotion}
      </span>
    );
  }

  return (
    <button
      onClick={handleAnalyze}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Sparkles className="w-3 h-3" />
      )}
      {loading ? "Analyzing…" : "Analyze"}
    </button>
  );
}

type Call = {
  id: string;
  phone: string;
  status: string;
  answered_by: string | null;
  duration_seconds: number | null;
  created_at: string;
  analysis: Record<string, unknown> | null;
  campaigns: Record<string, unknown> | null;
};

export function CallsTable({ calls }: { calls: Call[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = calls.filter((call) => {
    const matchesSearch =
      !search || call.phone.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || call.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-b border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by phone number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm bg-muted/50 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-6 py-3 font-medium">Phone</th>
              <th className="px-6 py-3 font-medium">Campaign</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Disposition</th>
              <th className="px-6 py-3 font-medium">Answered By</th>
              <th className="px-6 py-3 font-medium">Duration</th>
              <th className="px-6 py-3 font-medium">Emotion</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium sr-only">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground text-sm">
                  No calls match your search.
                </td>
              </tr>
            ) : (
              filtered.map((call) => {
                const disposition = call.analysis?.disposition as string | null | undefined;
                const emotionObj = call.analysis?.emotion as Record<string, unknown> | null | undefined;
                const emotionStr = emotionObj
                  ? ((emotionObj.primary_emotion ?? emotionObj.emotion) as string) ?? "neutral"
                  : null;

                return (
                  <tr key={call.id} className="hover:bg-muted/50">
                    <td className="px-6 py-3 font-medium">
                      <Link
                        href={`/dashboard/calls/${call.id}`}
                        className="hover:text-primary hover:underline transition-colors"
                      >
                        {call.phone}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {call.campaigns?.name as string ?? "—"}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          call.status === "completed"
                            ? "bg-success/10 text-success"
                            : call.status === "failed" || call.status === "no_answer"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {call.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {disposition ? (
                        <DispositionBadge disposition={disposition} />
                      ) : null}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {call.answered_by || "—"}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {call.duration_seconds ? `${call.duration_seconds}s` : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <EmotionCell callId={call.id} initialEmotion={emotionStr} />
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {new Date(call.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/dashboard/calls/${call.id}`}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
