import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Bot, Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listPersonas } from "@/lib/bland";
import { DeletePersonaButton } from "./delete-button";

export default async function PersonasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let personas: Array<Record<string, unknown>> = [];
  let error: string | null = null;

  try {
    const result = await listPersonas();
    // Bland returns { personas: [...] } or an array directly
    personas = Array.isArray(result) ? result : result?.personas ?? [];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load personas";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Personas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI personalities for different use cases. Each persona has its own
            voice, language, and style.
          </p>
        </div>
        <Link
          href="/dashboard/personas/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all"
        >
          <Plus className="w-4 h-4" />
          New Persona
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {!error && personas.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-16 text-center">
          <Bot className="w-14 h-14 text-muted-foreground opacity-30 mb-5" />
          <h3 className="text-lg font-semibold mb-2">No personas yet</h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm">
            Personas are AI agents with unique names, voices, and personalities.
            Create one to use across multiple campaigns.
          </p>
          <Link
            href="/dashboard/personas/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Persona
          </Link>
        </div>
      )}

      {personas.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          {personas.map((p) => (
            <div
              key={String(p.id || p.persona_id)}
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow group relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate">
                    {String(p.name || "Unnamed")}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mic className="w-3 h-3 flex-shrink-0" />
                    {String(p.voice || "default")}
                    {p.language ? ` \u00B7 ${String(p.language)}` : ""}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {String(p.description || p.prompt || "No description")}
              </p>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-end">
                <DeletePersonaButton
                  id={String(p.id || p.persona_id)}
                  name={String(p.name || "Unnamed")}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
