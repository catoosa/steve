import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

async function getAgencyOrgId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, organizations(id, is_agency, plan)")
    .eq("user_id", userId)
    .limit(1)
    .single();

  const org = membership?.organizations as unknown as Record<string, unknown> | null;

  if (!org || org.is_agency !== true || org.plan !== "agency") {
    return null;
  }
  return org.id as string;
}

// GET /api/agency/sub-accounts/[id] — sub-account details + usage stats
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const agencyOrgId = await getAgencyOrgId(supabase, user.id);
  if (!agencyOrgId) return Response.json({ error: "Agency plan required" }, { status: 403 });

  const { data: subAccount, error } = await supabase
    .from("organizations")
    .select("id, name, plan, call_balance, monthly_call_limit, created_at")
    .eq("id", id)
    .eq("parent_org_id", agencyOrgId)
    .single();

  if (error || !subAccount) {
    return Response.json({ error: "Sub-account not found" }, { status: 404 });
  }

  // Fetch call stats for current month
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: callStats } = await supabase
    .from("calls")
    .select("status, answered_by, analysis")
    .eq("org_id", id)
    .gte("created_at", periodStart);

  const calls = callStats ?? [];
  const totalCalls = calls.length;
  const answeredCalls = calls.filter((c) => c.answered_by === "human").length;
  const answerRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0;

  // Top disposition
  const dispositionCounts: Record<string, number> = {};
  for (const c of calls) {
    const analysis = c.analysis as Record<string, unknown> | null;
    const d = analysis?.disposition ? String(analysis.disposition) : "unknown";
    dispositionCounts[d] = (dispositionCounts[d] ?? 0) + 1;
  }
  const topDisposition = Object.entries(dispositionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return Response.json({
    sub_account: subAccount,
    stats: {
      calls_this_month: totalCalls,
      answered_calls: answeredCalls,
      answer_rate: answerRate,
      top_disposition: topDisposition,
    },
  });
}

// PATCH /api/agency/sub-accounts/[id] — update call limit or name
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const agencyOrgId = await getAgencyOrgId(supabase, user.id);
  if (!agencyOrgId) return Response.json({ error: "Agency plan required" }, { status: 403 });

  let body: { name?: string; call_limit?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Verify it belongs to this agency
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", id)
    .eq("parent_org_id", agencyOrgId)
    .single();

  if (!existing) return Response.json({ error: "Sub-account not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.call_limit !== undefined) {
    updates.monthly_call_limit = body.call_limit;
    updates.call_balance = body.call_limit;
  }

  const { data: updated, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", id)
    .select("id, name, plan, call_balance, monthly_call_limit")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ org: updated });
}

// DELETE /api/agency/sub-accounts/[id] — soft delete: detach from agency
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const agencyOrgId = await getAgencyOrgId(supabase, user.id);
  if (!agencyOrgId) return Response.json({ error: "Agency plan required" }, { status: 403 });

  // Verify it belongs to this agency
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", id)
    .eq("parent_org_id", agencyOrgId)
    .single();

  if (!existing) return Response.json({ error: "Sub-account not found" }, { status: 404 });

  // Soft delete: detach parent, set plan to 'free'
  const { error } = await supabase
    .from("organizations")
    .update({ parent_org_id: null, plan: "free" })
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}
