import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/** GET /api/v1/sequences/:id — Get sequence with steps and enrollment stats */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

    const { data: sequence, error } = await supabase
      .from("sequences")
      .select("*, sequence_steps(*)")
      .eq("id", id)
      .eq("org_id", org.id)
      .single();

    if (error || !sequence)
      return Response.json({ error: "Sequence not found" }, { status: 404 });

    // Fetch enrollment stats
    const { data: enrollments } = await supabase
      .from("sequence_enrollments")
      .select("status")
      .eq("sequence_id", id);

    const stats = { active: 0, completed: 0, failed: 0 };
    for (const e of enrollments ?? []) {
      if (e.status in stats) stats[e.status as keyof typeof stats]++;
    }

    return Response.json({
      ...sequence,
      enrollment_stats: stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** PATCH /api/v1/sequences/:id — Update sequence fields and optionally replace steps */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
    const { data: existing } = await supabase
      .from("sequences")
      .select("id")
      .eq("id", id)
      .eq("org_id", org.id)
      .single();

    if (!existing)
      return Response.json({ error: "Sequence not found" }, { status: 404 });

    const body = await request.json();
    const { steps, ...fields } = body;

    // Update sequence fields if any
    if (Object.keys(fields).length > 0) {
      const { error: updateError } = await supabase
        .from("sequences")
        .update(fields)
        .eq("id", id)
        .eq("org_id", org.id);

      if (updateError)
        return Response.json({ error: updateError.message }, { status: 500 });
    }

    // Replace steps if provided
    if (Array.isArray(steps)) {
      // Delete existing steps
      const { error: deleteError } = await supabase
        .from("sequence_steps")
        .delete()
        .eq("sequence_id", id);

      if (deleteError)
        return Response.json({ error: deleteError.message }, { status: 500 });

      // Insert new steps
      if (steps.length > 0) {
        const stepsPayload = steps.map(
          (s: { step_order: number; step_type: string; config: unknown }) => ({
            sequence_id: id,
            step_order: s.step_order,
            step_type: s.step_type,
            config: s.config,
          })
        );

        const { error: insertError } = await supabase
          .from("sequence_steps")
          .insert(stepsPayload);

        if (insertError)
          return Response.json({ error: insertError.message }, { status: 500 });
      }
    }

    // Return updated sequence with steps
    const { data: updated, error: fetchError } = await supabase
      .from("sequences")
      .select("*, sequence_steps(*)")
      .eq("id", id)
      .eq("org_id", org.id)
      .single();

    if (fetchError)
      return Response.json({ error: fetchError.message }, { status: 500 });

    return Response.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/v1/sequences/:id — Delete sequence */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

    const { error } = await supabase
      .from("sequences")
      .delete()
      .eq("id", id)
      .eq("org_id", org.id);

    if (error)
      return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
