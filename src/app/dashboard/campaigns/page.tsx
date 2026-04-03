import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CampaignsList } from "./campaigns-list";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const orgId = membership?.org_id;
  if (!orgId) redirect("/dashboard");

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="bg-background border border-border rounded-xl px-6 py-20 text-center">
          <Megaphone className="w-14 h-14 mx-auto mb-5 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
            Launch your first AI calling campaign in minutes. Upload contacts,
            configure your AI agent, and go.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/dashboard/pathways"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Browse Templates
            </Link>
            <Link
              href="/dashboard/campaigns/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Start from Scratch
            </Link>
          </div>
        </div>
      ) : (
        <CampaignsList campaigns={campaigns} />
      )}
    </div>
  );
}
