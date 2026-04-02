import { createClient } from "@/lib/supabase/server";
import { listVoices } from "@/lib/bland";

/** GET /api/voices — List available Bland AI voices (dashboard use) */
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
