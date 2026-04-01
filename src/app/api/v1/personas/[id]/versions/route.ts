import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getPersonaVersions, getPersonaVersion, promotePersonaVersion } from "@/lib/bland";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = createServiceClient();
    const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 401 });
    const { data: org } = await supabase.from("organizations").select("id").eq("api_key", apiKey).single();
    if (!org) return Response.json({ error: "Invalid API key" }, { status: 401 });

    // If version_id query param is provided, get specific version
    const versionId = request.nextUrl.searchParams.get("version_id");
    if (versionId) {
      const result = await getPersonaVersion(id, versionId);
      return Response.json(result);
    }

    const result = await getPersonaVersions(id);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = createServiceClient();
    const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 401 });
    const { data: org } = await supabase.from("organizations").select("id").eq("api_key", apiKey).single();
    if (!org) return Response.json({ error: "Invalid API key" }, { status: 401 });

    const body = await request.json();
    if (!body.version_id) return Response.json({ error: "version_id is required" }, { status: 400 });

    const result = await promotePersonaVersion(id, body.version_id);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
