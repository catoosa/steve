"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function WorkflowToggle({
  workflowId,
  initialEnabled,
}: {
  workflowId: string;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [toggling, setToggling] = useState(false);

  async function toggle() {
    setToggling(true);
    const supabase = createClient();
    const newEnabled = !enabled;
    const { error } = await supabase
      .from("workflows")
      .update({ enabled: newEnabled })
      .eq("id", workflowId);

    if (!error) {
      setEnabled(newEnabled);
    }
    setToggling(false);
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={toggling}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-50 ${
          enabled ? "bg-primary" : "bg-muted"
        }`}
        aria-label={enabled ? "Disable workflow" : "Enable workflow"}
      >
        <span
          className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="text-xs">
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}
