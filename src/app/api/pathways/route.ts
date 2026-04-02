import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listPathways, createPathway } from "@/lib/bland";

/** GET /api/pathways — List all pathways (dashboard auth) */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const result = await listPathways();
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** POST /api/pathways — Create a pathway (dashboard auth) */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.name) return Response.json({ error: "name is required" }, { status: 400 });

    const result = await createPathway(body.name, body.description || "", body.nodes);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
