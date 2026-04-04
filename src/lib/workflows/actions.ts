import type { SupabaseClient } from "@supabase/supabase-js";
import { sendSMS } from "@/lib/bland";
import type { CallContext } from "./conditions";
import { resolveTemplate } from "./conditions";
import { recordTimelineEvent } from "@/lib/timeline";

type ActionResult = { success: boolean; result?: unknown; error?: string };

export async function executeSendSms(
  config: Record<string, unknown>,
  context: CallContext,
  supabase: SupabaseClient
): Promise<ActionResult> {
  const message = resolveTemplate(String(config.message || ""), context);
  const to = String(config.to_field ? context.phone : context.phone);

  const result = await sendSMS(to, message);

  if (context.contact) {
    await recordTimelineEvent(supabase, {
      orgId: context.metadata.org_id as string,
      contactId: context.contact.id,
      eventType: "sms",
      eventData: { message, direction: "outbound", trigger: "workflow" },
    });
  }

  return { success: true, result };
}

export async function executeScheduleCallback(
  config: Record<string, unknown>,
  context: CallContext,
  supabase: SupabaseClient
): Promise<ActionResult> {
  const delayHours = Number(config.delay_hours) || 24;
  const scheduledAt = new Date(Date.now() + delayHours * 60 * 60 * 1000);
  const prompt = config.prompt
    ? resolveTemplate(String(config.prompt), context)
    : undefined;
  const firstSentence = config.first_sentence
    ? resolveTemplate(String(config.first_sentence), context)
    : undefined;

  const orgId = context.metadata.org_id as string;

  const { data: call, error } = await supabase
    .from("calls")
    .insert({
      org_id: orgId,
      campaign_id: context.campaign_id,
      contact_id: context.contact?.id,
      phone: context.phone,
      status: "queued",
      metadata: {
        org_id: orgId,
        campaign_id: context.campaign_id,
        contact_id: context.contact?.id,
        scheduled_callback: true,
        callback_prompt: prompt,
        callback_first_sentence: firstSentence,
        scheduled_at: scheduledAt.toISOString(),
      },
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  if (context.contact) {
    await recordTimelineEvent(supabase, {
      orgId,
      contactId: context.contact.id,
      eventType: "workflow_action",
      eventData: {
        action: "schedule_callback",
        call_id: call.id,
        scheduled_at: scheduledAt.toISOString(),
        delay_hours: delayHours,
      },
    });
  }

  return { success: true, result: { call_id: call.id, scheduled_at: scheduledAt } };
}

export async function executeCreateEscalation(
  config: Record<string, unknown>,
  context: CallContext,
  supabase: SupabaseClient
): Promise<ActionResult> {
  const orgId = context.metadata.org_id as string;
  const reason = resolveTemplate(String(config.reason_template || config.reason || "Escalation triggered"), context);
  const priority = String(config.priority || "medium");

  const { data: escalation, error } = await supabase
    .from("escalations")
    .insert({
      org_id: orgId,
      campaign_id: context.campaign_id,
      call_id: context.id,
      contact_id: context.contact?.id,
      priority,
      reason,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  if (context.contact) {
    await recordTimelineEvent(supabase, {
      orgId,
      contactId: context.contact.id,
      eventType: "escalation",
      eventData: {
        escalation_id: escalation.id,
        priority,
        reason,
      },
    });
  }

  return { success: true, result: { escalation_id: escalation.id } };
}

export async function executeWebhook(
  config: Record<string, unknown>,
  context: CallContext
): Promise<ActionResult> {
  const url = String(config.url);
  const headers = (config.headers as Record<string, string>) || {};

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        event: "workflow.action",
        call_id: context.id,
        phone: context.phone,
        status: context.status,
        analysis: context.analysis,
        contact: context.contact,
        campaign_id: context.campaign_id,
      }),
      signal: controller.signal,
    });
    return { success: res.ok, result: { status: res.status } };
  } catch (err) {
    return { success: false, error: String(err) };
  } finally {
    clearTimeout(timeout);
  }
}

