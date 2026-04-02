import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listNumbers, purchaseNumber } from "@/lib/bland";

/** GET /api/numbers — List inbound numbers (dashboard auth) */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const result = await listNumbers();
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** POST /api/numbers — Purchase a phone number (dashboard auth) */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.areaCode) {
      return Response.json({ error: "areaCode is required" }, { status: 400 });
    }

    const result = await purchaseNumber(body.areaCode, body.country);
    return Response.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
