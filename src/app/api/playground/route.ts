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

    const body = await request.json();
    const {
      prompt,
      first_sentence,
      analysis_prompt,
      caller_persona = "A regular person receiving this call. Be natural — sometimes hesitant, sometimes cooperative. Ask clarifying questions occasionally.",
      messages = [],
    } = body;

    if (!prompt) return Response.json({ error: "Prompt is required" }, { status: 400 });

    // If no messages yet, generate the agent's first line
    if (messages.length === 0) {
      const agentFirst = first_sentence || "Hi, I'm calling from our office today.";
      return Response.json({
        role: "agent",
        content: agentFirst,
        messages: [{ role: "agent", content: agentFirst }],
      });
    }

    // Determine whose turn it is
    const lastMessage = messages[messages.length - 1];
    const nextRole = lastMessage.role === "agent" ? "caller" : "agent";

    const conversationHistory = messages
      .map((m: { role: string; content: string }) => `${m.role === "agent" ? "Agent" : "Caller"}: ${m.content}`)
      .join("\n");

    let systemPrompt: string;
    let userPrompt: string;

    if (nextRole === "caller") {
      systemPrompt = `You are simulating a person receiving a phone call. Your persona: ${caller_persona}

Be realistic. Sometimes agree, sometimes push back, sometimes ask questions. Don't be overly cooperative — real people aren't. Keep responses to 1-3 sentences. If you'd naturally end the call, say goodbye.`;
      userPrompt = `The agent is calling you with this purpose: "${prompt}"

Conversation so far:
${conversationHistory}

Respond as the caller. Be natural. 1-3 sentences.`;
    } else {
      systemPrompt = `You are an AI voice agent on a phone call. Your instructions: ${prompt}

Follow your instructions naturally. Respond to what the caller says. Keep responses to 1-3 sentences — this is a phone conversation, not an essay. Be conversational and warm.`;
      userPrompt = `Conversation so far:
${conversationHistory}

Continue as the agent. Follow your prompt instructions. 1-3 sentences.`;
    }

    const message = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0].type === "text" ? message.content[0].text : "";
    const newMessages = [...messages, { role: nextRole, content }];

    // Check if conversation seems done (goodbye signals)
    const isDone = /\b(goodbye|bye|have a (great|good|nice) day|take care|thanks for calling)\b/i.test(content) && newMessages.length >= 6;

    // If done and there's an analysis prompt, run analysis
    let analysis = null;
    if (isDone && analysis_prompt) {
      const transcript = newMessages
        .map((m: { role: string; content: string }) => `${m.role === "agent" ? "Agent" : "Caller"}: ${m.content}`)
        .join("\n");

      const analysisMsg = await getAnthropic().messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Analyze this call transcript and extract data as requested.

Transcript:
${transcript}

Analysis instructions: ${analysis_prompt}

Return ONLY valid JSON.`,
        }],
      });

      const analysisText = analysisMsg.content[0].type === "text" ? analysisMsg.content[0].text : "{}";
      try {
        analysis = JSON.parse(analysisText.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      } catch {
        analysis = { raw: analysisText };
      }
    }

    return Response.json({
      role: nextRole,
      content,
      messages: newMessages,
      done: isDone,
      analysis,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json({ error: msg }, { status: 500 });
  }
}
