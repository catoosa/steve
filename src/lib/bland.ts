const VOICE_API_BASE = "https://api.bland.ai/v1";

function getKey(): string {
  const key = process.env.BLAND_API_KEY;
  if (!key) throw new Error("Voice API not configured. Please contact support.");
  return key;
}

async function blandFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${VOICE_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: getKey(),
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Voice API error (${res.status}): ${text}`);
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
  memoryId?: string;
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
  if (config.memoryId) payload.memory_id = config.memoryId;

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
    dispositions?: string[];
    memoryId?: string;
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
  if (config.global.dispositions) global.dispositions = config.global.dispositions;
  if (config.global.memoryId) global.memory_id = config.global.memoryId;

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

/** List calls with optional filters */
export async function listCalls(params?: Record<string, unknown>) {
  const query = params ? "?" + new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined) acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  ).toString() : "";
  return blandFetch(`/calls${query}`);
}

/** List all currently active calls */
export async function listActiveCalls() {
  return blandFetch("/calls/active");
}

/** Stop all currently active calls */
export async function stopAllActiveCalls() {
  return blandFetch("/calls/active", { method: "POST" });
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

/** List all batches */
export async function listBatches() {
  return blandFetch("/batches");
}

/** Stop an active batch */
export async function stopBatch(batchId: string) {
  return blandFetch(`/batches/${batchId}/stop`, { method: "POST" });
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
// PATHWAYS
// =============================================================================

/** Create a new pathway */
export async function createPathway(name: string, description: string, nodes?: unknown) {
  return blandFetch("/pathway", {
    method: "POST",
    body: JSON.stringify({ name, description, ...(nodes ? { nodes } : {}) }),
  });
}

/** Update an existing pathway */
export async function updatePathway(id: string, data: Record<string, unknown>) {
  return blandFetch(`/pathway/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Delete a pathway */
export async function deletePathway(id: string) {
  return blandFetch(`/pathway/${id}`, { method: "DELETE" });
}

/** Get pathway details */
export async function getPathway(id: string) {
  return blandFetch(`/pathway/${id}`);
}

/** List all pathways */
export async function listPathways() {
  return blandFetch("/pathway");
}

/** Create a new version of a pathway */
export async function createPathwayVersion(pathwayId: string, data: Record<string, unknown>) {
  return blandFetch(`/pathway/${pathwayId}/versions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Get all versions of a pathway */
export async function getPathwayVersions(pathwayId: string) {
  return blandFetch(`/pathway/${pathwayId}/versions`);
}

/** Get a specific version of a pathway */
export async function getPathwayVersion(pathwayId: string, versionId: string) {
  return blandFetch(`/pathway/${pathwayId}/versions/${versionId}`);
}

/** Delete a specific version of a pathway */
export async function deletePathwayVersion(pathwayId: string, versionId: string) {
  return blandFetch(`/pathway/${pathwayId}/versions/${versionId}`, { method: "DELETE" });
}

/** Promote a pathway version to active */
export async function promotePathwayVersion(pathwayId: string, versionId: string) {
  return blandFetch(`/pathway/${pathwayId}/versions/${versionId}/promote`, { method: "POST" });
}

/** Generate a pathway from a text prompt */
export async function generatePathway(prompt: string) {
  return blandFetch("/pathway/generate", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}

/** Check the status of a pathway generation job */
export async function getPathwayGenerationStatus(jobId: string) {
  return blandFetch(`/pathway/generate/${jobId}`);
}

/** Chat with a pathway for testing */
export async function chatWithPathway(pathwayId: string, message: string, chatId?: string) {
  return blandFetch(`/pathway/${pathwayId}/chat`, {
    method: "POST",
    body: JSON.stringify({ message, ...(chatId ? { chat_id: chatId } : {}) }),
  });
}

// =============================================================================
// PERSONAS
// =============================================================================

/** Create a new persona */
export async function createPersona(data: Record<string, unknown>) {
  return blandFetch("/personas", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Update a persona */
export async function updatePersona(id: string, data: Record<string, unknown>) {
  return blandFetch(`/personas/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Delete a persona */
export async function deletePersona(id: string) {
  return blandFetch(`/personas/${id}`, { method: "DELETE" });
}

/** Get persona details */
export async function getPersona(id: string) {
  return blandFetch(`/personas/${id}`);
}

/** List all personas */
export async function listPersonas() {
  return blandFetch("/personas");
}

/** Get all versions of a persona */
export async function getPersonaVersions(id: string) {
  return blandFetch(`/personas/${id}/versions`);
}

/** Get a specific persona version */
export async function getPersonaVersion(id: string, versionId: string) {
  return blandFetch(`/personas/${id}/versions/${versionId}`);
}

/** Promote a persona version to active */
export async function promotePersonaVersion(id: string, versionId: string) {
  return blandFetch(`/personas/${id}/versions/${versionId}/promote`, { method: "POST" });
}

/** Attach phone numbers to a persona */
export async function attachNumbersToPersona(id: string, numbers: string[]) {
  return blandFetch(`/personas/${id}/numbers`, {
    method: "POST",
    body: JSON.stringify({ numbers }),
  });
}

/** Detach phone numbers from a persona */
export async function detachNumbersFromPersona(id: string, numbers: string[]) {
  return blandFetch(`/personas/${id}/numbers`, {
    method: "DELETE",
    body: JSON.stringify({ numbers }),
  });
}

// =============================================================================
// KNOWLEDGE BASES
// =============================================================================

/** Create a knowledge base */
export async function createKnowledgeBase(name: string, description?: string) {
  return blandFetch("/knowledge-bases", {
    method: "POST",
    body: JSON.stringify({ name, ...(description ? { description } : {}) }),
  });
}

/** List all knowledge bases */
export async function listKnowledgeBases() {
  return blandFetch("/knowledge-bases");
}

/** Get knowledge base details */
export async function getKnowledgeBase(id: string) {
  return blandFetch(`/knowledge-bases/${id}`);
}

/** Delete a knowledge base */
export async function deleteKnowledgeBase(id: string) {
  return blandFetch(`/knowledge-bases/${id}`, { method: "DELETE" });
}

/** Update a knowledge base */
export async function updateKnowledgeBase(id: string, data: Record<string, unknown>) {
  return blandFetch(`/knowledge-bases/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Upload text content to a knowledge base */
export async function uploadTextToKB(id: string, text: string, name?: string) {
  return blandFetch(`/knowledge-bases/${id}/upload/text`, {
    method: "POST",
    body: JSON.stringify({ text, ...(name ? { name } : {}) }),
  });
}

/** Upload a file to a knowledge base via URL */
export async function uploadFileToKB(id: string, fileUrl: string) {
  return blandFetch(`/knowledge-bases/${id}/upload/file`, {
    method: "POST",
    body: JSON.stringify({ url: fileUrl }),
  });
}

/** Scrape web pages into a knowledge base */
export async function scrapeWebToKB(id: string, urls: string[]) {
  return blandFetch(`/knowledge-bases/${id}/upload/web`, {
    method: "POST",
    body: JSON.stringify({ urls }),
  });
}

/** Chat with a knowledge base */
export async function chatWithKB(id: string, message: string) {
  return blandFetch(`/knowledge-bases/${id}/chat`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

// =============================================================================
// GUARD RAILS
// =============================================================================

/** Create a guard rail */
export async function createGuardRail(data: Record<string, unknown>) {
  return blandFetch("/guard-rails", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** List all guard rails */
export async function listGuardRails() {
  return blandFetch("/guard-rails");
}

/** Get guard rail details */
export async function getGuardRail(id: string) {
  return blandFetch(`/guard-rails/${id}`);
}

/** Update a guard rail */
export async function updateGuardRail(id: string, data: Record<string, unknown>) {
  return blandFetch(`/guard-rails/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Delete a guard rail */
export async function deleteGuardRail(id: string) {
  return blandFetch(`/guard-rails/${id}`, { method: "DELETE" });
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

/** Send a batch of SMS messages */
export async function sendSMSBatch(messages: Array<{ to: string; message: string; from?: string }>) {
  return blandFetch("/sms/batch", {
    method: "POST",
    body: JSON.stringify({
      messages: messages.map((m) => ({
        to: normalizePhone(m.to),
        message: m.message,
        ...(m.from ? { from: m.from } : {}),
      })),
    }),
  });
}

/** List SMS conversations */
export async function listSMSConversations() {
  return blandFetch("/sms/conversations");
}

/** Get SMS conversation details */
export async function getSMSConversation(id: string) {
  return blandFetch(`/sms/conversations/${id}`);
}

/** Create an SMS conversation */
export async function createSMSConversation(data: Record<string, unknown>) {
  return blandFetch("/sms/conversations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Update an SMS conversation */
export async function updateSMSConversation(id: string, data: Record<string, unknown>) {
  return blandFetch(`/sms/conversations/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Delete an SMS conversation */
export async function deleteSMSConversation(id: string) {
  return blandFetch(`/sms/conversations/${id}`, { method: "DELETE" });
}

/** Analyze an SMS conversation */
export async function analyzeSMSConversation(id: string, prompt: string) {
  return blandFetch(`/sms/conversations/${id}/analyze`, {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}

// =============================================================================
// VOICES
// =============================================================================

/** List available voices */
export async function listVoices() {
  return blandFetch("/voices");
}

/** Get voice details */
export async function getVoice(id: string) {
  return blandFetch(`/voices/${id}`);
}

/** Update a voice (rename) */
export async function updateVoice(id: string, data: Record<string, unknown>) {
  return blandFetch(`/voices/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Delete a cloned voice */
export async function deleteVoice(id: string) {
  return blandFetch(`/voices/${id}`, { method: "DELETE" });
}

/** Clone a voice from an audio URL */
export async function cloneVoice(name: string, audioUrl: string) {
  return blandFetch("/voices/clone", {
    method: "POST",
    body: JSON.stringify({ name, audio_url: audioUrl }),
  });
}

// =============================================================================
// POST-CALL WEBHOOKS
// =============================================================================

/** Create a post-call webhook */
export async function createPostCallWebhook(data: Record<string, unknown>) {
  return blandFetch("/webhooks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Get the post-call webhook for a call */
export async function getPostCallWebhook(callId: string) {
  return blandFetch(`/webhooks?call_id=${callId}`);
}

/** Resend the post-call webhook for a call */
export async function resendPostCallWebhook(callId: string) {
  return blandFetch("/webhooks/resend", {
    method: "POST",
    body: JSON.stringify({ call_id: callId }),
  });
}

// =============================================================================
// BLOCK RULES
// =============================================================================

/** Create a block rule */
export async function createBlockRule(data: Record<string, unknown>) {
  return blandFetch("/block-rules", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** List all block rules */
export async function listBlockRules() {
  return blandFetch("/block-rules");
}

/** Get block rule details */
export async function getBlockRule(id: string) {
  return blandFetch(`/block-rules/${id}`);
}

/** Edit a block rule */
export async function editBlockRule(id: string, data: Record<string, unknown>) {
  return blandFetch(`/block-rules/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Delete a block rule */
export async function deleteBlockRule(id: string) {
  return blandFetch(`/block-rules/${id}`, { method: "DELETE" });
}

// =============================================================================
// CUSTOM TOOLS
// =============================================================================

/** Create a custom tool */
export async function createTool(data: Record<string, unknown>) {
  return blandFetch("/tools", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Update a custom tool */
export async function updateTool(id: string, data: Record<string, unknown>) {
  return blandFetch(`/tools/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** List all custom tools */
export async function listTools() {
  return blandFetch("/tools");
}

/** Get custom tool details */
export async function getTool(id: string) {
  return blandFetch(`/tools/${id}`);
}

/** Delete a custom tool */
export async function deleteTool(id: string) {
  return blandFetch(`/tools/${id}`, { method: "DELETE" });
}

// =============================================================================
// CONTACTS & MEMORY
// =============================================================================

/** List all contacts */
export async function listContacts() {
  return blandFetch("/contacts");
}

/** Get contact details */
export async function getContact(id: string) {
  return blandFetch(`/contacts/${id}`);
}

/** Update a contact */
export async function updateContact(id: string, data: Record<string, unknown>) {
  return blandFetch(`/contacts/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Find a contact by query */
export async function findContact(query: string) {
  return blandFetch(`/contacts/find?query=${encodeURIComponent(query)}`);
}

/** Merge multiple contacts into one */
export async function mergeContacts(ids: string[]) {
  return blandFetch("/contacts/merge", {
    method: "POST",
    body: JSON.stringify({ contact_ids: ids }),
  });
}

/** Create a memory entry */
export async function createMemory(data: Record<string, unknown>) {
  return blandFetch("/memory", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** List all memory entries */
export async function listMemories() {
  return blandFetch("/memory");
}

/** Get memory entry details */
export async function getMemory(id: string) {
  return blandFetch(`/memory/${id}`);
}

/** Delete a memory entry */
export async function deleteMemory(id: string) {
  return blandFetch(`/memory/${id}`, { method: "DELETE" });
}

/** Update a memory entry */
export async function updateMemory(id: string, data: Record<string, unknown>) {
  return blandFetch(`/memory/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Enable or disable a memory entry */
export async function enableMemory(id: string, enabled: boolean) {
  return blandFetch(`/memory/${id}`, {
    method: "POST",
    body: JSON.stringify({ enabled }),
  });
}

// =============================================================================
// PROMPTS
// =============================================================================

/** Create a prompt */
export async function createPrompt(data: Record<string, unknown>) {
  return blandFetch("/prompts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** List all prompts */
export async function listPrompts() {
  return blandFetch("/prompts");
}

/** Get prompt details */
export async function getPrompt(id: string) {
  return blandFetch(`/prompts/${id}`);
}

// =============================================================================
// CITATION SCHEMAS
// =============================================================================

/** Create a citation schema */
export async function createCitationSchema(data: Record<string, unknown>) {
  return blandFetch("/citations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** List all citation schemas */
export async function listCitationSchemas() {
  return blandFetch("/citations");
}

/** Get citation schema details */
export async function getCitationSchema(id: string) {
  return blandFetch(`/citations/${id}`);
}

/** Update a citation schema */
export async function updateCitationSchema(id: string, data: Record<string, unknown>) {
  return blandFetch(`/citations/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Backfill a citation schema against existing calls */
export async function backfillCitationSchema(id: string) {
  return blandFetch(`/citations/${id}/backfill`, { method: "POST" });
}

// =============================================================================
// ALARMS
// =============================================================================

/** Create an alarm */
export async function createAlarm(data: Record<string, unknown>) {
  return blandFetch("/alarms", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** List all alarms */
export async function listAlarms() {
  return blandFetch("/alarms");
}

/** Get alarm details */
export async function getAlarm(id: string) {
  return blandFetch(`/alarms/${id}`);
}

/** Update an alarm */
export async function updateAlarm(id: string, data: Record<string, unknown>) {
  return blandFetch(`/alarms/${id}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Delete an alarm */
export async function deleteAlarm(id: string) {
  return blandFetch(`/alarms/${id}`, { method: "DELETE" });
}

/** Toggle an alarm on/off */
export async function toggleAlarm(id: string) {
  return blandFetch(`/alarms/${id}/toggle`, { method: "POST" });
}

/** Trigger an alarm manually */
export async function triggerAlarm(id: string) {
  return blandFetch(`/alarms/${id}/trigger`, { method: "POST" });
}

/** Test alarm notification */
export async function testAlarmNotification(id: string) {
  return blandFetch(`/alarms/${id}/test`, { method: "POST" });
}

/** List alarm events */
export async function listAlarmEvents() {
  return blandFetch("/alarms/events");
}

// =============================================================================
// INTELLIGENCE
// =============================================================================

/** Analyze emotions in a call recording */
export async function analyzeEmotion(audioUrl: string) {
  return blandFetch("/intelligence/emotion-analysis", {
    method: "POST",
    body: JSON.stringify({ audio_url: audioUrl }),
  });
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
