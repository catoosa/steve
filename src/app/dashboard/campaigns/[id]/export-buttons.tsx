"use client";

import { Download, FileText } from "lucide-react";

export function ExportButtons({ campaignId }: { campaignId: string }) {
  return (
    <div className="flex gap-2">
      <a
        href={`/api/campaigns/${campaignId}/export/csv`}
        target="_blank"
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        <Download className="w-4 h-4" />
        Export CSV
      </a>
      <a
        href={`/api/campaigns/${campaignId}/export/pdf`}
        target="_blank"
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        <FileText className="w-4 h-4" />
        Export Report
      </a>
    </div>
  );
}
