import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// Secondary lens rotates daily — adds a different angle to the always-broad search
const DAILY_LENS = [
  // Sun
  "government & public sector — councils, federal agencies, courts, benefits processing, regulatory compliance, citizen services",
  // Mon
  "healthcare & aged care — clinical documentation, aged care quality standards, NDIS, mental health, chronic disease, hospital admin",
  // Tue
  "education & workforce — skills assessment, student support, vocational training, career guidance, HR automation",
  // Wed
  "legal, compliance & risk — contract review, regulatory reporting, workplace safety, licensing, audit automation",
  // Thu
  "finance & insurance — claims processing, fraud detection, loan assessment, superannuation, SMB accounting, fintech",
  // Fri
  "property, construction & infrastructure — strata management, DA compliance, construction safety, asset management, utilities",
  // Sat
  "community & social services — mental health, non-profits, emergency services, social housing, disability support",
];

function getDailyLens(): string {
  const dayOfWeek = new Date().getDay(); // 0=Sun
  return DAILY_LENS[dayOfWeek];
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
          <p style="margin:4px 0 0 0;color:rgba(255,255,255,0.6);font-size:11px;">Lens: ${focus.split("—")[0].trim()} + wide</p>
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

  const focus = getDailyLens();
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `You are an AI product strategist and startup scout. Your job: find the 10 best AI product opportunities a small technical team could build and monetise right now. Cast the net wide — the goal is the 10 strongest ideas regardless of sector, with a secondary bias toward today's lens.

Today's date: ${dateStr}
Today's secondary lens (bias, not a limit): ${focus}

Builder background: runs CareplanAI (health/aged care SaaS) and Skawk (AI voice calling for SMBs). Deep experience with Next.js/Supabase, Claude/OpenAI APIs, voice AI, and selling to healthcare, government, and SMB markets in Australia. Looking for the next thing to build — standalone products, new verticals, AI-native workflow tools, or B2G plays.

Your process: First, think across ALL sectors and types of AI opportunity — healthcare, government, legal, finance, property, logistics, education, consumer, developer tools, data products, API services, platform plays, anything. Then surface the 10 that are most compelling right now based on:
1. Real pain that existing software fails to solve
2. AI capability that's now good enough to solve it (LLMs, RAG, voice AI, computer vision, agents)
3. Clear willingness to pay from identifiable buyers
4. A realistic path to $50K–$1M ARR for a small team
5. No massive incumbent already winning with AI

Today's lens should give 3–4 of the 10 ideas. The other 6–7 should come from wherever the strongest opportunities are globally — do not force them into the lens sector.

Think specifically about:
- Manual workflows still done by humans that AI can now do faster/cheaper
- Compliance and regulatory burdens where AI can be the specialist
- Data trapped in PDFs, emails, or legacy systems that AI can unlock
- Government procurement in Australia (federal, state, local) — these are large, sticky contracts
- Healthcare, aged care, disability — massive government spend, outdated software, strong AI fit
- "Second-order" products: tools that help AI builders, safety/compliance layers for AI, evals, observability
- Emerging agent-based products where AI takes end-to-end actions (not just answers questions)

Return exactly 10 ideas as a JSON array. Each item must have exactly these fields:
- title: punchy product name (max 8 words)
- sector: one of: healthcare, government, legal, finance, property, education, logistics, consumer, developer-tools, other
- oneliner: one sentence — what it does and for whom
- target_market: specific buyer with enough detail to cold-email them (e.g. "aged care facility operators in NSW/VIC with 50+ beds", "local council procurement teams in AU", "immigration law firms handling employer-sponsored visas")
- revenue_model: specific pricing and structure (e.g. "$299/mo per facility + $2/resident/mo", "per-report at $79, volume discount after 50/mo", "AU government panel contract $120K/year")
- confidence_pct: integer 0-100 — realistic probability this generates meaningful revenue within 18 months. Account for: market readiness, competition, sales cycle length, technical feasibility
- why_it_works: 2-3 sentences citing specific evidence — name the regulation, the market size, the incumbent's weakness, or the recent AI capability that makes this viable now (not 2 years ago)
- key_risk: single most likely failure mode

Scoring rules: At least 2 ideas should be high-conviction (75–92%). At least 2 should be contrarian/moonshot (18–38%). The rest should be spread realistically. Never give everything 70–75% — that's lazy scoring. Be brutally honest.

Respond with ONLY a valid JSON array. No markdown fences, no text before or after the JSON.`;

  const message = await getAnthropic().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const ideas: Idea[] = JSON.parse(raw);

  const html = buildEmail(ideas, focus, dateStr);

  await getResend().emails.send({
    from: "Skawk Ideas <ideas@skawk.io>",
    to: "andrew@careplans.io",
    subject: `AI Build Ideas — ${dateStr}`,
    html,
  });

  return Response.json({ ok: true, sent: ideas.length, date: dateStr });
}
