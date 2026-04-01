import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { uploadTextToKB, uploadFileToKB, scrapeWebToKB } from "@/lib/bland";

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

    // Determine upload type based on body fields
    if (body.text) {
      const result = await uploadTextToKB(id, body.text, body.name);
      return Response.json(result);
    }

    if (body.file_url) {
      const result = await uploadFileToKB(id, body.file_url);
      return Response.json(result);
    }

    if (body.urls && Array.isArray(body.urls)) {
      const result = await scrapeWebToKB(id, body.urls);
      return Response.json(result);
    }

    return Response.json(
      { error: "Provide one of: text, file_url, or urls[]" },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
