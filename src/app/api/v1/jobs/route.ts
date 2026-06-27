import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/** GET /api/v1/jobs — List jobs for org, optional ?status= filter */
export async function GET(request: NextRequest) {
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

    const status = request.nextUrl.searchParams.get("status");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "100", 10);
    const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0", 10);

    let query = supabase
      .from("jobs")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: jobs, error } = await query;

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ jobs: jobs ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** POST /api/v1/jobs — Create a new job */
export async function POST(request: NextRequest) {
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

    if (!body.title) return Response.json({ error: "title is required" }, { status: 400 });

    // Get next job number via RPC
    const { data: jobNumber } = await supabase.rpc("next_job_number", {
      p_org_id: org.id,
    });

    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        org_id: org.id,
        job_number: jobNumber || "JOB-0001",
        title: body.title,
        customer_name: body.customer_name || null,
        customer_phone: body.customer_phone || null,
        customer_address: body.customer_address || null,
        scheduled_date: body.scheduled_date || null,
        scheduled_time_start: body.scheduled_time_start || null,
        scheduled_time_end: body.scheduled_time_end || null,
        notes: body.notes || null,
        total_cents: body.total_cents || null,
        status: body.status || "booked",
        deal_id: body.deal_id || null,
        quote_id: body.quote_id || null,
        contact_id: body.contact_id || null,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true, job }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
