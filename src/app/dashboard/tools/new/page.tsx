"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Plus, X } from "lucide-react";
import Link from "next/link";

interface Header {
  key: string;
  value: string;
}

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"] as const;

export default function NewToolPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState<string>("POST");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<Header[]>([
    { key: "Content-Type", value: "application/json" },
  ]);
  const [body, setBody] = useState("");
  const [inputSchema, setInputSchema] = useState("");
  const [responsePath, setResponsePath] = useState("");
  const [speech, setSpeech] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addHeader() {
    setHeaders((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeHeader(index: number) {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  }

  function updateHeader(index: number, field: "key" | "value", val: string) {
    setHeaders((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: val } : h))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tool name is required");
      return;
    }
    if (!url.trim()) {
      setError("URL is required");
      return;
    }

    // Validate JSON fields if provided
    let parsedInputSchema: Record<string, unknown> | undefined;
    if (inputSchema.trim()) {
      try {
        parsedInputSchema = JSON.parse(inputSchema.trim());
      } catch {
        setError("Input schema must be valid JSON");
        return;
      }
    }

    let parsedBody: Record<string, unknown> | undefined;
    if (body.trim() && (method === "POST" || method === "PUT")) {
      try {
        parsedBody = JSON.parse(body.trim());
      } catch {
        setError("Body template must be valid JSON");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    // Build headers object
    const headersObj: Record<string, string> = {};
    for (const h of headers) {
      if (h.key.trim()) headersObj[h.key.trim()] = h.value;
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || undefined,
      url: url.trim(),
      method,
      headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
      body: parsedBody,
      input_schema: parsedInputSchema,
      response: responsePath.trim() || undefined,
      speech: speech.trim() || undefined,
    };

    // Remove undefined values
    for (const k of Object.keys(payload)) {
      if (payload[k] === undefined) delete payload[k];
    }

    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create tool");
      }

      router.push("/dashboard/tools");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const showBody = method === "POST" || method === "PUT";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard/tools"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-card transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Tool</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create an HTTP API integration your AI agents can call
            mid-conversation.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Basic Info
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="tool-name"
                className="block text-sm font-medium mb-1.5"
              >
                Tool Name <span className="text-red-400">*</span>
              </label>
              <input
                id="tool-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Check Inventory, Book Appointment, CRM Lookup"
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            <div>
              <label
                htmlFor="tool-description"
                className="block text-sm font-medium mb-1.5"
              >
                Description
              </label>
              <textarea
                id="tool-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what this tool does. The AI uses this to decide when to call it during a conversation."
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
              />
            </div>
          </div>
        </section>

        {/* API Configuration */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            API Configuration
          </h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-32">
                <label
                  htmlFor="tool-method"
                  className="block text-sm font-medium mb-1.5"
                >
                  Method
                </label>
                <select
                  id="tool-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {HTTP_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label
                  htmlFor="tool-url"
                  className="block text-sm font-medium mb-1.5"
                >
                  URL <span className="text-red-400">*</span>
                </label>
                <input
                  id="tool-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            </div>

            {/* Headers */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium">Headers</label>
                <button
                  type="button"
                  onClick={addHeader}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  <Plus className="w-3 h-3" />
                  Add Header
                </button>
              </div>
              <div className="space-y-2">
                {headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={h.key}
                      onChange={(e) => updateHeader(i, "key", e.target.value)}
                      placeholder="Header name"
                      className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      type="text"
                      value={h.value}
                      onChange={(e) => updateHeader(i, "value", e.target.value)}
                      placeholder="Value"
                      className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeHeader(i)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {headers.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">
                    No headers configured.
                  </p>
                )}
              </div>
            </div>

            {/* Body */}
            {showBody && (
              <div>
                <label
                  htmlFor="tool-body"
                  className="block text-sm font-medium mb-1.5"
                >
                  Body Template (JSON)
                </label>
                <textarea
                  id="tool-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder='{"product_id": "{{product_id}}", "quantity": {{quantity}}}'
                  className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                />
              </div>
            )}
          </div>
        </section>

        {/* Input Schema */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Input Schema
          </h2>
          <div>
            <label
              htmlFor="tool-schema"
              className="block text-sm font-medium mb-1.5"
            >
              Parameters the AI should extract from the conversation
            </label>
            <textarea
              id="tool-schema"
              value={inputSchema}
              onChange={(e) => setInputSchema(e.target.value)}
              rows={5}
              placeholder={'{\n  "product_id": "string",\n  "quantity": "number"\n}'}
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Define parameter names and types as a JSON object. The AI will
              extract these values from the conversation before calling the API.
            </p>
          </div>
        </section>

        {/* Response Mapping */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Response Mapping
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="tool-response-path"
                className="block text-sm font-medium mb-1.5"
              >
                Response JSONPath
              </label>
              <input
                id="tool-response-path"
                type="text"
                value={responsePath}
                onChange={(e) => setResponsePath(e.target.value)}
                placeholder="$.data.result"
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                JSONPath expression to extract the relevant data from the API
                response.
              </p>
            </div>

            <div>
              <label
                htmlFor="tool-speech"
                className="block text-sm font-medium mb-1.5"
              >
                Waiting Speech
              </label>
              <textarea
                id="tool-speech"
                value={speech}
                onChange={(e) => setSpeech(e.target.value)}
                rows={2}
                placeholder="Let me check that for you, one moment..."
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                What the agent says while waiting for the API response.
              </p>
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !name.trim() || !url.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {submitting ? "Creating..." : "Create Tool"}
          </button>
          <Link
            href="/dashboard/tools"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-card transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
