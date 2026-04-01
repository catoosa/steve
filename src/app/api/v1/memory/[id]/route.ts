import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getMemory, updateMemory, deleteMemory, enableMemory } from "@/lib/bland";

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

    const result = await getMemory(id);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
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

    // If only "enabled" field is provided, use enableMemory shorthand
    if (body.enabled !== undefined && Object.keys(body).length === 1) {
      const result = await enableMemory(id, body.enabled);
      return Response.json(result);
    }

    const result = await updateMemory(id, body);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
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

    const result = await deleteMemory(id);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
