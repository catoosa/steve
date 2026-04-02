import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listKnowledgeBases, createKnowledgeBase } from "@/lib/bland";

/** GET /api/knowledge — List all knowledge bases (dashboard auth) */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const result = await listKnowledgeBases();
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

/** POST /api/knowledge — Create a knowledge base (dashboard auth) */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await createKnowledgeBase(name.trim(), description?.trim() || undefined);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
