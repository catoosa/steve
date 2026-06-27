"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Deal } from "./page";

const STAGES = [
  { key: "lead", label: "Lead" },
  { key: "qualified", label: "Qualified" },
  { key: "quoted", label: "Quoted" },
  { key: "booked", label: "Booked" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

const SOURCES = [
  { key: "inbound_call", label: "Inbound Call" },
  { key: "outbound_call", label: "Outbound Call" },
  { key: "manual", label: "Manual" },
  { key: "website", label: "Website" },
  { key: "referral", label: "Referral" },
];

interface LinkedQuote {
  id: string;
  quote_number: string;
  status: string;
  total_cents: number | null;
}

interface LinkedCall {
  id: string;
  phone: string;
  status: string;
  created_at: string;
}

export function DealDrawer({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(deal.title);
  const [customerName, setCustomerName] = useState(deal.customer_name ?? "");
  const [customerPhone, setCustomerPhone] = useState(deal.customer_phone ?? "");
  const [customerEmail, setCustomerEmail] = useState(deal.customer_email ?? "");
  const [stage, setStage] = useState(deal.stage);
  const [valueDollars, setValueDollars] = useState(
    deal.value_cents ? (deal.value_cents / 100).toString() : ""
  );
  const [source, setSource] = useState(deal.source ?? "manual");
  const [nextFollowUp, setNextFollowUp] = useState(deal.next_follow_up?.slice(0, 10) ?? "");
  const [notes, setNotes] = useState(deal.notes ?? "");
  const [lostReason, setLostReason] = useState(deal.lost_reason ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [linkedQuotes, setLinkedQuotes] = useState<LinkedQuote[]>([]);
  const [linkedCall, setLinkedCall] = useState<LinkedCall | null>(null);

  useEffect(() => {
    // Fetch linked quotes
    supabase
      .from("quotes")
      .select("id, quote_number, status, total_cents")
      .eq("deal_id", deal.id)
      .then(({ data }) => {
        if (data) setLinkedQuotes(data as LinkedQuote[]);
      });

    // Fetch linked call
    if (deal.call_id) {
      supabase
        .from("calls")
        .select("id, phone, status, created_at")
        .eq("id", deal.call_id)
        .single()
        .then(({ data }) => {
          if (data) setLinkedCall(data as LinkedCall);
        });
    }
  }, [deal.id, deal.call_id, supabase]);

  async function handleSave() {
    setSaving(true);
    const cents = valueDollars ? Math.round(parseFloat(valueDollars) * 100) : null;

    const updates: Record<string, unknown> = {
      title,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      customer_email: customerEmail || null,
      stage,
      value_cents: cents,
      source,
      next_follow_up: nextFollowUp || null,
      notes: notes || null,
      lost_reason: stage === "lost" ? lostReason || null : null,
    };

    if (stage === "won" && deal.stage !== "won") {
      updates.won_at = new Date().toISOString();
      updates.lost_at = null;
    } else if (stage === "lost" && deal.stage !== "lost") {
      updates.lost_at = new Date().toISOString();
      updates.won_at = null;
    } else if (stage !== "won" && stage !== "lost") {
      updates.won_at = null;
      updates.lost_at = null;
      updates.lost_reason = null;
    }

    await supabase.from("deals").update(updates).eq("id", deal.id);
    setSaving(false);
    onClose();
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this deal? This cannot be undone.")) return;
    setDeleting(true);
    await supabase.from("deals").delete().eq("id", deal.id);
    setDeleting(false);
    onClose();
    router.refresh();
  }

  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";
  const inputClass =
    "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold truncate">Deal Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-5 py-5 space-y-4">
          <div>
            <label className={labelClass}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Customer Name</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className={inputClass}>
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Value ($)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={valueDollars}
                onChange={(e) => setValueDollars(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
                {SOURCES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Next Follow-up</label>
              <input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {stage === "lost" && (
            <div>
              <label className={labelClass}>Lost Reason</label>
              <input
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="Why was this deal lost?"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>

          {/* Linked Items */}
          <div className="border-t border-border pt-4 space-y-3">
            <h3 className="text-sm font-semibold">Linked Items</h3>

            {linkedCall && (
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="font-medium">Call</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {linkedCall.phone} &mdash; {linkedCall.status}
                </p>
              </div>
            )}

            {linkedQuotes.length > 0 ? (
              linkedQuotes.map((q) => (
                <div key={q.id} className="bg-muted rounded-lg p-3 text-sm flex items-center justify-between">
                  <div>
                    <p className="font-medium">{q.quote_number}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {q.status} {q.total_cents ? `- $${(q.total_cents / 100).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <a
                    href={`/dashboard/quotes/${q.id}`}
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No linked quotes.</p>
            )}

            <a
              href={`/dashboard/quotes/new?deal_id=${deal.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium"
            >
              + Create Quote
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-500/30 text-red-500 px-3 py-2 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
