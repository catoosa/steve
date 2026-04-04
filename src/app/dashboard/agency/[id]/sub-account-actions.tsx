"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2 } from "lucide-react";

export default function SubAccountActions({
  subAccountId,
  currentName,
  currentCallLimit,
}: {
  subAccountId: string;
  currentName: string;
  currentCallLimit: number;
}) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [callLimit, setCallLimit] = useState(currentCallLimit);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    const res = await fetch(`/api/agency/sub-accounts/${subAccountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, call_limit: callLimit }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSaveError(json.error ?? "Failed to save changes");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    }
    setSaving(false);
  }

  async function handleRemove() {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }

    setRemoving(true);
    const res = await fetch(`/api/agency/sub-accounts/${subAccountId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push("/dashboard/agency");
    } else {
      const json = await res.json().catch(() => ({}));
      setSaveError(json.error ?? "Failed to remove sub-account");
      setRemoving(false);
      setConfirmRemove(false);
    }
  }

  return (
    <div className="border border-border rounded-xl p-6">
      <h2 className="font-semibold mb-5">Account Settings</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Client Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Monthly Call Limit</label>
          <input
            type="number"
            min={0}
            value={callLimit}
            onChange={(e) => setCallLimit(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {saveError && (
          <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{saveError}</p>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              confirmRemove
                ? "border-red-500 text-red-500 hover:bg-red-500/10"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {removing ? "Removing..." : confirmRemove ? "Confirm Remove" : "Remove Client"}
          </button>
        </div>
        {confirmRemove && (
          <p className="text-xs text-muted-foreground">
            This will detach the client from your agency. Their account will remain but be independent.
            Click &quot;Confirm Remove&quot; to proceed.
          </p>
        )}
      </form>
    </div>
  );
}
