import { createClient } from "@/lib/supabase/server";

async function blandFetch(path: string, apiKey: string) {
  const res = await fetch(`https://api.bland.ai/v1${path}`, {
    headers: { Authorization: apiKey, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Bland API error: ${res.status}`);
  return res.json();
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { bland_api_key } = await request.json();
    if (!bland_api_key) return Response.json({ error: "API key required" }, { status: 400 });

    // Scan Bland account in parallel
    const [personas, pathways, tools, voices, guardRails] = await Promise.allSettled([
      blandFetch("/agents", bland_api_key).then((d) => d.agents || d || []),
      blandFetch("/convo_pathway", bland_api_key).then((d) => d.pathways || d || []),
      blandFetch("/tools", bland_api_key).then((d) => d.tools || d || []),
      blandFetch("/voices", bland_api_key).then((d) => d.voices || d || []),
      blandFetch("/guard_rails", bland_api_key).then((d) => d.guard_rails || d || []),
    ]);

    return Response.json({
      personas: personas.status === "fulfilled" ? (Array.isArray(personas.value) ? personas.value.length : 0) : 0,
      pathways: pathways.status === "fulfilled" ? (Array.isArray(pathways.value) ? pathways.value.length : 0) : 0,
      tools: tools.status === "fulfilled" ? (Array.isArray(tools.value) ? tools.value.length : 0) : 0,
      voices: voices.status === "fulfilled" ? (Array.isArray(voices.value) ? voices.value.length : 0) : 0,
      guard_rails: guardRails.status === "fulfilled" ? (Array.isArray(guardRails.value) ? guardRails.value.length : 0) : 0,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json({ error: msg }, { status: 500 });
  }
}
