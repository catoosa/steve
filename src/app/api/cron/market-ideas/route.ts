import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

const DAILY_FOCUS = [
  // Sun
  "government & public sector AI — council services, benefits processing, regulatory compliance, citizen communication, permit management, court systems",
  // Mon
  "healthcare & aged care AI — clinical documentation, patient triage, aged care quality standards, mental health support, chronic disease management, hospital admin",
  // Tue
  "education & workforce AI — learning platforms, skills assessment, student support, NDIS/disability services, vocational training, career guidance",
  // Wed
  "legal, compliance & risk AI — contract review, regulatory reporting, audit trail automation, privacy law, workplace safety, licensing",
  // Thu
  "finance, insurance & fintech AI — claims processing, fraud detection, loan assessment, superannuation, financial advice, SMB accounting",
  // Fri
  "logistics, property & infrastructure AI — supply chain, real estate, construction compliance, asset management, utilities, agriculture",
  // Sat
  "consumer & community AI — mental health apps, community services, non-profits, family support, emergency services, social housing",
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
          <p style="margin:4px 0 0 0;color:rgba(255,255,255,0.6);font-size:11px;">Focus: ${focus.split("—")[0].trim()}</p>
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

  const prompt = `You are an AI product strategist and startup advisor. Your job is to generate high-quality, specific, actionable AI product ideas that a small technical team (1-5 devs) could realistically build and monetise.

Today's date: ${dateStr}
Today's focus sector: ${focus}

The builder's background: They run CareplanAI (a health/aged care SaaS), Skawk (AI voice calling platform for SMBs), and have deep experience building multi-tenant SaaS on Next.js/Supabase, integrating AI APIs (Claude, OpenAI, voice AI), and selling to healthcare, government, and SMB markets in Australia. They are looking for their next build — could be a standalone product, a new vertical, a tool to sell to government/enterprise, or an AI-native workflow product.

Generate exactly 8 specific, buildable AI product ideas focused on today's sector. These should be real gap-in-market opportunities — not vague "AI for X" concepts but concrete products with clear buyers, pricing, and a realistic path to $10K–$500K ARR.

Think about:
- Workflows that are still being done manually that AI can automate
- Data that exists in silos that AI can synthesise and act on
- Regulatory/compliance burdens that AI can reduce
- Human bottlenecks (call centres, case workers, reviewers) that AI can augment
- Government procurement opportunities (Australian federal/state/local)
- Aged care, disability, mental health, primary care gaps
- Problems where the incumbent software is terrible and AI-native alternatives win

For each idea respond with a JSON array. Each item must have exactly these fields:
- title: punchy product name (max 8 words)
- oneliner: one sentence — what it does and for whom
- target_market: specific buyer (e.g. "aged care facility operators in Australia", "local councils", "mortgage brokers")
- revenue_model: specific pricing (e.g. "$299/mo SaaS per facility", "per-report pricing at $49/report", "government contract $80K/year")
- confidence_pct: integer 0-100 — realistic confidence this generates meaningful revenue within 18 months given current AI capabilities and market readiness
- why_it_works: 2-3 sentences. Cite specific pain points, market size signals, or regulatory drivers that make this timely right now
- key_risk: the single most likely reason this fails

Vary confidence scores realistically across the 8 ideas. Include at least one moonshot (20-35%), several mid-confidence plays (45-65%), and at least two high-conviction ideas (75-90%). Be brutally honest about risk.

Respond with ONLY a valid JSON array, no markdown fences, no explanation outside the JSON.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const ideas: Idea[] = JSON.parse(raw);

  const html = buildEmail(ideas, focus, dateStr);

  await resend.emails.send({
    from: "Skawk Ideas <ideas@skawk.io>",
    to: "andrew@careplans.io",
    subject: `AI Build Ideas — ${dateStr}`,
    html,
  });

  return Response.json({ ok: true, sent: ideas.length, date: dateStr });
}
