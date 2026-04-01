import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { analyzeCall } from "@/lib/bland";

/** POST /api/v1/calls/:id/analyze — Analyze a completed call */
export async function POST(
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

    const body = await request.json();

    if (!body.questions || !Array.isArray(body.questions)) {
      return Response.json({ error: "questions array is required" }, { status: 400 });
    }

    const result = await analyzeCall(call.bland_call_id, body.questions);

    // Store analysis in our DB
    await supabase.from("calls").update({ analysis: result }).eq("id", id);

    return Response.json({ success: true, analysis: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
