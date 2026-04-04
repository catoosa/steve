import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

type SubAccount = {
  id: string;
  name: string;
  plan: string;
  call_balance: number;
  monthly_call_limit: number;
};

// GET /api/agency/usage — aggregated usage across all sub-accounts
// ?format=csv returns a CSV file
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, organizations(id, is_agency, plan)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const org = membership?.organizations as unknown as Record<string, unknown> | null;

  if (!org || org.is_agency !== true || org.plan !== "agency") {
    return Response.json({ error: "Agency plan required" }, { status: 403 });
  }

  const agencyOrgId = org.id as string;

  // Fetch all sub-accounts
  const { data: subAccounts } = await supabase
    .from("organizations")
    .select("id, name, plan, call_balance, monthly_call_limit")
    .eq("parent_org_id", agencyOrgId)
    .order("name");

  const accounts = (subAccounts ?? []) as SubAccount[];

  if (accounts.length === 0) {
    const format = req.nextUrl.searchParams.get("format");
    if (format === "csv") {
      return new Response("Client Name,Plan,Calls Used,Calls Remaining,Answer Rate,Top Disposition\n", {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="agency-usage-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }
    return Response.json({ usage: [] });
  }

  // Fetch call stats for current month across all sub-accounts
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: callStats } = await supabase
    .from("calls")
    .select("org_id, answered_by, analysis")
    .in(
      "org_id",
      accounts.map((a) => a.id)
    )
    .gte("created_at", periodStart);

  const calls = callStats ?? [];

  // Group by org_id
  const statsByOrg: Record<
    string,
    { total: number; answered: number; dispositions: Record<string, number> }
  > = {};
  for (const c of calls) {
    if (!statsByOrg[c.org_id]) {
      statsByOrg[c.org_id] = { total: 0, answered: 0, dispositions: {} };
    }
    statsByOrg[c.org_id].total++;
    if (c.answered_by === "human") statsByOrg[c.org_id].answered++;
    const analysis = c.analysis as Record<string, unknown> | null;
    const d = analysis?.disposition ? String(analysis.disposition) : "unknown";
    statsByOrg[c.org_id].dispositions[d] = (statsByOrg[c.org_id].dispositions[d] ?? 0) + 1;
  }

  const usageRows = accounts.map((a) => {
    const stats = statsByOrg[a.id] ?? { total: 0, answered: 0, dispositions: {} };
    const callsUsed = Math.max(0, a.monthly_call_limit - a.call_balance);
    const answerRate = stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 0;
    const topDisposition =
      Object.entries(stats.dispositions).sort((x, y) => y[1] - x[1])[0]?.[0] ?? "";
    return {
      name: a.name,
      plan: a.plan,
      calls_used: callsUsed,
      calls_remaining: a.call_balance,
      answer_rate: answerRate,
      top_disposition: topDisposition,
    };
  });

  const format = req.nextUrl.searchParams.get("format");

  if (format === "csv") {
    const header = [
      "Client Name",
      "Plan",
      "Calls Used",
      "Calls Remaining",
      "Answer Rate (%)",
      "Top Disposition",
    ];
    const rows = usageRows.map((r) => [
      r.name,
      r.plan,
      r.calls_used,
      r.calls_remaining,
      r.answer_rate,
      r.top_disposition,
    ]);
    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const dateStr = new Date().toISOString().split("T")[0];
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="agency-usage-${dateStr}.csv"`,
      },
    });
  }

  return Response.json({ usage: usageRows, period_start: periodStart });
}
