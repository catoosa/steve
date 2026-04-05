import { redirect } from "next/navigation";
import { DollarSign, TrendingUp, Users, Calculator, BarChart3, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function fmt(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDollars(dollars: number): string {
  return dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function RoiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (!membership) redirect("/login");
  const orgId = membership.org_id;

  // Fetch completed calls
  const { data: callsData } = await supabase
    .from("calls")
    .select("id, cost_cents, duration_seconds, analysis, answered_by, created_at")
    .eq("org_id", orgId)
    .eq("status", "completed");

  // Fetch campaigns
  const { data: campaignsData } = await supabase
    .from("campaigns")
    .select("id, name, calls_completed, calls_answered")
    .eq("org_id", orgId);

  const calls = callsData ?? [];
  const campaigns = campaignsData ?? [];

  // --- Calculations ---
  const totalCalls = calls.length;
  const totalSpendCents = calls.reduce((sum, c) => sum + (c.cost_cents ?? 0), 0);
  const avgCostPerCall = totalCalls > 0 ? totalSpendCents / totalCalls : 0;

  const positiveDispositions = calls.filter((c) => {
    const analysis = c.analysis as Record<string, unknown> | null;
    const disposition = (analysis?.disposition as string | undefined)?.toUpperCase();
    return disposition === "INTERESTED" || disposition === "FOLLOW_UP";
  }).length;

  const costPerLead = positiveDispositions > 0 ? totalSpendCents / positiveDispositions : null;

  const totalDurationSeconds = calls.reduce((sum, c) => sum + (c.duration_seconds ?? 0), 0);

  // Human equivalent: $30/hr, 7.5 calls/hr
  const humanEquivalent = (totalCalls / 7.5) * 30;
  const totalSpendDollars = totalSpendCents / 100;
  const savings = humanEquivalent - totalSpendDollars;
  const roi = savings > 0 && totalSpendDollars > 0 ? (savings / totalSpendDollars) * 100 : 0;

  // For the proportional bar
  const maxCost = Math.max(humanEquivalent, totalSpendDollars, 1);
  const humanBarPct = (humanEquivalent / maxCost) * 100;
  const skawkBarPct = (totalSpendDollars / maxCost) * 100;

  const hasData = totalCalls > 0;

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ROI Dashboard</h1>
          <p className="text-muted-foreground mt-1">See how much Skawk saves you compared to a human team.</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-12 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">No completed calls yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Launch your first campaign to start seeing ROI data. Once calls are completed, this dashboard will show you exactly how much time and money Skawk is saving.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ROI Dashboard</h1>
        <p className="text-muted-foreground mt-1">See how much Skawk saves you compared to a human team.</p>
      </div>

      {/* Hero Stats Row */}
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Key Metrics</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Spend */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              Total Spend
            </div>
            <p className="text-3xl font-bold">${fmt(totalSpendCents)}</p>
          </div>

          {/* Cost Per Call */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Calculator className="w-4 h-4" />
              Cost Per Call
            </div>
            <p className="text-3xl font-bold">${fmt(Math.round(avgCostPerCall))}</p>
          </div>

          {/* Cost Per Lead */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              Cost Per Lead
            </div>
            <p className="text-3xl font-bold">
              {costPerLead !== null ? `$${fmt(Math.round(costPerLead))}` : "N/A"}
            </p>
          </div>

          {/* ROI */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <BarChart3 className="w-4 h-4" />
              ROI
            </div>
            <p className={`text-3xl font-bold ${roi > 0 ? "text-green-500" : ""}`}>
              {roi > 0 ? `${Math.round(roi)}%` : "0%"}
            </p>
          </div>
        </div>
      </div>

      {/* Savings Comparison Card */}
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Savings Comparison</p>
        <div className="bg-card border border-border rounded-xl p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Human Team */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users className="w-4 h-4 text-muted-foreground" />
                Human Team
              </div>
              <p className="text-muted-foreground text-sm">
                {totalCalls.toLocaleString()} calls &times; $4.00/call = <span className="font-semibold text-foreground">${fmtDollars(humanEquivalent)}</span>
              </p>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-muted-foreground"
                  style={{ width: `${humanBarPct}%` }}
                />
              </div>
            </div>

            {/* Skawk */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Zap className="w-4 h-4 text-primary" />
                Skawk
              </div>
              <p className="text-muted-foreground text-sm">
                {totalCalls.toLocaleString()} calls &times; ${fmt(Math.round(avgCostPerCall))}/call = <span className="font-semibold text-foreground">${fmtDollars(totalSpendDollars)}</span>
              </p>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${skawkBarPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Savings total */}
          <div className="border-t border-border pt-4 text-center">
            {savings > 0 ? (
              <p className="text-2xl font-bold text-green-500">
                You saved ${fmtDollars(savings)}
              </p>
            ) : (
              <p className="text-lg text-muted-foreground">
                Add more calls to see savings
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Breakdown */}
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Campaign Breakdown</p>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Campaign Name</th>
                    <th className="px-5 py-3 font-medium text-right">Calls</th>
                    <th className="px-5 py-3 font-medium text-right">Answered</th>
                    <th className="px-5 py-3 font-medium text-right">Answer Rate</th>
                    <th className="px-5 py-3 font-medium text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const completed = campaign.calls_completed ?? 0;
                    const answered = campaign.calls_answered ?? 0;
                    const answerRate = completed > 0 ? ((answered / completed) * 100).toFixed(1) : "0.0";
                    const estCostCents = completed * avgCostPerCall;
                    return (
                      <tr key={campaign.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="px-5 py-3 font-medium">{campaign.name}</td>
                        <td className="px-5 py-3 text-right tabular-nums">{completed.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right tabular-nums">{answered.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right tabular-nums">{answerRate}%</td>
                        <td className="px-5 py-3 text-right tabular-nums">${fmt(Math.round(estCostCents))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No campaigns created yet.
            </div>
          )}
        </div>
      </div>

      {/* Why This Matters */}
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Why This Matters</p>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            A human caller costs ~$30/hour and makes ~60 calls per day. Skawk makes 10,000 calls in the time it takes to pour a coffee. These numbers don&apos;t include hiring, training, sick days, or turnover.
          </p>
        </div>
      </div>
    </div>
  );
}
