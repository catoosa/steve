"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

export function AddDealModal({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [valueDollars, setValueDollars] = useState("");
  const [source, setSource] = useState("manual");
  const [stage, setStage] = useState("lead");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const cents = valueDollars ? Math.round(parseFloat(valueDollars) * 100) : null;

    await supabase.from("deals").insert({
      org_id: orgId,
      title: title.trim(),
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      customer_email: customerEmail || null,
      value_cents: cents,
      source,
      stage,
      notes: notes || null,
    });

    setSaving(false);
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

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-lg font-semibold">Add Deal</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Kitchen reno - Smith"
                required
                className={inputClass}
              />
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

            <div className="grid grid-cols-3 gap-3">
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
              <div>
                <label className={labelClass}>Source</label>
                <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
                  {SOURCES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Stage</label>
                <select value={stage} onChange={(e) => setStage(e.target.value)} className={inputClass}>
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={inputClass}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Deal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
