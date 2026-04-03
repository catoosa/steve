"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2, FlaskConical, Brain, Shield, Bot } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";

const COMPLIANCE_RULES = [
  {
    id: "ai_disclosure",
    label: "AI Disclosure",
    description: "Agent identifies as AI at start of call",
    rule: {
      description: "Always identify yourself as an AI assistant at the start of the call",
      action: "block",
    },
  },
  {
    id: "company_id",
    label: "Company Identification",
    description: "Agent states company name",
    rule: {
      description: "Always state the company name at the start of the call",
      action: "block",
    },
  },
  {
    id: "recording",
    label: "Recording Disclosure",
    description: "Inform call may be recorded",
    rule: {
      description: "Inform the caller at the start that the call may be recorded",
      action: "warn",
    },
  },
  {
    id: "optout",
    label: "Opt-out Offer",
    description: "Offer to be removed from call list",
    rule: {
      description:
        "If the caller asks to not be called again, confirm you will remove them and end the call",
      action: "block",
    },
  },
];

interface VoiceOption {
  voice_id?: string;
  id?: string;
  name?: string;
  description?: string;
}

interface Variant {
  id: string;
  name: string;
  prompt: string;
  firstSentence: string;
  splitPct: number;
}

const FALLBACK_VOICES: VoiceOption[] = [
  { voice_id: "mason", name: "Mason", description: "Male AU" },
  { voice_id: "nat", name: "Nat", description: "Female US" },
  { voice_id: "josh", name: "Josh", description: "Male US" },
  { voice_id: "june", name: "June", description: "Female US" },
];

function NewCampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateKey = searchParams.get("template");
  const template = templateKey ? CAMPAIGN_TEMPLATES[templateKey] : null;
  const personaId = searchParams.get("persona_id");
  const personaName = searchParams.get("agent_name");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [agentName, setAgentName] = useState(personaName || template?.agentName || "Steve");
  const [prompt, setPrompt] = useState(template?.prompt || "");
  const [firstSentence, setFirstSentence] = useState(template?.firstSentence || "");
  const [analysisPrompt, setAnalysisPrompt] = useState(template?.analysisPrompt || "");
  const [voice, setVoice] = useState(template?.voice || "mason");
  const [language, setLanguage] = useState(template?.language || "en-AU");
  const [maxDuration, setMaxDuration] = useState(template?.maxDuration || 120);
  const [dispositions, setDispositions] = useState<string[]>([]);
  const [dispositionInput, setDispositionInput] = useState("");
  const [contacts, setContacts] = useState("");

  // Memory state
  const [enableMemory, setEnableMemory] = useState(false);
  const [memoryId, setMemoryId] = useState("");

  // Compliance state
  const [complianceRules, setComplianceRules] = useState<string[]>([]);

  // A/B Testing state
  const [abEnabled, setAbEnabled] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([
    { id: "A", name: "Variant A", prompt: "", firstSentence: "", splitPct: 50 },
    { id: "B", name: "Variant B", prompt: "", firstSentence: "", splitPct: 50 },
  ]);
  const [activeVariantTab, setActiveVariantTab] = useState("A");

  const [voices, setVoices] = useState<VoiceOption[]>(FALLBACK_VOICES);
  const [voicesLoading, setVoicesLoading] = useState(true);

  useEffect(() => {
    fetch("/api/voices")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch voices");
        return res.json();
      })
      .then((data) => {
        // Bland API may return voices in different shapes
        const list = Array.isArray(data) ? data : data?.voices || data?.data;
        if (Array.isArray(list) && list.length > 0) {
          setVoices(list);
        }
      })
      .catch(() => {
        // Keep fallback voices on error
      })
      .finally(() => setVoicesLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

      // Get org
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

      const orgId = membership.org_id;

      // Parse contacts (one phone per line, or CSV with phone,name,metadata)
      const contactLines = contacts
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      // Build analysis prompt with disposition instructions if applicable
      let finalAnalysisPrompt = analysisPrompt || null;
      if (dispositions.length > 0 && finalAnalysisPrompt) {
        finalAnalysisPrompt += `\n\nClassify this call with one of these dispositions: ${dispositions.join(", ")}. Include a "disposition" field in your response.`;
      } else if (dispositions.length > 0) {
        finalAnalysisPrompt = `Classify this call with one of these dispositions: ${dispositions.join(", ")}. Return JSON with a "disposition" field.`;
      }

      // Determine the primary prompt (Variant A's prompt if A/B enabled)
      const primaryPrompt = abEnabled ? variants[0].prompt : prompt;
      const primaryFirstSentence = abEnabled ? variants[0].firstSentence : firstSentence;

      // Build metadata including memory config and compliance rules
      const campaignMeta: Record<string, unknown> = {};
      if (enableMemory) {
        campaignMeta.enable_memory = true;
        if (memoryId.trim()) campaignMeta.memory_id = memoryId.trim();
      }
      if (complianceRules.length > 0) {
        const selectedGuardRails = COMPLIANCE_RULES
          .filter((r) => complianceRules.includes(r.id))
          .map((r) => r.rule);
        campaignMeta.compliance_rules = complianceRules;
        campaignMeta.guard_rails = selectedGuardRails;
      }

      // Create campaign
      const { data: campaign, error: campaignErr } = await supabase
        .from("campaigns")
        .insert({
          org_id: orgId,
          name,
          agent_name: agentName,
          agent_prompt: primaryPrompt,
          first_sentence: primaryFirstSentence || null,
          analysis_prompt: finalAnalysisPrompt,
          voice,
          language,
          max_duration: maxDuration,
          total_contacts: contactLines.length,
          dispositions: dispositions.length > 0 ? dispositions : null,
          metadata: { ...campaignMeta, ...(personaId ? { persona_id: personaId } : {}) },
        })
        .select("id")
        .single();

      if (campaignErr) {
        setError(campaignErr.message);
        setLoading(false);
        return;
      }

      // Assign variants to contacts if A/B testing is enabled
      function assignVariant(index: number, total: number, variantList: Variant[]): Variant {
        // Shuffle-based assignment: use cumulative split percentages
        const rand = ((index * 2654435761) % total) / total; // deterministic but distributed
        let cumulative = 0;
        for (const v of variantList) {
          cumulative += v.splitPct / 100;
          if (rand < cumulative) return v;
        }
        return variantList[variantList.length - 1];
      }

      // Create contacts
      if (contactLines.length > 0 && campaign) {
        // Shuffle contact lines for fair variant distribution
        const shuffledIndices = contactLines.map((_, i) => i);
        for (let i = shuffledIndices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
        }

        const contactRecords = contactLines.map((line, idx) => {
          const parts = line.split(",").map((p) => p.trim());
          const baseMetadata: Record<string, unknown> = parts[2] ? { extra: parts[2] } : {};

          if (abEnabled) {
            const variant = assignVariant(shuffledIndices[idx], contactLines.length, variants);
            baseMetadata.variant = variant.id;
            baseMetadata.variant_prompt = variant.prompt;
            baseMetadata.variant_first_sentence = variant.firstSentence;
          }

          return {
            campaign_id: campaign.id,
            org_id: orgId,
            phone: parts[0],
            name: parts[1] || null,
            metadata: baseMetadata,
          };
        });

        // Insert in batches of 500
        for (let i = 0; i < contactRecords.length; i += 500) {
          await supabase
            .from("contacts")
            .insert(contactRecords.slice(i, i + 500));
        }
      }

      router.push(`/dashboard/campaigns/${campaign?.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/campaigns"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </Link>

      <h1 className="text-2xl font-bold mb-4">New Campaign</h1>

      {template && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-4 text-sm">
          <span className="font-medium text-primary">Template:</span>{" "}
          <span className="text-foreground">{template.title}</span>
          <span className="text-muted-foreground"> &mdash; {template.desc}</span>
        </div>
      )}

      {personaId && personaName && (
        <div className="bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-3 mb-8 text-sm flex items-center gap-2">
          <Bot className="w-4 h-4 text-secondary shrink-0" />
          <span>Using persona <span className="font-semibold text-foreground">{decodeURIComponent(personaName)}</span></span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Basics */}
        <div className="bg-background border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Campaign Details</h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              Campaign Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Q2 Customer Survey"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Agent Name
            </label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Steve"
            />
          </div>
        </div>

        {/* Voice Agent Config */}
        <div className="bg-background border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Voice Agent</h2>

          {/* A/B Testing Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" />
              <div>
                <span className="text-sm font-medium">A/B Testing</span>
                <p className="text-xs text-muted-foreground">Split contacts between different prompt variants</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAbEnabled(!abEnabled);
                if (!abEnabled) {
                  // Pre-fill Variant A with current prompt values
                  setVariants((prev) =>
                    prev.map((v, i) =>
                      i === 0 ? { ...v, prompt: prompt, firstSentence: firstSentence } : v
                    )
                  );
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                abEnabled ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  abEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Cross-Call Memory Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <div>
                <span className="text-sm font-medium">Enable Cross-Call Memory</span>
                <p className="text-xs text-muted-foreground">Agent remembers previous conversations with each caller</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnableMemory(!enableMemory)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enableMemory ? "bg-purple-500" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enableMemory ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {enableMemory && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Memory ID (optional)
              </label>
              <input
                type="text"
                value={memoryId}
                onChange={(e) => setMemoryId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                placeholder="Leave blank to auto-create"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Memory ID (optional — leave blank to auto-create)
              </p>
            </div>
          )}

          {!abEnabled ? (
            /* Standard single-prompt mode */
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Agent Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                  rows={6}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                  placeholder={`You are Steve, a friendly phone agent calling to confirm appointments.\n\nWhen the call connects, say: "Hi, this is Steve calling from Acme Health..."\n\nIf they confirm, thank them and end the call.\nIf they want to reschedule, ask for their preferred time.`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tell the agent who they are, what to say, and how to handle
                  different responses.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  First Sentence (optional)
                </label>
                <input
                  type="text"
                  value={firstSentence}
                  onChange={(e) => setFirstSentence(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Hi, this is Steve calling from Acme Health."
                />
              </div>
            </>
          ) : (
            /* A/B Testing variant panels */
            <>
              {/* Variant tabs */}
              <div className="flex items-center gap-2">
                <div className="inline-flex bg-muted rounded-lg p-1 gap-1">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveVariantTab(v.id)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        activeVariantTab === v.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
                {variants.length < 4 && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextId = String.fromCharCode(65 + variants.length); // C, D...
                      const newSplit = Math.floor(100 / (variants.length + 1));
                      setVariants((prev) => {
                        const remaining = 100 - newSplit * variants.length;
                        return [
                          ...prev.map((v) => ({ ...v, splitPct: newSplit })),
                          {
                            id: nextId,
                            name: `Variant ${nextId}`,
                            prompt: "",
                            firstSentence: "",
                            splitPct: remaining,
                          },
                        ];
                      });
                      setActiveVariantTab(nextId);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    Add Variant
                  </button>
                )}
              </div>

              {/* Active variant editor */}
              {variants.map((v) =>
                v.id !== activeVariantTab ? null : (
                  <div key={v.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">{v.name}</span>
                      {variants.length > 2 && v.id !== "A" && (
                        <button
                          type="button"
                          onClick={() => {
                            setVariants((prev) => {
                              const filtered = prev.filter((x) => x.id !== v.id);
                              const splitEach = Math.floor(100 / filtered.length);
                              const last = 100 - splitEach * (filtered.length - 1);
                              return filtered.map((x, i) => ({
                                ...x,
                                splitPct: i === filtered.length - 1 ? last : splitEach,
                              }));
                            });
                            setActiveVariantTab("A");
                          }}
                          className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Agent Prompt
                      </label>
                      <textarea
                        value={v.prompt}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((x) =>
                              x.id === v.id ? { ...x, prompt: e.target.value } : x
                            )
                          )
                        }
                        required
                        rows={6}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                        placeholder={`You are Steve, a friendly phone agent...`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        First Sentence (optional)
                      </label>
                      <input
                        type="text"
                        value={v.firstSentence}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((x) =>
                              x.id === v.id
                                ? { ...x, firstSentence: e.target.value }
                                : x
                            )
                          )
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Hi, this is Steve calling from..."
                      />
                    </div>
                  </div>
                )
              )}

              {/* Split percentages */}
              <div>
                <label className="block text-sm font-medium mb-2">Traffic Split</label>
                <div className="flex items-center gap-3">
                  {variants.map((v, idx) => (
                    <div key={v.id} className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground w-6">{v.id}</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={v.splitPct}
                        onChange={(e) => {
                          const newVal = Math.max(1, Math.min(99, Number(e.target.value)));
                          setVariants((prev) => {
                            const updated = [...prev];
                            updated[idx] = { ...updated[idx], splitPct: newVal };
                            // Redistribute remaining among other variants
                            const remaining = 100 - newVal;
                            const others = updated.filter((_, i) => i !== idx);
                            const otherTotal = others.reduce((s, o) => s + o.splitPct, 0);
                            if (otherTotal > 0) {
                              for (const o of others) {
                                const target = updated.findIndex((u) => u.id === o.id);
                                updated[target] = {
                                  ...updated[target],
                                  splitPct: Math.max(1, Math.round((o.splitPct / otherTotal) * remaining)),
                                };
                              }
                            }
                            // Fix rounding errors
                            const total = updated.reduce((s, u) => s + u.splitPct, 0);
                            if (total !== 100) {
                              const lastOther = updated.findIndex((u, i) => i !== idx);
                              if (lastOther >= 0) {
                                updated[lastOther] = {
                                  ...updated[lastOther],
                                  splitPct: updated[lastOther].splitPct + (100 - total),
                                };
                              }
                            }
                            return updated;
                          });
                        }}
                        className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  ))}
                </div>
                {(() => {
                  const total = variants.reduce((s, v) => s + v.splitPct, 0);
                  return total !== 100 ? (
                    <p className="text-xs text-destructive mt-1">
                      Split must total 100% (currently {total}%)
                    </p>
                  ) : null;
                })()}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Data Extraction Prompt (optional)
            </label>
            <textarea
              value={analysisPrompt}
              onChange={(e) => setAnalysisPrompt(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              placeholder={`Extract from this call: {"confirmed": true/false, "reschedule_date": "string or null", "notes": "any relevant notes"}`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Define the structured JSON you want extracted from each call.
            </p>
          </div>

          {/* Dispositions */}
          <div>
            <label className="block text-sm font-medium mb-1">Call Dispositions (optional)</label>
            <p className="text-xs text-muted-foreground mb-2">
              Define outcome categories for calls. The AI will classify each call into one of these.
            </p>
            {dispositions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {dispositions.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {d}
                    <button
                      type="button"
                      onClick={() => setDispositions(dispositions.filter((x) => x !== d))}
                      className="hover:text-destructive"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={dispositionInput}
                onChange={(e) => setDispositionInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = dispositionInput.trim().replace(/\s+/g, "_");
                    if (val && !dispositions.includes(val)) {
                      setDispositions([...dispositions, val]);
                    }
                    setDispositionInput("");
                  }
                }}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Type a disposition and press Enter"
              />
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {["INTERESTED", "NOT_INTERESTED", "FOLLOW_UP", "DO_NOT_CALL", "APPOINTMENT_SET", "CALLBACK_REQUESTED", "WRONG_NUMBER"]
                .filter((s) => !dispositions.includes(s))
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDispositions([...dispositions, s])}
                    className="text-xs bg-muted px-2 py-0.5 rounded hover:bg-muted-foreground/20"
                  >
                    {s}
                  </button>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Voice</label>
              {voicesLoading ? (
                <div className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading voices...
                </div>
              ) : (
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {voices.map((v) => {
                    const id = v.voice_id || v.id || "";
                    const label = v.name || id;
                    const desc = v.description ? ` (${v.description})` : "";
                    return (
                      <option key={id} value={id}>
                        {label}{desc}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="en-AU">English (AU)</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Duration (s)
              </label>
              <input
                type="number"
                value={maxDuration}
                onChange={(e) => setMaxDuration(Number(e.target.value))}
                min={30}
                max={300}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div className="bg-background border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Compliance</h2>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Select the guard rails to apply on every call in this campaign.
          </p>
          <div className="space-y-3">
            {COMPLIANCE_RULES.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={complianceRules.includes(item.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setComplianceRules((prev) => [...prev, item.id]);
                    } else {
                      setComplianceRules((prev) => prev.filter((r) => r !== item.id));
                    }
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/50 accent-primary"
                />
                <div>
                  <span className="text-sm font-medium group-hover:text-foreground transition-colors">
                    {item.label}
                  </span>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Contacts */}
        <div className="bg-background border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Contacts</h2>
          <div>
            <label className="block text-sm font-medium mb-1">
              Phone Numbers
            </label>
            <textarea
              value={contacts}
              onChange={(e) => setContacts(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              placeholder={`0412345678,John Smith\n0498765432,Jane Doe\n0411222333`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              One per line. Format: phone or phone,name or phone,name,extra_data
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Campaign"}
        </button>
      </form>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 text-muted-foreground py-12">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      }
    >
      <NewCampaignForm />
    </Suspense>
  );
}
