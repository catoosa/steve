"use client";

import { useState, useEffect } from "react";
import { Settings, Save, ExternalLink, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PortalLink from "./portal-link";

export default function SettingsPage() {
  const [orgName, setOrgName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [apiKey, setApiKey] = useState("");

  // Custom domain state
  const [customDomain, setCustomDomain] = useState("");
  const [savedCustomDomain, setSavedCustomDomain] = useState<string | null>(null);
  const [savingDomain, setSavingDomain] = useState(false);
  const [domainSaved, setDomainSaved] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [subdomainCopied, setSubdomainCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: membership } = await supabase
        .from("org_members")
        .select("org_id, organizations(id, name, slug, webhook_url, api_key, custom_domain)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      const org = membership?.organizations as unknown as Record<string, unknown> | null;
      if (org) {
        setOrgId(org.id as string);
        setOrgName((org.name as string) || "");
        setOrgSlug((org.slug as string) || "");
        setWebhookUrl((org.webhook_url as string) || "");
        setApiKey((org.api_key as string) || "");
        const cd = (org.custom_domain as string | null) ?? null;
        setSavedCustomDomain(cd);
        setCustomDomain(cd ?? "");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    await supabase
      .from("organizations")
      .update({ name: orgName, webhook_url: webhookUrl || null })
      .eq("id", orgId);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleSaveDomain(e: React.FormEvent) {
    e.preventDefault();
    setSavingDomain(true);
    setDomainSaved(false);
    setDomainError(null);

    const res = await fetch("/api/settings/custom-domain", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custom_domain: customDomain.trim() || null }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setDomainError(json.error ?? "Failed to save domain");
    } else {
      const cd = json.org?.custom_domain ?? null;
      setSavedCustomDomain(cd);
      setCustomDomain(cd ?? "");
      setDomainSaved(true);
      setTimeout(() => setDomainSaved(false), 3000);
    }

    setSavingDomain(false);
  }

  async function handleCopySubdomain() {
    const url = `https://${orgSlug}.skawk.io`;
    try {
      await navigator.clipboard.writeText(url);
      setSubdomainCopied(true);
      setTimeout(() => setSubdomainCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  const subdomainUrl = orgSlug ? `https://${orgSlug}.skawk.io` : null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-background border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Organization</h2>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Webhook URL (optional)
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="https://your-app.com/api/skawk-webhook"
            />
            <p className="text-xs text-muted-foreground mt-1">
              We&apos;ll POST call results to this URL when calls complete.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
      </form>

      {/* Client Portal */}
      <div className="bg-background border border-border rounded-xl p-6 space-y-4 mt-8">
        <div className="flex items-center gap-3 mb-2">
          <ExternalLink className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Client Portal</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Share this link with clients to give them read-only access to their
          campaign results. No login required — the link includes a secure key.
        </p>
        {orgId && apiKey ? (
          <PortalLink orgId={orgId} apiKey={apiKey} />
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Loading portal link…
          </p>
        )}
      </div>

      {/* Branded Portal */}
      <div className="bg-background border border-border rounded-xl p-6 space-y-4 mt-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Branded Portal</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Access your client portal via a branded subdomain or your own custom domain.
        </p>

        {/* Subdomain URL */}
        {subdomainUrl && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Your subdomain
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted rounded-lg px-4 py-2.5 text-xs font-mono break-all">
                {subdomainUrl}
              </code>
              <button
                type="button"
                onClick={handleCopySubdomain}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                title="Copy subdomain URL"
              >
                {subdomainCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your subdomain ({orgSlug}.skawk.io) works immediately with no setup needed.
            </p>
          </div>
        )}

        {/* Custom domain */}
        <form onSubmit={handleSaveDomain} className="space-y-3 pt-2">
          <div>
            <label className="block text-sm font-medium mb-1">
              Custom domain (optional)
            </label>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => {
                setCustomDomain(e.target.value);
                setDomainError(null);
              }}
              placeholder="portal.yourclient.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {domainError && (
              <p className="text-xs text-red-500 mt-1">{domainError}</p>
            )}
            {savedCustomDomain && !domainError && (
              <p className="text-xs text-green-600 mt-1">
                Active: {savedCustomDomain}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={savingDomain}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingDomain ? "Saving..." : domainSaved ? "Saved!" : "Save Domain"}
          </button>
        </form>

        {/* DNS instructions */}
        <details className="pt-2">
          <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground select-none">
            DNS setup instructions
          </summary>
          <div className="mt-3 rounded-lg bg-muted p-4 text-sm space-y-2">
            <p className="font-medium text-foreground">To use a custom domain:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
              <li>
                Add a CNAME record in your DNS:
                <code className="ml-1 bg-background rounded px-1.5 py-0.5 text-xs font-mono">
                  portal.yourclient.com → cname.vercel-dns.com
                </code>
              </li>
              <li>
                Add the domain in your Vercel project: Settings → Domains → Add
              </li>
              <li>Enter your domain above and save.</li>
            </ol>
          </div>
        </details>
      </div>
    </div>
  );
}
