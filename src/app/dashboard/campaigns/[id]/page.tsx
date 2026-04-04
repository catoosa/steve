import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Pause, PhoneCall, FlaskConical, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LaunchCampaignButton } from "./launch-button";
import { AnalyzeEmotionButton } from "./analyze-emotion-button";
import { ExportButtons } from "./export-buttons";
import { LiveStats } from "./live-stats";

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
    .limit(200);

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
          <ExportButtons campaignId={campaign.id} />
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

      {/* Stats — live when active, static otherwise */}
      {campaign.status === "active" ? (
        <LiveStats
          campaignId={campaign.id}
          campaignStatus={campaign.status}
          initialStats={{
            total: campaign.total_contacts,
            completed: campaign.calls_completed,
            answered: campaign.calls_answered,
            inProgress: calls?.filter((c) => c.status === "in_progress").length ?? 0,
            queued: calls?.filter((c) => c.status === "queued").length ?? 0,
          }}
        />
      ) : (
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
      )}

      {/* A/B Variant Performance */}
      {(() => {
        // Check if any calls have variant metadata
        const variantCalls = calls?.filter(
          (c) => (c.metadata as Record<string, unknown>)?.variant
        );
        if (!variantCalls || variantCalls.length === 0) return null;

        // Group by variant
        const variantMap = new Map<
          string,
          {
            total: number;
            completed: number;
            answered: number;
            totalDuration: number;
            dispositions: Record<string, number>;
          }
        >();

        for (const call of variantCalls) {
          const variant = String(
            (call.metadata as Record<string, unknown>).variant
          );
          if (!variantMap.has(variant)) {
            variantMap.set(variant, {
              total: 0,
              completed: 0,
              answered: 0,
              totalDuration: 0,
              dispositions: {},
            });
          }
          const stats = variantMap.get(variant)!;
          stats.total++;
          if (call.status === "completed") {
            stats.completed++;
            if (call.answered_by === "human") stats.answered++;
            if (call.duration_seconds)
              stats.totalDuration += call.duration_seconds;
          }
          const disposition = (
            call.analysis as Record<string, unknown> | null
          )?.disposition;
          if (disposition) {
            const d = String(disposition);
            stats.dispositions[d] = (stats.dispositions[d] || 0) + 1;
          }
        }

        const variantEntries = Array.from(variantMap.entries()).sort(
          ([a], [b]) => a.localeCompare(b)
        );

        // Determine winner (highest answer rate among variants with completed calls)
        let winnerVariant: string | null = null;
        let bestRate = -1;
        for (const [name, stats] of variantEntries) {
          if (stats.completed > 0) {
            const rate = stats.answered / stats.completed;
            if (rate > bestRate) {
              bestRate = rate;
              winnerVariant = name;
            }
          }
        }

        return (
          <div className="bg-background border border-border rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">A/B Variant Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Variant
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Contacts
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Completed
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Answered
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Answer Rate
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Avg Duration
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground">
                      Top Disposition
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {variantEntries.map(([name, stats]) => {
                    const answerRate =
                      stats.completed > 0
                        ? Math.round(
                            (stats.answered / stats.completed) * 100
                          )
                        : 0;
                    const avgDuration =
                      stats.completed > 0
                        ? Math.round(stats.totalDuration / stats.completed)
                        : 0;
                    const topDisposition = Object.entries(stats.dispositions)
                      .sort(([, a], [, b]) => b - a)[0];
                    const isWinner =
                      winnerVariant === name &&
                      variantEntries.length > 1 &&
                      stats.completed > 0;

                    return (
                      <tr
                        key={name}
                        className={
                          isWinner
                            ? "ring-1 ring-success/50 bg-success/5 rounded"
                            : ""
                        }
                      >
                        <td className="py-3 pr-4 font-medium">
                          <span className="flex items-center gap-1.5">
                            Variant {name}
                            {isWinner && (
                              <Trophy className="w-3.5 h-3.5 text-success" />
                            )}
                          </span>
                        </td>
                        <td className="py-3 pr-4">{stats.total}</td>
                        <td className="py-3 pr-4">{stats.completed}</td>
                        <td className="py-3 pr-4">{stats.answered}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={
                              isWinner
                                ? "text-success font-semibold"
                                : ""
                            }
                          >
                            {stats.completed > 0 ? `${answerRate}%` : "--"}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {stats.completed > 0 ? `${avgDuration}s` : "--"}
                        </td>
                        <td className="py-3">
                          {topDisposition ? (
                            <span className="inline-flex items-center bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                              {topDisposition[0]} ({topDisposition[1]})
                            </span>
                          ) : (
                            "--"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

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
        {campaign.dispositions && Array.isArray(campaign.dispositions) && campaign.dispositions.length > 0 && (
          <>
            <h3 className="font-medium mt-4 mb-2 text-sm">Dispositions</h3>
            <div className="flex flex-wrap gap-2">
              {(campaign.dispositions as string[]).map((d: string) => (
                <span
                  key={d}
                  className="inline-flex items-center bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {d}
                </span>
              ))}
            </div>
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
                    {(call.metadata as Record<string, unknown> | null)?.variant && (
                      <span className="inline-flex items-center bg-muted text-muted-foreground text-xs font-medium px-1.5 py-0.5 rounded">
                        {String((call.metadata as Record<string, unknown>).variant)}
                      </span>
                    )}
                    {(call.analysis as Record<string, unknown> | null)?.disposition && (
                      <span className="inline-flex items-center bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                        {String((call.analysis as Record<string, unknown>).disposition)}
                      </span>
                    )}
                    {call.status === "completed" && (
                      <AnalyzeEmotionButton
                        callId={call.id}
                        existingEmotion={
                          (call.analysis as Record<string, unknown> | null)?.emotion
                            ? String(
                                ((call.analysis as Record<string, unknown>).emotion as Record<string, unknown>)?.primary_emotion ??
                                ((call.analysis as Record<string, unknown>).emotion as Record<string, unknown>)?.emotion ??
                                null
                              )
                            : null
                        }
                      />
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
