import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNumber, updateNumber } from "@/lib/bland";

/** GET /api/numbers/[id] — Get number details (dashboard auth) */
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

    const result = await getNumber(id);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** POST /api/numbers/[id] — Update number config (dashboard auth) */
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
    const result = await updateNumber(id, {
      prompt: body.prompt,
      pathwayId: body.pathwayId,
      voice: body.voice,
      language: body.language,
      maxDuration: body.maxDuration,
      webhookUrl: body.webhookUrl,
      transferPhoneNumber: body.transferPhoneNumber,
    });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
