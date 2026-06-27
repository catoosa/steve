"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

type Quote = {
  id: string;
  quote_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  total_cents: number | null;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-500",
  viewed: "bg-indigo-500/10 text-indigo-500",
  accepted: "bg-green-500/10 text-green-500",
  declined: "bg-red-500/10 text-red-500",
  expired: "bg-yellow-500/10 text-yellow-500",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function QuotesList({ quotes }: { quotes: Quote[] }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="px-4 py-3 font-medium">Quote #</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Total</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium w-16">View</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            <tr
              key={quote.id}
              className="border-b border-border hover:bg-muted/30 transition-colors"
            >
              <td className="px-4 py-3 font-mono font-medium">
                {quote.quote_number}
              </td>
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium">
                    {quote.customer_name || "No name"}
                  </p>
                  {quote.customer_phone && (
                    <p className="text-xs text-muted-foreground">
                      {quote.customer_phone}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${
                    STATUS_STYLES[quote.status] || STATUS_STYLES.draft
                  }`}
                >
                  {quote.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {quote.total_cents != null
                  ? `$${(quote.total_cents / 100).toFixed(2)}`
                  : "-"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(quote.created_at)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/quotes/${quote.id}`}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors inline-flex"
                >
                  <Eye className="w-4 h-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
