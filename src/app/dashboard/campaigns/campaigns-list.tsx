"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Megaphone, Search } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  status: string;
  agent_name: string | null;
  total_contacts: number | null;
  calls_completed: number | null;
};

export function CampaignsList({ campaigns }: { campaigns: Campaign[] }) {
  const [search, setSearch] = useState("");

  const filtered = campaigns.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search campaigns…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
        />
      </div>

      <div className="bg-background border border-border rounded-xl divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Megaphone className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              {search ? "No campaigns match your search." : "No campaigns yet."}
            </p>
            {!search && (
              <Link
                href="/dashboard/campaigns/new"
                className="inline-flex items-center gap-2 mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Create Campaign
              </Link>
            )}
          </div>
        ) : (
          filtered.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/campaigns/${c.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted-foreground">
                  Agent: {c.agent_name ?? "—"} &middot; {c.total_contacts ?? 0} contacts &middot;{" "}
                  {c.calls_completed ?? 0} completed
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    c.status === "active"
                      ? "bg-success/10 text-success"
                      : c.status === "completed"
                        ? "bg-primary/10 text-primary"
                        : c.status === "paused"
                          ? "bg-accent/10 text-accent"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
