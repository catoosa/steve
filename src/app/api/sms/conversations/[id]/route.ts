import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSMSConversation, analyzeSMSConversation } from "@/lib/bland";

/** GET /api/sms/conversations/[id] — Get SMS conversation details (dashboard auth) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const result = await getSMSConversation(id);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** POST /api/sms/conversations/[id] — Analyze SMS conversation (dashboard auth) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.prompt) {
      return Response.json(
        { error: "prompt is required for analysis" },
        { status: 400 }
      );
    }

    const result = await analyzeSMSConversation(id, body.prompt);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
