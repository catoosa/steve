import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/** POST /api/v1/sequences/:id/enroll — Enroll contacts in a sequence */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sequenceId } = await params;

  try {
    const supabase = createServiceClient();
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey)
      return Response.json({ error: "Missing API key" }, { status: 401 });

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("api_key", apiKey)
      .single();

    if (!org)
      return Response.json({ error: "Invalid API key" }, { status: 401 });

    // Verify sequence belongs to org
    const { data: sequence } = await supabase
      .from("sequences")
      .select("id")
      .eq("id", sequenceId)
      .eq("org_id", org.id)
      .single();

    if (!sequence)
      return Response.json({ error: "Sequence not found" }, { status: 404 });

    const body = await request.json();
    const { contact_ids } = body;

    if (!Array.isArray(contact_ids) || contact_ids.length === 0)
      return Response.json(
        { error: "contact_ids must be a non-empty array" },
        { status: 400 }
      );

    // Verify all contacts belong to org
    const { data: validContacts } = await supabase
      .from("contacts")
      .select("id")
      .eq("org_id", org.id)
      .in("id", contact_ids);

    const validIds = new Set((validContacts ?? []).map((c: { id: string }) => c.id));
    const skipped = contact_ids.filter((cid: string) => !validIds.has(cid)).length;

    // Build enrollment rows for valid contacts
    const enrollments = contact_ids
      .filter((cid: string) => validIds.has(cid))
      .map((contactId: string) => ({
        sequence_id: sequenceId,
        contact_id: contactId,
        status: "active",
        current_step: 0,
        next_action_at: new Date().toISOString(),
      }));

    let enrolled = 0;
    if (enrollments.length > 0) {
      const { data, error } = await supabase
        .from("sequence_enrollments")
        .upsert(enrollments, { onConflict: "sequence_id,contact_id", ignoreDuplicates: true })
        .select("id");

      if (error)
        return Response.json({ error: error.message }, { status: 500 });

      enrolled = data?.length ?? 0;
    }

    const duplicates = enrollments.length - enrolled;

    return Response.json({
      enrolled,
      skipped: skipped + duplicates,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
