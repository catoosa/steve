/**
 * Bland AI API client — wraps all Bland endpoints that Skawk exposes.
 * Skawk acts as a proxy/value-add layer on top of Bland's infrastructure.
 */

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

// =============================================================================
// CALLS
// =============================================================================

export interface CallConfig {
  phone: string;
  prompt?: string;
  pathwayId?: string;
  firstSentence?: string;
  analysisPrompt?: string;
  voice?: string;
  language?: string;
  maxDuration?: number;
  model?: "base" | "turbo";
  temperature?: number;
  waitForGreeting?: boolean;
  record?: boolean;
  from?: string;
  transferPhoneNumber?: string;
  transferList?: Record<string, string>;
  pronunciationGuide?: Array<{ word: string; pronunciation: string }>;
  backgroundTrack?: string;
  noiseCancellation?: boolean;
  blockInterruptions?: boolean;
  interruptionThreshold?: number;
  voicemail?: { enabled: boolean; message?: string };
  summaryPrompt?: string;
  metadata?: Record<string, string>;
  requestData?: Record<string, unknown>;
  webhookUrl: string;
  webhookEvents?: string[];
  dynamicData?: Array<{ url: string; method: string; cache?: boolean }>;
  keywords?: string[];
  guardRails?: Array<{ description: string; action: string }>;
  dispositions?: string[];
  retry?: { enabled: boolean; max_retries?: number; delay?: number };
}

/** Place a single call via Bland AI */
export async function makeCall(config: CallConfig) {
  let phone = normalizePhone(config.phone);

  const payload: Record<string, unknown> = {
    phone_number: phone,
    voice: config.voice || "mason",
    language: config.language || "en-AU",
    max_duration: config.maxDuration || 5, // minutes
    model: config.model || "base",
    wait_for_greeting: config.waitForGreeting ?? true,
    record: config.record ?? true,
    answered_by_enabled: true,
    webhook: config.webhookUrl,
    metadata: config.metadata || {},
  };

  // Task or pathway — one is required
  if (config.pathwayId) {
    payload.pathway_id = config.pathwayId;
  } else {
    payload.task = config.prompt || "You are a helpful phone agent. Be brief and professional.";
  }

  if (config.firstSentence) payload.first_sentence = config.firstSentence;
  if (config.analysisPrompt) payload.analysis_prompt = config.analysisPrompt;
  if (config.temperature !== undefined) payload.temperature = config.temperature;
  if (config.from) payload.from = config.from;
  if (config.transferPhoneNumber) payload.transfer_phone_number = config.transferPhoneNumber;
  if (config.transferList) payload.transfer_list = config.transferList;
  if (config.pronunciationGuide) payload.pronunciation_guide = config.pronunciationGuide;
  if (config.backgroundTrack) payload.background_track = config.backgroundTrack;
  if (config.noiseCancellation) payload.noise_cancellation = true;
  if (config.blockInterruptions) payload.block_interruptions = true;
  if (config.interruptionThreshold) payload.interruption_threshold = config.interruptionThreshold;
  if (config.voicemail) payload.voicemail = config.voicemail;
  if (config.summaryPrompt) payload.summary_prompt = config.summaryPrompt;
  if (config.requestData) payload.request_data = config.requestData;
  if (config.webhookEvents) payload.webhook_events = config.webhookEvents;
  if (config.dynamicData) payload.dynamic_data = config.dynamicData;
  if (config.keywords) payload.keywords = config.keywords;
  if (config.guardRails) payload.guard_rails = config.guardRails;
  if (config.dispositions) payload.dispositions = config.dispositions;
  if (config.retry) payload.retry = config.retry;

  return blandFetch("/calls", { method: "POST", body: JSON.stringify(payload) });
}

export interface BatchCallConfig {
  calls: Array<{
    phone: string;
    prompt?: string;
    firstSentence?: string;
    metadata?: Record<string, string>;
    requestData?: Record<string, unknown>;
  }>;
  global: {
    prompt?: string;
    pathwayId?: string;
    firstSentence?: string;
    analysisPrompt?: string;
    voice?: string;
    language?: string;
    maxDuration?: number;
    model?: string;
    temperature?: number;
    record?: boolean;
    waitForGreeting?: boolean;
    webhookUrl: string;
    transferPhoneNumber?: string;
    guardRails?: Array<{ description: string; action: string }>;
    summaryPrompt?: string;
  };
  label?: string;
  statusWebhook?: string;
}

