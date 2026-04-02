import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadTextToKB, uploadFileToKB, scrapeWebToKB } from "@/lib/bland";

/** POST /api/knowledge/[id]/upload — Upload content to a knowledge base */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { type } = body;

    if (type === "text") {
      const { text, name } = body;
      if (!text?.trim()) {
        return Response.json({ error: "Text content is required" }, { status: 400 });
      }
      const result = await uploadTextToKB(id, text.trim(), name?.trim() || undefined);
      return Response.json(result);
    }

    if (type === "file") {
      const { fileUrl } = body;
      if (!fileUrl?.trim()) {
        return Response.json({ error: "File URL is required" }, { status: 400 });
      }
      const result = await uploadFileToKB(id, fileUrl.trim());
      return Response.json(result);
    }

    if (type === "web") {
      const { urls } = body;
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return Response.json({ error: "At least one URL is required" }, { status: 400 });
      }
      const cleanUrls = urls.map((u: string) => u.trim()).filter(Boolean);
      if (cleanUrls.length === 0) {
        return Response.json({ error: "At least one valid URL is required" }, { status: 400 });
      }
      const result = await scrapeWebToKB(id, cleanUrls);
      return Response.json(result);
    }

    return Response.json(
      { error: "Invalid upload type. Use 'text', 'file', or 'web'." },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
