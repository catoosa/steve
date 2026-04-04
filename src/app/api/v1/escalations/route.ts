import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey)
      return Response.json({ error: "Missing API key" }, { status: 401 });

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("api_key", apiKey)
      .single();
    if (!org)
      return Response.json({ error: "Invalid API key" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    let query = supabase
      .from("escalations")
      .select("*")
      .eq("org_id", org.id);

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);

    const priorityOrder = "priority_order";
    const { data: escalations, error } = await query
      .order(priorityOrder, { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      // Fallback if priority_order column doesn't exist — sort client-side
      const { data: fallbackData, error: fallbackError } = await (() => {
        let q = supabase
          .from("escalations")
          .select("*")
          .eq("org_id", org.id);
        if (status) q = q.eq("status", status);
        if (priority) q = q.eq("priority", priority);
        return q.order("created_at", { ascending: false });
      })();

      if (fallbackError)
        return Response.json(
          { error: fallbackError.message },
          { status: 500 }
        );

      const priorityRank: Record<string, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      const sorted = (fallbackData ?? []).sort((a: Record<string, string>, b: Record<string, string>) => {
        const pa = priorityRank[a.priority] ?? 99;
        const pb = priorityRank[b.priority] ?? 99;
        if (pa !== pb) return pa - pb;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      return Response.json({ data: sorted });
    }

    return Response.json({ data: escalations });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey)
      return Response.json({ error: "Missing API key" }, { status: 401 });

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("api_key", apiKey)
      .single();
    if (!org)
      return Response.json({ error: "Invalid API key" }, { status: 401 });

    const body = await request.json();
    const { campaign_id, call_id, contact_id, priority, reason } = body;

    if (!priority || !reason) {
      return Response.json(
        { error: "priority and reason are required" },
        { status: 400 }
      );
    }

    const { data: escalation, error } = await supabase
      .from("escalations")
      .insert({
        org_id: org.id,
        campaign_id: campaign_id ?? null,
        call_id: call_id ?? null,
        contact_id: contact_id ?? null,
        priority,
        reason,
      })
      .select()
      .single();

    if (error)
      return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ data: escalation }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