/** Place a batch of calls via Bland AI */
export async function makeBatchCalls(config: BatchCallConfig) {
  const callObjects = config.calls.map((c) => ({
    phone_number: normalizePhone(c.phone),
    ...(c.prompt ? { task: c.prompt } : {}),
    ...(c.firstSentence ? { first_sentence: c.firstSentence } : {}),
    metadata: c.metadata || {},
    ...(c.requestData ? { request_data: c.requestData } : {}),
  }));

  const global: Record<string, unknown> = {
    voice: config.global.voice || "mason",
    language: config.global.language || "en-AU",
    max_duration: config.global.maxDuration || 5,
    model: config.global.model || "base",
    wait_for_greeting: config.global.waitForGreeting ?? true,
    record: config.global.record ?? true,
    answered_by_enabled: true,
    webhook: config.global.webhookUrl,
  };

  if (config.global.pathwayId) {
    global.pathway_id = config.global.pathwayId;
  } else {
    global.task = config.global.prompt || "You are a helpful phone agent.";
  }

  if (config.global.firstSentence) global.first_sentence = config.global.firstSentence;
  if (config.global.analysisPrompt) global.analysis_prompt = config.global.analysisPrompt;
  if (config.global.temperature !== undefined) global.temperature = config.global.temperature;
  if (config.global.transferPhoneNumber) global.transfer_phone_number = config.global.transferPhoneNumber;
  if (config.global.guardRails) global.guard_rails = config.global.guardRails;
  if (config.global.summaryPrompt) global.summary_prompt = config.global.summaryPrompt;

  return blandFetch("/batches", {
    method: "POST",
    body: JSON.stringify({
      call_objects: callObjects,
      global,
      description: config.label || `Skawk batch - ${callObjects.length} calls`,
      ...(config.statusWebhook ? { status_webhook: config.statusWebhook } : {}),
    }),
  });
}

// =============================================================================
// CALL DETAILS & MANAGEMENT
// =============================================================================

/** Get call details including transcript, analysis, recording */
export async function getCall(callId: string) {
  return blandFetch(`/calls/${callId}`);
}

/** Get corrected transcript for a call */
export async function getCorrectedTranscript(callId: string) {
  return blandFetch(`/calls/${callId}/corrected-transcript`);
}

/** Get call recording URL */
export async function getRecording(callId: string) {
  return blandFetch(`/calls/${callId}/recording`);
}

/** Stop an active call */
export async function stopCall(callId: string) {
  return blandFetch(`/calls/${callId}/stop`, { method: "POST" });
}

/** Analyze a completed call with a custom prompt */
export async function analyzeCall(callId: string, questions: Array<{ question: string; type: string }>) {
  return blandFetch(`/calls/${callId}/analyze`, {
    method: "POST",
    body: JSON.stringify({ questions }),
  });
}

// =============================================================================
// BATCH MANAGEMENT
// =============================================================================

/** Get batch status and details */
export async function getBatch(batchId: string) {
  return blandFetch(`/batches/${batchId}`);
}

/** Get batch call logs */
export async function getBatchLogs(batchId: string) {
  return blandFetch(`/batches/${batchId}/logs`);
}

// =============================================================================
// INBOUND NUMBERS
// =============================================================================

/** List all inbound numbers */
export async function listNumbers() {
  return blandFetch("/inbound");
}

/** Get details for an inbound number */
export async function getNumber(numberId: string) {
  return blandFetch(`/inbound/${numberId}`);
}

/** Purchase a new phone number */
export async function purchaseNumber(areaCode: string, country?: string) {
  return blandFetch("/inbound/purchase", {
    method: "POST",
    body: JSON.stringify({ area_code: areaCode, country_code: country || "AU" }),
  });
}

/** Update inbound number configuration */
export async function updateNumber(
  numberId: string,
  config: {
    prompt?: string;
    pathwayId?: string;
    voice?: string;
    language?: string;
    maxDuration?: number;
    webhookUrl?: string;
    transferPhoneNumber?: string;
  }
) {
  const payload: Record<string, unknown> = {};
  if (config.prompt) payload.task = config.prompt;
  if (config.pathwayId) payload.pathway_id = config.pathwayId;
  if (config.voice) payload.voice = config.voice;
  if (config.language) payload.language = config.language;
  if (config.maxDuration) payload.max_duration = config.maxDuration;
  if (config.webhookUrl) payload.webhook = config.webhookUrl;
  if (config.transferPhoneNumber) payload.transfer_phone_number = config.transferPhoneNumber;

  return blandFetch(`/inbound/${numberId}/update`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// =============================================================================
// SMS
// =============================================================================

/** Send an SMS message */
export async function sendSMS(to: string, message: string, from?: string) {
  return blandFetch("/sms/send", {
    method: "POST",
    body: JSON.stringify({
      to: normalizePhone(to),
      message,
      ...(from ? { from } : {}),
    }),
  });
}

// =============================================================================
// VOICES
// =============================================================================

/** List available voices */
export async function listVoices() {
  return blandFetch("/voices");
}

// =============================================================================
// HELPERS
// =============================================================================

/** Normalize phone to E.164 (defaults to AU) */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("0")) cleaned = "+61" + cleaned.slice(1);
  if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;
  return cleaned;
}
