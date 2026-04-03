import { redirect } from "next/navigation";
import Link from "next/link";
import { PhoneCall, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CallsTable } from "./calls-table";

export default async function CallsPage() {
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

  if (!membership) redirect("/dashboard");

  const { data: calls } = await supabase
    .from("calls")
    .select("*, campaigns(name)")
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Call Logs</h1>

      <div className="bg-background border border-border rounded-xl">
        {!calls || calls.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <PhoneCall className="w-14 h-14 mx-auto mb-5 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No calls yet</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
              Calls will appear here once you launch a campaign.
            </p>
            <Link
              href="/dashboard/campaigns/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </Link>
          </div>
        ) : (
          <CallsTable calls={calls as Parameters<typeof CallsTable>[0]["calls"]} />
        )}
      </div>
    </div>
  );
}
