"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ToggleLeft, ToggleRight } from "lucide-react";

export function ToggleMemoryButton({
  memoryId,
  enabled,
}: {
  memoryId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [optimisticEnabled, setOptimisticEnabled] = useState(enabled);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const next = !optimisticEnabled;
    setOptimisticEnabled(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/memory/${memoryId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) {
        // Revert on failure
        setOptimisticEnabled(!next);
        const data = await res.json();
        alert(data.error || "Toggle failed");
      } else {
        router.refresh();
      }
    } catch {
      setOptimisticEnabled(!next);
      alert("Toggle failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        optimisticEnabled
          ? "text-emerald-600 hover:text-emerald-700"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : optimisticEnabled ? (
        <ToggleRight className="w-3.5 h-3.5" />
      ) : (
        <ToggleLeft className="w-3.5 h-3.5" />
      )}
      {optimisticEnabled ? "Enabled" : "Disabled"}
    </button>
  );
}
