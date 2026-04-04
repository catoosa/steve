import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import WorkflowToggle from "./workflow-toggle";

const TRIGGER_BADGES: Record<string, { label: string; className: string }> = {
  call_completed: {
    label: "Call Completed",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  call_no_answer: {
    label: "No Answer",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  call_voicemail: {
    label: "Voicemail",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
};

const ACTION_LABELS: Record<string, string> = {
  send_sms: "Send SMS",
  schedule_callback: "Schedule Callback",
  create_escalation: "Create Escalation",
  webhook: "Webhook",
  update_contact: "Update Contact",
  add_to_dnc: "Add to DNC",
  enroll_in_sequence: "Enroll in Sequence",
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  completed: {
    label: "Completed",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  running: {
    label: "Running",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
};

type WorkflowStep = {
  id: string;
  step_order: number;
  action_type: string;
  config: Record<string, unknown>;
};

type Execution = {
  id: string;
  status: string;
  error: string | null;
  started_at: string;
  completed_at: string | null;
  call_id: string | null;
};

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: workflow } = await supabase
    .from("workflows")
    .select("*, workflow_steps(*)")
    .eq("id", id)
    .eq("org_id", membership.org_id)
    .single();

  if (!workflow) notFound();

  const { data: executions } = await supabase
    .from("workflow_executions")
    .select("id, status, error, started_at, completed_at, call_id")
    .eq("workflow_id", id)
    .order("started_at", { ascending: false })
    .limit(20);

  const triggerBadge = TRIGGER_BADGES[workflow.trigger_type] ?? {
    label: workflow.trigger_type,
    className: "bg-muted text-muted-foreground border-border",
  };

  const sortedSteps = ((workflow.workflow_steps ?? []) as WorkflowStep[]).sort(
    (a, b) => a.step_order - b.step_order
  );

  return (
    <div className="max-w-4xl">
      <Link
        href="/dashboard/workflows"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Workflows
      </Link>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{workflow.name}</h1>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${triggerBadge.className}`}
              >
                {triggerBadge.label}
              </span>
            </div>
            {workflow.description && (
              <p className="text-muted-foreground">{workflow.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span>
                Created {new Date(workflow.created_at).toLocaleDateString()}
              </span>
              <WorkflowToggle
                workflowId={workflow.id}
                initialEnabled={workflow.enabled}
              />
            </div>
          </div>
          <Link
            href={`/dashboard/workflows/${id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Link>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          Steps ({sortedSteps.length})
        </h2>
        {sortedSteps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No steps configured.
          </p>
        ) : (
          <div className="space-y-3">
            {sortedSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-start gap-4 border border-border rounded-lg p-4 bg-muted/30"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                  {step.step_order}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {ACTION_LABELS[step.action_type] ?? step.action_type}
                  </p>
                  <pre className="mt-1 text-xs text-muted-foreground bg-muted rounded p-2 overflow-x-auto">
                    {JSON.stringify(step.config, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution History */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Execution History</h2>
        {!executions || executions.length === 0 ? (
          <div className="text-center py-10">
            <Zap className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">
              No executions yet. This workflow will run automatically when
              triggered.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Started</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Call ID</th>
                  <th className="pb-3 font-medium">Duration</th>
                  <th className="pb-3 font-medium">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(executions as Execution[]).map((exec) => {
                  const statusBadge = STATUS_BADGES[exec.status] ?? {
                    label: exec.status,
                    className: "bg-muted text-muted-foreground border-border",
                  };
                  const started = new Date(exec.started_at);
                  const completed = exec.completed_at
                    ? new Date(exec.completed_at)
                    : null;
                  const durationMs = completed
                    ? completed.getTime() - started.getTime()
                    : null;

                  return (
                    <tr key={exec.id}>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {started.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                        {exec.call_id ? (
                          <Link
                            href={`/dashboard/calls/${exec.call_id}`}
                            className="hover:text-primary hover:underline"
                          >
                            {exec.call_id.slice(0, 8)}...
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {durationMs !== null
                          ? `${(durationMs / 1000).toFixed(1)}s`
                          : "-"}
                      </td>
                      <td className="py-3 text-xs text-destructive max-w-xs truncate">
                        {exec.error ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
