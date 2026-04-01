import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { makeCall, makeBatchCalls } from "@/lib/bland";

/**
 * Public API — POST /api/v1/calls
 * Authenticated via API key (Bearer token or x-api-key header)
 *
 * Single call:   { phone, prompt, first_sentence?, analysis_prompt?, metadata? }
 * Batch calls:   { calls: [{ phone, prompt, ... }] }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Authenticate via API key
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) {
      return Response.json({ error: "Missing API key" }, { status: 401 });
    }

    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("id, plan, call_balance")
      .eq("api_key", apiKey)
      .single();

    if (orgErr || !org) {
      return Response.json({ error: "Invalid API key" }, { status: 401 });
    }

    const body = await request.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://callsteve.au";
    const webhookUrl = `${appUrl}/api/webhook/bland`;

    // Log API call
    await supabase.from("api_logs").insert({
      org_id: org.id,
      method: "POST",
      path: "/api/v1/calls",
      status_code: 200,
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
    });

    // Batch mode
    if (body.calls && Array.isArray(body.calls)) {
      const callCount = body.calls.length;

      if (org.call_balance < callCount) {
        return Response.json(
          {
            error: "Insufficient call balance",
            balance: org.call_balance,
            required: callCount,
          },
          { status: 402 }
        );
      }

      // Create call records
      const callRecords = await Promise.all(
        body.calls.map(async (c: Record<string, unknown>) => {
          const { data } = await supabase
            .from("calls")
            .insert({
              org_id: org.id,
              phone: c.phone as string,
              status: "queued",
              metadata: (c.metadata as Record<string, unknown>) || {},
            })
            .select("id")
            .single();
          return { ...c, steveCallId: data?.id };
        })
      );

      const blandCalls = callRecords.map((c) => ({
        phone: c.phone as string,
        prompt: (c.prompt as string) || body.prompt || "You are a helpful phone agent.",
        firstSentence: c.first_sentence as string | undefined,
        analysisPrompt: c.analysis_prompt as string | undefined,
        voice: (c.voice as string) || body.voice,
        language: (c.language as string) || body.language,
        maxDuration: (c.max_duration as number) || body.max_duration,
        webhookUrl,
        metadata: {
          org_id: org.id,
          steve_call_id: c.steveCallId,
          ...(typeof c.metadata === "object" && c.metadata !== null
            ? Object.fromEntries(
                Object.entries(c.metadata as Record<string, unknown>).map(([k, v]) => [k, String(v)])
              )
            : {}),
        },
      }));

      const result = await makeBatchCalls({
        calls: blandCalls,
        label: body.label || `Steve API batch - ${callCount} calls`,
      });

      return Response.json({
        success: true,
        batch_id: result.batch_id,
        calls_queued: callCount,
        estimated_cost: `$${(callCount * 0.5).toFixed(2)}`,
      });
    }

    // Single call mode
    if (!body.phone) {
      return Response.json({ error: "phone is required" }, { status: 400 });
    }

    if (org.call_balance < 1) {
      return Response.json(
        { error: "Insufficient call balance", balance: 0 },
        { status: 402 }
      );
    }

    // Create call record
    const { data: callRecord } = await supabase
      .from("calls")
      .insert({
        org_id: org.id,
        phone: body.phone,
        status: "queued",
        metadata: body.metadata || {},
      })
      .select("id")
      .single();

    const result = await makeCall({
      phone: body.phone,
      prompt: body.prompt || "You are a helpful phone agent. Be brief and professional.",
      firstSentence: body.first_sentence,
      analysisPrompt: body.analysis_prompt,
      voice: body.voice,
      language: body.language,
      maxDuration: body.max_duration,
      webhookUrl,
      metadata: {
        org_id: org.id,
        steve_call_id: callRecord?.id || "",
        ...(body.metadata
          ? Object.fromEntries(
              Object.entries(body.metadata as Record<string, unknown>).map(([k, v]) => [k, String(v)])
            )
          : {}),
      },
    });

    // Update with Bland call ID
    if (callRecord?.id) {
      await supabase
        .from("calls")
        .update({ bland_call_id: result.call_id, status: "ringing" })
        .eq("id", callRecord.id);
    }

    return Response.json({
      success: true,
      call_id: callRecord?.id,
      bland_call_id: result.call_id,
      phone: body.phone,
      message: "Call initiated. You'll receive a webhook when it completes.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
