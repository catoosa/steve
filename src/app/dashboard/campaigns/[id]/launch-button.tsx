"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";

export function LaunchCampaignButton({ campaignId }: { campaignId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLaunch() {
    if (!confirm("Launch this campaign? Calls will begin immediately.")) return;

    setLoading(true);
    const res = await fetch(`/api/campaigns/${campaignId}/launch`, {
      method: "POST",
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to launch campaign");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleLaunch}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-50"
    >
      <Play className="w-4 h-4" />
      {loading ? "Launching..." : "Launch Campaign"}
    </button>
  );
}
