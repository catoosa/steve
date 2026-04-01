import { redirect } from "next/navigation";
import { Plus, GitBranch, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PathwaysPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Conversation Pathways</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Design complex call flows with branching logic, data collection, and conditional responses.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all">
          <Plus className="w-4 h-4" />
          New Pathway
        </button>
      </div>

      {/* Templates */}
      <h2 className="font-semibold mb-4">Start from a template</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          {
            title: "Appointment Reminder",
            desc: "Confirm, reschedule, or cancel. Handles objections gracefully.",
            nodes: 6,
          },
          {
            title: "Customer Survey",
            desc: "Multi-question survey with rating scales and open-ended follow-ups.",
            nodes: 8,
          },
          {
            title: "Lead Qualification",
            desc: "Budget, authority, need, timeline (BANT) qualification flow.",
            nodes: 10,
          },
          {
            title: "Stock Check",
            desc: "Ask about product availability with structured yes/no extraction.",
            nodes: 5,
          },
          {
            title: "Payment Collection",
            desc: "Remind about outstanding balance and collect payment commitment.",
            nodes: 7,
          },
          {
            title: "Blank Canvas",
            desc: "Start from scratch and build your own conversation flow.",
            nodes: 0,
            isBlank: true,
          },
        ].map((t) => (
          <div
            key={t.title}
            className={`bg-card border rounded-2xl p-5 cursor-pointer hover:shadow-lg transition-shadow ${
              t.isBlank ? "border-dashed border-primary/50" : "border-border"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">{t.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{t.desc}</p>
            {!t.isBlank && (
              <p className="text-[10px] text-muted-foreground font-medium">{t.nodes} nodes</p>
            )}
          </div>
        ))}
      </div>

      {/* Visual builder teaser */}
      <div className="bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end rounded-2xl p-8 text-white text-center">
        <GitBranch className="w-10 h-10 mx-auto mb-4 text-accent" />
        <h3 className="text-xl font-bold mb-2">Visual Pathway Builder</h3>
        <p className="text-white/60 max-w-md mx-auto mb-6 text-sm">
          Drag-and-drop conversation nodes, add conditions, and test your flows — all without writing code.
        </p>
        <span className="inline-flex items-center gap-2 text-accent text-sm font-medium">
          Coming soon <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
}
