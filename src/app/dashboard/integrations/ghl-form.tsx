"use client";

import { useState } from "react";
import { Save, Copy, Check, Eye, EyeOff } from "lucide-react";

interface GHLFormProps {
  initialApiKey: string;
  initialLocationId: string;
  initialEnabled: boolean;
}

const TRIGGER_URL = "https://skawk.io/api/integrations/ghl/trigger";

export default function GHLForm({
  initialApiKey,
  initialLocationId,
  initialEnabled,
}: GHLFormProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [locationId, setLocationId] = useState(initialLocationId);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Show the info block if we have a location id saved (means it was previously connected)
  const [showInfo, setShowInfo] = useState(!!(initialLocationId));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch("/api/integrations/ghl", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          location_id: locationId,
          enabled,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error ?? "Failed to save");
      } else {
        setSaved(true);
        setShowInfo(true);
        // Update api key display with masked value from server
        if (json.org?.ghl_api_key) {
          setApiKey(json.org.ghl_api_key);
        }
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(TRIGGER_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSave} className="space-y-4">
        {/* API Key */}
        <div>
          <label className="block text-sm font-medium mb-1">GHL API Key</label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your GHL API key"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Get your API key from GHL &rarr; Settings &rarr; Integrations &rarr; API Keys
          </p>
        </div>

        {/* Location ID */}
        <div>
          <label className="block text-sm font-medium mb-1">Location ID</label>
          <input
            type="text"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            placeholder="e.g. ve9EPM428h8vShlRW1KT"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Found in GHL &rarr; Settings &rarr; Business Info &rarr; Location ID
          </p>
        </div>

        {/* Enable sync toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              enabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-sm font-medium">Enable GHL sync</span>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Integration"}
        </button>
      </form>

      {/* Info block — shown after save or if already connected */}
      {showInfo && (
        <div className="space-y-4 pt-2 border-t border-border">
          {/* Inbound trigger URL */}
          <div>
            <p className="text-sm font-medium mb-1">Inbound trigger URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted rounded-lg px-4 py-2.5 text-xs font-mono break-all">
                {TRIGGER_URL}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                title="Copy trigger URL"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Add this as a webhook in your GHL workflow to trigger Skawk
              campaigns or single AI calls
            </p>
          </div>

          {/* Outbound info */}
          <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Outbound webhook: </span>
            Skawk automatically pushes call results to GHL contacts as notes
            after each call completes.
          </div>
        </div>
      )}
    </div>
  );
}
