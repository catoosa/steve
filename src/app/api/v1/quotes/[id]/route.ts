import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: quote, error } = await supabase
      .from("quotes")
      .select("*, quote_line_items(*)")
      .eq("id", id)
      .eq("org_id", org.id)
      .single();

    if (error || !quote)
      return Response.json({ error: "Quote not found" }, { status: 404 });

    return Response.json({ data: quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify quote belongs to org
    const { data: existing } = await supabase
      .from("quotes")
      .select("id")
      .eq("id", id)
      .eq("org_id", org.id)
      .single();

    if (!existing)
      return Response.json({ error: "Quote not found" }, { status: 404 });

    const body = await request.json();
    const allowedFields = [
      "status",
      "customer_name",
      "customer_phone",
      "customer_email",
      "description",
      "notes",
      "valid_until",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    // Auto-set timestamp fields based on status changes
    if (body.status === "sent" && !body.sent_at)
      updates.sent_at = new Date().toISOString();
    if (body.status === "accepted" && !body.accepted_at)
      updates.accepted_at = new Date().toISOString();
    if (body.status === "declined" && !body.declined_at)
      updates.declined_at = new Date().toISOString();

    const { data: quote, error } = await supabase
      .from("quotes")
      .update(updates)
      .eq("id", id)
      .eq("org_id", org.id)
      .select()
      .single();

    if (error)
      return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ data: quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Delete line items first
    await supabase.from("quote_line_items").delete().eq("quote_id", id);

    const { error } = await supabase
      .from("quotes")
      .delete()
      .eq("id", id)
      .eq("org_id", org.id);

    if (error)
      return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
