"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  CheckCircle2,
  XCircle,
  Pencil,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function QuoteActions({
  quoteId,
  status,
  phone,
}: {
  quoteId: string;
  status: string;
  phone: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(newStatus: string) {
    setLoading(newStatus);
    try {
      const supabase = createClient();
      const updates: Record<string, unknown> = { status: newStatus };
      if (newStatus === "sent") updates.sent_at = new Date().toISOString();
      if (newStatus === "accepted")
        updates.accepted_at = new Date().toISOString();
      if (newStatus === "declined")
        updates.declined_at = new Date().toISOString();

      await supabase.from("quotes").update(updates).eq("id", quoteId);

      // If sending/resending, also trigger SMS
      if (
        (newStatus === "sent") &&
        phone
      ) {
        try {
          await fetch(`/api/v1/quotes/${quoteId}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone }),
          });
        } catch {
          // SMS may fail but status is updated
        }
      }

      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Actions
      </h2>
      <div className="space-y-2">
        {status === "draft" && (
          <>
            <Link
              href={`/dashboard/quotes/new?edit=${quoteId}`}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm border border-border rounded-xl hover:bg-muted transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit Quote
            </Link>
            <button
              onClick={() => updateStatus("sent")}
              disabled={loading !== null}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading === "sent" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Quote
            </button>
          </>
        )}

        {(status === "sent" || status === "viewed") && (
          <>
            <button
              onClick={() => updateStatus("sent")}
              disabled={loading !== null}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
            >
              {loading === "sent" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Resend
            </button>
            <button
              onClick={() => updateStatus("accepted")}
              disabled={loading !== null}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm bg-green-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading === "accepted" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Mark Accepted
            </button>
            <button
              onClick={() => updateStatus("declined")}
              disabled={loading !== null}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {loading === "declined" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Mark Declined
            </button>
          </>
        )}

        {status === "accepted" && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Quote accepted. Jobs feature coming soon.
          </p>
        )}

        {status === "declined" && (
          <p className="text-sm text-muted-foreground text-center py-2">
            This quote was declined.
          </p>
        )}

        {status === "expired" && (
          <p className="text-sm text-muted-foreground text-center py-2">
            This quote has expired.
          </p>
        )}
      </div>
    </div>
  );
}
