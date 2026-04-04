import type { SupabaseClient } from "@supabase/supabase-js";

export async function recordTimelineEvent(
  supabase: SupabaseClient,
  params: {
    orgId: string;
    contactId: string;
    eventType: string;
    eventData?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.from("contact_timeline").insert({
    org_id: params.orgId,
    contact_id: params.contactId,
    event_type: params.eventType,
    event_data: params.eventData ?? {},
  });

  if (error) {
    console.error("[timeline] Failed to record event:", error.message);
  }
}
