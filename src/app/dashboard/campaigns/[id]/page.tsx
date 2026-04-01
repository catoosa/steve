import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Pause, PhoneCall } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LaunchCampaignButton } from "./launch-button";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign) redirect("/dashboard/campaigns");

  // Get contacts
  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true })
    .limit(100);

  // Get calls for this campaign
  const { data: calls } = await supabase
    .from("calls")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const completedCalls = calls?.filter((c) => c.status === "completed") ?? [];
  const answeredCalls = completedCalls.filter(
    (c) => c.answered_by === "human"
  );

  return (
    <div>
      <Link
        href="/dashboard/campaigns"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-muted-foreground text-sm">
            Agent: {campaign.agent_name} &middot; {campaign.voice} &middot;{" "}
            {campaign.language}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-medium px-3 py-1 rounded-full ${
              campaign.status === "active"
                ? "bg-success/10 text-success"
                : campaign.status === "completed"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {campaign.status}
          </span>
          {campaign.status === "draft" && (
            <LaunchCampaignButton campaignId={campaign.id} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Contacts", value: campaign.total_contacts },
          { label: "Calls Completed", value: campaign.calls_completed },
          { label: "Calls Answered", value: campaign.calls_answered },
          {
            label: "Answer Rate",
            value:
              campaign.calls_completed > 0
                ? `${Math.round((campaign.calls_answered / campaign.calls_completed) * 100)}%`
                : "—",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-background border border-border rounded-xl p-4"
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Prompt */}
      <div className="bg-background border border-border rounded-xl p-6 mb-8">
        <h2 className="font-semibold mb-3">Agent Prompt</h2>
        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted rounded-lg p-4">
          {campaign.agent_prompt}
        </pre>
        {campaign.analysis_prompt && (
          <>
            <h3 className="font-medium mt-4 mb-2 text-sm">
              Data Extraction Prompt
            </h3>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted rounded-lg p-4">
              {campaign.analysis_prompt}
            </pre>
          </>
        )}
      </div>

      {/* Call logs */}
      <div className="bg-background border border-border rounded-xl">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Call Log</h2>
        </div>
        {!calls || calls.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <PhoneCall className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No calls yet. Launch the campaign to start calling.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {calls.map((call) => (
              <div key={call.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{call.phone}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        call.status === "completed"
                          ? "bg-success/10 text-success"
                          : call.status === "failed" ||
                              call.status === "no_answer"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {call.status}
                    </span>
                    {call.answered_by && (
                      <span className="text-xs text-muted-foreground">
                        ({call.answered_by})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {call.duration_seconds && (
                      <span>{call.duration_seconds}s</span>
                    )}
                    <span>
                      {new Date(call.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                {call.transcript && (
                  <details className="mt-2">
                    <summary className="text-xs text-primary cursor-pointer">
                      View transcript
                    </summary>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap mt-2 bg-muted rounded-lg p-3 font-mono">
                      {call.transcript}
                    </pre>
                  </details>
                )}
                {call.analysis && (
                  <details className="mt-1">
                    <summary className="text-xs text-primary cursor-pointer">
                      View extracted data
                    </summary>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap mt-2 bg-muted rounded-lg p-3 font-mono">
                      {JSON.stringify(call.analysis, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
