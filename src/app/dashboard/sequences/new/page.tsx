"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Phone,
  MessageSquare,
  Clock,
  Globe,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type StepType = "call" | "sms" | "wait" | "webhook";

interface SequenceStep {
  id: string;
  step_type: StepType;
  config: Record<string, string | number>;
}

const STEP_TYPE_META: Record<
  StepType,
  { label: string; icon: React.ElementType; color: string }
> = {
  call: { label: "Call", icon: Phone, color: "text-blue-500" },
  sms: { label: "SMS", icon: MessageSquare, color: "text-green-500" },
  wait: { label: "Wait", icon: Clock, color: "text-yellow-500" },
  webhook: { label: "Webhook", icon: Globe, color: "text-purple-500" },
};

let nextStepId = 1;
function genId() {
  return `step-${nextStepId++}-${Date.now()}`;
}

function defaultConfig(type: StepType): Record<string, string | number> {
  switch (type) {
    case "call":
      return { prompt: "", first_sentence: "", voice: "nat", language: "en-AU" };
    case "sms":
      return { message: "" };
    case "wait":
      return { delay_hours: 24 };
    case "webhook":
      return { url: "" };
  }
}

export default function NewSequencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<SequenceStep[]>([
    { id: genId(), step_type: "call", config: defaultConfig("call") },
  ]);

  function addStep() {
    setSteps((prev) => [
      ...prev,
      { id: genId(), step_type: "call", config: defaultConfig("call") },
    ]);
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function updateStepType(id: string, type: StepType) {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, step_type: type, config: defaultConfig(type) } : s
      )
    );
  }

  function updateStepConfig(id: string, key: string, value: string | number) {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, config: { ...s.config, [key]: value } } : s
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (steps.length === 0) {
      setError("Add at least one step.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const { data: membership } = await supabase
        .from("org_members")
        .select("org_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      if (!membership) {
        setError("No organization found");
        setLoading(false);
        return;
      }

      const { data: sequence, error: seqErr } = await supabase
        .from("sequences")
        .insert({
          org_id: membership.org_id,
          name,
          description: description || null,
          enabled: true,
        })
        .select("id")
        .single();

      if (seqErr) {
        setError(seqErr.message);
        setLoading(false);
        return;
      }

      const stepRows = steps.map((s, idx) => ({
        sequence_id: sequence.id,
        step_order: idx,
        step_type: s.step_type,
        config: s.config,
      }));

      const { error: stepsErr } = await supabase
        .from("sequence_steps")
        .insert(stepRows);

      if (stepsErr) {
        setError(stepsErr.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard/sequences");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/sequences"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sequences
      </Link>

      <h1 className="text-2xl font-bold mb-4">New Sequence</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Basics */}
        <div className="bg-background border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Basics</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Follow-up after missed call"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Describe what this sequence does..."
            />
          </div>
        </div>

        {/* Steps */}
        <div className="bg-background border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Steps</h2>

          {steps.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No steps yet. Add your first step below.
            </p>
          )}

          {/* Visual timeline */}
          <div className="relative">
            {steps.map((step, idx) => {
              const meta = STEP_TYPE_META[step.step_type];
              const StepIcon = meta.icon;

              return (
                <div key={step.id} className="relative flex gap-4">
                  {/* Timeline line + node */}
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

                  {/* Step card */}
                  <div className="flex-1 pb-6">
                    <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Step {idx + 1}
                        </span>
                        {steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(step.id)}
                            className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Type selector */}
                      <div className="flex gap-1">
                        {(
                          Object.keys(STEP_TYPE_META) as StepType[]
                        ).map((t) => {
                          const m = STEP_TYPE_META[t];
                          const Icon = m.icon;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => updateStepType(step.id, t)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                step.step_type === t
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              {m.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Config fields */}
                      {step.step_type === "call" && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">
                              Prompt
                            </label>
                            <textarea
                              value={(step.config.prompt as string) || ""}
                              onChange={(e) =>
                                updateStepConfig(
                                  step.id,
                                  "prompt",
                                  e.target.value
                                )
                              }
                              rows={3}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                              placeholder="You are calling to follow up on..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">
                              First Sentence
                            </label>
                            <input
                              type="text"
                              value={
                                (step.config.first_sentence as string) || ""
                              }
                              onChange={(e) =>
                                updateStepConfig(
                                  step.id,
                                  "first_sentence",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              placeholder="Hi, this is Steve calling from..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Voice
                              </label>
                              <select
                                value={(step.config.voice as string) || "nat"}
                                onChange={(e) =>
                                  updateStepConfig(
                                    step.id,
                                    "voice",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              >
                                <option value="nat">Nat</option>
                                <option value="mason">Mason</option>
                                <option value="josh">Josh</option>
                                <option value="june">June</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Language
                              </label>
                              <select
                                value={
                                  (step.config.language as string) || "en-AU"
                                }
                                onChange={(e) =>
                                  updateStepConfig(
                                    step.id,
                                    "language",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              >
                                <option value="en-AU">English (AU)</option>
                                <option value="en-US">English (US)</option>
                                <option value="en-GB">English (UK)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {step.step_type === "sms" && (
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Message
                          </label>
                          <textarea
                            value={(step.config.message as string) || ""}
                            onChange={(e) =>
                              updateStepConfig(
                                step.id,
                                "message",
                                e.target.value
                              )
                            }
                            rows={3}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Hi {{name}}, just following up..."
                          />
                        </div>
                      )}

                      {step.step_type === "wait" && (
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Wait for
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              value={
                                (step.config.delay_hours as number) || 24
                              }
                              onChange={(e) =>
                                updateStepConfig(
                                  step.id,
                                  "delay_hours",
                                  Number(e.target.value)
                                )
                              }
                              className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <span className="text-sm text-muted-foreground">
                              hours
                            </span>
                          </div>
                        </div>
                      )}

                      {step.step_type === "webhook" && (
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Webhook URL
                          </label>
                          <input
                            type="url"
                            value={(step.config.url as string) || ""}
                            onChange={(e) =>
                              updateStepConfig(
                                step.id,
                                "url",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="https://example.com/webhook"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addStep}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Step
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </span>
          ) : (
            "Create Sequence"
          )}
        </button>
      </form>
    </div>
  );
}
