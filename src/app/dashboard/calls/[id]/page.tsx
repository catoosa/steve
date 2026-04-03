import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Play,
  FileText,
  BarChart2,
  PhoneCall,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CallDetailClient } from "./call-detail-client";

export default async function CallDetailPage({
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

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) redirect("/dashboard");

  const { data: call } = await supabase
    .from("calls")
    .select("*, campaigns(id, name)")
    .eq("id", id)
    .eq("org_id", membership.org_id)
    .single();

  if (!call) redirect("/dashboard/calls");

  const analysis = call.analysis as Record<string, unknown> | null;
  const disposition = analysis?.disposition as string | null | undefined;
  const emotionObj = analysis?.emotion as Record<string, unknown> | null | undefined;
  const emotionStr = emotionObj
    ? ((emotionObj.primary_emotion ?? emotionObj.emotion) as string) ?? null
    : null;

  // Parse transcript — may be plain text or JSONB array
  type TranscriptEntry = { speaker?: string; role?: string; text?: string; content?: string };
  let transcriptEntries: TranscriptEntry[] | null = null;
  let transcriptPlain: string | null = null;

  if (call.transcript) {
    if (Array.isArray(call.transcript)) {
      transcriptEntries = call.transcript as TranscriptEntry[];
    } else if (typeof call.transcript === "string") {
      try {
        const parsed = JSON.parse(call.transcript);
        if (Array.isArray(parsed)) {
          transcriptEntries = parsed;
        } else {
          transcriptPlain = call.transcript;
        }
      } catch {
        transcriptPlain = call.transcript;
      }
    } else if (typeof call.transcript === "object") {
      // JSONB object — try to treat as array-like or plain stringify
      transcriptPlain = JSON.stringify(call.transcript, null, 2);
    }
  }

  const campaign = call.campaigns as { id: string; name: string } | null;

  // Summary and extra analysis fields
  const summary = analysis?.summary as string | null | undefined;
  const keyPoints = analysis?.key_points as string[] | null | undefined;

  return (
    <div>
      <Link
        href="/dashboard/calls"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Call Logs
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <PhoneCall className="w-6 h-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">{call.phone}</h1>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              call.status === "completed"
                ? "bg-success/10 text-success"
                : call.status === "failed" || call.status === "no_answer"
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {call.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(call.created_at).toLocaleString()}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Duration</p>
          <p className="font-semibold">
            {call.duration_seconds ? `${call.duration_seconds}s` : "—"}
          </p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Answered By</p>
          <p className="font-semibold">{call.answered_by || "—"}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Cost</p>
          <p className="font-semibold">
            {call.cost != null ? `$${Number(call.cost).toFixed(4)}` : "—"}
          </p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Campaign</p>
          {campaign ? (
            <Link
              href={`/dashboard/campaigns/${campaign.id}`}
              className="font-semibold text-primary hover:underline truncate block"
            >
              {campaign.name}
            </Link>
          ) : (
            <p className="font-semibold text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Recording Player */}
      {call.recording_url ? (
        <div className="bg-background border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Play className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Recording</h2>
          </div>

          {/* Waveform placeholder */}
          <div className="h-12 bg-muted rounded-lg mb-4 flex items-center px-4 gap-0.5 overflow-hidden">
            {Array.from({ length: 80 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-primary/40 rounded-full"
                style={{
                  height: `${20 + Math.sin(i * 0.7) * 12 + Math.sin(i * 1.3) * 8}%`,
                }}
              />
            ))}
          </div>

          <audio
            controls
            src={call.recording_url}
            className="w-full h-10 rounded-lg"
          />

          <a
            href={call.recording_url}
            download
            className="inline-flex items-center gap-2 mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            <Download className="w-4 h-4" />
            Download recording
          </a>
        </div>
      ) : null}

      {/* Transcript */}
      {(transcriptEntries || transcriptPlain) ? (
        <div className="bg-background border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Transcript</h2>
          </div>

          {transcriptEntries ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {transcriptEntries.map((entry, i) => {
                const speaker = (entry.speaker ?? entry.role ?? "").toLowerCase();
                const isAI =
                  speaker.includes("assistant") ||
                  speaker.includes("ai") ||
                  speaker.includes("agent") ||
                  speaker === "0" ||
                  speaker === "bot";
                const text = entry.text ?? entry.content ?? "";
                return (
                  <div
                    key={i}
                    className={`flex ${isAI ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        isAI
                          ? "bg-muted text-foreground rounded-tl-sm"
                          : "bg-primary/10 text-foreground rounded-tr-sm"
                      }`}
                    >
                      <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                        {isAI ? "AI" : "Human"}
                      </p>
                      <p>{text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <pre className="text-sm font-mono whitespace-pre-wrap text-muted-foreground bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
              {transcriptPlain}
            </pre>
          )}
        </div>
      ) : null}

      {/* Analysis */}
      <div className="bg-background border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Analysis</h2>
        </div>

        <CallDetailClient
          callId={id}
          initialEmotion={emotionStr}
          disposition={disposition ?? null}
          summary={summary ?? null}
          keyPoints={keyPoints ?? null}
        />
      </div>
    </div>
  );
}
