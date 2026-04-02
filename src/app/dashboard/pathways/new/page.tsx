"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, PenTool, Loader2 } from "lucide-react";

export default function NewPathwayPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "ai" | "manual">("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // AI generate state
  const [aiPrompt, setAiPrompt] = useState("");

  // Manual create state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleAIGenerate() {
    if (!aiPrompt.trim()) return;
    setLoading(true);
    setError("");
    try {
      // Create a placeholder pathway first, then generate
      const createRes = await fetch("/api/pathways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "AI Generated Pathway",
          description: aiPrompt.slice(0, 200),
        }),
      });
      if (!createRes.ok) throw new Error("Failed to create pathway");
      const created = await createRes.json();
      const pathwayId = created.pathway_id || created.id;

      // Generate via AI
      const genRes = await fetch(`/api/pathways/${pathwayId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      if (!genRes.ok) throw new Error("Failed to generate pathway");

      router.push(`/dashboard/pathways/${pathwayId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pathways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Failed to create pathway");
      const data = await res.json();
      const pathwayId = data.pathway_id || data.id;
      router.push(`/dashboard/pathways/${pathwayId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard/pathways"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Pathways
      </Link>

      <h1 className="text-2xl font-bold mb-2">Create New Pathway</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Choose how you want to build your conversation flow.
      </p>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3 text-sm mb-6">
          {error}
        </div>
      )}

      {mode === "choose" && (
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => setMode("ai")}
            className="bg-card border border-border rounded-2xl p-6 text-left hover:shadow-lg hover:border-primary/50 transition-all"
          >
            <Sparkles className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">Generate with AI</h3>
            <p className="text-xs text-muted-foreground">
              Describe what your call flow should do and AI will generate the
              nodes and connections for you.
            </p>
          </button>
          <button
            onClick={() => setMode("manual")}
            className="bg-card border border-border rounded-2xl p-6 text-left hover:shadow-lg hover:border-primary/50 transition-all"
          >
            <PenTool className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">Create Manually</h3>
            <p className="text-xs text-muted-foreground">
              Start with a blank canvas and build your conversation flow
              node-by-node.
            </p>
          </button>
        </div>
      )}

      {mode === "ai" && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Generate with AI</h3>
          </div>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe your conversation flow. E.g.: A customer support pathway that greets the caller, asks about their issue, tries to resolve it, and offers to transfer to a human agent if needed."
            className="w-full bg-muted/50 border border-border rounded-xl p-4 text-sm resize-none h-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setMode("choose")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
            <button
              onClick={handleAIGenerate}
              disabled={loading || !aiPrompt.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Pathway
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {mode === "manual" && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <PenTool className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Create Manually</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Pathway"
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this pathway do?"
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setMode("choose")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
            <button
              onClick={handleManualCreate}
              disabled={loading || !name.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create & Open Editor"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
