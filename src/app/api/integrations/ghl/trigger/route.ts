import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { makeCall } from "@/lib/bland";

/**
 * Public endpoint — called by GHL workflows to trigger a Skawk AI call.
 * Auth is via the org's Skawk api_key in the request body.
 *
 * Body: {
 *   api_key: string        — Skawk org API key
 *   phone: string          — contact phone number
 *   contact_id?: string    — GHL contact ID (stored in call metadata)
 *   campaign_id?: string   — Skawk campaign ID to add contact to
 *   prompt?: string        — custom prompt for a single call (ignored if campaign_id given)
 * }
 */
export async function POST(req: NextRequest) {
  let body: {
    api_key?: string;
    phone?: string;
    contact_id?: string;
    campaign_id?: string;
    prompt?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { api_key, phone, contact_id, campaign_id, prompt } = body;

  if (!api_key) {
    return NextResponse.json({ error: "api_key is required" }, { status: 400 });
  }

  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Validate API key against organizations table
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, call_balance, ghl_enabled")
    .eq("api_key", api_key)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if ((org.call_balance ?? 0) <= 0) {
    return NextResponse.json(
      { error: "Insufficient call balance" },
      { status: 402 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://skawk.io";
  const webhookUrl = `${appUrl}/api/webhook/bland`;

  let callId: string;

  if (campaign_id) {
    // Add the contact to the campaign queue and make a single call using campaign settings
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .eq("org_id", org.id)
      .single();

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or does not belong to this org" },
        { status: 404 }
      );
    }

    // Reserve one call from balance
    const { data: reserved } = await supabase.rpc("reserve_call_balance", {
      p_org_id: org.id,
      p_count: 1,
    });

    if (!reserved) {
      return NextResponse.json(
        { error: "Insufficient call balance" },
        { status: 402 }
      );
    }

    // Insert contact into campaign
    const { data: contact } = await supabase
      .from("contacts")
      .insert({
        org_id: org.id,
        campaign_id,
        phone,
        status: "queued",
        metadata: contact_id ? { ghl_contact_id: contact_id } : {},
      })
      .select("id")
      .single();

    // Insert call record
    const { data: callRecord } = await supabase
      .from("calls")
      .insert({
        org_id: org.id,
        campaign_id,
        contact_id: contact?.id ?? null,
        phone,
        status: "queued",
        metadata: contact_id ? { ghl_contact_id: contact_id } : {},
      })
      .select("id")
      .single();

    callId = callRecord?.id ?? "";

    const campaignMeta = (campaign.metadata as Record<string, unknown>) || {};

    try {
      const result = await makeCall({
        phone,
        prompt: campaign.agent_prompt,
        firstSentence: campaign.first_sentence || undefined,
        analysisPrompt: campaign.analysis_prompt || undefined,
        voice: campaign.voice,
        language: campaign.language,
        maxDuration: campaign.max_duration,
        webhookUrl,
        dispositions: campaign.dispositions || undefined,
        metadata: {
          org_id: org.id,
          campaign_id,
          contact_id: contact?.id ?? "",
          steve_call_id: callId,
          ...(contact_id ? { ghl_contact_id: contact_id } : {}),
        },
        ...(Array.isArray(campaignMeta.guard_rails) &&
        campaignMeta.guard_rails.length > 0
          ? {
              guardRails: campaignMeta.guard_rails as Array<{
                description: string;
                action: string;
              }>,
            }
          : {}),
      });

      // Store bland call id
      await supabase
        .from("calls")
        .update({ bland_call_id: result?.call_id ?? null, status: "dialing" })
        .eq("id", callId);
    } catch (err) {
      // Release reserved balance on Bland failure
      await supabase.rpc("decrement_call_balance", { p_org_id: org.id });
      console.error("[ghl/trigger] Bland call failed:", err);
      return NextResponse.json(
        { error: "Failed to initiate call" },
        { status: 500 }
      );
    }
  } else {
    // Single call with provided prompt (no campaign)
    const { data: reserved } = await supabase.rpc("reserve_call_balance", {
      p_org_id: org.id,
      p_count: 1,
    });

    if (!reserved) {
      return NextResponse.json(
        { error: "Insufficient call balance" },
        { status: 402 }
      );
    }

    const { data: callRecord } = await supabase
      .from("calls")
      .insert({
        org_id: org.id,
        phone,
        status: "queued",
        metadata: contact_id ? { ghl_contact_id: contact_id } : {},
      })
      .select("id")
      .single();

    callId = callRecord?.id ?? "";

    try {
      const result = await makeCall({
        phone,
        prompt:
          prompt ||
          "You are a helpful phone agent calling on behalf of a business. Be professional and brief.",
        webhookUrl,
        metadata: {
          org_id: org.id,
          steve_call_id: callId,
          ...(contact_id ? { ghl_contact_id: contact_id } : {}),
        },
      });

      await supabase
        .from("calls")
        .update({ bland_call_id: result?.call_id ?? null, status: "dialing" })
        .eq("id", callId);
    } catch (err) {
      await supabase.rpc("decrement_call_balance", { p_org_id: org.id });
      console.error("[ghl/trigger] Bland call failed:", err);
      return NextResponse.json(
        { error: "Failed to initiate call" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true, call_id: callId });
}
