import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { listNumbers, purchaseNumber } from "@/lib/bland";

/** GET /api/v1/numbers — List inbound numbers */
export async function GET(request: NextRequest) {
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

    if (org.plan === "starter") {
      return Response.json({ error: "Inbound numbers require Pro plan or above" }, { status: 403 });
    }

    const numbers = await listNumbers();
    return Response.json(numbers);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** POST /api/v1/numbers — Purchase a phone number */
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

    if (org.plan === "starter") {
      return Response.json({ error: "Inbound numbers require Pro plan or above" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.area_code) return Response.json({ error: "area_code is required" }, { status: 400 });

    const result = await purchaseNumber(body.area_code, body.country_code);
    return Response.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
