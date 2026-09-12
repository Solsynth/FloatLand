import { API_BASE_URL, apiFetch, fetchJson, safeJsonParse } from "~/utils/api";
import { camelToSnake } from "~/utils/case";

/**
 * PersonalityCore client.
 *
 * PersonalityCore is exposed through the Solar Network gateway under
 * `/personality` (not `/api`). All management endpoints below authenticate
 * with regular Solar auth via `apiFetch`.
 */
export const PERSONALITY_API_BASE = "/personality";

/** OpenAI-compatible chat completions. Stateless: send the full history each time. */
export const PERSONALITY_CHAT_COMPLETIONS = `${PERSONALITY_API_BASE}/v1/chat/completions`;

export interface PersonalityAgent {
  id: string;
  name: string;
  description?: string;
  model?: string;
  abilities?: string[];
  systemPrompt?: string;
  enabled: boolean;
}

export interface PersonalityModelPricing {
  currency?: string;
  input?: string | null;
  output?: string | null;
}

export interface PersonalityModel {
  id: string;
  provider: string;
  name: string;
  type?: string;
  modalities?: string[];
  pricing?: PersonalityModelPricing | null;
  perkOverrides?: Record<
    number,
    { blocked?: boolean; maxCompletionTokens?: number | null }
  >;
}

export interface PersonalityRunUsage {
  used: string;
  max: string | null;
}

export interface PersonalityBillingUsage {
  hourlyRuns?: PersonalityRunUsage;
  dailyRuns?: PersonalityRunUsage;
  hourlyUsage?: Record<string, PersonalityRunUsage>;
  dailyUsage?: Record<string, PersonalityRunUsage>;
}

export interface PersonalityBilling {
  hourlyRunLimit: number | null;
  dailyRunLimit: number | null;
  spendingQuota: string | null;
  blacklisted: boolean;
  usage: PersonalityBillingUsage;
}

