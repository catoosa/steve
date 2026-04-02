"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EMOTION_COLORS: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  happy: "bg-success/10 text-success",
  angry: "bg-destructive/10 text-destructive",
  sad: "bg-blue-100 text-blue-600",
  fear: "bg-yellow-100 text-yellow-600",
};

export function AnalyzeEmotionButton({
  callId,
  existingEmotion,
}: {
  callId: string;
  existingEmotion?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState<string | null>(existingEmotion ?? null);
  const router = useRouter();

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
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to analyze emotion");
      }
    } catch {
      alert("Failed to analyze emotion");
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
      className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
    >
      {loading ? "Analyzing..." : "Analyze"}
    </button>
  );
}
