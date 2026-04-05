import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { prompt, first_sentence, analysis_prompt } = await request.json();
    if (!prompt) return Response.json({ error: "Prompt is required" }, { status: 400 });

    const message = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `You are an expert at writing AI voice agent prompts for phone calls. Analyze this prompt and return improvements.

CURRENT PROMPT:
${prompt}

${first_sentence ? `FIRST SENTENCE: ${first_sentence}` : ""}
${analysis_prompt ? `ANALYSIS PROMPT: ${analysis_prompt}` : ""}

Return ONLY valid JSON:
{
  "score": <1-10 quality score>,
  "issues": [
    {"severity": "high"|"medium"|"low", "issue": "what's wrong", "fix": "how to fix it"}
  ],
  "improved_prompt": "<your rewritten, optimized version of the full prompt>",
  "improved_first_sentence": "<better opening line, or null if original is good>",
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Focus on: clarity of instructions, objection handling, natural conversation flow, structured data extraction, keeping responses concise for phone (1-3 sentences), and including a clear call-to-action or goal.`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();

    try {
      const result = JSON.parse(jsonStr);
      return Response.json(result);
    } catch {
      return Response.json({ error: "Failed to parse optimization", raw: text }, { status: 500 });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json({ error: msg }, { status: 500 });
  }
}
