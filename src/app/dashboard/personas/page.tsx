import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Bot, Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function PersonasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const SAMPLE_PERSONAS = [
    {
      name: "Steve",
      voice: "mason",
      language: "en-AU",
      desc: "Friendly Australian bloke. Great for surveys and data collection.",
      color: "bg-primary",
    },
    {
      name: "Alex",
      voice: "nat",
      language: "en-US",
      desc: "Professional and warm. Perfect for appointment reminders.",
      color: "bg-secondary",
    },
    {
      name: "Custom",
      voice: "—",
      language: "—",
      desc: "Create your own persona with any voice, tone, and personality.",
      color: "bg-accent",
      isNew: true,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Personas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI personalities for different use cases. Each persona has its own voice, language, and style.
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

      <div className="grid md:grid-cols-3 gap-6">
        {SAMPLE_PERSONAS.map((p) => (
          <div
            key={p.name}
            className={`bg-card border rounded-2xl p-6 hover:shadow-lg transition-shadow ${
              p.isNew ? "border-dashed border-primary/50" : "border-border"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`${p.color} w-10 h-10 rounded-xl flex items-center justify-center`}>
                {p.isNew ? (
                  <Plus className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                {!p.isNew && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mic className="w-3 h-3" /> {p.voice} &middot; {p.language}
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
