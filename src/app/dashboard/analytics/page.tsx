import { redirect } from "next/navigation";
import { Activity, Phone, PhoneCall, Clock, CheckCircle, XCircle, Tag, Heart, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const orgId = membership?.org_id;
  if (!orgId) redirect("/dashboard");

  // Get call stats
  const { data: calls } = await supabase
    .from("calls")
    .select("status, duration_seconds, answered_by, created_at, analysis")
    .eq("org_id", orgId);

  const allCalls = calls ?? [];
  const completed = allCalls.filter((c) => c.status === "completed");
  const answered = completed.filter((c) => c.answered_by === "human");
  const totalDuration = completed.reduce((sum, c) => sum + (c.duration_seconds ?? 0), 0);
  const avgDuration = completed.length > 0 ? Math.round(totalDuration / completed.length) : 0;

  // Build disposition counts from analysis JSONB
  const dispositionCounts: Record<string, number> = {};
  for (const call of allCalls) {
    const analysis = call.analysis as Record<string, unknown> | null;
    const disposition = analysis?.disposition as string | undefined;
    if (disposition) {
      dispositionCounts[disposition] = (dispositionCounts[disposition] || 0) + 1;
    }
  }
  const dispositionEntries = Object.entries(dispositionCounts).sort((a, b) => b[1] - a[1]);
  const totalWithDisposition = dispositionEntries.reduce((sum, [, count]) => sum + count, 0);

  // Build emotion counts from analysis.emotion JSONB
  const emotionCounts: Record<string, number> = {};
  for (const call of allCalls) {
    const analysis = call.analysis as Record<string, unknown> | null;
    const emotionData = analysis?.emotion as Record<string, unknown> | undefined;
    if (emotionData) {
      const primary = String(emotionData.primary_emotion ?? emotionData.emotion ?? "neutral").toLowerCase();
      emotionCounts[primary] = (emotionCounts[primary] || 0) + 1;
    }
  }
  const emotionEntries = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
  const totalWithEmotion = emotionEntries.reduce((sum, [, count]) => sum + count, 0);

  const EMOTION_BAR_COLORS: Record<string, string> = {
    neutral: "bg-muted-foreground",
    happy: "bg-success",
    angry: "bg-destructive",
    sad: "bg-blue-500",
    fear: "bg-yellow-500",
  };

  const stats = [
    { label: "Total Calls", value: allCalls.length, icon: Phone, color: "text-primary" },
    { label: "Completed", value: completed.length, icon: CheckCircle, color: "text-success" },
    { label: "Answered (Human)", value: answered.length, icon: PhoneCall, color: "text-accent" },
    { label: "Avg Duration", value: `${avgDuration}s`, icon: Clock, color: "text-secondary" },
    {
      label: "Answer Rate",
      value: completed.length > 0 ? `${Math.round((answered.length / completed.length) * 100)}%` : "—",
      icon: Activity,
      color: "text-primary",
    },
    {
      label: "Failed",
      value: allCalls.filter((c) => ["failed", "no_answer", "busy"].includes(c.status)).length,
      icon: XCircle,
      color: "text-destructive",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <a
          href="/api/analytics/export"
          target="_blank"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <Download className="w-4 h-4" />
          Export All CSV
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Call Status Breakdown</h2>
        {allCalls.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No call data yet. Launch a campaign to see analytics.
          </p>
        ) : (
          <div className="space-y-3">
            {[
              { status: "completed", label: "Completed", color: "bg-success" },
              { status: "no_answer", label: "No Answer", color: "bg-accent" },
              { status: "voicemail", label: "Voicemail", color: "bg-secondary" },
              { status: "busy", label: "Busy", color: "bg-muted-foreground" },
              { status: "failed", label: "Failed", color: "bg-destructive" },
              { status: "queued", label: "Queued", color: "bg-border" },
            ].map((s) => {
              const count = allCalls.filter((c) => c.status === s.status).length;
              const pct = allCalls.length > 0 ? (count / allCalls.length) * 100 : 0;
              return (
                <div key={s.status} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-24">{s.label}</span>
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{count} ({Math.round(pct)}%)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Disposition breakdown */}
      <div className="bg-card border border-border rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Tag className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Call Dispositions</h2>
        </div>
        {dispositionEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No disposition data yet. Add dispositions to a campaign to start tracking outcomes.
          </p>
        ) : (
          <div className="space-y-3">
            {dispositionEntries.map(([disposition, count]) => {
              const pct = totalWithDisposition > 0 ? (count / totalWithDisposition) * 100 : 0;
              return (
                <div key={disposition} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-40 truncate" title={disposition}>
                    {disposition}
                  </span>
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">
                    {count} ({Math.round(pct)}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Emotion analysis breakdown */}
      <div className="bg-card border border-border rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Emotion Analysis</h2>
        </div>
        {emotionEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No emotion data yet. Analyze calls to see emotion breakdowns.
          </p>
        ) : (
          <div className="space-y-3">
            {emotionEntries.map(([emotion, count]) => {
              const pct = totalWithEmotion > 0 ? (count / totalWithEmotion) * 100 : 0;
              const barColor = EMOTION_BAR_COLORS[emotion] || "bg-muted-foreground";
              return (
                <div key={emotion} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-24 capitalize">{emotion}</span>
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">
                    {count} ({Math.round(pct)}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
