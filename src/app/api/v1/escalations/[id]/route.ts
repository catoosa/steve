import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify escalation belongs to org
    const { data: existing } = await supabase
      .from("escalations")
      .select("id")
      .eq("id", id)
      .eq("org_id", org.id)
      .single();

    if (!existing)
      return Response.json({ error: "Escalation not found" }, { status: 404 });

    const body = await request.json();
    const { status, assigned_to } = body;

    if (!status) {
      return Response.json(
        { error: "status is required" },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = { status };
    if (assigned_to !== undefined) updatePayload.assigned_to = assigned_to;
    if (status === "resolved") updatePayload.resolved_at = new Date().toISOString();

    const { data: escalation, error } = await supabase
      .from("escalations")
      .update(updatePayload)
      .eq("id", id)
      .eq("org_id", org.id)
      .select()
      .single();

    if (error)
      return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ data: escalation });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
