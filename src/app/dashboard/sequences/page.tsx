import { redirect } from "next/navigation";
import Link from "next/link";
import { ListOrdered, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function SequencesPage() {
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

  const { data: sequences } = await supabase
    .from("sequences")
    .select("id, name, description, enabled, created_at, sequence_steps(id)")
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false });

  // Count active enrollments per sequence
  const sequenceIds = (sequences ?? []).map((s) => s.id);
  const { data: enrollmentCounts } = sequenceIds.length
    ? await supabase
        .from("sequence_enrollments")
        .select("sequence_id")
        .in("sequence_id", sequenceIds)
        .eq("status", "active")
    : { data: [] };

  const enrollmentMap: Record<string, number> = {};
  for (const e of enrollmentCounts ?? []) {
    enrollmentMap[e.sequence_id] = (enrollmentMap[e.sequence_id] || 0) + 1;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Sequences</h1>
        <Link
          href="/dashboard/sequences/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Sequence
        </Link>
      </div>

      {!sequences || sequences.length === 0 ? (
        <div className="bg-background border border-border rounded-xl px-6 py-20 text-center">
          <ListOrdered className="w-14 h-14 mx-auto mb-5 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-semibold mb-2">No sequences yet</h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
            Create multi-step outreach sequences with calls, SMS, waits, and
            webhooks to automate your follow-up workflows.
          </p>
          <Link
            href="/dashboard/sequences/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Sequence
          </Link>
        </div>
      ) : (
        <div className="bg-background border border-border rounded-xl divide-y divide-border">
          {sequences.map((seq) => {
            const stepCount = Array.isArray(seq.sequence_steps)
              ? seq.sequence_steps.length
              : 0;
            const activeEnrollments = enrollmentMap[seq.id] || 0;

            return (
              <Link
                key={seq.id}
                href={`/dashboard/sequences/${seq.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium">{seq.name}</p>
                  {seq.description && (
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      {seq.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {stepCount} {stepCount === 1 ? "step" : "steps"}
                  </span>
                  {activeEnrollments > 0 && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {activeEnrollments} active
                    </span>
                  )}
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      seq.enabled
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {seq.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(seq.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
