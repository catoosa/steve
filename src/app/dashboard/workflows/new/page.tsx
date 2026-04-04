"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Condition = {
  field: string;
  operator: string;
  value: string;
};

type Step = {
  id: string;
  action_type: string;
  config: Record<string, unknown>;
};

const ACTION_TYPES = [
  { value: "send_sms", label: "Send SMS" },
  { value: "schedule_callback", label: "Schedule Callback" },
  { value: "create_escalation", label: "Create Escalation" },
  { value: "webhook", label: "Webhook" },
  { value: "update_contact", label: "Update Contact" },
  { value: "add_to_dnc", label: "Add to DNC" },
  { value: "enroll_in_sequence", label: "Enroll in Sequence" },
];

const OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "not equals" },
  { value: "greater_than", label: "greater than" },
  { value: "less_than", label: "less than" },
  { value: "contains", label: "contains" },
  { value: "exists", label: "exists" },
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function StepConfig({
  step,
  onChange,
}: {
  step: Step;
  onChange: (config: Record<string, unknown>) => void;
}) {
  const c = step.config;

  switch (step.action_type) {
    case "send_sms":
      return (
        <div className="mt-3">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Message
          </label>
          <textarea
            rows={3}
            value={(c.message as string) ?? ""}
            onChange={(e) => onChange({ ...c, message: e.target.value })}
            placeholder="Hi {{contact.name}}, thanks for your time..."
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use {"{{contact.name}}"}, {"{{contact.phone}}"}, {"{{analysis.*}}"}{" "}
            for dynamic values.
          </p>
        </div>
      );

    case "schedule_callback":
      return (
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Delay (hours)
            </label>
            <input
              type="number"
              min={0}
              value={(c.delay_hours as number) ?? 24}
              onChange={(e) =>
                onChange({ ...c, delay_hours: Number(e.target.value) })
              }
              className="w-32 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Prompt
            </label>
            <textarea
              rows={2}
              value={(c.prompt as string) ?? ""}
              onChange={(e) => onChange({ ...c, prompt: e.target.value })}
              placeholder="Follow up with the contact about..."
              className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              First Sentence
            </label>
            <input
              type="text"
              value={(c.first_sentence as string) ?? ""}
              onChange={(e) =>
                onChange({ ...c, first_sentence: e.target.value })
              }
              placeholder="Hi, this is a follow-up call..."
              className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
            />
          </div>
        </div>
      );

    case "create_escalation":
      return (
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Priority
            </label>
            <select
              value={(c.priority as string) ?? "medium"}
              onChange={(e) => onChange({ ...c, priority: e.target.value })}
              className="w-48 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Reason Template
            </label>
            <textarea
              rows={2}
              value={(c.reason_template as string) ?? ""}
              onChange={(e) =>
                onChange({ ...c, reason_template: e.target.value })
              }
              placeholder="Escalated because {{analysis.reason}}..."
              className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
            />
          </div>
        </div>
      );

    case "webhook":
      return (
        <div className="mt-3">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            URL
          </label>
          <input
            type="url"
            value={(c.url as string) ?? ""}
            onChange={(e) => onChange({ ...c, url: e.target.value })}
            placeholder="https://example.com/webhook"
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
        </div>
      );

    case "update_contact":
      return (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Fields to Update
          </label>
          {Object.entries((c.updates as Record<string, string>) ?? { "": "" }).map(
            ([key, val], i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={key}
                  placeholder="field"
                  onChange={(e) => {
                    const updates = {
                      ...((c.updates as Record<string, string>) ?? {}),
                    };
                    const oldVal = updates[key] ?? "";
                    delete updates[key];
                    updates[e.target.value] = oldVal;
                    onChange({ ...c, updates });
                  }}
                  className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
                />
                <input
                  type="text"
                  value={val}
                  placeholder="value"
                  onChange={(e) => {
                    const updates = {
                      ...((c.updates as Record<string, string>) ?? {}),
                    };
                    updates[key] = e.target.value;
                    onChange({ ...c, updates });
                  }}
                  className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updates = {
                      ...((c.updates as Record<string, string>) ?? {}),
                    };
                    delete updates[key];
                    onChange({ ...c, updates });
                  }}
                  className="p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          )}
          <button
            type="button"
            onClick={() => {
              const updates = {
                ...((c.updates as Record<string, string>) ?? {}),
              };
              updates[""] = "";
              onChange({ ...c, updates });
            }}
            className="text-xs text-primary hover:underline"
          >
            + Add field
          </button>
        </div>
      );

    case "add_to_dnc":
      return (
        <div className="mt-3">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Reason
          </label>
          <input
            type="text"
            value={(c.reason as string) ?? ""}
            onChange={(e) => onChange({ ...c, reason: e.target.value })}
            placeholder="Requested removal during call"
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
        </div>
      );

    case "enroll_in_sequence":
      return (
        <div className="mt-3">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Sequence ID
          </label>
          <input
            type="text"
            value={(c.sequence_id as string) ?? ""}
            onChange={(e) => onChange({ ...c, sequence_id: e.target.value })}
            placeholder="seq_abc123"
            className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
        </div>
      );

    default:
      return null;
  }
}

export default function NewWorkflowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basics
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("call_completed");

  // Conditions
  const [conditionLogic, setConditionLogic] = useState<"AND" | "OR">("AND");
  const [conditions, setConditions] = useState<Condition[]>([]);

  // Steps
  const [steps, setSteps] = useState<Step[]>([
    { id: generateId(), action_type: "send_sms", config: {} },
  ]);

  function addCondition() {
    setConditions([
      ...conditions,
      { field: "", operator: "equals", value: "" },
    ]);
  }

  function updateCondition(index: number, patch: Partial<Condition>) {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  }

  function removeCondition(index: number) {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  }

  function addStep() {
    setSteps([
      ...steps,
      { id: generateId(), action_type: "send_sms", config: {} },
    ]);
  }

  function updateStep(
    id: string,
    patch: Partial<Pick<Step, "action_type" | "config">>
  ) {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        // Reset config when action type changes
        if (patch.action_type && patch.action_type !== s.action_type) {
          return { ...s, action_type: patch.action_type, config: {} };
        }
        return { ...s, ...patch };
      })
    );
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Workflow name is required.");
      return;
    }
    if (steps.length === 0) {
      setError("Add at least one step.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get org_id
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: membership } = await supabase
        .from("org_members")
        .select("org_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) {
        setError("No organization found.");
        setLoading(false);
        return;
      }

      // Build conditions JSON
      const conditionsJson =
        conditions.length > 0
          ? {
              logic: conditionLogic,
              rules: conditions.map((c) => ({
                field: c.field,
                operator: c.operator,
                ...(c.operator !== "exists" ? { value: c.value } : {}),
              })),
            }
          : null;

      // Insert workflow
      const { data: workflow, error: wfError } = await supabase
        .from("workflows")
        .insert({
          org_id: membership.org_id,
          name: name.trim(),
          description: description.trim() || null,
          trigger_type: triggerType,
          conditions: conditionsJson,
          enabled: true,
        })
        .select("id")
        .single();

      if (wfError || !workflow) {
        setError(wfError?.message ?? "Failed to create workflow.");
        setLoading(false);
        return;
      }

      // Insert steps
      const stepRows = steps.map((s, i) => ({
        workflow_id: workflow.id,
        step_order: i + 1,
        action_type: s.action_type,
        config: s.config,
      }));

      const { error: stepsError } = await supabase
        .from("workflow_steps")
        .insert(stepRows);

      if (stepsError) {
        setError(stepsError.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard/workflows");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/dashboard/workflows"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Workflows
      </Link>

      <h1 className="text-2xl font-bold mb-8">New Workflow</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basics */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Basics</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Send follow-up SMS"
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this workflow do?"
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Trigger Type
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="call_completed">Call Completed</option>
                <option value="call_no_answer">No Answer</option>
                <option value="call_voicemail">Voicemail</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Conditions */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conditions</h2>
            <div className="inline-flex rounded-lg border border-border overflow-hidden text-xs font-medium">
              <button
                type="button"
                onClick={() => setConditionLogic("AND")}
                className={`px-3 py-1.5 transition-colors ${
                  conditionLogic === "AND"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                AND
              </button>
              <button
                type="button"
                onClick={() => setConditionLogic("OR")}
                className={`px-3 py-1.5 transition-colors ${
                  conditionLogic === "OR"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                OR
              </button>
            </div>
          </div>

          {conditions.length === 0 ? (
            <p className="text-sm text-muted-foreground mb-4">
              No conditions yet. The workflow will run for all matching triggers.
            </p>
          ) : (
            <div className="space-y-3 mb-4">
              {conditions.map((cond, i) => (
                <div key={i} className="flex items-start gap-2">
                  <input
                    type="text"
                    value={cond.field}
                    onChange={(e) =>
                      updateCondition(i, { field: e.target.value })
                    }
                    placeholder="e.g. analysis.pain_level"
                    className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
                  />
                  <select
                    value={cond.operator}
                    onChange={(e) =>
                      updateCondition(i, { operator: e.target.value })
                    }
                    className="w-36 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  {cond.operator !== "exists" && (
                    <input
                      type="text"
                      value={cond.value}
                      onChange={(e) =>
                        updateCondition(i, { value: e.target.value })
                      }
                      placeholder="value"
                      className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeCondition(i)}
                    className="p-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addCondition}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Plus className="w-4 h-4" /> Add Condition
          </button>
        </div>

        {/* Section 3: Steps */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Steps</h2>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <div
                key={step.id}
                className="border border-border rounded-lg p-4 bg-muted/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Step {i + 1}
                    </span>
                  </div>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Action Type
                  </label>
                  <select
                    value={step.action_type}
                    onChange={(e) =>
                      updateStep(step.id, { action_type: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {ACTION_TYPES.map((at) => (
                      <option key={at.value} value={at.value}>
                        {at.label}
                      </option>
                    ))}
                  </select>
                </div>

                <StepConfig
                  step={step}
                  onChange={(config) => updateStep(step.id, { config })}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addStep}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-4"
          >
            <Plus className="w-4 h-4" /> Add Step
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Workflow
          </button>
          <Link
            href="/dashboard/workflows"
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
