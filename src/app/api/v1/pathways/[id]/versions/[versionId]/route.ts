import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getPathwayVersion, deletePathwayVersion } from "@/lib/bland";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;
  try {
    const supabase = createServiceClient();
    const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 401 });
    const { data: org } = await supabase.from("organizations").select("id").eq("api_key", apiKey).single();
    if (!org) return Response.json({ error: "Invalid API key" }, { status: 401 });

    const result = await getPathwayVersion(id, versionId);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;
  try {
    const supabase = createServiceClient();
    const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 401 });
    const { data: org } = await supabase.from("organizations").select("id").eq("api_key", apiKey).single();
    if (!org) return Response.json({ error: "Invalid API key" }, { status: 401 });

    const result = await deletePathwayVersion(id, versionId);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
