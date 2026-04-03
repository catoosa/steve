"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

export default function NewVoicePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Voice name is required");
      return;
    }
    if (!audioUrl.trim()) {
      setError("Audio URL is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          audioUrl: audioUrl.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to clone voice");
      }

      router.push("/dashboard/voices");
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
          href="/dashboard/voices"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-card transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Clone Voice</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a custom voice from an audio recording.
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
            htmlFor="voice-name"
            className="block text-sm font-medium mb-1.5"
          >
            Voice Name
          </label>
          <input
            id="voice-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah, Executive Voice, Support Agent"
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div>
          <label
            htmlFor="voice-audio-url"
            className="block text-sm font-medium mb-1.5"
          >
            Audio URL
          </label>
          <input
            id="voice-audio-url"
            type="url"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="https://example.com/recording.wav"
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Provide a URL to an audio file (WAV or MP3). Minimum 30 seconds of
            clear speech for best results.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {submitting ? "Cloning..." : "Clone Voice"}
          </button>
          <Link
            href="/dashboard/voices"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-card transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
