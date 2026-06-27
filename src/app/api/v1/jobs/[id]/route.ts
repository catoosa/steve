import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/** GET /api/v1/jobs/:id — Get job details */
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

    if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 401 });

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("api_key", apiKey)
      .single();

    if (!org) return Response.json({ error: "Invalid API key" }, { status: 401 });

    const { data: job } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .eq("org_id", org.id)
      .single();

    if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

    return Response.json({ job });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** PATCH /api/v1/jobs/:id — Update job */
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

    if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 401 });

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("api_key", apiKey)
      .single();

    if (!org) return Response.json({ error: "Invalid API key" }, { status: 401 });

    const body = await request.json();

    // Only allow updating known fields
    const allowedFields = [
      "title",
      "customer_name",
      "customer_phone",
      "customer_address",
      "scheduled_date",
      "scheduled_time_start",
      "scheduled_time_end",
      "actual_start",
      "actual_end",
      "notes",
      "total_cents",
      "status",
      "deal_id",
      "quote_id",
      "contact_id",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // If status is changing to in_progress, set actual_start
    if (updates.status === "in_progress" && !updates.actual_start) {
      updates.actual_start = new Date().toISOString();
    }
    // If status is changing to completed, set actual_end
    if (updates.status === "completed" && !updates.actual_end) {
      updates.actual_end = new Date().toISOString();
    }

    const { data: job, error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .eq("org_id", org.id)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

    return Response.json({ success: true, job });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/v1/jobs/:id — Delete a job */
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

    if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 401 });

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("api_key", apiKey)
      .single();

    if (!org) return Response.json({ error: "Invalid API key" }, { status: 401 });

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id)
      .eq("org_id", org.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true, message: "Job deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