export interface PersonalityCredential {
  id: string;
  name: string;
  tokenPrefix: string;
  agentIds?: string[];
  providers?: string[];
  models?: string[];
  usageLimit: string;
  usageUsed: string;
  usageCurrency: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalityCredentialCreate {
  name: string;
  agentIds?: string[];
  providers?: string[];
  models?: string[];
  usageLimit: string;
  usageCurrency?: string;
}

export interface PersonalityCredentialCreated {
  credential: PersonalityCredential;
  /** Raw `sat_...` token, returned exactly once from POST. */
  token: string;
}

/** GET /personality/billing/me */
export function fetchPersonalityBilling(): Promise<PersonalityBilling> {
  return fetchJson<PersonalityBilling>(
    `${PERSONALITY_API_BASE}/billing/me`,
  );
}

/** PUT /personality/billing/me/spending-quota — "0" disables immediate settlement. */
export function setPersonalitySpendingQuota(
  spendingQuota: string,
): Promise<PersonalityBilling> {
  return fetchJson<PersonalityBilling>(
    `${PERSONALITY_API_BASE}/billing/me/spending-quota`,
    {
      method: "PUT",
      body: JSON.stringify(
        camelToSnake({ spendingQuota }),
      ),
    },
  );
}

/** POST /personality/billing/me/settle — settles unpaid usage; clears billing blacklist on success. */
export async function settlePersonalityBilling(): Promise<void> {
  await apiFetch(`${PERSONALITY_API_BASE}/billing/me/settle`, {
    method: "POST",
  });
}

/** GET /personality/openai/credentials */
export async function fetchPersonalityCredentials(): Promise<
  PersonalityCredential[]
> {
  const response = await apiFetch(
    `${PERSONALITY_API_BASE}/openai/credentials`,
  );
  const body = await safeJsonParse<{ data?: PersonalityCredential[] }>(
    response,
  );
  return body.data ?? [];
}

/** POST /personality/openai/credentials — returns the raw token exactly once. */
export function createPersonalityCredential(
  payload: PersonalityCredentialCreate,
): Promise<PersonalityCredentialCreated> {
  return fetchJson<PersonalityCredentialCreated>(
    `${PERSONALITY_API_BASE}/openai/credentials`,
    {
      method: "POST",
      body: JSON.stringify(camelToSnake(payload)),
    },
  );
}

/** DELETE /personality/openai/credentials/:id — permanently revokes the credential. */
export async function revokePersonalityCredential(id: string): Promise<void> {
  await apiFetch(
    `${PERSONALITY_API_BASE}/openai/credentials/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

/** GET /personality/agents */
export function fetchPersonalityAgents(): Promise<PersonalityAgent[]> {
  return fetchJson<PersonalityAgent[]>(`${PERSONALITY_API_BASE}/agents`);
}

/** GET /personality/models */
export function fetchPersonalityModels(): Promise<PersonalityModel[]> {
  return fetchJson<PersonalityModel[]>(`${PERSONALITY_API_BASE}/models`);
}

export interface PersonalityChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
}

export interface PersonalityChatResult {
  content: string;
  raw: unknown;
}

/**
 * POST /personality/v1/chat/completions
 *
 * Authenticates with Solar auth (session/token) unless a `sat_...` credential
 * token is supplied. Uses plain fetch so OpenAI-style error bodies
 * ({"error":{"message":...}}) surface their real message instead of a generic
 * HTTP status.
 */
export async function personalityChatCompletion(payload: {
  model: string;
  messages: PersonalityChatMessage[];
  bearerToken?: string;
}): Promise<PersonalityChatResult> {
  const body = JSON.stringify({ model: payload.model, messages: payload.messages });
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const init: RequestInit = { method: "POST", headers, body };

  if (payload.bearerToken) {
    // Playground API key path (unsessioned): forward the caller's key as-is.
    headers["Authorization"] = `Bearer ${payload.bearerToken}`;
    init.credentials = "omit";
  } else {
    // Sessioned path: route through the same-origin proxy so the server-held
    // token authenticates for us and no backend cookie leaks to the browser.
    // SSR forwards the incoming `cookie` so the `sid` reaches the proxy.
    if (import.meta.server) {
      const requestHeaders = useRequestHeaders(["cookie"]);
      if (requestHeaders.cookie) {
        headers["cookie"] = requestHeaders.cookie;
      }
    }
  }

  const response = await fetch(
    payload.bearerToken
      ? `${API_BASE_URL}${PERSONALITY_CHAT_COMPLETIONS}`
      : `/api/proxy${PERSONALITY_CHAT_COMPLETIONS}`,
    init,
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body = (data ?? {}) as Record<string, unknown>;
    const error = (body.error ?? {}) as Record<string, unknown>;
    const message =
      typeof error.message === "string"
        ? error.message
        : typeof body.message === "string"
          ? body.message
          : `HTTP ${response.status}`;
    throw new Error(message);
  }
  const choices = (data as { choices?: { message?: { content?: string } }[] })?.choices;
  return { content: choices?.[0]?.message?.content ?? "", raw: data };
}

// ────────────────────────────────────────────────────────────────────────────
// Persisted conversations (the chat app surface). Personality Core owns the
// history, tool execution, and final message persistence; these helpers only
// forward turns and relay the server's SSE run events, mirroring the SynthPet
// desktop client.
// ────────────────────────────────────────────────────────────────────────────

export interface PersonalityConversation {
  id: string;
  agentId: string;
  title: string;
  lastMessageAt?: string | null;
}

export interface PersonalityConversationToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface PersonalityConversationMessage {
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  attachmentIds: string[];
  /** Assistant-only: reasoning captured at generation time. */
  reasoningContent?: string | null;
  /** Assistant-only: tool calls requested by this message. */
  toolCalls: PersonalityConversationToolCall[];
  /** Tool-role messages only. */
  toolCallId?: string | null;
  toolName?: string | null;
  /** Raw metadata bag carried by the backend message (values narrowed on read). */
  metadata?: {
    attachmentIds?: unknown;
    reasoningContent?: unknown;
    toolCalls?: Array<{
      id?: unknown;
      function?: { name?: unknown; arguments?: unknown };
    }>;
    toolCallId?: unknown;
    toolName?: unknown;
  };
}

/** GET /personality/conversations — the account's threads, newest first. */
export async function fetchPersonalityConversations(
  take = 50,
  offset = 0,
): Promise<PersonalityConversation[]> {
  const response = await apiFetch(
    `${PERSONALITY_API_BASE}/conversations?take=${take}&offset=${offset}`,
  );
  const data = await safeJsonParse<PersonalityConversation[]>(response);
  return (data ?? []).map((conversation) => ({
    id: conversation.id ?? "",
    agentId: conversation.agentId ?? "",
    title: conversation.title ?? "",
    lastMessageAt: conversation.lastMessageAt ?? null,
  }));
}

/** GET /personality/conversations/:id/messages — ordered by sequence ascending. */
export async function fetchPersonalityConversationMessages(
  conversationId: string,
  take = 200,
  offset = 0,
): Promise<PersonalityConversationMessage[]> {
  const response = await apiFetch(
    `${PERSONALITY_API_BASE}/conversations/${encodeURIComponent(conversationId)}/messages?take=${take}&offset=${offset}`,
  );
  const data = await safeJsonParse<PersonalityConversationMessage[]>(response);
  return (data ?? []).map(normalizeConversationMessage);
}

/** POST /personality/conversations — returns the new thread id. */
export async function createPersonalityConversation(
  agentId: string,
  title = "",
): Promise<string> {
  const response = await apiFetch(`${PERSONALITY_API_BASE}/conversations`, {
    method: "POST",
    body: JSON.stringify({ agent_id: agentId, title }),
  });
  const data = await safeJsonParse<{ id?: string }>(response);
  return data?.id ?? "";
}

export interface PersonalityRunOptions {
  conversationId: string;
  message: string;
  attachmentIds?: string[];
  signal?: AbortSignal;
  onChunk?: (delta: string) => void;
  onReasoning?: (delta: string) => void;
  onToolCall?: (
    id: string,
    name: string,
    args: Record<string, unknown>,
  ) => void;
  onToolResult?: (
    id: string,
    name: string,
    args: Record<string, unknown>,
    result: string,
  ) => void;
  /** Fired once on `message.completed`: the final, persisted assistant text. */
  onCompleted?: (text: string) => void;
}

/**
 * POST /personality/conversations/:id/runs — SSE stream of one assistant turn.
 * Resolves with the completed message content once the stream closes.
 */
export async function runPersonalityConversation(
  options: PersonalityRunOptions,
): Promise<string> {
  const response = await apiFetch(
    `${PERSONALITY_API_BASE}/conversations/${encodeURIComponent(options.conversationId)}/runs`,
    {
      method: "POST",
      headers: { Accept: "text/event-stream" },
      body: JSON.stringify({
        message: options.message,
        stream: true,
        ...(options.attachmentIds?.length
          ? { attachment_ids: options.attachmentIds }
          : {}),
      }),
      signal: options.signal,
    },
  );

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Conversation stream unavailable.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let event = "";
  let data = "";
  let streamedText = "";
  let completedText = "";

  function dispatch() {
    if (!data) {
      event = "";
      return;
    }
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(data);
    } catch {
      event = "";
      data = "";
      return;
    }
    switch (event) {
      case "message.delta": {
        if (typeof payload.delta === "string" && payload.delta) {
          streamedText += payload.delta;
          options.onChunk?.(payload.delta);
        }
        break;
      }
      case "reasoning.delta": {
        if (typeof payload.delta === "string" && payload.delta) {
          options.onReasoning?.(payload.delta);
        }
        break;
      }
      case "tool_call.delta": {
        if (typeof payload.name === "string" && payload.name) {
          options.onToolCall?.(
            String(payload.id ?? ""),
            payload.name,
            parseToolArguments(payload.arguments),
          );
        }
        break;
      }
      case "tool_call.completed": {
        if (
          typeof payload.name === "string" &&
          payload.name &&
          typeof payload.result === "string"
        ) {
          options.onToolResult?.(
            String(payload.id ?? ""),
            payload.name,
            parseToolArguments(payload.arguments),
            payload.result,
          );
        }
        break;
      }
      case "message.completed": {
        if (typeof payload.content === "string" && payload.content.trim()) {
          completedText = payload.content.trim();
          options.onCompleted?.(completedText);
        }
        break;
      }
      case "run.failed": {
        const error = payload.error;
        throw new Error(
          typeof error === "string" && error
            ? error
            : "Conversation run failed.",
        );
      }
    }
    event = "";
    data = "";
  }

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);
        if (line.startsWith("event:")) {
          event = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          if (data) data += "\n";
          data += line.slice(5).trim();
        } else if (line === "") {
          dispatch();
        }
      }
    }
    dispatch();
  } finally {
    reader.releaseLock();
  }

  return completedText || streamedText.trim();
}

function parseToolArguments(raw: unknown): Record<string, unknown> {
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    // JSON objects are record-shaped by construction; only display access follows.
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const decoded: unknown = JSON.parse(raw);
      if (
        typeof decoded === "object" &&
        decoded !== null &&
        !Array.isArray(decoded)
      ) {
        // JSON.parse produced a plain object; record-shaped by construction.
        return decoded as Record<string, unknown>;
      }
    } catch {
      // Malformed tool arguments; keep the trace visible without failing.
    }
  }
  return {};
}

function normalizeConversationMessage(
  message: PersonalityConversationMessage,
): PersonalityConversationMessage {
  const metadata = message.metadata ?? {};
  const attachmentIds = Array.isArray(metadata.attachmentIds)
    ? metadata.attachmentIds
        .map((id) => String(id))
        .filter((id) => id !== "")
    : [];
  const reasoning =
    typeof metadata.reasoningContent === "string"
      ? metadata.reasoningContent.trim()
      : "";
  const toolCalls: PersonalityConversationToolCall[] = [];
  if (Array.isArray(metadata.toolCalls)) {
    for (const call of metadata.toolCalls) {
      if (!call || typeof call !== "object") continue;
      const fn = call.function;
      toolCalls.push({
        id: typeof call.id === "string" ? call.id : "",
        name:
          fn && typeof fn === "object" && typeof fn.name === "string"
            ? fn.name
            : "",
        arguments:
          fn && typeof fn === "object" && typeof fn.arguments === "string"
            ? fn.arguments
            : "",
      });
    }
  }
  return {
    role: message.role ?? "user",
    content: typeof message.content === "string" ? message.content : "",
    attachmentIds,
    reasoningContent: reasoning ? reasoning : null,
    toolCalls,
    toolCallId:
      metadata.toolCallId == null ? null : String(metadata.toolCallId),
    toolName: metadata.toolName == null ? null : String(metadata.toolName),
  };
}
