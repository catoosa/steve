#!/usr/bin/env npx tsx
/**
 * Skawk Healthcare Demo — End-to-End API-Driven Showcase
 *
 * Demonstrates post-discharge patient follow-up with:
 * - AI voice agent "Emma" (caring aged care nurse)
 * - Knowledge base with discharge care instructions
 * - Workflow automation: critical pain escalation, medication reminders
 * - Multi-touch 7-day post-discharge sequence
 * - Escalation system for clinical teams
 * - Contact timeline tracking
 *
 * Usage:
 *   npx tsx demo/healthcare-demo.ts
 *
 * Environment:
 *   SKAWK_API_KEY  — your Skawk API key (sk_...)
 *   SKAWK_URL      — API base URL (default: http://localhost:3000)
 */

const BASE = process.env.SKAWK_URL || "http://localhost:3000";
const API_KEY = process.env.SKAWK_API_KEY;

if (!API_KEY) {
  console.error("❌ Set SKAWK_API_KEY environment variable first.");
  console.error("   Find your key at: /dashboard/api");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
};

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`❌ ${method} ${path} → ${res.status}`, data);
    throw new Error(`API error: ${res.status}`);
  }
  return data;
}

function log(icon: string, msg: string) {
  console.log(`\n${icon}  ${msg}`);
}

function divider(title: string) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DEMO
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   SKAWK — Healthcare Demo                                ║
  ║   Post-Discharge Patient Follow-Up                       ║
  ║                                                          ║
  ║   One API call. One phone call. Structured data back.    ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `);

  // ─── Step 1: Create Persona ──────────────────────────────────────────────

  divider("STEP 1 — Create Voice Agent Persona");

  log("🤖", "Creating persona: Emma (Aged Care Nurse)");

  const persona = await api("POST", "/api/v1/personas", {
    name: "Emma",
    voice: "nat",
    language: "en-AU",
    description: "Caring aged care follow-up nurse. Warm, empathetic, patient. Australian accent.",
    prompt: `You are Emma, a caring aged care nurse making a post-discharge follow-up call.

Your goals:
1. Check on the patient's wellbeing since leaving hospital
2. Assess their pain level (1-10 scale)
3. Confirm they are taking their medications as prescribed
4. Ask about their mobility and daily activities
5. Gauge their mood and emotional state
6. Ask if they've confirmed their next appointment
7. Determine if clinical escalation is needed

Be warm, patient, and empathetic. Use their name. Listen carefully.
If they express severe pain (7+), distress, or mention falls — flag for escalation.
If they haven't been taking medication — flag for follow-up.

Always end by reassuring them their care team is here for them.`,
    first_sentence: "Hi {{contact_name}}, this is Emma calling from the care team. How are you feeling today since coming home from hospital?",
  });

  console.log(`   ✓ Persona created: ${persona.name || "Emma"} (voice: nat, lang: en-AU)`);

  // ─── Step 2: Knowledge Base ──────────────────────────────────────────────

  divider("STEP 2 — Upload Knowledge Base");

  log("📚", "Creating knowledge base: Discharge Care Instructions");

  const kb = await api("POST", "/api/v1/knowledge", {
    name: "Post-Discharge Care Instructions",
    description: "Standard discharge care protocols, medication schedules, warning signs, and escalation criteria",
  });

  console.log(`   ✓ Knowledge base created: ${kb.id || "created"}`);

  // Upload care instructions
  if (kb.id) {
    log("📄", "Uploading discharge care protocols...");
    await api("POST", `/api/v1/knowledge/${kb.id}/upload`, {
      text: `# Post-Discharge Care Instructions

## Medication Management
- Take all prescribed medications at the scheduled times
- Do not skip doses even if feeling better
- Contact care team if experiencing side effects: nausea, dizziness, rash
- Keep medications in original containers with labels

## Pain Management
- Mild pain (1-3): Normal post-discharge. Continue prescribed pain relief
- Moderate pain (4-6): Take prescribed pain medication. Apply ice/heat as directed
- Severe pain (7+): Contact care team immediately. This requires clinical review

## Mobility & Activity
- Walk short distances daily, increasing gradually
- Use mobility aids as prescribed (walker, cane)
- Avoid lifting more than 2kg for first 2 weeks
- Report any falls or near-falls immediately

