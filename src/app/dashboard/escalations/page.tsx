import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EscalationsList } from "./escalations-list";

export default async function EscalationsPage() {
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

  const { data: escalations } = await supabase
    .from("escalations")
    .select(
      "id, priority, reason, status, created_at, campaign_id, contact_id, contacts(name, phone), campaigns(name)"
    )
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Escalations</h1>
      </div>

      {!escalations || escalations.length === 0 ? (
        <div className="bg-background border border-border rounded-xl px-6 py-20 text-center">
          <AlertTriangle className="w-14 h-14 mx-auto mb-5 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-semibold mb-2">No escalations</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            When calls require human attention, escalations will appear here
            with priority levels and action buttons.
          </p>
        </div>
      ) : (
        <EscalationsList escalations={escalations} />
      )}
    </div>
  );
}
