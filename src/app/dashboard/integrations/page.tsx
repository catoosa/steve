import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Plug } from "lucide-react";
import GHLForm from "./ghl-form";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select(
      "org_id, organizations(id, ghl_api_key, ghl_location_id, ghl_enabled)"
    )
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const org = membership?.organizations as unknown as {
    id: string;
    ghl_api_key: string | null;
    ghl_location_id: string | null;
    ghl_enabled: boolean | null;
  } | null;

  const ghlEnabled = org?.ghl_enabled ?? false;
  const ghlConnected = !!(org?.ghl_api_key && org?.ghl_location_id);

  // Mask api key — only expose last 4 chars to the form
  const maskedKey = org?.ghl_api_key
    ? "••••••••" + org.ghl_api_key.slice(-4)
    : "";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Plug className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Integrations</h1>
      </div>

      <div className="space-y-6">
        {/* GoHighLevel card */}
        <div className="bg-background border border-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* GHL logo placeholder */}
              <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">GHL</span>
              </div>
              <div>
                <h2 className="font-semibold text-base">GoHighLevel</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Automatically update GHL contacts with call outcomes, trigger
                  campaigns from GHL workflows
                </p>
              </div>
            </div>
            <span
              className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                ghlConnected
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {ghlConnected ? "Connected" : "Not Connected"}
            </span>
          </div>

          <GHLForm
            initialApiKey={maskedKey}
            initialLocationId={org?.ghl_location_id ?? ""}
            initialEnabled={ghlEnabled}
          />
        </div>

        {/* Zapier / Make card — coming soon */}
        <div className="bg-background border border-border rounded-xl p-6 opacity-60">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <span className="text-muted-foreground font-bold text-xs">ZAP</span>
              </div>
              <div>
                <h2 className="font-semibold text-base">Zapier / Make</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Connect Skawk to 5,000+ apps via Zapier or Make.com
                </p>
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
