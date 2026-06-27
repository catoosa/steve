import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "./pipeline-board";

export default async function PipelinePage() {
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

  const orgId = membership.org_id;

  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  const allDeals = (deals ?? []) as Deal[];

  // Stats
  const totalDeals = allDeals.length;
  const pipelineValue = allDeals
    .filter((d) => d.stage !== "lost")
    .reduce((sum, d) => sum + (d.value_cents ?? 0), 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const wonThisMonth = allDeals.filter(
    (d) => d.stage === "won" && d.won_at && d.won_at >= startOfMonth
  ).length;

  const wonCount = allDeals.filter((d) => d.stage === "won").length;
  const lostCount = allDeals.filter((d) => d.stage === "lost").length;
  const conversionRate =
    wonCount + lostCount > 0
      ? Math.round((wonCount / (wonCount + lostCount)) * 100)
      : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pipeline</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Deals</p>
          <p className="text-2xl font-bold mt-1">{totalDeals}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Pipeline Value</p>
          <p className="text-2xl font-bold mt-1">${(pipelineValue / 100).toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Won This Month</p>
          <p className="text-2xl font-bold mt-1">{wonThisMonth}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Conversion Rate</p>
          <p className="text-2xl font-bold mt-1">{conversionRate}%</p>
        </div>
      </div>

      <PipelineBoard deals={allDeals} orgId={orgId} />
    </div>
  );
}

export interface Deal {
  id: string;
  org_id: string;
  contact_id: string | null;
  call_id: string | null;
  title: string;
  stage: string;
  value_cents: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  source: string | null;
  notes: string | null;
  next_follow_up: string | null;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}
