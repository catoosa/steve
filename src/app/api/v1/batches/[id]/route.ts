import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getBatch, getBatchLogs } from "@/lib/bland";

/** GET /api/v1/batches/:id — Get batch status */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = createServiceClient();
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 401 });

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("api_key", apiKey)
      .single();

    if (!org) return Response.json({ error: "Invalid API key" }, { status: 401 });

    const [batch, logs] = await Promise.all([
      getBatch(id),
      getBatchLogs(id).catch(() => null),
    ]);

    return Response.json({
      batch_id: id,
      ...batch,
      logs: logs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
