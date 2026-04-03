import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Mic, Play, Ghost } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listVoices } from "@/lib/bland";
import { DeleteVoiceButton } from "./delete-button";

export default async function VoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let voices: Array<Record<string, unknown>> = [];
  let error: string | null = null;

  try {
    const result = await listVoices();
    // Bland returns { voices: [...] } or an array directly
    voices = Array.isArray(result) ? result : result?.voices ?? [];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load voices";
  }

  const customVoices = voices.filter(
    (v) => v.is_custom === true || v.type === "custom"
  );
  const systemVoices = voices.filter(
    (v) => v.is_custom !== true && v.type !== "custom"
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Voices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage cloned voices and browse built-in Bland AI voices for your
            agents.
          </p>
        </div>
        <Link
          href="/dashboard/voices/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all"
        >
          <Plus className="w-4 h-4" />
          Clone Voice
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {!error && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
            Custom Voices
          </h2>

          {customVoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
              <Ghost className="w-10 h-10 text-muted-foreground mb-4" />
              <h3 className="text-base font-semibold mb-1">
                No custom voices yet
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Clone a voice from an audio recording to create a personalised
                AI voice for your agents.
              </p>
              <Link
                href="/dashboard/voices/new"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all"
              >
                <Plus className="w-4 h-4" />
                Clone Voice
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {customVoices.map((v) => {
                const id = String(v.voice_id || v.id || "");
                const name = String(v.name || "Unnamed");
                return (
                  <div
                    key={id}
                    className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center">
                        <Mic className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{name}</h3>
                          <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary flex-shrink-0">
                            Custom
                          </span>
                        </div>
                        {v.language && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {String(v.language)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                      <button
                        disabled
                        title="Preview coming soon"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground opacity-40 cursor-not-allowed"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Preview
                      </button>
                      <DeleteVoiceButton id={id} name={name} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {!error && systemVoices.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
            Built-in Voices
          </h2>
          <div className="grid md:grid-cols-3 gap-3">
            {systemVoices.map((v) => {
              const id = String(v.voice_id || v.id || v.name || "");
              const name = String(v.name || id);
              return (
                <div
                  key={id}
                  className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div className="bg-muted w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mic className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    {v.language && (
                      <p className="text-xs text-muted-foreground">
                        {String(v.language)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