export async function executeUpdateContact(
  config: Record<string, unknown>,
  context: CallContext,
  supabase: SupabaseClient
): Promise<ActionResult> {
  if (!context.contact) return { success: false, error: "No contact" };

  const updates = config.updates as Record<string, unknown> | undefined;
  if (!updates) return { success: false, error: "No updates specified" };

  const orgId = context.metadata.org_id as string;

  // Separate metadata updates from top-level field updates
  const metadataUpdates: Record<string, unknown> = {};
  const directUpdates: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(updates)) {
    if (key === "status") {
      directUpdates.status = val;
    } else {
      metadataUpdates[key] = val;
    }
  }

  const updatePayload: Record<string, unknown> = { ...directUpdates };
  if (Object.keys(metadataUpdates).length > 0) {
    const currentMeta = (context.contact.metadata || {}) as Record<string, unknown>;
    updatePayload.metadata = { ...currentMeta, ...metadataUpdates };
  }

  const { error } = await supabase
    .from("contacts")
    .update(updatePayload)
    .eq("id", context.contact.id);

  if (error) return { success: false, error: error.message };

  await recordTimelineEvent(supabase, {
    orgId,
    contactId: context.contact.id,
    eventType: "status_change",
    eventData: { updates, trigger: "workflow" },
  });

  return { success: true };
}

export async function executeAddToDnc(
  config: Record<string, unknown>,
  context: CallContext,
  supabase: SupabaseClient
): Promise<ActionResult> {
  const orgId = context.metadata.org_id as string;
  const reason = config.reason ? resolveTemplate(String(config.reason), context) : "Added by workflow";

  const { error } = await supabase.from("dnc_numbers").upsert(
    { org_id: orgId, phone: context.phone, reason, source: "workflow" },
    { onConflict: "org_id,phone", ignoreDuplicates: true }
  );

  if (error) return { success: false, error: error.message };

  if (context.contact) {
    await recordTimelineEvent(supabase, {
      orgId,
      contactId: context.contact.id,
      eventType: "dnc_added",
      eventData: { reason, source: "workflow" },
    });
  }

  return { success: true };
}

export async function executeEnrollInSequence(
  config: Record<string, unknown>,
  context: CallContext,
  supabase: SupabaseClient
): Promise<ActionResult> {
  if (!context.contact) return { success: false, error: "No contact" };

  const sequenceId = String(config.sequence_id);
  const orgId = context.metadata.org_id as string;

  const { error } = await supabase.from("sequence_enrollments").upsert(
    {
      sequence_id: sequenceId,
      contact_id: context.contact.id,
      org_id: orgId,
      current_step: 0,
      status: "active",
      next_action_at: new Date().toISOString(),
    },
    { onConflict: "sequence_id,contact_id", ignoreDuplicates: true }
  );

  if (error) return { success: false, error: error.message };

  await recordTimelineEvent(supabase, {
    orgId,
    contactId: context.contact.id,
    eventType: "sequence_enrolled",
    eventData: { sequence_id: sequenceId },
  });

  return { success: true };
}

const ACTION_MAP: Record<
  string,
  (config: Record<string, unknown>, context: CallContext, supabase: SupabaseClient) => Promise<ActionResult>
> = {
  send_sms: executeSendSms,
  schedule_callback: executeScheduleCallback,
  create_escalation: executeCreateEscalation,
  webhook: (config, context) => executeWebhook(config, context),
  update_contact: executeUpdateContact,
  add_to_dnc: executeAddToDnc,
  enroll_in_sequence: executeEnrollInSequence,
};

export async function executeAction(
  actionType: string,
  config: Record<string, unknown>,
  context: CallContext,
  supabase: SupabaseClient
): Promise<ActionResult> {
  const handler = ACTION_MAP[actionType];
  if (!handler) return { success: false, error: `Unknown action type: ${actionType}` };
  return handler(config, context, supabase);
}
