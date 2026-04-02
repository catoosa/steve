import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listTools, createTool } from "@/lib/bland";

/** GET /api/tools — List all custom tools (dashboard auth) */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const result = await listTools();
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** POST /api/tools — Create a custom tool (dashboard auth) */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    if (!body.name?.trim()) {
      return Response.json({ error: "Tool name is required" }, { status: 400 });
    }
    if (!body.url?.trim()) {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }

    const result = await createTool(body);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
