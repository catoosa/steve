import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatWithPathway } from "@/lib/bland";

/** POST /api/pathways/[id]/chat — Test-chat with a pathway (dashboard auth) */
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
    if (!body.message)
      return Response.json({ error: "message is required" }, { status: 400 });

    const result = await chatWithPathway(id, body.message, body.chatId);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
