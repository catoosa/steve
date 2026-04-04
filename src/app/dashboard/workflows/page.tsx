import { redirect } from "next/navigation";
import Link from "next/link";
import { Zap, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import WorkflowsList from "./workflows-list";

export default async function WorkflowsPage() {
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
  if (!membership) redirect("/login");

  const { data: workflows } = await supabase
    .from("workflows")
    .select("id, name, description, trigger_type, enabled, created_at, workflow_steps(id)")
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Automate actions when calls complete
          </p>
        </div>
        <Link
          href="/dashboard/workflows/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Workflow
        </Link>
      </div>

      {!workflows || workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Create workflows to automatically send SMS, create escalations, or
            trigger webhooks when calls complete.
          </p>
          <Link
            href="/dashboard/workflows/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Workflow
          </Link>
        </div>
      ) : (
        <WorkflowsList workflows={workflows} />
      )}
    </div>
  );
}
