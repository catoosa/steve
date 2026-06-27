import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

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

/**
 * GET /api/v1/deals/[id] — Get a single deal
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const auth = await authenticateOrg(request);
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { orgId, supabase } = auth;

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();

    if (error || !data) {
      return Response.json({ error: "Deal not found" }, { status: 404 });
    }

    return Response.json({ deal: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/deals/[id] — Update a deal
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const auth = await authenticateOrg(request);
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { orgId, supabase } = auth;
    const body = await request.json();

    // Validate stage if provided
    if (body.stage) {
      const validStages = ["lead", "qualified", "quoted", "booked", "won", "lost"];
      if (!validStages.includes(body.stage)) {
        return Response.json(
          { error: `Invalid stage. Must be one of: ${validStages.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Validate source if provided
    if (body.source) {
      const validSources = ["inbound_call", "outbound_call", "manual", "website", "referral"];
      if (!validSources.includes(body.source)) {
        return Response.json(
          { error: `Invalid source. Must be one of: ${validSources.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const allowedFields = [
      "title", "stage", "source", "customer_name", "customer_phone",
      "customer_email", "value_cents", "notes", "next_follow_up",
      "contact_id", "call_id", "lost_reason",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // Auto-set timestamps for stage changes
    if (body.stage === "won") {
      updates.won_at = new Date().toISOString();
      updates.lost_at = null;
      updates.lost_reason = null;
    } else if (body.stage === "lost") {
      updates.lost_at = new Date().toISOString();
      updates.won_at = null;
    } else if (body.stage) {
      updates.won_at = null;
      updates.lost_at = null;
      updates.lost_reason = null;
    }

    const { data, error } = await supabase
      .from("deals")
      .update(updates)
      .eq("id", id)
      .eq("org_id", orgId)
      .select()
      .single();

    if (error || !data) {
      return Response.json({ error: "Deal not found" }, { status: 404 });
    }

    return Response.json({ deal: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/deals/[id] — Delete a deal
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const auth = await authenticateOrg(request);
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { orgId, supabase } = auth;

    const { error } = await supabase
      .from("deals")
      .delete()
      .eq("id", id)
      .eq("org_id", orgId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
