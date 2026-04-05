"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Radio,
  Phone,
  PhoneCall,
  PhoneOff,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  Volume2,
  ChevronRight,
  Activity,
  Zap,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ActiveCall {
  id: string;
  phone: string;
  status: string;
  campaign_id: string | null;
  campaign_name: string | null;
  contact_name: string | null;
  bland_call_id: string | null;
  started_at: string | null;
  created_at: string;
}

interface RecentCall {
  id: string;
  phone: string;
  status: string;
  campaign_name: string | null;
  contact_name: string | null;
  duration_seconds: number | null;
  answered_by: string | null;
  analysis: Record<string, unknown> | null;
  completed_at: string | null;
}

interface LiveStats {
  active_calls: number;
  today_completed: number;
  today_answered: number;
  answer_rate: number;
}

const ALERT_KEYWORDS = ["cancel", "angry", "manager", "lawyer", "complaint", "refund", "terrible", "worst", "sue"];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function LiveDuration({ startedAt }: { startedAt: string | null }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setSeconds(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return <span className="text-xs text-muted-foreground">--:--</span>;
  return <span className="text-xs font-mono text-foreground">{formatDuration(seconds)}</span>;
}

function getSentimentColor(analysis: Record<string, unknown> | null): string {
  if (!analysis) return "bg-muted";
  const disposition = String(analysis.disposition || "").toLowerCase();
  const mood = String(analysis.mood || "").toLowerCase();
  if (disposition === "interested" || mood === "positive" || mood === "happy") return "bg-green-500";
  if (disposition === "do_not_call" || mood === "angry" || mood === "distressed") return "bg-red-500";
  if (mood === "anxious" || disposition === "follow_up") return "bg-yellow-500";
  return "bg-blue-500";
}

export default function LiveDashboardPage() {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [stats, setStats] = useState<LiveStats>({ active_calls: 0, today_completed: 0, today_answered: 0, answer_rate: 0 });
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/calls/active");
      if (!res.ok) return;
      const data = await res.json();
      setActiveCalls(data.active || []);
      setRecentCalls(data.recent || []);
      setStats(data.stats || { active_calls: 0, today_completed: 0, today_answered: 0, answer_rate: 0 });
      setLastUpdate(new Date());
    } catch {
      // Silently fail — will retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-primary" />
            {stats.active_calls > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Live Monitor</h1>
            <p className="text-xs text-muted-foreground">
              Updated {lastUpdate.toLocaleTimeString()} &middot; Refreshing every 3s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
            stats.active_calls > 0
              ? "bg-green-500/10 text-green-500"
              : "bg-muted text-muted-foreground"
          }`}>
            <span className={`w-2 h-2 rounded-full ${stats.active_calls > 0 ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
            {stats.active_calls > 0 ? `${stats.active_calls} Live` : "No active calls"}
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Active Calls",
            value: stats.active_calls,
            icon: PhoneCall,
            color: stats.active_calls > 0 ? "text-green-500" : "text-muted-foreground",
            bg: stats.active_calls > 0 ? "bg-green-500/10" : "bg-muted",
          },
          {
            label: "Completed Today",
            value: stats.today_completed,
            icon: CheckCircle2,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Answered Today",
            value: stats.today_answered,
            icon: Users,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
          },
          {
            label: "Answer Rate",
            value: `${stats.answer_rate}%`,
            icon: TrendingUp,
            color: stats.answer_rate >= 50 ? "text-green-500" : stats.answer_rate >= 25 ? "text-yellow-500" : "text-red-500",
            bg: stats.answer_rate >= 50 ? "bg-green-500/10" : stats.answer_rate >= 25 ? "bg-yellow-500/10" : "bg-red-500/10",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Active Calls */}
      {activeCalls.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Active Calls
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeCalls.map((call) => (
              <div
                key={call.id}
                className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedCall === call.id ? "border-primary shadow-lg" : "border-border"
                }`}
                onClick={() => setSelectedCall(selectedCall === call.id ? null : call.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Phone className="w-4 h-4 text-green-500" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <span className="text-sm font-mono font-medium">{call.phone}</span>
                  </div>
                  <LiveDuration startedAt={call.started_at} />
                </div>

                {call.contact_name && (
                  <p className="text-sm font-medium mb-1">{call.contact_name}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    call.status === "in_progress"
                      ? "bg-green-500/10 text-green-500"
                      : call.status === "ringing"
                      ? "bg-yellow-500/10 text-yellow-500"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {call.status === "in_progress" ? "Connected" : call.status === "ringing" ? "Ringing" : "Queued"}
                  </span>
                  {call.campaign_name && (
                    <span className="truncate">{call.campaign_name}</span>
                  )}
                </div>

                {selectedCall === call.id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <Link
                      href={`/dashboard/calls/${call.id}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      View full details <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Active */}
      {!loading && activeCalls.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No active calls right now</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            Launch a campaign and watch your calls appear here in real time. Every call, every word, every outcome — live.
          </p>
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <Zap className="w-4 h-4" /> Launch Campaign
          </Link>
        </div>
      )}

      {/* Recent Completions Feed */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Recent Completions
        </h2>

        {recentCalls.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No calls completed in the last 5 minutes.</p>
        ) : (
          <div className="space-y-2">
            {recentCalls.map((call) => {
              const disposition = call.analysis && typeof call.analysis === "object"
                ? String((call.analysis as Record<string, unknown>).disposition || "")
                : "";
              const summary = call.analysis && typeof call.analysis === "object"
                ? String((call.analysis as Record<string, unknown>).summary || "")
                : "";
              const sentimentColor = getSentimentColor(call.analysis);

              return (
                <Link
                  key={call.id}
                  href={`/dashboard/calls/${call.id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  {/* Sentiment dot */}
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sentimentColor}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {call.contact_name || call.phone}
                      </span>
                      {!call.contact_name && null}
                      {call.contact_name && (
                        <span className="text-xs text-muted-foreground font-mono">{call.phone}</span>
                      )}
                    </div>
                    {summary && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{summary}</p>
                    )}
                  </div>

                  {/* Disposition */}
                  {disposition && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      disposition.toLowerCase() === "interested"
                        ? "bg-green-500/10 text-green-500"
                        : disposition.toLowerCase() === "do_not_call"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {disposition}
                    </span>
                  )}

                  {/* Duration + answered */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono">
                      {call.duration_seconds ? formatDuration(call.duration_seconds) : "--"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {call.answered_by === "human" ? "Human" : call.answered_by === "voicemail" ? "Voicemail" : "N/A"}
                    </p>
                  </div>

                  {/* Time */}
                  <span className="text-[10px] text-muted-foreground shrink-0 w-12 text-right">
                    {call.completed_at ? timeAgo(call.completed_at) : ""}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
