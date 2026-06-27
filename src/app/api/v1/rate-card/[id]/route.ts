import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

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

    // Verify item belongs to org
    const { data: existing } = await supabase
      .from("rate_card_items")
      .select("id")
      .eq("id", id)
      .eq("org_id", org.id)
      .single();

    if (!existing)
      return Response.json({ error: "Item not found" }, { status: 404 });

    const body = await request.json();
    const allowedFields = [
      "name",
      "description",
      "unit",
      "price_min_cents",
      "price_max_cents",
      "category",
      "is_active",
      "sort_order",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: item, error } = await supabase
      .from("rate_card_items")
      .update(updates)
      .eq("id", id)
      .eq("org_id", org.id)
      .select()
      .single();

    if (error)
      return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ data: item });
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

    const { error } = await supabase
      .from("rate_card_items")
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
