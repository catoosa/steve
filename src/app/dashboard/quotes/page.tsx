import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  DollarSign,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QuotesList } from "./quotes-list";

export default async function QuotesPage() {
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

  const { data: quotes } = await supabase
    .from("quotes")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false })
    .limit(200);

  const allQuotes = quotes ?? [];
  const totalQuotes = allQuotes.length;
  const pendingQuotes = allQuotes.filter(
    (q) => q.status === "sent" || q.status === "viewed"
  ).length;
  const acceptedQuotes = allQuotes.filter(
    (q) => q.status === "accepted"
  ).length;
  const totalValue = allQuotes.reduce(
    (sum, q) => sum + (q.total_cents || 0),
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage quotes for your customers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/quotes/rate-card"
            className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            Rate Card
          </Link>
          <Link
            href="/dashboard/quotes/new"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Quote
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalQuotes}</p>
              <p className="text-xs text-muted-foreground">Total Quotes</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingQuotes}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{acceptedQuotes}</p>
              <p className="text-xs text-muted-foreground">Accepted</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                ${(totalValue / 100).toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">Total Value</p>
            </div>
          </div>
        </div>
      </div>

      {allQuotes.length === 0 ? (
        <div className="bg-background border border-border rounded-xl px-6 py-20 text-center">
          <FileText className="w-14 h-14 mx-auto mb-5 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-semibold mb-2">No quotes yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Create your first quote to start sending professional estimates to
            your customers.
          </p>
          <Link
            href="/dashboard/quotes/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Create Quote
          </Link>
        </div>
      ) : (
        <QuotesList quotes={allQuotes} />
      )}
    </div>
  );
}
