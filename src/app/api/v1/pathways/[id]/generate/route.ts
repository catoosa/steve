import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generatePathway, getPathwayGenerationStatus } from "@/lib/bland";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: _id } = await params;
  try {
    const supabase = createServiceClient();
    const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 401 });
    const { data: org } = await supabase.from("organizations").select("id").eq("api_key", apiKey).single();
    if (!org) return Response.json({ error: "Invalid API key" }, { status: 401 });

    const body = await request.json();

    // If job_id is provided, check status; otherwise generate
    if (body.job_id) {
      const result = await getPathwayGenerationStatus(body.job_id);
      return Response.json(result);
    }

    if (!body.prompt) return Response.json({ error: "prompt is required" }, { status: 400 });
    const result = await generatePathway(body.prompt);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
