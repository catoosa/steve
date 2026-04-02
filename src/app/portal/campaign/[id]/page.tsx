"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type Campaign = {
  id: string;
  name: string;
  status: string;
  total_contacts: number | null;
  calls_completed: number | null;
  calls_answered: number | null;
  created_at: string;
};

type Call = {
  id: string;
  phone: string;
  status: string;
  duration_seconds: number | null;
  answered_by: string | null;
  created_at: string;
  disposition: string | null;
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  paused: "bg-yellow-100 text-yellow-700",
  draft: "bg-gray-100 text-gray-600",
};

const STATUS_BARS = [
  { status: "completed", label: "Completed", color: "bg-green-500" },
  { status: "no_answer", label: "No Answer", color: "bg-yellow-400" },
  { status: "voicemail", label: "Voicemail", color: "bg-purple-400" },
  { status: "busy", label: "Busy", color: "bg-orange-400" },
  { status: "failed", label: "Failed", color: "bg-red-500" },
  { status: "queued", label: "Queued", color: "bg-gray-300" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function PortalCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org_id");
  const key = searchParams.get("key");

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId || !key) {
      setLoading(false);
      return;
    }

    async function load() {
      const res = await fetch(
        `/api/portal/campaigns/${id}?org_id=${encodeURIComponent(orgId!)}&key=${encodeURIComponent(key!)}`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to load campaign");
        setLoading(false);
        return;
      }
      const json = await res.json();
      setCampaign(json.campaign ?? null);
      setCalls(json.calls ?? []);
      setLoading(false);
    }

    load();
  }, [id, orgId, key]);

  const backHref =
    orgId && key
      ? `/portal?org_id=${encodeURIComponent(orgId)}&key=${encodeURIComponent(key)}`
      : "/portal";

  if (!orgId || !key) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm max-w-md">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            Invalid portal link
          </p>
          <p className="text-sm text-gray-500">
            This link is missing required credentials.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-400 text-sm">Loading campaign…</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="bg-white border border-red-200 rounded-xl p-10 shadow-sm max-w-md">
          <p className="text-lg font-semibold text-red-600 mb-2">
            {error ?? "Campaign not found"}
          </p>
          <Link href={backHref} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            ← Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  // Stats
  const completed = campaign.calls_completed ?? 0;
  const answered = campaign.calls_answered ?? 0;
  const total = campaign.total_contacts ?? 0;
  const answerRate = completed > 0 ? Math.round((answered / completed) * 100) : 0;
  const totalDuration = calls.reduce((sum, c) => sum + (c.duration_seconds ?? 0), 0);
  const avgDuration = calls.length > 0 ? Math.round(totalDuration / calls.length) : 0;

  const badge = STATUS_BADGE[campaign.status] ?? "bg-gray-100 text-gray-600";

  // Disposition breakdown
  const dispositionCounts: Record<string, number> = {};
  for (const c of calls) {
    if (c.disposition) {
      dispositionCounts[c.disposition] = (dispositionCounts[c.disposition] || 0) + 1;
    }
  }
  const dispositionEntries = Object.entries(dispositionCounts).sort((a, b) => b[1] - a[1]);
  const totalWithDisposition = dispositionEntries.reduce((sum, [, n]) => sum + n, 0);

  return (
    <div>
      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        ← Back to campaigns
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{campaign.name}</h2>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badge}`}
        >
          {campaign.status}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Calls", value: total },
          { label: "Completed", value: completed },
          { label: "Answered", value: answered },
          { label: "Avg Duration", value: formatDuration(avgDuration) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Answer rate hero */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Answer Rate</p>
          <p className="text-5xl font-bold text-blue-600">{answerRate}%</p>
          <p className="text-xs text-gray-400 mt-1">
            {answered} answered of {completed} completed calls
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-sm text-gray-500">Campaign started</p>
          <p className="text-sm font-medium text-gray-900">
            {new Date(campaign.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Call Status Breakdown</h3>
        {calls.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No call data yet.</p>
        ) : (
          <div className="space-y-3">
            {STATUS_BARS.map((s) => {
              const count = calls.filter((c) => c.status === s.status).length;
              const pct = calls.length > 0 ? (count / calls.length) * 100 : 0;
              return (
                <div key={s.status} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-24">{s.label}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.color} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-20 text-right">
                    {count} ({Math.round(pct)}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Disposition breakdown */}
      {dispositionEntries.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Disposition Breakdown</h3>
          <div className="space-y-3">
            {dispositionEntries.map(([disposition, count]) => {
              const pct =
                totalWithDisposition > 0
                  ? (count / totalWithDisposition) * 100
                  : 0;
              return (
                <div key={disposition} className="flex items-center gap-3">
                  <span
                    className="text-sm text-gray-500 w-40 truncate"
                    title={disposition}
                  >
                    {disposition}
                  </span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-20 text-right">
                    {count} ({Math.round(pct)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calls table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            Calls{" "}
            <span className="text-gray-400 font-normal text-sm">
              ({calls.length})
            </span>
          </h3>
        </div>

        {calls.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">
            No calls recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {["Phone", "Status", "Duration", "Date"].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {calls.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">
                      {c.phone}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {c.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDuration(c.duration_seconds)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
