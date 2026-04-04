import type { SupabaseClient } from "@supabase/supabase-js";
import { sendSMS, makeCall } from "@/lib/bland";
import { recordTimelineEvent } from "@/lib/timeline";

export async function processSequenceEnrollments(supabase: SupabaseClient) {
  const now = new Date().toISOString();

  const { data: enrollments } = await supabase
    .from("sequence_enrollments")
    .select(`
      id, sequence_id, contact_id, org_id, current_step, status,
      contacts!inner(id, phone, name, metadata),
      sequences!inner(id, name, enabled)
    `)
    .eq("status", "active")
    .lte("next_action_at", now)
    .limit(100);

  if (!enrollments || enrollments.length === 0) {
    return { processed: 0 };
  }

  let processed = 0;

  for (const enrollment of enrollments) {
    const sequence = enrollment.sequences as unknown as { id: string; name: string; enabled: boolean };
    const contact = enrollment.contacts as unknown as { id: string; phone: string; name: string | null; metadata: Record<string, unknown> };

    if (!sequence.enabled) {
      await supabase
        .from("sequence_enrollments")
        .update({ status: "paused" })
        .eq("id", enrollment.id);
      continue;
    }

    // Fetch all steps for this sequence
    const { data: steps } = await supabase
      .from("sequence_steps")
      .select("id, step_order, step_type, config")
      .eq("sequence_id", enrollment.sequence_id)
      .order("step_order", { ascending: true });

    if (!steps || enrollment.current_step >= steps.length) {
      await supabase
        .from("sequence_enrollments")
        .update({ status: "completed" })
        .eq("id", enrollment.id);
      continue;
    }

    const step = steps[enrollment.current_step];
    const config = (step.config || {}) as Record<string, unknown>;

    try {
      switch (step.step_type) {
        case "wait": {
          const delayHours = Number(config.delay_hours) || 24;
          const nextAt = new Date(Date.now() + delayHours * 60 * 60 * 1000);
          await supabase
            .from("sequence_enrollments")
            .update({
              current_step: enrollment.current_step + 1,
              next_action_at: nextAt.toISOString(),
            })
            .eq("id", enrollment.id);
          break;
        }

        case "sms": {
          const message = String(config.message || "")
            .replace(/\{\{name\}\}/g, contact.name || "")
            .replace(/\{\{phone\}\}/g, contact.phone);
          await sendSMS(contact.phone, message);
          await advanceEnrollment(supabase, enrollment, steps);
          await recordTimelineEvent(supabase, {
            orgId: enrollment.org_id,
            contactId: contact.id,
            eventType: "sequence_step",
            eventData: { sequence_id: enrollment.sequence_id, step_type: "sms", message },
          });
          break;
        }

        case "call": {
          const prompt = String(config.prompt || "");
          const firstSentence = config.first_sentence ? String(config.first_sentence) : undefined;
          const voice = config.voice ? String(config.voice) : "nat";
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://skawk.io";

          await makeCall({
            phone: contact.phone,
            prompt,
            firstSentence,
            voice,
            language: String(config.language || "en-AU"),
            maxDuration: Number(config.max_duration) || 120,
            webhookUrl: `${appUrl}/api/webhook/bland`,
            metadata: {
              org_id: enrollment.org_id,
              contact_id: contact.id,
              sequence_enrollment_id: enrollment.id,
            },
          });
          await advanceEnrollment(supabase, enrollment, steps);
          await recordTimelineEvent(supabase, {
            orgId: enrollment.org_id,
            contactId: contact.id,
            eventType: "sequence_step",
            eventData: { sequence_id: enrollment.sequence_id, step_type: "call" },
          });
          break;
        }

        case "webhook": {
          const url = String(config.url);
          await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "sequence.step",
              contact: { id: contact.id, phone: contact.phone, name: contact.name },
              sequence_id: enrollment.sequence_id,
              step_order: enrollment.current_step,
            }),
          });
          await advanceEnrollment(supabase, enrollment, steps);
          break;
        }
      }

      processed++;
    } catch (err) {
      console.error(`[sequence] Step execution failed for enrollment ${enrollment.id}:`, err);
      await supabase
        .from("sequence_enrollments")
        .update({ status: "failed" })
        .eq("id", enrollment.id);
    }
  }

  return { processed };
}

async function advanceEnrollment(
  supabase: SupabaseClient,
  enrollment: { id: string; current_step: number },
  steps: Array<{ step_type: string; config: unknown }>
) {
  const nextStep = enrollment.current_step + 1;

  if (nextStep >= steps.length) {
    await supabase
      .from("sequence_enrollments")
      .update({ status: "completed", current_step: nextStep })
      .eq("id", enrollment.id);
    return;
  }

  // If next step is a wait, calculate delay; otherwise process immediately
  const next = steps[nextStep];
  const nextConfig = (next.config || {}) as Record<string, unknown>;
  let nextActionAt: string;

  if (next.step_type === "wait") {
    const delayHours = Number(nextConfig.delay_hours) || 24;
    nextActionAt = new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString();
    // Skip past the wait step so next execution hits the action after it
    const stepAfterWait = nextStep + 1;
    await supabase
      .from("sequence_enrollments")
      .update({ current_step: stepAfterWait, next_action_at: nextActionAt })
      .eq("id", enrollment.id);
  } else {
    nextActionAt = new Date().toISOString();
    await supabase
      .from("sequence_enrollments")
      .update({ current_step: nextStep, next_action_at: nextActionAt })
      .eq("id", enrollment.id);
  }
}
