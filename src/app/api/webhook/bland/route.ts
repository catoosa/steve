import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Bland AI webhook — receives call completion results.
 * Stores transcript, analysis, and updates call/contact status.
 * Also forwards to customer's webhook if configured.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const payload = await request.json();
    const supabase = createServiceClient();

    const callId = payload.call_id;
    const metadata = payload.metadata || {};
    const orgId = metadata.org_id;
    const campaignId = metadata.campaign_id;
    const contactId = metadata.contact_id;
    const steveCallId = metadata.steve_call_id;

    if (!orgId) {
      console.error("[webhook] No org_id in metadata");
      return Response.json({ success: false, error: "No org_id" });
    }

    // Build transcript
    const transcript =
      payload.concatenated_transcript ??
      (payload.transcripts ?? [])
        .map((t: { user: string; text: string }) => `${t.user}: ${t.text}`)
        .join("\n");

    // Map status
    const statusMap: Record<string, string> = {
      completed: "completed",
      "no-answer": "no_answer",
      voicemail: "voicemail",
      busy: "busy",
      failed: "failed",
    };
    const status = statusMap[payload.status] || payload.status;

    // Merge disposition into analysis if Bland returned one
    let analysis = payload.analysis ?? null;
    if (payload.disposition && analysis && typeof analysis === "object") {
      analysis = { ...analysis, disposition: payload.disposition };
    } else if (payload.disposition && !analysis) {
      analysis = { disposition: payload.disposition };
    }

    // Update call record
    const callUpdate: Record<string, unknown> = {
      status,
      bland_call_id: callId,
      duration_seconds: payload.call_length ?? null,
      answered_by: payload.answered_by ?? null,
      transcript: transcript || null,
      analysis,
      recording_url: payload.recording_url ?? null,
      cost_cents: payload.price ? Math.round(payload.price) : null,
      completed_at: new Date().toISOString(),
    };

    if (steveCallId) {
      await supabase.from("calls").update(callUpdate).eq("id", steveCallId);
    }

    // Update contact status
    if (contactId) {
      await supabase
        .from("contacts")
        .update({ status: status === "completed" ? "completed" : "failed" })
        .eq("id", contactId);
    }

    // Update campaign stats
    if (campaignId) {
      const isAnswered = status === "completed" && payload.answered_by === "human";
      await supabase.rpc("increment_campaign_stats", {
        p_campaign_id: campaignId,
        p_completed: 1,
        p_answered: isAnswered ? 1 : 0,
      });
    }

    // Deduct from org call balance
    await supabase.rpc("decrement_call_balance", { p_org_id: orgId });

    // Forward to customer webhook if configured
    const { data: org } = await supabase
      .from("organizations")
      .select("webhook_url")
      .eq("id", orgId)
      .single();

    if (org?.webhook_url) {
      try {
        await fetch(org.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "call.completed",
            call_id: steveCallId,
            campaign_id: campaignId,
            contact_id: contactId,
            phone: payload.to,
            status,
            duration_seconds: payload.call_length,
            answered_by: payload.answered_by,
            transcript,
            analysis: payload.analysis,
            recording_url: payload.recording_url,
            metadata: {
              ...metadata,
              org_id: undefined,
              campaign_id: undefined,
              contact_id: undefined,
              steve_call_id: undefined,
            },
          }),
        });
      } catch (e) {
        console.error("[webhook] Customer webhook failed:", e);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[webhook] Processed call ${callId} | status=${status} | ${elapsed}ms`
    );

    return Response.json({ success: true, elapsed_ms: elapsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[webhook] Error:", message);
    return Response.json({ success: false, error: message });
  }
}
