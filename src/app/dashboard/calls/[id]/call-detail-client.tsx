"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

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

function toTitleCase(str: string) {
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = {
  callId: string;
  initialEmotion: string | null;
  disposition: string | null;
  summary: string | null;
  keyPoints: string[] | null;
};

export function CallDetailClient({
  callId,
  initialEmotion,
  disposition,
  summary,
  keyPoints,
}: Props) {
  const [emotion, setEmotion] = useState<string | null>(initialEmotion);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calls/${callId}/emotion`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        const primary =
          data.emotion?.primary_emotion ?? data.emotion?.emotion ?? "neutral";
        setEmotion(primary);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to analyze emotion");
      }
    } catch {
      setError("Failed to analyze emotion");
    }
    setLoading(false);
  }

  const hasAnyAnalysis = emotion || disposition || summary || (keyPoints && keyPoints.length > 0);

  return (
    <div className="space-y-4">
      {/* Emotion */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground w-28 shrink-0">Emotion</span>
        {emotion ? (
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              EMOTION_COLORS[emotion.toLowerCase()] ?? EMOTION_COLORS.neutral
            }`}
          >
            {toTitleCase(emotion)}
          </span>
        ) : (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {loading ? "Analyzing…" : "Analyze Emotion"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Disposition */}
      {disposition && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-28 shrink-0">Disposition</span>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              DISPOSITION_COLORS[disposition.toLowerCase()] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {toTitleCase(disposition)}
          </span>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="flex gap-3">
          <span className="text-sm text-muted-foreground w-28 shrink-0 pt-0.5">Summary</span>
          <p className="text-sm">{summary}</p>
        </div>
      )}

      {/* Key Points */}
      {keyPoints && keyPoints.length > 0 && (
        <div className="flex gap-3">
          <span className="text-sm text-muted-foreground w-28 shrink-0 pt-0.5">Key Points</span>
          <ul className="list-disc list-inside text-sm space-y-1">
            {keyPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {!hasAnyAnalysis && !loading && (
        <p className="text-sm text-muted-foreground">
          No analysis available yet. Use the button above to analyze emotion from the recording.
        </p>
      )}
    </div>
  );
}
