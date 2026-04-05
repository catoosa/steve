import { createClient } from "@/lib/supabase/server";
import { listActiveCalls, getCall } from "@/lib/bland";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();
    if (!membership) return Response.json({ error: "No org" }, { status: 403 });

    // Get active calls from our DB
    const { data: activeCalls } = await supabase
      .from("calls")
      .select("id, phone, status, campaign_id, contact_id, bland_call_id, started_at, created_at, metadata, contacts(name)")
      .eq("org_id", membership.org_id)
      .in("status", ["queued", "ringing", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(50);

    // Get recently completed calls (last 5 minutes) for the live feed
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentCalls } = await supabase
      .from("calls")
      .select("id, phone, status, campaign_id, duration_seconds, analysis, answered_by, completed_at, contacts(name)")
      .eq("org_id", membership.org_id)
      .eq("status", "completed")
      .gte("completed_at", fiveMinAgo)
      .order("completed_at", { ascending: false })
      .limit(20);

    // Get campaign names for active calls
    const campaignIds = [...new Set([
      ...(activeCalls || []).map((c) => c.campaign_id).filter(Boolean),
      ...(recentCalls || []).map((c) => c.campaign_id).filter(Boolean),
    ])];

    let campaignMap: Record<string, string> = {};
    if (campaignIds.length > 0) {
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, name")
        .in("id", campaignIds);
      if (campaigns) {
        campaignMap = Object.fromEntries(campaigns.map((c) => [c.id, c.name]));
      }
    }

    // Get org-wide live stats
    const { count: totalActive } = await supabase
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("org_id", membership.org_id)
      .in("status", ["queued", "ringing", "in_progress"]);

    const { count: todayCompleted } = await supabase
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("org_id", membership.org_id)
      .eq("status", "completed")
      .gte("created_at", new Date().toISOString().split("T")[0]);

    const { count: todayAnswered } = await supabase
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("org_id", membership.org_id)
      .eq("status", "completed")
      .eq("answered_by", "human")
      .gte("created_at", new Date().toISOString().split("T")[0]);

    return Response.json({
      active: (activeCalls || []).map((c) => ({
        ...c,
        campaign_name: c.campaign_id ? campaignMap[c.campaign_id] : null,
        contact_name: (c.contacts as unknown as { name: string } | null)?.name ?? null,
      })),
      recent: (recentCalls || []).map((c) => ({
        ...c,
        campaign_name: c.campaign_id ? campaignMap[c.campaign_id] : null,
        contact_name: (c.contacts as unknown as { name: string } | null)?.name ?? null,
      })),
      stats: {
        active_calls: totalActive ?? 0,
        today_completed: todayCompleted ?? 0,
        today_answered: todayAnswered ?? 0,
        answer_rate: todayCompleted ? Math.round(((todayAnswered ?? 0) / todayCompleted) * 100) : 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