## Warning Signs — Seek Immediate Help
- Chest pain or difficulty breathing
- Sudden confusion or disorientation
- Fever above 38.5°C
- Wound redness, swelling, or discharge
- Uncontrolled pain despite medication
- Falls or inability to stand

## Follow-Up Appointments
- GP visit within 7 days of discharge
- Specialist appointment as scheduled
- Pathology/blood tests as ordered

## Emergency Contacts
- Care Team: 1300-CARE-TEAM
- Emergency: 000
- Hospital Direct: (02) 9XXX-XXXX`,
    });
    console.log("   ✓ Care protocols uploaded");
  }

  // ─── Step 3: Create Workflows ────────────────────────────────────────────

  divider("STEP 3 — Create Automation Workflows");

  // Workflow 1: Critical Pain Escalation
  log("🚨", "Workflow 1: Critical Pain Escalation");
  log("  ", "Trigger: Call completed");
  log("  ", "Condition: pain_level > 7 OR escalation_needed = true");
  log("  ", "Actions: Create escalation → SMS patient → Webhook to clinical system");

  const wf1 = await api("POST", "/api/v1/workflows", {
    name: "Critical Pain Escalation",
    description: "Escalate when patient reports severe pain or clinical flags are raised",
    trigger_type: "call_completed",
    conditions: {
      operator: "OR",
      rules: [
        { field: "analysis.pain_level", operator: "gt", value: 7 },
        { field: "analysis.escalation_needed", operator: "eq", value: true },
      ],
    },
    steps: [
      {
        step_order: 0,
        action_type: "create_escalation",
        action_config: {
          priority: "critical",
          reason_template:
            "Patient {{contact.name}} reported pain level {{analysis.pain_level}}/10. Escalation needed: {{analysis.escalation_needed}}. Summary: {{analysis.summary}}",
        },
      },
      {
        step_order: 1,
        action_type: "send_sms",
        action_config: {
          message:
            "Hi {{contact.name}}, we've flagged your concerns to your care team. A nurse will follow up with you within 2 hours. If your condition worsens, call 000 immediately.",
        },
      },
      {
        step_order: 2,
        action_type: "webhook",
        action_config: {
          url: "https://httpbin.org/post",
          headers: { "X-Source": "skawk-escalation" },
        },
      },
    ],
  });

  console.log(`   ✓ Workflow created: ${wf1.name || "Critical Pain Escalation"}`);

  // Workflow 2: Medication Adherence Callback
  log("💊", "Workflow 2: Medication Reminder Callback");
  log("  ", "Trigger: Call completed");
  log("  ", "Condition: medication_adherence = false");
  log("  ", "Action: Schedule callback in 24h with medication-focused script");

  const wf2 = await api("POST", "/api/v1/workflows", {
    name: "Medication Reminder Callback",
    description: "Schedule a follow-up call when patient isn't taking medication",
    trigger_type: "call_completed",
    conditions: {
      operator: "AND",
      rules: [
        { field: "analysis.medication_adherence", operator: "eq", value: false },
      ],
    },
    steps: [
      {
        step_order: 0,
        action_type: "schedule_callback",
        action_config: {
          delay_hours: 24,
          prompt:
            "You are Emma, a caring nurse following up about medication. The patient previously mentioned they haven't been taking their prescribed medication. Gently ask why, address concerns, and explain the importance of adherence for their recovery. Be understanding, not judgmental.",
          first_sentence:
            "Hi {{contact.name}}, it's Emma from the care team again. I just wanted to check in about your medication — we chatted yesterday and I wanted to make sure everything's going smoothly.",
        },
      },
      {
        step_order: 1,
        action_type: "send_sms",
        action_config: {
          message:
            "Hi {{contact.name}}, just a friendly reminder to take your prescribed medications today. If you're having trouble with side effects, please let us know — we can help. — Care Team",
        },
      },
    ],
  });

  console.log(`   ✓ Workflow created: ${wf2.name || "Medication Reminder Callback"}`);

  // Workflow 3: Positive Outcome Thank-You
  log("😊", "Workflow 3: Positive Recovery SMS");
  log("  ", "Trigger: Call completed");
  log("  ", "Condition: mood = positive AND pain_level <= 3");
  log("  ", "Action: Send encouraging SMS");

  const wf3 = await api("POST", "/api/v1/workflows", {
    name: "Positive Recovery Message",
    description: "Send encouraging message when patient is recovering well",
    trigger_type: "call_completed",
    conditions: {
      operator: "AND",
      rules: [
        { field: "analysis.mood", operator: "eq", value: "positive" },
        { field: "analysis.pain_level", operator: "lte", value: 3 },
      ],
    },
    steps: [
      {
        step_order: 0,
        action_type: "send_sms",
        action_config: {
          message:
            "Great to hear you're doing well, {{contact.name}}! Keep up the good work with your recovery. Remember, we're here if you need anything. — Your Care Team 💙",
        },
      },
    ],
  });

  console.log(`   ✓ Workflow created: ${wf3.name || "Positive Recovery Message"}`);

  // ─── Step 4: Create Multi-Touch Sequence ─────────────────────────────────

  divider("STEP 4 — Create 7-Day Post-Discharge Sequence");

  log("📋", "Sequence: Post-Discharge 7-Day Follow-Up");
  log("  ", "Day 1: Initial call → Day 3: SMS check-in → Day 7: Follow-up call");

  const seq = await api("POST", "/api/v1/sequences", {
    name: "Post-Discharge 7-Day Follow-Up",
    description: "Automated 7-day patient follow-up: call on day 1, SMS on day 3, final call on day 7",
    steps: [
      {
        step_order: 0,
        step_type: "call",
        config: {
          prompt: `You are Emma, a caring aged care nurse making a day-1 post-discharge check-in call.
