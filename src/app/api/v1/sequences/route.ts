import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/** GET /api/v1/sequences — List sequences for org with active enrollment counts */
export async function GET(request: NextRequest) {
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

    const { data: sequences, error } = await supabase
      .from("sequences")
      .select("*, sequence_steps(*), sequence_enrollments(id)")
      .eq("org_id", org.id)
      .eq("sequence_enrollments.status", "active")
      .order("created_at", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });

    const result = (sequences ?? []).map((seq: Record<string, unknown> & { sequence_enrollments?: unknown[] }) => ({
      ...seq,
      active_enrollments: seq.sequence_enrollments?.length ?? 0,
      sequence_enrollments: undefined,
    }));

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** POST /api/v1/sequences — Create sequence with steps */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, enabled = true, steps = [] } = body;

    if (!name)
      return Response.json({ error: "name is required" }, { status: 400 });

    // Insert sequence
    const { data: sequence, error: seqError } = await supabase
      .from("sequences")
      .insert({ name, description, enabled, org_id: org.id })
      .select()
      .single();

    if (seqError)
      return Response.json({ error: seqError.message }, { status: 500 });

    // Insert steps
    let insertedSteps: typeof steps = [];
    if (steps.length > 0) {
      const stepsPayload = steps.map(
        (s: { step_order: number; step_type: string; config: unknown }) => ({
          sequence_id: sequence.id,
          step_order: s.step_order,
          step_type: s.step_type,
          config: s.config,
        })
      );

      const { data: stepsData, error: stepsError } = await supabase
        .from("sequence_steps")
        .insert(stepsPayload)
        .select()
        .order("step_order", { ascending: true });

      if (stepsError)
        return Response.json({ error: stepsError.message }, { status: 500 });

      insertedSteps = stepsData;
    }

    return Response.json(
      { ...sequence, sequence_steps: insertedSteps },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
