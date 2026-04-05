"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
  Download,
  Bot,
  GitBranch,
  Wrench,
  Mic,
  Shield,
} from "lucide-react";

interface ImportResult {
  personas: number;
  pathways: number;
  tools: number;
  voices: number;
  guard_rails: number;
}

export default function MigratePage() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "scanning" | "preview" | "importing" | "done">("input");
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  async function scan() {
    if (!apiKey.trim()) return;
    setError("");
    setStep("scanning");
    setLoading(true);

    try {
      const res = await fetch("/api/migrate/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bland_api_key: apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to scan");
      setPreview(data);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Bland API");
      setStep("input");
    } finally {
      setLoading(false);
    }
  }

  async function doImport() {
    setStep("importing");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/migrate/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bland_api_key: apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setPreview(data);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("preview");
    } finally {
      setLoading(false);
    }
  }

  const items = [
    { icon: Bot, label: "Personas", count: preview?.personas ?? 0 },
    { icon: GitBranch, label: "Pathways", count: preview?.pathways ?? 0 },
    { icon: Wrench, label: "Tools", count: preview?.tools ?? 0 },
    { icon: Mic, label: "Voices", count: preview?.voices ?? 0 },
    { icon: Shield, label: "Guard Rails", count: preview?.guard_rails ?? 0 },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Download className="w-6 h-6 text-primary" />
          Migrate from Bland.ai
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Import your existing Bland AI personas, pathways, tools, and voices. Zero switching cost.
        </p>
      </div>

      {/* Step 1: Input API Key */}
      {(step === "input" || step === "scanning") && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">Enter your Bland API key</h2>
          <p className="text-sm text-muted-foreground mb-4">
            We&apos;ll scan your Bland account and show you what can be imported. Your key is used for this scan only and is never stored.
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
          />
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 mb-4">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <button
            onClick={scan}
            disabled={loading || !apiKey.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {loading ? "Scanning your Bland account..." : "Scan Account"}
          </button>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && preview && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">Ready to import</h2>
          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-3 py-2">
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm flex-1">{item.label}</span>
                <span className={`text-sm font-bold ${item.count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 mb-4">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={doImport}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {loading ? "Importing..." : "Import Everything"}
            </button>
            <button
              onClick={() => { setStep("input"); setPreview(null); }}
              className="rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === "done" && (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Migration complete</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Everything has been imported into your Skawk account.
          </p>
          <div className="grid grid-cols-5 gap-3 mb-6">
            {items.map((item) => (
              <div key={item.label} className="text-center">
                <item.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{item.count}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
          <a
            href="/dashboard/personas"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
          >
            View Imported Assets <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}
