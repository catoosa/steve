"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

export default function InviteForm({ onInvited }: { onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Failed to send invitation");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setEmail("");
    setRole("member");
    setLoading(false);
    onInvited();

    setTimeout(() => setSuccess(false), 4000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
          Invitation sent successfully.
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="colleague@company.com"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "member" | "viewer")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        <UserPlus className="w-4 h-4" />
        {loading ? "Sending..." : "Send Invite"}
      </button>
      <p className="text-xs text-muted-foreground">
        The invitee will receive an email with a link to join your organization. If they don&apos;t have a Skawk account yet, they&apos;ll need to sign up first.
      </p>
    </form>
  );
}
