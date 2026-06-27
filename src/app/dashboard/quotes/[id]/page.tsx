import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Pencil,
  RefreshCw,
  Briefcase,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QuoteActions } from "./quote-actions";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-500",
  viewed: "bg-indigo-500/10 text-indigo-500",
  accepted: "bg-green-500/10 text-green-500",
  declined: "bg-red-500/10 text-red-500",
  expired: "bg-yellow-500/10 text-yellow-500",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (!membership) redirect("/login");

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .eq("org_id", membership.org_id)
    .single();

  if (!quote) redirect("/dashboard/quotes");

  const { data: lineItems } = await supabase
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", quote.id)
    .order("sort_order", { ascending: true });

  // Build a simple timeline from timestamps
  const timeline: { label: string; time: string }[] = [
    { label: "Created", time: quote.created_at },
  ];
  if (quote.sent_at) timeline.push({ label: "Sent", time: quote.sent_at });
  if (quote.accepted_at)
    timeline.push({ label: "Accepted", time: quote.accepted_at });
  if (quote.declined_at)
    timeline.push({ label: "Declined", time: quote.declined_at });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/quotes"
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{quote.quote_number}</h1>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                STATUS_STYLES[quote.status] || STATUS_STYLES.draft
              }`}
            >
              {quote.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {quote.description || "No description"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Customer info */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Customer
            </h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{quote.customer_name || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{quote.customer_phone || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{quote.customer_email || "-"}</p>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Line Items
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Item</th>
                  <th className="px-6 py-3 font-medium">Qty</th>
                  <th className="px-6 py-3 font-medium">Unit</th>
                  <th className="px-6 py-3 font-medium text-right">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(lineItems ?? []).map((li) => (
                  <tr key={li.id} className="border-b border-border">
                    <td className="px-6 py-3">
                      <p className="font-medium">{li.name}</p>
                      {li.description && (
                        <p className="text-xs text-muted-foreground">
                          {li.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3">{li.quantity}</td>
                    <td className="px-6 py-3">{li.unit}</td>
                    <td className="px-6 py-3 text-right">
                      {formatDollars(li.unit_price_cents)}
                    </td>
                    <td className="px-6 py-3 text-right font-medium">
                      {formatDollars(li.total_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-muted/30">
              <div className="flex flex-col items-end gap-1 text-sm">
                <div className="flex items-center gap-8">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium w-28 text-right">
                    {formatDollars(quote.subtotal_cents || 0)}
                  </span>
                </div>
                <div className="flex items-center gap-8">
                  <span className="text-muted-foreground">GST (10%)</span>
                  <span className="font-medium w-28 text-right">
                    {formatDollars(quote.tax_cents || 0)}
                  </span>
                </div>
                <div className="flex items-center gap-8 text-base font-bold mt-1 pt-1 border-t border-border">
                  <span>Total</span>
                  <span className="w-28 text-right">
                    {formatDollars(quote.total_cents || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Notes
              </h2>
              <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <QuoteActions quoteId={quote.id} status={quote.status} phone={quote.customer_phone} />

          {/* Details */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Details
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Valid Until</span>
                <span className="font-medium">
                  {quote.valid_until
                    ? new Date(quote.valid_until).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Timeline
            </h2>
            <div className="space-y-3">
              {timeline.map((event, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">{event.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
