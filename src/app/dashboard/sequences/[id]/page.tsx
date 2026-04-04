import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Clock,
  Globe,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const STEP_ICONS: Record<string, { icon: typeof Phone; color: string; label: string }> = {
  call: { icon: Phone, color: "text-blue-500", label: "Call" },
  sms: { icon: MessageSquare, color: "text-green-500", label: "SMS" },
  wait: { icon: Clock, color: "text-yellow-500", label: "Wait" },
  webhook: { icon: Globe, color: "text-purple-500", label: "Webhook" },
};

function formatStepDetail(step: { step_type: string; config: Record<string, unknown> }) {
  switch (step.step_type) {
    case "call": {
      const firstSentence = step.config?.first_sentence as string | undefined;
      return firstSentence || (step.config?.prompt as string)?.slice(0, 80) || "Call contact";
    }
    case "sms":
      return (step.config?.message as string)?.slice(0, 80) || "Send SMS";
    case "wait": {
      const hours = step.config?.delay_hours as number | undefined;
      return `Wait ${hours ?? 24} hour${hours === 1 ? "" : "s"}`;
    }
    case "webhook":
      return (step.config?.url as string) || "Webhook";
    default:
      return step.step_type;
  }
}

export default async function SequenceDetailPage({
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

  const { data: sequence } = await supabase
    .from("sequences")
    .select("*, sequence_steps(*)")
    .eq("id", id)
    .eq("org_id", membership.org_id)
    .single();

  if (!sequence) redirect("/dashboard/sequences");

  const { data: enrollments } = await supabase
    .from("sequence_enrollments")
    .select(
      "id, current_step, status, next_action_at, enrolled_at, contacts(id, name, phone)"
    )
    .eq("sequence_id", id)
    .order("enrolled_at", { ascending: false })
    .limit(50);

  const steps = Array.isArray(sequence.sequence_steps)
    ? [...sequence.sequence_steps].sort(
        (a: { step_order: number }, b: { step_order: number }) =>
          a.step_order - b.step_order
      )
    : [];

  return (
    <div>
      <Link
        href="/dashboard/sequences"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sequences
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{sequence.name}</h1>
          {sequence.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {sequence.description}
            </p>
          )}
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
            sequence.enabled
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {sequence.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {/* Steps Timeline */}
      <div className="bg-background border border-border rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">
          Steps ({steps.length})
        </h2>

        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No steps configured.
          </p>
        ) : (
          <div className="relative">
            {steps.map(
              (
                step: {
                  id: string;
                  step_type: string;
                  step_order: number;
                  config: Record<string, unknown>;
                },
                idx: number
              ) => {
                const meta = STEP_ICONS[step.step_type] || STEP_ICONS.call;
                const StepIcon = meta.icon;

                return (
                  <div key={step.id} className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full border-2 border-border bg-card flex items-center justify-center shrink-0 ${meta.color}`}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>
                      {idx < steps.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border min-h-[1rem]" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatStepDetail(step)}
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Enrollments Table */}
      <div className="bg-background border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">
          Enrollments ({enrollments?.length ?? 0})
        </h2>

        {!enrollments || enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No contacts enrolled in this sequence yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Contact</th>
                  <th className="pb-2 pr-4 font-medium">Phone</th>
                  <th className="pb-2 pr-4 font-medium">Current Step</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Next Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {enrollments.map(
                  (e: {
                    id: string;
                    current_step: number;
                    status: string;
                    next_action_at: string | null;
                    enrolled_at: string;
                    contacts:
                      | { id: string; name: string | null; phone: string }[]
                      | { id: string; name: string | null; phone: string }
                      | null;
                  }) => {
                    const rawContact = e.contacts;
                    const contact = Array.isArray(rawContact)
                      ? rawContact[0] ?? null
                      : rawContact;

                    return (
                      <tr key={e.id}>
                        <td className="py-3 pr-4 font-medium">
                          {contact?.name || "Unknown"}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">
                          {contact?.phone || "--"}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            Step {(e.current_step ?? 0) + 1}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                              e.status === "active"
                                ? "bg-success/10 text-success"
                                : e.status === "completed"
                                  ? "bg-primary/10 text-primary"
                                  : e.status === "paused"
                                    ? "bg-yellow-500/10 text-yellow-500"
                                    : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {e.status}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {e.next_action_at
                            ? new Date(e.next_action_at).toLocaleString()
                            : "--"}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
