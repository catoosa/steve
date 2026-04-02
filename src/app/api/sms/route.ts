import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSMS, listSMSConversations } from "@/lib/bland";

/** GET /api/sms — List SMS conversations (dashboard auth) */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const result = await listSMSConversations();
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** POST /api/sms — Send a single SMS (dashboard auth) */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.to || !body.message) {
      return Response.json(
        { error: "to and message are required" },
        { status: 400 }
      );
    }

    const result = await sendSMS(body.to, body.message, body.from);
    return Response.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
