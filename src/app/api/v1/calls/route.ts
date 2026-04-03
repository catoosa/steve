import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { makeCall, makeBatchCalls } from "@/lib/bland";

/**
 * Skawk Public API — Calls
 *
 * POST /api/v1/calls — Send a single call or batch
 *
 * Auth: x-api-key header or Authorization: Bearer <key>
 *
 * Single: { phone, prompt?, pathway_id?, first_sentence?, analysis_prompt?,
 *           voice?, language?, max_duration?, model?, temperature?,
 *           transfer_phone_number?, transfer_list?, guard_rails?,
 *           record?, metadata?, request_data?, webhook_events?,
 *           summary_prompt?, dispositions?, retry? }
 *
 * Batch:  { calls: [{ phone, prompt?, first_sentence?, metadata? }],
 *           prompt?, pathway_id?, analysis_prompt?, voice?, language?,
 *           label?, status_webhook? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Auth
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) {
      return Response.json({ error: "Missing API key. Pass via x-api-key header." }, { status: 401 });
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://skawk.io";
    const webhookUrl = `${appUrl}/api/webhook/bland`;

    // Log API request
    supabase.from("api_logs").insert({
      org_id: org.id,
      method: "POST",
      path: "/api/v1/calls",
      status_code: 200,
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
    });

    // =========================================================================
    // BATCH MODE
    // =========================================================================
    if (body.calls && Array.isArray(body.calls)) {
      const callCount = body.calls.length;

      if (callCount > 10000) {
        return Response.json({ error: "Maximum 10,000 calls per batch" }, { status: 400 });
      }

      // Atomically reserve balance — prevents race conditions with concurrent requests
      const { data: batchReserved, error: batchReserveError } = await supabase.rpc(
        "reserve_call_balance",
        { p_org_id: org.id, p_count: callCount }
      );

      if (batchReserveError || !batchReserved) {
        return Response.json(
          { error: "Insufficient call balance", required: callCount },
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

      const batchCalls = callRecords.map((c) => ({
        phone: c.phone as string,
        prompt: c.prompt as string | undefined,
        firstSentence: c.first_sentence as string | undefined,
        metadata: {
          org_id: org.id,
          steve_call_id: c.steveCallId || "",
          ...(typeof c.metadata === "object" && c.metadata !== null
            ? Object.fromEntries(
                Object.entries(c.metadata as Record<string, unknown>).map(([k, v]) => [k, String(v)])
              )
            : {}),
        },
        requestData: c.request_data as Record<string, unknown> | undefined,
      }));

      let batchResult;
      try {
        batchResult = await makeBatchCalls({
          calls: batchCalls,
          global: {
            prompt: body.prompt,
            pathwayId: body.pathway_id,
            firstSentence: body.first_sentence,
            analysisPrompt: body.analysis_prompt,
            voice: body.voice,
            language: body.language,
            maxDuration: body.max_duration,
            model: body.model,
            temperature: body.temperature,
            record: body.record,
            waitForGreeting: body.wait_for_greeting,
            webhookUrl,
            transferPhoneNumber: body.transfer_phone_number,
            guardRails: body.guard_rails,
            summaryPrompt: body.summary_prompt,
          },
          label: body.label || `Skawk API batch - ${callCount} calls`,
          statusWebhook: body.status_webhook,
        });
      } catch (blandError) {
        // Bland call failed — restore the reserved balance
        await supabase.rpc("release_call_balance", { p_org_id: org.id, p_count: callCount });
        throw blandError;
      }

      return Response.json({
        success: true,
        batch_id: batchResult.data?.batch_id || batchResult.batch_id,
        calls_queued: callCount,
      });
    }

    // =========================================================================
    // SINGLE CALL
    // =========================================================================
    if (!body.phone) {
      return Response.json({ error: "phone is required" }, { status: 400 });
    }

    // Atomically reserve 1 call
    const { data: singleReserved, error: singleReserveError } = await supabase.rpc(
      "reserve_call_balance",
      { p_org_id: org.id, p_count: 1 }
    );

    if (singleReserveError || !singleReserved) {
      return Response.json({ error: "Insufficient call balance" }, { status: 402 });
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

    let result;
    try {
      result = await makeCall({
        phone: body.phone,
        prompt: body.prompt,
        pathwayId: body.pathway_id,
        firstSentence: body.first_sentence,
        analysisPrompt: body.analysis_prompt,
        voice: body.voice,
        language: body.language,
        maxDuration: body.max_duration,
        model: body.model,
        temperature: body.temperature,
        waitForGreeting: body.wait_for_greeting,
        record: body.record ?? true,
        from: body.from,
        transferPhoneNumber: body.transfer_phone_number,
        transferList: body.transfer_list,
        pronunciationGuide: body.pronunciation_guide,
        backgroundTrack: body.background_track,
        noiseCancellation: body.noise_cancellation,
        blockInterruptions: body.block_interruptions,
        interruptionThreshold: body.interruption_threshold,
        voicemail: body.voicemail,
        summaryPrompt: body.summary_prompt,
        metadata: {
          org_id: org.id,
          steve_call_id: callRecord?.id || "",
          ...(body.metadata
            ? Object.fromEntries(
                Object.entries(body.metadata as Record<string, unknown>).map(([k, v]) => [k, String(v)])
              )
            : {}),
        },
        requestData: body.request_data,
        webhookUrl,
        webhookEvents: body.webhook_events,
        dynamicData: body.dynamic_data,
        keywords: body.keywords,
        guardRails: body.guard_rails,
        dispositions: body.dispositions,
        retry: body.retry,
      });
    } catch (blandError) {
      // Bland call failed — restore the reserved balance
      await supabase.rpc("release_call_balance", { p_org_id: org.id, p_count: 1 });
      throw blandError;
    }

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
      message: "Call initiated.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
