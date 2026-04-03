import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

const DAILY_FOCUS = [
  "healthcare AI voice automation (appointments, reminders, patient outreach)",
  "agency & white-label reseller models for AI voice platforms",
  "compliance & regulatory features (TCPA, HIPAA, ACMA/DNCR) as paid add-ons",
  "CRM & scheduling integrations (GoHighLevel, HubSpot, Calendly)",
  "new vertical markets for outbound AI calling (solar, real estate, insurance, staffing)",
  "pricing, packaging, and monetisation strategies for AI SaaS",
  "wild card ideas — adjacent tools, platform plays, or partnerships",
];

function getDailyFocus(): string {
  const dayOfWeek = new Date().getDay(); // 0=Sun
  return DAILY_FOCUS[dayOfWeek];
}

function confidenceBadge(pct: number): string {
  if (pct >= 70) {
    return `<span style="background:#16a34a;color:#fff;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:700;">${pct}% likely</span>`;
  } else if (pct >= 40) {
    return `<span style="background:#d97706;color:#fff;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:700;">${pct}% likely</span>`;
  } else {
    return `<span style="background:#dc2626;color:#fff;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:700;">${pct}% likely</span>`;
  }
}

interface Idea {
  title: string;
  oneliner: string;
  target_market: string;
  revenue_model: string;
  confidence_pct: number;
  why_it_works: string;
  key_risk: string;
}

function buildEmail(ideas: Idea[], focus: string, dateStr: string): string {
  const cards = ideas
    .map(
      (idea, i) => `
    <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:24px;margin-bottom:16px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="background:#ff6b35;color:#fff;width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0;">${i + 1}</span>
          <h2 style="margin:0;font-size:17px;font-weight:700;color:#ffffff;">${idea.title}</h2>
        </div>
        ${confidenceBadge(idea.confidence_pct)}
      </div>
      <p style="margin:0 0 16px 0;color:#a0a0a0;font-size:14px;line-height:1.5;">${idea.oneliner}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 12px;background:#111;border-radius:8px 8px 0 0;border-bottom:1px solid #222;width:30%;">
            <span style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Target Market</span><br>
            <span style="color:#e0e0e0;font-size:13px;">${idea.target_market}</span>
          </td>
          <td style="padding:8px 12px;background:#111;border-radius:0 0 8px 8px;width:70%;vertical-align:top;">
            <span style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Revenue Model</span><br>
            <span style="color:#e0e0e0;font-size:13px;">${idea.revenue_model}</span>
          </td>
        </tr>
      </table>
      <div style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:#0d1f0d;border:1px solid #1a3a1a;border-radius:8px;padding:12px;">
          <span style="color:#4ade80;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Why it works</span>
          <p style="margin:6px 0 0 0;color:#d0f0d0;font-size:13px;line-height:1.5;">${idea.why_it_works}</p>
        </div>
        <div style="background:#1f0d0d;border:1px solid #3a1a1a;border-radius:8px;padding:12px;">
          <span style="color:#f87171;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Key risk</span>
          <p style="margin:6px 0 0 0;color:#f0d0d0;font-size:13px;line-height:1.5;">${idea.key_risk}</p>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#ff6b35,#ff4500);border-radius:16px;padding:28px 32px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:2px;">SKAWK</span>
          <p style="margin:4px 0 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Daily Ideas Brief</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;color:rgba(255,255,255,0.9);font-size:13px;font-weight:600;">${dateStr}</p>
          <p style="margin:4px 0 0 0;color:rgba(255,255,255,0.6);font-size:11px;">Today's focus: ${focus.split("(")[0].trim()}</p>
        </div>
      </div>
    </div>

    <!-- Ideas -->
    ${cards}

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0 8px;">
      <p style="color:#444;font-size:12px;margin:0;">Generated daily by Claude · Skawk by CareplanAI Pty Ltd</p>
      <p style="color:#333;font-size:11px;margin:8px 0 0 0;">Confidence scores reflect market conditions as of today — not financial advice.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(request: Request) {
  // Verify this is a legitimate Vercel cron request
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const focus = getDailyFocus();
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `You are a strategic advisor for Skawk — an AI voice calling SaaS platform built on top of voice AI infrastructure (similar to Bland AI, Vapi, Retell). Skawk lets businesses run outbound AI voice campaigns: appointment reminders, lead qualification, debt collection, patient outreach, surveys, and more. It has multi-tenant orgs, campaign management, personas, knowledge bases, pathway builder, Stripe billing, and a webhook pipeline.

Today's focus area: ${focus}

Today's date: ${dateStr}

Generate exactly 5 specific, actionable business ideas for what Skawk could build, add, or sell. These should be concrete opportunities — new features, pricing strategies, integrations, vertical plays, or adjacent products.

For each idea, respond with a JSON array. Each item must have exactly these fields:
- title: short punchy name (max 8 words)
- oneliner: one sentence description of the opportunity
- target_market: who specifically buys this
- revenue_model: how Skawk makes money from it (pricing, add-on, tier gate, etc.)
- confidence_pct: integer 0-100 representing your confidence this will generate meaningful revenue within 12 months
- why_it_works: 1-2 sentences on why this will work in the current market
- key_risk: the single biggest thing that could kill this idea

Be specific and creative. Draw on real market dynamics. Vary confidence scores realistically — not everything is 85%. Some ideas should be moonshots (30-40%), others are near-certain wins (80-90%).

Respond with ONLY the JSON array, no markdown, no explanation.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const ideas: Idea[] = JSON.parse(raw);

  const html = buildEmail(ideas, focus, dateStr);

  await resend.emails.send({
    from: "Skawk Ideas <ideas@skawk.io>",
    to: "andrew@careplans.io",
    subject: `Skawk Daily Ideas — ${dateStr}`,
    html,
  });

  return Response.json({ ok: true, sent: ideas.length, date: dateStr });
}
