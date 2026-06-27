"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Quote = {
  id: string;
  quote_number: string;
  customer_name: string | null;
  total_cents: number | null;
};

type Deal = {
  id: string;
  title: string;
  contact_name: string | null;
};

export function JobForm({
  orgId,
  quotes,
  deals,
}: {
  orgId: string;
  quotes: Quote[];
  deals: Deal[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [totalDollars, setTotalDollars] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [dealId, setDealId] = useState("");

  // When a quote is selected, prefill customer info
  function handleQuoteChange(selectedQuoteId: string) {
    setQuoteId(selectedQuoteId);
    if (selectedQuoteId) {
      const quote = quotes.find((q) => q.id === selectedQuoteId);
      if (quote) {
        if (quote.customer_name) setCustomerName(quote.customer_name);
        if (quote.total_cents !== null) {
          setTotalDollars((quote.total_cents / 100).toFixed(2));
        }
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get next job number via RPC
      const { data: jobNumber } = await supabase.rpc("next_job_number", {
        p_org_id: orgId,
      });

      const totalCents = totalDollars
        ? Math.round(parseFloat(totalDollars) * 100)
        : null;

      const { data: job, error: insertError } = await supabase
        .from("jobs")
        .insert({
          org_id: orgId,
          job_number: jobNumber || "JOB-0001",
          title: title.trim(),
          customer_name: customerName.trim() || null,
          customer_phone: customerPhone.trim() || null,
          customer_address: customerAddress.trim() || null,
          scheduled_date: scheduledDate || null,
          scheduled_time_start: timeStart || null,
          scheduled_time_end: timeEnd || null,
          notes: notes.trim() || null,
          total_cents: totalCents,
          status: "booked",
          quote_id: quoteId || null,
          deal_id: dealId || null,
        })
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      router.push(`/dashboard/jobs/${job.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </Link>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Job Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Hot water system install"
            className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
        </div>

        {/* Customer Info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Smith"
              className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Customer Phone
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="0412 345 678"
              className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Customer Address
          </label>
          <input
            type="text"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="123 Main St, Sydney NSW 2000"
            className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
        </div>

        {/* Schedule */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Scheduled Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Start Time
            </label>
            <input
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              End Time
            </label>
            <input
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Total */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Total ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={totalDollars}
            onChange={(e) => setTotalDollars(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
        </div>

        {/* Link to Quote */}
        {quotes.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Link to Quote (optional)
            </label>
            <select
              value={quoteId}
              onChange={(e) => handleQuoteChange(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            >
              <option value="">No quote linked</option>
              {quotes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.quote_number} - {q.customer_name || "Unknown"} ($
                  {q.total_cents !== null
                    ? (q.total_cents / 100).toFixed(2)
                    : "0.00"}
                  )
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Link to Deal */}
        {deals.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Link to Deal (optional)
            </label>
            <select
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            >
              <option value="">No deal linked</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} {d.contact_name ? `(${d.contact_name})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional details about the job..."
            className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Creating..." : "Create Job"}
        </button>
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center rounded-xl border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
