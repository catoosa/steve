"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  XCircle,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Escalation = {
  id: string;
  priority: string;
  reason: string | null;
  status: string;
  created_at: string;
  campaign_id: string | null;
  contact_id: string | null;
  contacts: { name: string | null; phone: string }[] | { name: string | null; phone: string } | null;
  campaigns: { name: string }[] | { name: string } | null;
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500 border border-red-500/20",
  high: "bg-orange-500/10 text-orange-500 border border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
  low: "bg-muted text-muted-foreground border border-border",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-red-500/10 text-red-500",
  acknowledged: "bg-yellow-500/10 text-yellow-500",
  resolved: "bg-success/10 text-success",
  dismissed: "bg-muted text-muted-foreground",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function EscalationsList({
  escalations,
}: {
  escalations: Escalation[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function updateStatus(
    id: string,
    status: string,
    extra?: Record<string, unknown>
  ) {
    setLoadingId(id);
    try {
      const supabase = createClient();
      await supabase
        .from("escalations")
        .update({ status, ...extra })
        .eq("id", id);
      router.refresh();
    } catch {
      // Silently fail - page will refresh anyway
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {escalations.map((esc) => {
        const rawContact = esc.contacts;
        const contact = Array.isArray(rawContact)
          ? rawContact[0] ?? null
          : rawContact;
        const rawCampaign = esc.campaigns;
        const campaign = Array.isArray(rawCampaign)
          ? rawCampaign[0] ?? null
          : rawCampaign;
        const isActionable =
          esc.status === "open" || esc.status === "acknowledged";
        const isLoading = loadingId === esc.id;

        return (
          <div
            key={esc.id}
            className="bg-background border border-border rounded-xl p-5 space-y-3"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    PRIORITY_STYLES[esc.priority] || PRIORITY_STYLES.low
                  }`}
                >
                  {esc.priority}
                </span>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    STATUS_STYLES[esc.status] || STATUS_STYLES.open
                  }`}
                >
                  {esc.status}
                </span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {timeAgo(esc.created_at)}
              </span>
            </div>

            {/* Contact + Campaign info */}
            <div>
              <p className="font-medium">
                {contact?.name || "Unknown contact"}
              </p>
              <p className="text-sm text-muted-foreground font-mono">
                {contact?.phone || "--"}
              </p>
              {campaign && (
                <p className="text-xs text-muted-foreground mt-1">
                  Campaign: {campaign.name}
                </p>
              )}
            </div>

            {/* Reason */}
            {esc.reason && (
              <p className="text-sm text-muted-foreground border-l-2 border-border pl-3">
                {esc.reason}
              </p>
            )}

            {/* Action buttons */}
            {isActionable && (
              <div className="flex items-center gap-2 pt-1">
                {esc.status === "open" && (
                  <button
                    onClick={() => updateStatus(esc.id, "acknowledged")}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                    Acknowledge
                  </button>
                )}
                <button
                  onClick={() =>
                    updateStatus(esc.id, "resolved", {
                      resolved_at: new Date().toISOString(),
                    })
                  }
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  Resolve
                </button>
                <button
                  onClick={() => updateStatus(esc.id, "dismissed")}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:bg-muted-foreground/20 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  Dismiss
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
