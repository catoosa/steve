import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { mergeContacts } from "@/lib/bland";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 401 });
    const { data: org } = await supabase.from("organizations").select("id").eq("api_key", apiKey).single();
    if (!org) return Response.json({ error: "Invalid API key" }, { status: 401 });

    const body = await request.json();
    if (!body.contact_ids || !Array.isArray(body.contact_ids) || body.contact_ids.length < 2) {
      return Response.json({ error: "contact_ids array with at least 2 IDs is required" }, { status: 400 });
    }

    // Verify all contact_ids belong to the authenticated org
    const { data: contacts, error: verifyErr } = await supabase
      .from("contacts")
      .select("id")
      .eq("org_id", org.id)
      .in("id", body.contact_ids);

    if (verifyErr) {
      return Response.json({ error: "Failed to verify contacts" }, { status: 500 });
    }

    if (!contacts || contacts.length !== body.contact_ids.length) {
      return Response.json({ error: "One or more contact_ids do not belong to your organization" }, { status: 403 });
    }

    const result = await mergeContacts(body.contact_ids);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
