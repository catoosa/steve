"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [agentName, setAgentName] = useState("Steve");
  const [prompt, setPrompt] = useState("");
  const [firstSentence, setFirstSentence] = useState("");
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [voice, setVoice] = useState("mason");
  const [language, setLanguage] = useState("en-AU");
  const [maxDuration, setMaxDuration] = useState(120);
  const [contacts, setContacts] = useState("");

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

      // Create campaign
      const { data: campaign, error: campaignErr } = await supabase
        .from("campaigns")
        .insert({
          org_id: orgId,
          name,
          agent_name: agentName,
          agent_prompt: prompt,
          first_sentence: firstSentence || null,
          analysis_prompt: analysisPrompt || null,
          voice,
          language,
          max_duration: maxDuration,
          total_contacts: contactLines.length,
        })
        .select("id")
        .single();

      if (campaignErr) {
        setError(campaignErr.message);
        setLoading(false);
        return;
      }

      // Create contacts
      if (contactLines.length > 0 && campaign) {
        const contactRecords = contactLines.map((line) => {
          const parts = line.split(",").map((p) => p.trim());
          return {
            campaign_id: campaign.id,
            org_id: orgId,
            phone: parts[0],
            name: parts[1] || null,
            metadata: parts[2] ? { extra: parts[2] } : {},
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

      <h1 className="text-2xl font-bold mb-8">New Campaign</h1>

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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Voice</label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="mason">Mason (Male AU)</option>
                <option value="nat">Nat (Female US)</option>
                <option value="josh">Josh (Male US)</option>
                <option value="june">June (Female US)</option>
              </select>
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
