const BLAND_API_BASE = "https://api.bland.ai/v1";

function getKey(): string {
  const key = process.env.BLAND_API_KEY;
  if (!key) throw new Error("BLAND_API_KEY not configured");
  return key;
}

async function blandFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BLAND_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: getKey(),
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bland API error (${res.status}): ${text}`);
  }

  return res.json();
}

export interface CallConfig {
  phone: string;
  prompt: string;
  firstSentence?: string;
  analysisPrompt?: string;
  voice?: string;
  language?: string;
  maxDuration?: number;
  metadata?: Record<string, string>;
  webhookUrl: string;
}

export interface BatchCallConfig {
  calls: CallConfig[];
  label?: string;
}

/** Place a single call via Bland AI */
export async function makeCall(config: CallConfig) {
  // Normalize phone number
  let phone = config.phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  if (phone.startsWith("0")) phone = "+61" + phone.slice(1);
  if (!phone.startsWith("+")) phone = "+" + phone;

  return blandFetch("/calls", {
    method: "POST",
    body: JSON.stringify({
      phone_number: phone,
      task: config.prompt,
      first_sentence: config.firstSentence,
      analysis_prompt: config.analysisPrompt,
      voice: config.voice || "mason",
      language: config.language || "en-AU",
      max_duration: config.maxDuration || 120,
      wait_for_greeting: true,
      record: true,
      answered_by_enabled: true,
      webhook: config.webhookUrl,
      metadata: config.metadata || {},
    }),
  });
}

/** Place a batch of calls via Bland AI */
export async function makeBatchCalls(config: BatchCallConfig) {
  const calls = config.calls.map((c) => {
    let phone = c.phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
    if (phone.startsWith("0")) phone = "+61" + phone.slice(1);
    if (!phone.startsWith("+")) phone = "+" + phone;

    return {
      phone_number: phone,
      task: c.prompt,
      first_sentence: c.firstSentence,
      analysis_prompt: c.analysisPrompt,
      voice: c.voice || "mason",
      language: c.language || "en-AU",
      max_duration: c.maxDuration || 120,
      wait_for_greeting: true,
      record: true,
      answered_by_enabled: true,
      webhook: c.webhookUrl,
      metadata: c.metadata || {},
    };
  });

  return blandFetch("/batches", {
    method: "POST",
    body: JSON.stringify({
      calls,
      label: config.label || `Steve batch - ${calls.length} calls`,
    }),
  });
}

/** Get call details */
export async function getCall(callId: string) {
  return blandFetch(`/calls/${callId}`);
}

/** Get batch details */
export async function getBatch(batchId: string) {
  return blandFetch(`/batches/${batchId}`);
}
