"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Loader2, CheckCircle } from "lucide-react";

export default function SendSMSPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [from, setFrom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const charCount = message.length;
  const overLimit = charCount > 160;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: phone,
          message,
          ...(from ? { from } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send SMS");
      }

      setSuccess(true);
      setPhone("");
      setMessage("");
      setFrom("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Link
        href="/dashboard/sms"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to SMS
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Send SMS</h1>
          <p className="text-sm text-muted-foreground">
            Send a single SMS message to a phone number.
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
          SMS sent successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0412 345 678 or +61412345678"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            required
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <p
            className={`text-xs mt-1.5 ${
              overLimit ? "text-red-400" : "text-muted-foreground"
            }`}
          >
            {charCount}/160 characters
            {overLimit && " — message may be split into multiple parts"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            From Number{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <input
            type="tel"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="Leave blank for default"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Optionally specify a purchased number to send from.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !phone || !message}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Sending..." : "Send SMS"}
        </button>
      </form>
    </div>
  );
}