Check on: pain level (1-10), medication adherence, mobility, mood, and whether they've scheduled their GP follow-up.
Be warm and empathetic. Flag any concerns for escalation.`,
          first_sentence:
            "Hi {{name}}, this is Emma from the care team. Just calling to see how your first day home has been.",
          voice: "nat",
          language: "en-AU",
        },
      },
      {
        step_order: 1,
        step_type: "wait",
        config: { delay_hours: 48 },
      },
      {
        step_order: 2,
        step_type: "sms",
        config: {
          message:
            "Hi {{name}}, it's the care team checking in. How are you feeling today? Remember to take your medications and do your gentle exercises. Reply if you need anything! 💙",
        },
      },
      {
        step_order: 3,
        step_type: "wait",
        config: { delay_hours: 96 },
      },
      {
        step_order: 4,
        step_type: "call",
        config: {
          prompt: `You are Emma, a caring aged care nurse making a day-7 post-discharge follow-up call.
This is the final scheduled follow-up. Check on their overall recovery, confirm they attended their GP appointment, and ask if they need any ongoing support.
Celebrate their progress and provide reassurance.`,
          first_sentence:
            "Hi {{name}}, it's Emma again from the care team. It's been a week since you came home — I'd love to hear how you're going!",
          voice: "nat",
          language: "en-AU",
        },
      },
    ],
  });

  console.log(`   ✓ Sequence created: ${seq.name || "Post-Discharge 7-Day Follow-Up"}`);

  // ─── Step 5: Campaign Setup ──────────────────────────────────────────────

  divider("STEP 5 — Campaign Configuration");

  log("📞", "Analysis prompt extracts structured clinical data from every call:");
  console.log(`
   {
     "pain_level": number (1-10),
     "medication_adherence": boolean,
     "mobility": "independent" | "assisted" | "bedbound",
     "mood": "positive" | "neutral" | "anxious" | "distressed",
     "escalation_needed": boolean,
     "next_appointment_confirmed": boolean,
     "summary": "Brief clinical summary",
     "key_concerns": ["list", "of", "concerns"]
   }
  `);

  const analysisPrompt = `Extract the following structured data from the call. Return valid JSON only:
{
  "pain_level": <number 1-10, patient's self-reported pain level>,
  "medication_adherence": <boolean, true if patient is taking medications as prescribed>,
  "mobility": <"independent" | "assisted" | "bedbound">,
  "mood": <"positive" | "neutral" | "anxious" | "distressed">,
  "escalation_needed": <boolean, true if patient has severe pain, fall risk, confusion, or other clinical red flags>,
  "next_appointment_confirmed": <boolean, true if follow-up GP appointment is booked>,
  "summary": "<brief 1-2 sentence clinical summary>",
  "key_concerns": [<list of specific concerns raised>]
}`;

  // ─── Step 6: Test Patients ───────────────────────────────────────────────

  divider("STEP 6 — Test Patient Roster");

  const patients = [
    { name: "Margaret Wilson", phone: "+61400000001", notes: "Hip replacement, 78yo" },
    { name: "Robert Chen", phone: "+61400000002", notes: "Cardiac stent, 65yo" },
    { name: "Dorothy Nguyen", phone: "+61400000003", notes: "Knee reconstruction, 71yo" },
    { name: "James O'Brien", phone: "+61400000004", notes: "Cataract surgery, 82yo" },
    { name: "Fatima Al-Hassan", phone: "+61400000005", notes: "Diabetic wound care, 69yo" },
  ];

  console.log("\n   Patient roster:");
  for (const p of patients) {
    console.log(`   • ${p.name} (${p.phone}) — ${p.notes}`);
  }

  log("🚀", "Ready to launch campaign!");
  console.log(`
   To launch calls with these workflows active:

   curl -X POST ${BASE}/api/v1/calls \\
     -H "x-api-key: ${API_KEY!.slice(0, 8)}..." \\
     -H "Content-Type: application/json" \\
     -d '{
       "calls": [
         ${patients.map((p) => `{ "phone": "${p.phone}", "name": "${p.name}" }`).join(",\n         ")}
       ],
       "prompt": "You are Emma, a caring aged care nurse...",
       "voice": "nat",
       "language": "en-AU",
       "analysis_prompt": "${analysisPrompt.replace(/\n/g, "\\n").replace(/"/g, '\\"').slice(0, 80)}..."
     }'
  `);

  // ─── Summary ─────────────────────────────────────────────────────────────

  divider("DEMO COMPLETE — What Was Built");

  console.log(`
   ✅ Persona: Emma (aged care nurse, AU voice)
   ✅ Knowledge Base: Discharge care protocols
   ✅ Workflow 1: Critical Pain Escalation
      → pain > 7 OR escalation_needed
      → Creates clinical escalation + SMS patient + webhook
   ✅ Workflow 2: Medication Reminder Callback
      → medication_adherence = false
      → Schedules 24h callback + sends reminder SMS
   ✅ Workflow 3: Positive Recovery Message
      → mood = positive AND pain ≤ 3
      → Sends encouraging SMS
   ✅ Sequence: 7-Day Post-Discharge
      → Day 1: Call → Day 3: SMS → Day 7: Call

   ┌──────────────────────────────────────────────────────┐
   │  When a call completes, Skawk automatically:         │
   │                                                      │
   │  1. Extracts structured clinical data (JSON)         │
   │  2. Evaluates all active workflows                   │
   │  3. Triggers escalations for clinical red flags      │
   │  4. Sends SMS follow-ups                             │
   │  5. Schedules callback calls                         │
   │  6. Pushes data to external systems via webhooks     │
   │  7. Records everything in the contact timeline       │
   │                                                      │
   │  Bland AI can make the call.                         │
   │  Only Skawk turns it into a care system.             │
   └──────────────────────────────────────────────────────┘
  `);

  // ─── Check Created Resources ─────────────────────────────────────────────

  divider("VERIFY — Checking Created Resources");

  try {
    const workflows = await api("GET", "/api/v1/workflows");
    console.log(`\n   Workflows: ${workflows.length || 0} active`);
    for (const wf of workflows || []) {
      console.log(`   • ${wf.name} [${wf.trigger_type}] ${wf.enabled ? "✓ enabled" : "✗ disabled"}`);
    }
  } catch {
    console.log("   (Skipping verification — API may not be running)");
  }

  try {
    const sequences = await api("GET", "/api/v1/sequences");
    console.log(`\n   Sequences: ${sequences.length || 0} active`);
    for (const s of sequences || []) {
      console.log(`   • ${s.name} ${s.enabled ? "✓ enabled" : "✗ disabled"}`);
    }
  } catch {
    console.log("   (Skipping sequence verification)");
  }

  try {
    const escalations = await api("GET", "/api/v1/escalations");
    console.log(`\n   Escalations: ${escalations.length || 0} open`);
  } catch {
    console.log("   (No escalations yet — they're created when calls trigger workflows)");
  }

  console.log("\n   Done! 🎉\n");
}

main().catch((err) => {
  console.error("\n❌ Demo failed:", err.message);
  process.exit(1);
});
