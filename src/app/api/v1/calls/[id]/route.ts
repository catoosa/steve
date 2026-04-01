import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCall, stopCall, analyzeCall } from "@/lib/bland";

/** GET /api/v1/calls/:id — Get call details */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = createServiceClient();
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 401 });

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("api_key", apiKey)
      .single();

    if (!org) return Response.json({ error: "Invalid API key" }, { status: 401 });

    // Get our record
    const { data: call } = await supabase
      .from("calls")
      .select("*")
      .eq("id", id)
      .eq("org_id", org.id)
      .single();

    if (!call) return Response.json({ error: "Call not found" }, { status: 404 });

    // If we have a bland_call_id, fetch live details from Bland
    let blandDetails = null;
    if (call.bland_call_id) {
      try {
        blandDetails = await getCall(call.bland_call_id);
      } catch {
        // Call might not exist yet on Bland's side
      }
    }

    return Response.json({
      id: call.id,
      phone: call.phone,
      status: call.status,
      bland_call_id: call.bland_call_id,
      duration_seconds: blandDetails?.corrected_duration || call.duration_seconds,
      answered_by: blandDetails?.answered_by || call.answered_by,
      transcript: blandDetails?.concatenated_transcript || call.transcript,
      analysis: blandDetails?.analysis || call.analysis,
      summary: blandDetails?.summary || null,
      recording_url: blandDetails?.recording_url || call.recording_url,
      call_ended_by: blandDetails?.call_ended_by || null,
      metadata: call.metadata,
      created_at: call.created_at,
      completed_at: call.completed_at,
      cost_cents: call.cost_cents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/v1/calls/:id — Stop an active call */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = createServiceClient();
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 401 });

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("api_key", apiKey)
      .single();

    if (!org) return Response.json({ error: "Invalid API key" }, { status: 401 });

    const { data: call } = await supabase
      .from("calls")
      .select("bland_call_id")
      .eq("id", id)
      .eq("org_id", org.id)
      .single();

    if (!call?.bland_call_id) return Response.json({ error: "Call not found" }, { status: 404 });

    await stopCall(call.bland_call_id);

    await supabase.from("calls").update({ status: "failed" }).eq("id", id);

    return Response.json({ success: true, message: "Call stopped" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
