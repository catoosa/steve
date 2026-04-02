"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Loader2, Save } from "lucide-react";

const FALLBACK_VOICES = [
  { id: "nat", name: "Nat (Female)" },
  { id: "mason", name: "Mason (Male)" },
  { id: "evelyn", name: "Evelyn (Female)" },
  { id: "josh", name: "Josh (Male)" },
];

const LANGUAGES = [
  { code: "en-AU", label: "English (Australia)" },
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
];

interface NumberConfig {
  phone_number?: string;
  number?: string;
  task?: string;
  prompt?: string;
  voice?: string;
  language?: string;
  max_duration?: number;
  transfer_phone_number?: string;
  webhook?: string;
  webhook_url?: string;
  pathway_id?: string;
}

interface Voice {
  id?: string;
  voice_id?: string;
  name?: string;
}

export default function NumberConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [config, setConfig] = useState<NumberConfig>({});
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [prompt, setPrompt] = useState("");
  const [voice, setVoice] = useState("");
  const [language, setLanguage] = useState("en-AU");
  const [maxDuration, setMaxDuration] = useState(300);
  const [transferPhone, setTransferPhone] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [numRes, voiceRes] = await Promise.all([
          fetch(`/api/numbers/${id}`),
          fetch("/api/voices"),
        ]);

        if (numRes.ok) {
          const data = await numRes.json();
          setConfig(data);
          setPrompt(data.task || data.prompt || "");
          setVoice(data.voice || "");
          setLanguage(data.language || "en-AU");
          setMaxDuration(data.max_duration || 300);
          setTransferPhone(data.transfer_phone_number || "");
          setWebhookUrl(data.webhook || data.webhook_url || "");
        } else {
          const errData = await numRes.json();
          setError(errData.error || "Failed to load number details");
        }

        if (voiceRes.ok) {
          const vData = await voiceRes.json();
          const voiceList = Array.isArray(vData)
            ? vData
            : vData?.voices ?? [];
          if (voiceList.length > 0) {
            setVoices(voiceList);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load number config"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/numbers/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          voice,
          language,
          maxDuration,
          transferPhoneNumber: transferPhone || undefined,
          webhookUrl: webhookUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update configuration");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const phoneNumber = config.phone_number || config.number || id;
  const voiceOptions =
    voices.length > 0
      ? voices.map((v) => ({
          id: String(v.voice_id || v.id || v.name || ""),
          name: String(v.name || v.voice_id || v.id || "Unknown"),
        }))
      : FALLBACK_VOICES;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/numbers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Numbers
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center">
          <Phone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Configure Number</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {phoneNumber}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400 mb-6">
          Configuration saved successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Agent Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            placeholder="You are a helpful assistant that answers incoming calls..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            The instructions for the AI agent answering this number.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Voice</label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Default</option>
              {voiceOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Max Duration (seconds)
          </label>
          <input
            type="number"
            value={maxDuration}
            onChange={(e) => setMaxDuration(Number(e.target.value))}
            min={30}
            max={3600}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Maximum call length in seconds (30 - 3600).
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Transfer Phone Number{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <input
            type="tel"
            value={transferPhone}
            onChange={(e) => setTransferPhone(e.target.value)}
            placeholder="+61400000000"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            A phone number the AI can transfer the call to if needed.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Webhook URL{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://example.com/webhook"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Receive a POST request after each call completes.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
