import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();
    if (!membership) return Response.json({ error: "No org" }, { status: 403 });

    // Verify campaign belongs to org
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, name, metadata")
      .eq("id", campaignId)
      .eq("org_id", membership.org_id)
      .single();

    if (!campaign) return Response.json({ error: "Campaign not found" }, { status: 404 });

    // Check cache
    const force = new URL(request.url).searchParams.get("force") === "true";
    const meta = (campaign.metadata || {}) as Record<string, unknown>;
    if (!force && meta.intelligence) {
      return Response.json({
        ...meta.intelligence as Record<string, unknown>,
        generated_at: meta.intelligence_generated_at,
        cached: true,
      });
    }

    // Fetch transcripts
    const { data: calls } = await supabase
      .from("calls")
      .select("id, transcript, analysis, duration_seconds, answered_by, completed_at")
      .eq("campaign_id", campaignId)
      .eq("status", "completed")
      .not("transcript", "is", null)
      .limit(100);

    if (!calls || calls.length < 3) {
      return Response.json(
        { error: "Need at least 3 completed calls with transcripts to generate intelligence" },
        { status: 400 }
      );
    }

    // Build transcript block (truncate each to 2000 chars)
    const transcriptBlock = calls
      .map((c, i) => {
        const t = (c.transcript || "").slice(0, 2000);
        const disposition =
          c.analysis && typeof c.analysis === "object"
            ? (c.analysis as Record<string, unknown>).disposition || "unknown"
            : "unknown";
        return `--- Call ${i + 1} (disposition: ${disposition}, duration: ${c.duration_seconds || 0}s, answered_by: ${c.answered_by || "unknown"}) ---\n${t}`;
      })
      .join("\n\n");

    const message = await getAnthropic().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Analyze these ${calls.length} call transcripts from a voice AI campaign and return a JSON intelligence report.

${transcriptBlock}

Return ONLY valid JSON with this exact structure:
{
  "objections": [{"text": "the objection", "frequency": 1, "example_quote": "exact quote"}],
  "winning_phrases": [{"phrase": "what agent said", "context": "why it worked", "frequency": 1}],
  "contact_archetypes": [{"name": "archetype name", "description": "description", "percentage": 25}],
  "recommendations": ["actionable recommendation 1", "recommendation 2"],
  "summary": "2-3 sentence executive summary",
  "sentiment_breakdown": {"positive": 40, "neutral": 40, "negative": 20}
}

Limit to top 5 for each list. Percentages should sum to 100. Be specific and actionable.`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse — handle potential markdown code blocks
    const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    let intelligence: Record<string, unknown>;
    try {
      intelligence = JSON.parse(jsonStr);
    } catch {
      return Response.json({ error: "Failed to parse intelligence report", raw: text }, { status: 500 });
    }

    // Cache in campaign metadata
    await supabase
      .from("campaigns")
      .update({
        metadata: {
          ...meta,
          intelligence,
          intelligence_generated_at: new Date().toISOString(),
        },
      })
      .eq("id", campaignId);

    return Response.json({
      ...intelligence,
      generated_at: new Date().toISOString(),
      cached: false,
      call_count: calls.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[intelligence] Error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
