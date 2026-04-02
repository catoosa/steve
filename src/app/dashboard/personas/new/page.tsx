"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

interface Voice {
  voice_id?: string;
  id?: string;
  name?: string;
  language?: string;
  is_custom?: boolean;
}

const LANGUAGES = [
  { code: "en-AU", label: "English (Australia)" },
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "ko", label: "Korean" },
  { code: "pt", label: "Portuguese" },
  { code: "it", label: "Italian" },
  { code: "nl", label: "Dutch" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
];

export default function NewPersonaPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [voice, setVoice] = useState("");
  const [language, setLanguage] = useState("en-AU");
  const [description, setDescription] = useState("");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVoices() {
      try {
        const res = await fetch("/api/voices");
        if (!res.ok) throw new Error("Failed to load voices");
        const data = await res.json();
        // Bland returns { voices: [...] } or an array
        const list = Array.isArray(data) ? data : data?.voices ?? [];
        setVoices(list);
        if (list.length > 0 && !voice) {
          setVoice(String(list[0].voice_id || list[0].id || list[0].name || ""));
        }
      } catch {
        setVoices([]);
      } finally {
        setLoadingVoices(false);
      }
    }
    fetchVoices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          voice: voice || undefined,
          language,
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create persona");
      }

      router.push("/dashboard/personas");
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
          href="/dashboard/personas"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-card transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Persona</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define an AI personality with a specific voice and style.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label
            htmlFor="persona-name"
            className="block text-sm font-medium mb-1.5"
          >
            Name
          </label>
          <input
            id="persona-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Steve, Sales Agent, Support Bot"
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        {/* Voice */}
        <div>
          <label
            htmlFor="persona-voice"
            className="block text-sm font-medium mb-1.5"
          >
            Voice
          </label>
          {loadingVoices ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2.5">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading voices...
            </div>
          ) : voices.length > 0 ? (
            <select
              id="persona-voice"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {voices.map((v) => {
                const vid = String(v.voice_id || v.id || v.name || "");
                const vname = String(v.name || vid);
                return (
                  <option key={vid} value={vid}>
                    {vname}
                    {v.is_custom ? " (custom)" : ""}
                  </option>
                );
              })}
            </select>
          ) : (
            <input
              id="persona-voice"
              type="text"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              placeholder="e.g. mason, nat, josh"
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}
          <p className="text-xs text-muted-foreground mt-1">
            The voice the AI agent will use on calls.
          </p>
        </div>

        {/* Language */}
        <div>
          <label
            htmlFor="persona-language"
            className="block text-sm font-medium mb-1.5"
          >
            Language
          </label>
          <select
            id="persona-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label} ({l.code})
              </option>
            ))}
          </select>
        </div>

        {/* Description / Personality */}
        <div>
          <label
            htmlFor="persona-description"
            className="block text-sm font-medium mb-1.5"
          >
            Description / Personality
          </label>
          <textarea
            id="persona-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe the persona's personality, tone, and purpose. E.g. 'Friendly Australian bloke who handles survey calls with a casual, warm tone.'"
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          />
        </div>

        {/* Actions */}
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
            {submitting ? "Creating..." : "Create Persona"}
          </button>
          <Link
            href="/dashboard/personas"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-card transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
