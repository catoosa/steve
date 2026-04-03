import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listVoices, cloneVoice } from "@/lib/bland";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const voices = await listVoices();
    return Response.json(voices);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, audioUrl } = body as { name?: string; audioUrl?: string };

    if (!name || !name.trim()) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }
    if (!audioUrl || !audioUrl.trim()) {
      return Response.json({ error: "audioUrl is required" }, { status: 400 });
    }

    const result = await cloneVoice(name.trim(), audioUrl.trim());
    return Response.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
