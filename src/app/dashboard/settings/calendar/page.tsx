import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Check, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CalendarSettingsClient } from "./calendar-settings-client";

export default async function CalendarSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) redirect("/dashboard");

  // Fetch existing calendar integration
  const { data: integration } = await supabase
    .from("calendar_integrations")
    .select("*")
    .eq("org_id", membership.org_id)
    .limit(1)
    .single();

  return (
    <div>
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Calendar Integration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your Google Calendar to sync bookings automatically.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Connection Status */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                integration?.is_active
                  ? "bg-success/10"
                  : "bg-muted"
              }`}
            >
              <Calendar
                className={`w-5 h-5 ${
                  integration?.is_active
                    ? "text-success"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <h2 className="font-semibold">Google Calendar</h2>
              <p className="text-sm text-muted-foreground">
                {integration?.is_active
                  ? "Connected and syncing"
                  : "Not connected"}
              </p>
            </div>
            {integration?.is_active && (
              <div className="ml-auto">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">
                  <Check className="w-3 h-3" />
                  Active
                </span>
              </div>
            )}
          </div>

          {/* OAuth Button — Coming Soon */}
          <button
            disabled
            className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed"
          >
            <ExternalLink className="w-4 h-4" />
            Connect Google Calendar
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1">
              Coming Soon
            </span>
          </button>
        </div>

        {/* Calendar Settings */}
        <CalendarSettingsClient
          orgId={membership.org_id}
          integration={integration}
        />
      </div>
    </div>
  );
}
