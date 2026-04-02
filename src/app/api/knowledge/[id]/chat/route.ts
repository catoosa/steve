import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatWithKB } from "@/lib/bland";

/** POST /api/knowledge/[id]/chat — Query a knowledge base */
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
    const { message } = body;

    if (!message?.trim()) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const result = await chatWithKB(id, message.trim());
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
