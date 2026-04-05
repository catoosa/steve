import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

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

    // Auto-add to DNC if disposition is DO_NOT_CALL
    const dispositionValue =
      analysis && typeof analysis === "object"
        ? (analysis as Record<string, unknown>).disposition
        : undefined;
    const dispositionStr =
      typeof dispositionValue === "string" ? dispositionValue.toUpperCase() : "";
    if (payload.to && dispositionStr === "DO_NOT_CALL") {
      const rawPhone = String(payload.to).trim();
      const normalizedPhone = rawPhone.startsWith("+")
        ? "+" + rawPhone.slice(1).replace(/\D/g, "")
        : rawPhone.replace(/\D/g, "");
      await supabase
        .from("dnc_numbers")
        .upsert(
          { org_id: orgId, phone: normalizedPhone, source: "opt_out" },
          { onConflict: "org_id,phone", ignoreDuplicates: true }
        );
    }

    // Deduct from org call balance
    await supabase.rpc("decrement_call_balance", { p_org_id: orgId });

    // Fetch updated org for low-balance alert, customer webhook URL, and GHL settings
    const { data: org } = await supabase
      .from("organizations")
      .select("call_balance, monthly_call_limit, name, webhook_url, ghl_enabled, ghl_api_key, ghl_location_id")
      .eq("id", orgId)
      .single();

    // Send low-balance alert at exactly 50, 25, or 10 remaining calls
    const LOW_BALANCE_THRESHOLDS = [10, 25, 50];
    const currentBalance = org?.call_balance ?? 0;

    if (LOW_BALANCE_THRESHOLDS.includes(currentBalance)) {
      try {
        const { data: ownerRow } = await supabase
          .from("org_members")
          .select("users:user_id(email)")
          .eq("org_id", orgId)
          .limit(1)
          .single();

        const ownerEmail = (ownerRow?.users as { email?: string } | null)?.email;

        if (ownerEmail) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://skawk.io";
          const orgName = org?.name || "Your organisation";

          await getResend().emails.send({
            from: "alerts@skawk.io",
            to: ownerEmail,
            subject: `Low call balance alert — ${currentBalance} calls remaining`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background: #f4f4f5; margin: 0; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
    <h2 style="margin: 0 0 8px; color: #111;">Low call balance</h2>
    <p style="color: #555; margin: 0 0 24px;">This is an automated alert for <strong>${orgName}</strong>.</p>
    <div style="background: #fef9c3; border: 1px solid #fde047; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #713f12;">
        ${currentBalance} calls remaining
      </p>
    </div>
    <p style="color: #555; margin: 0 0 24px;">
      Top up your balance to keep your campaigns running without interruption.
    </p>
    <a href="${appUrl}/dashboard/billing"
       style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
      Top up balance
    </a>
  </div>
</body>
</html>`,
          });
        }
      } catch (emailErr) {
        console.error("[webhook] Low-balance email failed:", emailErr);
      }
    }

    // Forward to customer webhook if configured

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

    // Push call result to GHL if integration is enabled
    if (org?.ghl_enabled && org?.ghl_api_key && org?.ghl_location_id) {
      try {
        const disposition =
          analysis && typeof analysis === "object"
            ? (analysis as Record<string, unknown>).disposition as string | undefined
            : undefined;
        const summary =
          analysis && typeof analysis === "object"
            ? (analysis as Record<string, unknown>).summary as string | undefined
            : undefined;

        await pushToGHL(
          org.ghl_api_key,
          org.ghl_location_id,
          payload.to,
          {
            status,
            disposition,
            summary,
            duration: payload.call_length ?? undefined,
          }
        );
      } catch (ghlErr) {
        console.error("[webhook] GHL push failed:", ghlErr);
      }
    }

    // === WORKFLOW AUTOMATION ENGINE ===
    if (steveCallId && orgId) {
      try {
        const { executeWorkflows } = await import("@/lib/workflows/engine");
        const callContext = {
          id: steveCallId,
          status,
          answered_by: payload.answered_by ?? null,
          duration_seconds: payload.call_length ?? null,
          analysis,
          transcript: transcript || null,
          phone: payload.to || "",
          metadata: metadata || {},
          contact: null as { id: string; name: string | null; status: string; metadata: Record<string, unknown> } | null,
          campaign_id: campaignId || null,
        };

        // Enrich with contact details
        if (contactId) {
          const { data: contact } = await supabase
            .from("contacts")
            .select("id, name, status, metadata")
            .eq("id", contactId)
            .single();
          if (contact) callContext.contact = contact;
        }

        await Promise.race([
          executeWorkflows(callContext, orgId, supabase),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Workflow timeout")), 30000)),
        ]);
      } catch (wfErr) {
        console.error("[webhook] Workflow execution error:", wfErr);
      }
    }

    // Record call timeline event
    if (contactId && orgId) {
      try {
        const { recordTimelineEvent } = await import("@/lib/timeline");
        await recordTimelineEvent(supabase, {
          orgId,
          contactId,
          eventType: "call",
          eventData: {
            call_id: steveCallId,
            status,
            duration_seconds: payload.call_length,
            answered_by: payload.answered_by,
            analysis,
          },
        });
      } catch (tlErr) {
        console.error("[webhook] Timeline event error:", tlErr);
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

/**
 * Push a call result to a GHL contact as a note.
 * Uses the GHL API v2 to look up the contact by phone, then adds a note.
 */
async function pushToGHL(
  apiKey: string,
  locationId: string,
  contactPhone: string,
  callResult: {
    status: string;
    disposition?: string;
    summary?: string;
    duration?: number;
  }
) {
  // Search for contact by phone number
  const searchRes = await fetch(
    `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${locationId}&phone=${encodeURIComponent(contactPhone)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: "2021-07-28",
      },
    }
  );

  if (!searchRes.ok) return;

  const { contact } = await searchRes.json();
  if (!contact?.id) return;

  // Add a note to the contact with the call result
  await fetch(
    `https://services.leadconnectorhq.com/contacts/${contact.id}/notes`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: [
          "Skawk AI Call Result",
          `Status: ${callResult.status}`,
          `Disposition: ${callResult.disposition || "N/A"}`,
          `Duration: ${callResult.duration || 0}s`,
          `Summary: ${callResult.summary || "N/A"}`,
        ].join("\n"),
      }),
    }
  );
}
