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
