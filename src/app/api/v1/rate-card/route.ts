import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("active") !== "false";

    let query = supabase
      .from("rate_card_items")
      .select("*")
      .eq("org_id", org.id);

    if (activeOnly) query = query.eq("is_active", true);
    if (category) query = query.eq("category", category);

    const { data: items, error } = await query
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error)
      return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ data: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

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
    const { name, description, unit, price_min_cents, price_max_cents, category, sort_order } =
      body;

    if (!name || price_min_cents === undefined) {
      return Response.json(
        { error: "name and price_min_cents are required" },
        { status: 400 }
      );
    }

    const { data: item, error } = await supabase
      .from("rate_card_items")
      .insert({
        org_id: org.id,
        name,
        description: description || null,
        unit: unit || "each",
        price_min_cents,
        price_max_cents: price_max_cents ?? price_min_cents,
        category: category || null,
        is_active: true,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error)
      return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ data: item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
