"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Deal } from "./page";
import { DealDrawer } from "./deal-drawer";
import { AddDealModal } from "./add-deal-modal";

const STAGES = [
  { key: "lead", label: "Lead", color: "bg-slate-500" },
  { key: "qualified", label: "Qualified", color: "bg-blue-500" },
  { key: "quoted", label: "Quoted", color: "bg-purple-500" },
  { key: "booked", label: "Booked", color: "bg-amber-500" },
  { key: "won", label: "Won", color: "bg-green-500" },
  { key: "lost", label: "Lost", color: "bg-red-500" },
] as const;

const SOURCE_LABELS: Record<string, string> = {
  inbound_call: "Inbound",
  outbound_call: "Outbound",
  manual: "Manual",
  website: "Website",
  referral: "Referral",
};

function formatValue(cents: number | null): string {
  if (!cents) return "$0";
  return "$" + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function daysAgo(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function PipelineBoard({ deals, orgId }: { deals: Deal[]; orgId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  async function handleStageChange(dealId: string, newStage: string) {
    const updates: Record<string, unknown> = { stage: newStage };
    if (newStage === "won") {
      updates.won_at = new Date().toISOString();
      updates.lost_at = null;
      updates.lost_reason = null;
    } else if (newStage === "lost") {
      updates.lost_at = new Date().toISOString();
      updates.won_at = null;
    } else {
      updates.won_at = null;
      updates.lost_at = null;
      updates.lost_reason = null;
    }
    await supabase.from("deals").update(updates).eq("id", dealId);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Drag-free pipeline — use the stage dropdown on each card to move deals.
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Deal
        </button>
      </div>

      <div className="grid grid-cols-6 gap-3 overflow-x-auto">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          const stageValue = stageDeals.reduce((s, d) => s + (d.value_cents ?? 0), 0);

          return (
            <div key={stage.key} className="min-w-[200px]">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                <span className="text-sm font-semibold">{stage.label}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {stageDeals.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {formatValue(stageValue)}
              </p>

              {/* Cards */}
              <div className="space-y-2">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => setSelectedDeal(deal)}
                    className="bg-card border border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{deal.title}</p>
                    {deal.customer_name && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {deal.customer_name}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold">
                        {formatValue(deal.value_cents)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {daysAgo(deal.created_at)}d ago
                      </span>
                    </div>
                    {deal.source && (
                      <span className="inline-block mt-2 text-[10px] font-medium bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                        {SOURCE_LABELS[deal.source] ?? deal.source}
                      </span>
                    )}
                    {/* Stage selector */}
                    <select
                      value={deal.stage}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStageChange(deal.id, e.target.value)}
                      className="mt-2 w-full text-xs bg-muted border border-border rounded-lg px-2 py-1 cursor-pointer"
                    >
                      {STAGES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="border border-dashed border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">No deals</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDeal && (
        <DealDrawer
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
        />
      )}

      {showAddModal && (
        <AddDealModal
          orgId={orgId}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}
