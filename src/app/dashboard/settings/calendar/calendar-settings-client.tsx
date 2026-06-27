"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Integration = {
  id: string;
  org_id: string;
  provider: string;
  calendar_id: string | null;
  is_active: boolean;
} | null;

export function CalendarSettingsClient({
  orgId,
  integration,
}: {
  orgId: string;
  integration: Integration;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [calendarId, setCalendarId] = useState(
    integration?.calendar_id || ""
  );
  const [isActive, setIsActive] = useState(integration?.is_active ?? false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const supabase = createClient();

    if (integration) {
      // Update existing
      await supabase
        .from("calendar_integrations")
        .update({
          calendar_id: calendarId.trim() || null,
          is_active: isActive,
        })
        .eq("id", integration.id);
    } else {
      // Create new
      await supabase.from("calendar_integrations").insert({
        org_id: orgId,
        provider: "google",
        calendar_id: calendarId.trim() || null,
        is_active: isActive,
      });
    }

    setSaving(false);
    setSaved(true);
    router.refresh();

    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="font-semibold mb-4">Calendar Settings</h2>

      <div className="space-y-5">
        {/* Calendar ID */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Google Calendar ID
          </label>
          <input
            type="text"
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
            placeholder="your-email@gmail.com or calendar ID"
            className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Find this in Google Calendar Settings &gt; Calendar ID. Usually your
            email address for the primary calendar.
          </p>
        </div>

        {/* Enable/Disable Sync */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40"
          />
          <div>
            <p className="text-sm font-medium">Enable calendar sync</p>
            <p className="text-xs text-muted-foreground">
              When enabled, new bookings will be synced to your Google Calendar
            </p>
          </div>
        </label>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && (
            <span className="text-sm text-success font-medium">
              Settings saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
