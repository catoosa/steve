import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { analyzeEmotion, getCall } from "@/lib/bland";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userClient = await createClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Get the call record
    const { data: call } = await supabase
      .from("calls")
      .select("*")
      .eq("id", id)
      .single();

    if (!call) {
      return Response.json({ error: "Call not found" }, { status: 404 });
    }

    // Verify user belongs to the call's org
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("org_id", call.org_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get recording URL — from call record or fetch from Bland
    let recordingUrl = call.recording_url;

    if (!recordingUrl && call.bland_call_id) {
      const blandCall = await getCall(call.bland_call_id);
      recordingUrl = blandCall.recording_url;

      // Save it while we have it
      if (recordingUrl) {
        await supabase
          .from("calls")
          .update({ recording_url: recordingUrl })
          .eq("id", id);
      }
    }

    if (!recordingUrl) {
      return Response.json(
        { error: "No recording available for this call" },
        { status: 400 }
      );
    }

    // Run emotion analysis
    const emotionResult = await analyzeEmotion(recordingUrl);

    // Merge into existing analysis JSONB field
    const existingAnalysis =
      typeof call.analysis === "object" && call.analysis !== null
        ? call.analysis
        : {};

    const updatedAnalysis = { ...existingAnalysis, emotion: emotionResult };

    await supabase
      .from("calls")
      .update({ analysis: updatedAnalysis })
      .eq("id", id);

    return Response.json({ success: true, emotion: emotionResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
