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

    // Verify contact belongs to the org
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", id)
      .eq("org_id", org.id)
      .single();

    if (!contact)
      return Response.json({ error: "Contact not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const { data: events, error, count } = await supabase
      .from("contact_timeline")
      .select("*", { count: "exact" })
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error)
      return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ data: events, total: count });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
