import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Skawk Public API — Deals
 *
 * GET  /api/v1/deals — List deals (filterable by stage, source)
 * POST /api/v1/deals — Create a deal
 *
 * Auth: x-api-key header or Authorization: Bearer <key>
 */

async function authenticateOrg(request: NextRequest) {
  const supabase = createServiceClient();
  const apiKey =
    request.headers.get("x-api-key") ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey) return { error: "Missing API key", status: 401 };

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("api_key", apiKey)
    .single();

  if (!org) return { error: "Invalid API key", status: 401 };

  return { orgId: org.id, supabase };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateOrg(request);
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { orgId, supabase } = auth;
    const url = request.nextUrl;
    const stage = url.searchParams.get("stage");
    const source = url.searchParams.get("source");

    let query = supabase
      .from("deals")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (stage) query = query.eq("stage", stage);
    if (source) query = query.eq("source", source);

    const { data, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ deals: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateOrg(request);
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { orgId, supabase } = auth;
    const body = await request.json();

    if (!body.title) {
      return Response.json({ error: "title is required" }, { status: 400 });
    }

    const validStages = ["lead", "qualified", "quoted", "booked", "won", "lost"];
    const stage = body.stage || "lead";
    if (!validStages.includes(stage)) {
      return Response.json({ error: `Invalid stage. Must be one of: ${validStages.join(", ")}` }, { status: 400 });
    }

    const validSources = ["inbound_call", "outbound_call", "manual", "website", "referral"];
    const source = body.source || "manual";
    if (!validSources.includes(source)) {
      return Response.json({ error: `Invalid source. Must be one of: ${validSources.join(", ")}` }, { status: 400 });
    }

    const insert: Record<string, unknown> = {
      org_id: orgId,
      title: body.title,
      stage,
      source,
      customer_name: body.customer_name || null,
      customer_phone: body.customer_phone || null,
      customer_email: body.customer_email || null,
      value_cents: body.value_cents ?? null,
      notes: body.notes || null,
      next_follow_up: body.next_follow_up || null,
      contact_id: body.contact_id || null,
      call_id: body.call_id || null,
    };

    if (stage === "won") insert.won_at = new Date().toISOString();
    if (stage === "lost") {
      insert.lost_at = new Date().toISOString();
      insert.lost_reason = body.lost_reason || null;
    }

    const { data, error } = await supabase
      .from("deals")
      .insert(insert)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ deal: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
