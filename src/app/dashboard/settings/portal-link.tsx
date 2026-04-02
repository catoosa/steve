"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type Props = {
  orgId: string;
  apiKey: string;
};

export default function PortalLink({ orgId, apiKey }: Props) {
  const [copied, setCopied] = useState(false);

  const portalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/portal?org_id=${encodeURIComponent(orgId)}&key=${encodeURIComponent(apiKey)}`
      : `/portal?org_id=${encodeURIComponent(orgId)}&key=${encodeURIComponent(apiKey)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select input text
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 bg-muted rounded-lg px-4 py-2.5 text-xs font-mono break-all">
        {portalUrl}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        title="Copy portal URL"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-500" />
            Copied
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}
