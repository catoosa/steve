import { redirect } from "next/navigation";
import { Plus, GitBranch } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  CAMPAIGN_TEMPLATES,
  TEMPLATE_CATEGORIES,
} from "@/lib/campaign-templates";
import { TemplateBrowser } from "./template-browser";
import { PathwaysList } from "./pathways-list";

export default async function PathwaysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const categories = Object.entries(TEMPLATE_CATEGORIES).map(
    ([category, keys]) => ({
      category,
      templates: keys
        .filter((k) => CAMPAIGN_TEMPLATES[k])
        .map((key) => ({
          key,
          title: CAMPAIGN_TEMPLATES[key].title,
          desc: CAMPAIGN_TEMPLATES[key].desc,
          voice: CAMPAIGN_TEMPLATES[key].voice,
          language: CAMPAIGN_TEMPLATES[key].language,
          maxDuration: CAMPAIGN_TEMPLATES[key].maxDuration,
          isBlank: key === "blank",
        })),
    })
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Conversation Pathways</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Design complex call flows with branching logic, data collection, and
            conditional responses.
          </p>
        </div>
        <Link
          href="/dashboard/pathways/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all"
        >
          <Plus className="w-4 h-4" />
          New Pathway
        </Link>
      </div>

      {/* Templates */}
      <h2 className="font-semibold mb-4">Start from a template</h2>
      <TemplateBrowser categories={categories} />

      {/* Your Pathways */}
      <PathwaysList />
    </div>
  );
}
