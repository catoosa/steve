import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePathway } from "@/lib/bland";

/** POST /api/pathways/[id]/generate — AI-generate a pathway from a prompt (dashboard auth) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // id is available if we want to associate the generation with an existing pathway
  await params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.prompt)
      return Response.json({ error: "prompt is required" }, { status: 400 });

    const result = await generatePathway(body.prompt);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
