#!/usr/bin/env npx tsx
/**
 * Skawk — Test Call to Your Own Phone
 *
 * Makes a real AI call to your phone number, then shows the results.
 *
 * Usage:
 *   SKAWK_API_KEY=sk_xxx PHONE=0412345678 npx tsx demo/test-my-phone.ts
 *
 * Optional env:
 *   SKAWK_URL    — API base (default: https://skawk.io)
 *   SCENARIO     — dental | solar | debt | custom (default: dental)
 */

const BASE = process.env.SKAWK_URL || "https://skawk.io";
const API_KEY = process.env.SKAWK_API_KEY;
const PHONE = process.env.PHONE;
const SCENARIO = process.env.SCENARIO || "dental";

if (!API_KEY) {
  console.error("Missing SKAWK_API_KEY. Find it at /dashboard/api");
  process.exit(1);
}
if (!PHONE) {
  console.error("Missing PHONE. Set your phone number: PHONE=0412345678");
  process.exit(1);
}

const headers = { "Content-Type": "application/json", "x-api-key": API_KEY };

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ─── Scenarios ───────────────────────────────────────────────────────────────

const SCENARIOS: Record<string, { prompt: string; first_sentence: string; analysis_prompt: string }> = {
  dental: {
    prompt: `You are calling from Dr Chen's dental practice to confirm an appointment tomorrow at 2pm.
If the patient can't make it, offer to reschedule. Check what days work for them.
Be friendly and professional. Keep it short.`,
    first_sentence: "Hi, this is a reminder call from Dr Chen's dental practice. You have an appointment tomorrow at 2pm — are you still able to make it?",
    analysis_prompt: `Extract as JSON: {"confirmed": boolean, "rescheduled": boolean, "new_date": string or null, "new_time": string or null, "reason": string or null, "mood": "positive"|"neutral"|"negative"}`,
  },
  solar: {
    prompt: `You are calling about a solar panel enquiry the person made online.
Ask if they're the homeowner, what their electricity bill is roughly, and whether they'd like a free quote.
Be enthusiastic but not pushy. Keep it conversational.`,
    first_sentence: "Hi there, I'm calling about the solar enquiry you submitted. Have you got a quick minute to chat about getting a quote?",
    analysis_prompt: `Extract as JSON: {"interested": boolean, "homeowner": boolean, "electricity_bill": string or null, "wants_quote": boolean, "objections": [string], "lead_score": "hot"|"warm"|"cold"}`,
  },
  debt: {
    prompt: `You are calling about an overdue invoice of $450 from ABC Services.
Be professional and empathetic. Offer a payment plan if needed.
If they dispute the debt, note the reason. Always identify yourself and the company.`,
    first_sentence: "Good morning, this is a call from ABC Services regarding your account. I'm calling about an outstanding balance — do you have a moment?",
    analysis_prompt: `Extract as JSON: {"acknowledged_debt": boolean, "promise_to_pay": boolean, "payment_date": string or null, "amount_agreed": number or null, "disputed": boolean, "dispute_reason": string or null}`,
  },
  custom: {
    prompt: process.env.PROMPT || "You are making a friendly check-in call. Ask how they're doing and if there's anything they need help with.",
    first_sentence: process.env.FIRST_SENTENCE || "Hi, just calling for a quick check-in. How are you going?",
    analysis_prompt: process.env.ANALYSIS_PROMPT || `Extract as JSON: {"mood": "positive"|"neutral"|"negative", "summary": "one sentence summary", "follow_up_needed": boolean}`,
  },
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const scenario = SCENARIOS[SCENARIO] || SCENARIOS.dental;

  console.log(`
╔══════════════════════════════════════════════════════════╗
║  SKAWK TEST CALL                                         ║
╚══════════════════════════════════════════════════════════╝

  Scenario:  ${SCENARIO}
  Phone:     ${PHONE}
  Server:    ${BASE}
`);

  // 1. Make the call
  console.log("📞 Placing call...\n");

  const callResult = await api("POST", "/api/v1/calls", {
    phone: PHONE,
    prompt: scenario.prompt,
    firstSentence: scenario.first_sentence,
    analysisPrompt: scenario.analysis_prompt,
    voice: "nat",
    language: "en-AU",
    maxDuration: 120,
  });

  if (callResult.error) {
    console.error("❌ Call failed:", callResult.error);
    process.exit(1);
  }

  const callId = callResult.call_id || callResult.id;
  console.log(`✅ Call placed! ID: ${callId}`);
  console.log("   Your phone should ring in a few seconds.\n");
  console.log("   Pick up and have a conversation with the AI.\n");
  console.log("   ⏳ Waiting for call to complete...\n");

  // 2. Poll for completion
  let attempts = 0;
  let callData: Record<string, unknown> | null = null;

  while (attempts < 60) {
    await new Promise((r) => setTimeout(r, 5000));
    attempts++;

    const result = await api("GET", `/api/v1/calls/${callId}`);
    if (result.status === "completed" || result.status === "no_answer" || result.status === "failed") {
      callData = result;
      break;
    }

    process.stdout.write(`   Polling... (${attempts * 5}s) status: ${result.status || "waiting"}\r`);
  }

  if (!callData) {
    console.log("\n⏰ Timed out waiting for call. Check /dashboard/calls for results.");
    process.exit(0);
  }

  // 3. Show results
  console.log(`\n${"═".repeat(60)}`);
  console.log("  CALL RESULTS");
  console.log(`${"═".repeat(60)}\n`);

  console.log(`  Status:       ${callData.status}`);
  console.log(`  Answered by:  ${callData.answered_by || "N/A"}`);
  console.log(`  Duration:     ${callData.duration_seconds || 0}s`);

  if (callData.transcript) {
    console.log(`\n  ── TRANSCRIPT ──\n`);
    const lines = String(callData.transcript).split("\n");
    for (const line of lines) {
      console.log(`  ${line}`);
    }
  }

  if (callData.analysis) {
    console.log(`\n  ── EXTRACTED DATA ──\n`);
    console.log(JSON.stringify(callData.analysis, null, 2).split("\n").map((l: string) => `  ${l}`).join("\n"));
  }

  if (callData.recording_url) {
    console.log(`\n  🔊 Recording: ${callData.recording_url}`);
  }

  console.log(`\n  📊 View in dashboard: ${BASE}/dashboard/calls/${callId}`);
  console.log(`\n  Done! 🎉\n`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
