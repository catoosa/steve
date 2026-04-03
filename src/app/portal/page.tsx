"use client";

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

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  paused: "bg-yellow-100 text-yellow-700",
  draft: "bg-gray-100 text-gray-600",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PortalPage() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org_id");
  const key = searchParams.get("key");
  const slug = searchParams.get("__slug");
  const hostParam = searchParams.get("__host");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolved org_id + key (may come from slug/host lookup)
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null>(orgId);
  const [resolvedKey, setResolvedKey] = useState<string | null>(key);

  useEffect(() => {
    async function load() {
      let oid = orgId;
      let k = key;

      // If accessed via subdomain or custom domain, resolve org from slug/host
      if (slug || hostParam) {
        const param = slug
          ? `__slug=${encodeURIComponent(slug)}`
          : `__host=${encodeURIComponent(hostParam!)}`;
        const res = await fetch(`/api/portal/campaigns?${param}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError(json.error ?? "Failed to load campaigns");
          setLoading(false);
          return;
        }
        const json = await res.json();
        setResolvedOrgId(json.org_id ?? null);
        setResolvedKey(json.api_key ?? null);
        setCampaigns(json.campaigns ?? []);
        setLoading(false);
        return;
      }

      if (!oid || !k) {
        setLoading(false);
        return;
      }

      setResolvedOrgId(oid);
      setResolvedKey(k);

      const res = await fetch(
        `/api/portal/campaigns?org_id=${encodeURIComponent(oid)}&key=${encodeURIComponent(k)}`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to load campaigns");
        setLoading(false);
        return;
      }
      const json = await res.json();
      setCampaigns(json.campaigns ?? []);
      setLoading(false);
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, key, slug, hostParam]);

  // Determine campaign link params
  const campaignLinkSuffix = slug
    ? `__slug=${encodeURIComponent(slug)}`
    : hostParam
    ? `__host=${encodeURIComponent(hostParam)}`
    : resolvedOrgId && resolvedKey
    ? `org_id=${encodeURIComponent(resolvedOrgId)}&key=${encodeURIComponent(resolvedKey)}`
    : "";

  const missingCreds = !orgId && !key && !slug && !hostParam;

  if (missingCreds) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm max-w-md">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            Invalid portal link
          </p>
          <p className="text-sm text-gray-500">
            This link is missing required credentials. Please contact the sender
            for a valid portal URL.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-400 text-sm">Loading campaigns…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="bg-white border border-red-200 rounded-xl p-10 shadow-sm max-w-md">
          <p className="text-lg font-semibold text-red-600 mb-2">
            Access denied
          </p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm max-w-md">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            No campaigns yet
          </p>
          <p className="text-sm text-gray-500">
            Your campaigns will appear here once they&apos;ve been created.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Your Campaigns
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {campaigns.map((campaign) => {
          const completed = campaign.calls_completed ?? 0;
          const answered = campaign.calls_answered ?? 0;
          const total = campaign.total_contacts ?? 0;
          const answerRate =
            completed > 0 ? Math.round((answered / completed) * 100) : 0;
          const badge =
            STATUS_BADGE[campaign.status] ?? "bg-gray-100 text-gray-600";

          return (
            <div
              key={campaign.id}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{campaign.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(campaign.created_at)}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badge}`}
                >
                  {campaign.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-500">Total Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">{total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completed}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Answered</p>
                  <p className="text-2xl font-bold text-gray-900">{answered}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Answer Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {answerRate}%
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <Link
                  href={`/portal/campaign/${campaign.id}${campaignLinkSuffix ? `?${campaignLinkSuffix}` : ""}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  View Details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
