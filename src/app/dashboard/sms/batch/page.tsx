"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, CheckCircle } from "lucide-react";

type Mode = "same" | "custom";

export default function BatchSMSPage() {
  const [mode, setMode] = useState<Mode>("same");
  const [sharedMessage, setSharedMessage] = useState("");
  const [phoneList, setPhoneList] = useState("");
  const [customLines, setCustomLines] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sharedCharCount = sharedMessage.length;
  const sharedOverLimit = sharedCharCount > 160;

  function parseMessages(): Array<{ to: string; message: string }> {
    if (mode === "same") {
      const phones = phoneList
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      return phones.map((to) => ({ to, message: sharedMessage }));
    } else {
      return customLines
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const commaIdx = line.indexOf(",");
          if (commaIdx === -1) return null;
          const to = line.slice(0, commaIdx).trim();
          const message = line.slice(commaIdx + 1).trim();
          if (!to || !message) return null;
          return { to, message };
        })
        .filter(Boolean) as Array<{ to: string; message: string }>;
    }
  }

  const messages = parseMessages();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (messages.length === 0) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/sms/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send batch SMS");
      }

      setSuccess(`Successfully queued ${messages.length} SMS messages.`);
      setPhoneList("");
      setSharedMessage("");
      setCustomLines("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/sms"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to SMS
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center">
          <Send className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Batch SMS</h1>
          <p className="text-sm text-muted-foreground">
            Send SMS messages to multiple recipients at once.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400 mb-6 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode("same")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "same"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Same message to all
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "custom"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Custom per contact
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === "same" ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={sharedMessage}
                onChange={(e) => setSharedMessage(e.target.value)}
                placeholder="Type the message to send to all recipients..."
                required
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              <p
                className={`text-xs mt-1.5 ${
                  sharedOverLimit ? "text-red-400" : "text-muted-foreground"
                }`}
              >
                {sharedCharCount}/160 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Phone Numbers{" "}
                <span className="text-muted-foreground font-normal">
                  (one per line)
                </span>
              </label>
              <textarea
                value={phoneList}
                onChange={(e) => setPhoneList(e.target.value)}
                placeholder={"0412 345 678\n0423 456 789\n+61400111222"}
                required
                rows={6}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">
              Messages{" "}
              <span className="text-muted-foreground font-normal">
                (one per line: phone,message)
              </span>
            </label>
            <textarea
              value={customLines}
              onChange={(e) => setCustomLines(e.target.value)}
              placeholder={
                "0412345678,Hi John, your appointment is tomorrow.\n0423456789,Hi Sarah, your order has shipped."
              }
              required
              rows={8}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Format: phone number, then comma, then message text.
            </p>
          </div>
        )}

        <div className="rounded-lg border border-border bg-muted/50 p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {messages.length} message{messages.length !== 1 ? "s" : ""} ready to
            send
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || messages.length === 0}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading
            ? "Sending..."
            : `Send ${messages.length} SMS${messages.length !== 1 ? "es" : ""}`}
        </button>
      </form>
    </div>
  );
}
