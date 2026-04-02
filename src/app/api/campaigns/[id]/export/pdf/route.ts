import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!membership) {
      return Response.json({ error: "No org" }, { status: 403 });
    }

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .single();

    if (!campaign || campaign.org_id !== membership.org_id) {
      return Response.json({ error: "Campaign not found" }, { status: 404 });
    }

    const { data: calls } = await supabase
      .from("calls")
      .select("*")
      .eq("campaign_id", id)
      .order("created_at", { ascending: false });

    const allCalls = calls ?? [];
    const completed = allCalls.filter((c) => c.status === "completed");
    const answered = completed.filter((c) => c.answered_by === "human");
    const totalDuration = completed.reduce(
      (sum, c) => sum + (c.duration_seconds ?? 0),
      0
    );
    const avgDuration =
      completed.length > 0 ? Math.round(totalDuration / completed.length) : 0;
    const answerRate =
      completed.length > 0
        ? Math.round((answered.length / completed.length) * 100)
        : 0;

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    for (const call of allCalls) {
      statusCounts[call.status] = (statusCounts[call.status] || 0) + 1;
    }

    // Disposition breakdown
    const dispositionCounts: Record<string, number> = {};
    for (const call of allCalls) {
      const analysis = call.analysis as Record<string, unknown> | null;
      const disposition = analysis?.disposition;
      if (disposition) {
        const d = String(disposition);
        dispositionCounts[d] = (dispositionCounts[d] || 0) + 1;
      }
    }

    // A/B variant data
    const variantMap = new Map<
      string,
      { total: number; completed: number; answered: number; totalDuration: number }
    >();
    for (const call of allCalls) {
      const variant = (call.metadata as Record<string, unknown> | null)
        ?.variant;
      if (!variant) continue;
      const v = String(variant);
      if (!variantMap.has(v)) {
        variantMap.set(v, {
          total: 0,
          completed: 0,
          answered: 0,
          totalDuration: 0,
        });
      }
      const stats = variantMap.get(v)!;
      stats.total++;
      if (call.status === "completed") {
        stats.completed++;
        if (call.answered_by === "human") stats.answered++;
        if (call.duration_seconds) stats.totalDuration += call.duration_seconds;
      }
    }

    const recentCalls = allCalls.slice(0, 20);
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const statusRows = Object.entries(statusCounts)
      .sort(([, a], [, b]) => b - a)
      .map(
        ([status, count]) =>
          `<tr><td>${escHtml(status)}</td><td>${count}</td><td>${allCalls.length > 0 ? Math.round((count / allCalls.length) * 100) : 0}%</td></tr>`
      )
      .join("");

    const dispositionRows = Object.entries(dispositionCounts)
      .sort(([, a], [, b]) => b - a)
      .map(
        ([d, count]) =>
          `<tr><td>${escHtml(d)}</td><td>${count}</td></tr>`
      )
      .join("");

    const variantRows = Array.from(variantMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, stats]) => {
        const rate =
          stats.completed > 0
            ? Math.round((stats.answered / stats.completed) * 100)
            : 0;
        const avg =
          stats.completed > 0
            ? Math.round(stats.totalDuration / stats.completed)
            : 0;
        return `<tr><td>Variant ${escHtml(name)}</td><td>${stats.total}</td><td>${stats.completed}</td><td>${stats.answered}</td><td>${rate}%</td><td>${avg}s</td></tr>`;
      })
      .join("");

    const callRows = recentCalls
      .map((call) => {
        const analysis = call.analysis as Record<string, unknown> | null;
        const disposition = analysis?.disposition
          ? String(analysis.disposition)
          : "";
        return `<tr>
          <td>${escHtml(call.phone ?? "")}</td>
          <td>${escHtml(call.status ?? "")}</td>
          <td>${escHtml(call.answered_by ?? "")}</td>
          <td>${call.duration_seconds ?? ""}</td>
          <td>${escHtml(disposition)}</td>
          <td>${new Date(call.created_at).toLocaleString()}</td>
        </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Campaign Report - ${escHtml(campaign.name)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; max-width: 1000px; margin: 0 auto; font-size: 14px; }
  .header { border-bottom: 3px solid #111; padding-bottom: 16px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header h1 { font-size: 24px; font-weight: 700; }
  .header .brand { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
  .meta { color: #555; font-size: 13px; margin-top: 4px; }
  .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; text-align: center; }
  .stat-card .value { font-size: 28px; font-weight: 700; }
  .stat-card .label { font-size: 12px; color: #666; margin-top: 4px; }
  h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; margin-top: 32px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th, td { text-align: left; padding: 8px 12px; border: 1px solid #ddd; font-size: 13px; }
  th { background: #f5f5f5; font-weight: 600; }
  tr:nth-child(even) td { background: #fafafa; }
  .print-btn { position: fixed; top: 20px; right: 20px; background: #111; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; z-index: 100; }
  .print-btn:hover { background: #333; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #ddd; color: #999; font-size: 11px; text-align: center; }
  @media print {
    .print-btn { display: none !important; }
    body { padding: 20px; }
    .stat-card { break-inside: avoid; }
    table { break-inside: auto; }
    tr { break-inside: avoid; }
  }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">Download as PDF</button>

<div class="header">
  <div>
    <h1>${escHtml(campaign.name)}</h1>
    <p class="meta">
      Agent: ${escHtml(campaign.agent_name ?? "")} &middot;
      Voice: ${escHtml(campaign.voice ?? "")} &middot;
      Language: ${escHtml(campaign.language ?? "")} &middot;
      Status: ${escHtml(campaign.status ?? "")}
    </p>
    <p class="meta">Report generated: ${dateStr}</p>
  </div>
  <div class="brand">Skawk Report</div>
</div>

<div class="stats-grid">
  <div class="stat-card"><div class="value">${allCalls.length}</div><div class="label">Total Calls</div></div>
  <div class="stat-card"><div class="value">${completed.length}</div><div class="label">Completed</div></div>
  <div class="stat-card"><div class="value">${answered.length}</div><div class="label">Answered</div></div>
  <div class="stat-card"><div class="value">${avgDuration}s</div><div class="label">Avg Duration</div></div>
  <div class="stat-card"><div class="value">${answerRate}%</div><div class="label">Answer Rate</div></div>
</div>

<h2>Status Breakdown</h2>
<table>
  <thead><tr><th>Status</th><th>Count</th><th>Percentage</th></tr></thead>
  <tbody>${statusRows || '<tr><td colspan="3" style="text-align:center;color:#999;">No data</td></tr>'}</tbody>
</table>

${
  dispositionRows
    ? `<h2>Disposition Breakdown</h2>
<table>
  <thead><tr><th>Disposition</th><th>Count</th></tr></thead>
  <tbody>${dispositionRows}</tbody>
</table>`
    : ""
}

${
  variantRows
    ? `<h2>A/B Variant Comparison</h2>
<table>
  <thead><tr><th>Variant</th><th>Contacts</th><th>Completed</th><th>Answered</th><th>Answer Rate</th><th>Avg Duration</th></tr></thead>
  <tbody>${variantRows}</tbody>
</table>`
    : ""
}

<h2>Recent Calls (Top 20)</h2>
<table>
  <thead><tr><th>Phone</th><th>Status</th><th>Answered By</th><th>Duration (s)</th><th>Disposition</th><th>Date</th></tr></thead>
  <tbody>${callRows || '<tr><td colspan="6" style="text-align:center;color:#999;">No calls</td></tr>'}</tbody>
</table>

<div class="footer">Generated by Skawk &middot; ${dateStr}</div>

<script>window.onload = () => window.print();</script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
