import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendSMS } from "@/lib/bland";

/** POST /api/v1/sms — Send an SMS */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 401 });

    const { data: org } = await supabase
      .from("organizations")
      .select("id, plan")
      .eq("api_key", apiKey)
      .single();

    if (!org) return Response.json({ error: "Invalid API key" }, { status: 401 });

    const body = await request.json();

    if (!body.to) return Response.json({ error: "to is required" }, { status: 400 });
    if (!body.message) return Response.json({ error: "message is required" }, { status: 400 });

    const result = await sendSMS(body.to, body.message, body.from);

    return Response.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
