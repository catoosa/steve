import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/** GET /api/v1/bookings — List bookings, optional ?start=&end=&status= filters */
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
    const start = request.nextUrl.searchParams.get("start");
    const end = request.nextUrl.searchParams.get("end");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "100", 10);

    let query = supabase
      .from("bookings")
      .select("*")
      .eq("org_id", org.id)
      .order("scheduled_start", { ascending: true })
      .limit(limit);

    if (status) query = query.eq("status", status);
    if (start) query = query.gte("scheduled_start", start);
    if (end) query = query.lte("scheduled_start", end);

    const { data: bookings, error } = await query;

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ bookings: bookings ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** POST /api/v1/bookings — Create a booking */
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
    if (!body.scheduled_start) return Response.json({ error: "scheduled_start is required" }, { status: 400 });
    if (!body.scheduled_end) return Response.json({ error: "scheduled_end is required" }, { status: 400 });

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        org_id: org.id,
        title: body.title,
        customer_name: body.customer_name || null,
        customer_phone: body.customer_phone || null,
        customer_address: body.customer_address || null,
        scheduled_start: body.scheduled_start,
        scheduled_end: body.scheduled_end,
        notes: body.notes || null,
        status: body.status || "confirmed",
        job_id: body.job_id || null,
        deal_id: body.deal_id || null,
        contact_id: body.contact_id || null,
        call_id: body.call_id || null,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
