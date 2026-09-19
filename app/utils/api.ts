import { z } from "zod";
import {
  SnAuthChallengeSchema,
  SnAuthFactorSchema,
  SnAuthTokenSchema,
  SnAccountSchema,
  SnAccountBadgeSchema,
  SnPasskeySchema,
  SnContactMethodSchema,
  SnAccountConnectionSchema,
  SnAuthSessionSchema,
  QrLoginGenerateResponseSchema,
  QrLoginStatusResponseSchema,
  CaptchaConfigSchema,
  PasskeyAuthenticationOptionsSchema,
  PasskeyRegistrationOptionsSchema,
  SnAccountPunishmentSchema,
  SnAccountTimelineItemSchema,
  PublicAccountConnectionSchema,
  RelationshipSchema,
  RelationshipStatusSchema,
  FriendOverviewItemSchema,
  WalletOrderSchema,
  AppProductSchema,
  SpellInfoSchema,
  WalletSchema,
  WalletStatsSchema,
  TransactionSchema,
  FundSchema,
  WalletPinStatusSchema,
  AfdianCheckoutSchema,
} from "~/types/auth";
import {
  WalletProductCatalogItemSchema,
  QuotaPurchaseConfigSchema,
  QuotaOrderSchema,
  NameChangeCardOrderSchema,
} from "~/types/shop";
import {
  SubscriptionGroupSchema,
  StellarSubscriptionSchema,
} from "~/types/subscription";
import {
  WorkspaceSchema,
  WorkspaceMemberSchema,
  WorkspacePlanStatusSchema,
  WorkspacePlanOrderSchema,
  WorkspaceMailboxSchema,
  WorkspaceMailboxAliasSchema,
  WorkspaceMailboxForwardingRuleSchema,
  WorkspaceMailboxQuotaSchema,
  WorkspaceMailboxUsageSchema,
  WorkspaceSendUsageSchema,
  WorkspaceCustomDomainSchema,
  WorkspaceCustomDomainUsageSchema,
  WorkspaceMailCredentialSchema,
  WorkspaceMailCredentialCreatedSchema,
  FlywheelOwnerAppSchema,
  FlywheelOwnerBlobSchema,
  FlywheelStorageQuotaSchema,
  FlywheelAuditEntrySchema,
} from "~/types/workspace";
import {
  BlockRuleSchema,
  MailLabelSchema,
  MailStatsSchema,
  PostalEmailSchema,
} from "~/types/mail";
import {
  PostSchema,
  PublisherSchema,
  TimelineResultSchema,
  ThreadedReplyNodeSchema,
  ReactionSchema,
  PostReactionSchema,
  BoostSchema,
  PublisherSubscriptionStatusSchema,
  HeatmapDataSchema,
} from "~/types/post";
import {
  RealmSchema,
  RealmMemberSchema,
  RealmLabelSchema,
  RealmBoostStatusSchema,
  RealmBoostLeaderboardEntrySchema,
  RealmInviteSchema,
} from "~/types/realm";
import type {
  SnAuthChallenge,
  SnAuthFactor,
  SnAuthToken,
  SnAccount,
  SnAccountBadge,
  SnContactMethod,
  SnAccountConnection,
  SnAuthDevice,
  SnAuthSession,
  SnPasskey,
  QrLoginGenerateResponse,
  QrLoginStatusResponse,
  QrLoginStatus,
  CaptchaConfig,
  WalletOrder,
  WalletOrderStatus,
  WalletOrderApp,
  WalletOrderDeveloper,
  WalletOrderAppImage,
  WalletOrderTimestamp,
  AppProduct,
  SpellInfo,
  SnAccountPunishment,
  SnAccountTimelineItem,
  AccountBoardItem,
  PublicAccountConnection,
  PasskeyAuthenticationOptions,
  PasskeyRegistrationOptions,
  Relationship,
  RelationshipStatus,
  FriendOverviewItem,
  Wallet,
  WalletStats,
  Transaction,
  Fund,
  WalletPinStatus,
  AfdianCheckout,
} from "~/types/auth";
import type {
  SubscriptionGroup,
  StellarSubscription,
} from "~/types/subscription";

export type {
  WalletOrder,
  WalletOrderStatus,
  WalletOrderApp,
  WalletOrderDeveloper,
  WalletOrderAppImage,
  WalletOrderTimestamp,
  AppProduct,
  fetchStoreProducts,
};
import type {
  Publisher,
  Post,
  TimelineResult,
  HeatmapData,
  Boost,
  PostReaction,
  Reaction,
  PublisherSubscriptionStatus,
  ThreadedReplyNode,
} from "~/types/post";
import type {
  Realm,
  RealmMember,
  RealmLabel,
  RealmBoostStatus,
  RealmBoostLeaderboardEntry,
  RealmInvite,
} from "~/types/realm";
import type { FlywheelAuditEntry, FlywheelOwnerApp, FlywheelOwnerBlob, FlywheelStorageQuota, Workspace, WorkspaceCustomDomain, WorkspaceCustomDomainUsage, WorkspaceMailbox, WorkspaceMailboxAlias, WorkspaceMailboxForwardingRule, WorkspaceMailboxQuota, WorkspaceMailboxUsage, WorkspaceMailCredential, WorkspaceMailCredentialCreated, WorkspaceMember, WorkspacePlanOrder, WorkspacePlanStatus, WorkspaceSendUsage } from "~/types/workspace";
import type {
  BlockRule,
  MailLabel,
  MailStats,
  PostalEmail,
  SendEmailPayload,
} from "~/types/mail";
import type {
  NameChangeCardOrder,
  QuotaOrder,
  QuotaPurchaseConfig,
  WalletProductCatalogItem,
} from "~/types/shop";

import { snakeToCamel, camelToSnake } from "~/utils/case";

// Re-export types for convenience
export type { SpellInfo };
export type {
  HeatmapData,
  Boost,
  PostReaction,
  Reaction,
  PublisherSubscriptionStatus,
} from "~/types/post";
export type { Relationship, RelationshipStatus, FriendOverviewItem } from "~/types/auth";
export type { Wallet, WalletStats, Transaction, Fund, WalletPinStatus, AfdianCheckout } from "~/types/auth";

// Global API configuration
export const API_BASE = "api.solian.app";
export const API_BASE_URL = `https://${API_BASE}`;

// Helper to build API URL
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}

// Parse response helper
async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text || text.trim().length === 0) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.trim() };
  }
}

// Helper to safely parse JSON and convert case
export async function safeJsonParse<T>(response: Response): Promise<T> {
  const data = await parseResponse(response);
  return snakeToCamel(data) as T;
}

interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
  retryCount?: number;
}

export class ApiError extends Error {
  status: number;
  /** Application-specific error code from the API (e.g. MERCHANT_PROFILE_NOT_FOUND) */
  code?: string;
  detail?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
  meta?: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    options?: {
      code?: string;
      detail?: string;
      traceId?: string;
      errors?: Record<string, string[]>;
      meta?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options?.code;
    this.detail = options?.detail;
    this.traceId = options?.traceId;
    this.errors = options?.errors;
    this.meta = options?.meta;
  }

  static fromBody(status: number, errorData: unknown): ApiError {
    if (typeof errorData === "object" && errorData !== null) {
      const body = errorData as Record<string, unknown>;
      const message =
        typeof body.message === "string" && body.message.trim()
          ? body.message
          : `HTTP ${status}`;
      return new ApiError(message, status, {
        code: typeof body.code === "string" ? body.code : undefined,
        detail: typeof body.detail === "string" ? body.detail : undefined,
        traceId:
          typeof body.traceId === "string"
            ? body.traceId
            : typeof body.trace_id === "string"
              ? body.trace_id
              : undefined,
        errors:
          body.errors && typeof body.errors === "object"
            ? (body.errors as Record<string, string[]>)
            : undefined,
        meta:
          body.meta && typeof body.meta === "object"
            ? (body.meta as Record<string, unknown>)
            : undefined,
      });
    }
    if (typeof errorData === "string" && errorData.trim()) {
      return new ApiError(errorData, status);
    }
    return new ApiError(`HTTP ${status}`, status);
  }

  hasCode(code: string): boolean {
    return this.code === code;
  }
}

export async function apiFetch(
  endpoint: string,
  options: ApiFetchOptions = {},
): Promise<Response> {
  const { skipAuth, ...fetchOptions } = options;
  // `skipAuth` (pre-auth / anonymous calls) is a no-op now: the proxy
  // authenticates purely by the presence of a server-held session (`sid`
  // cookie), and the client never adds auth headers itself. Keep the flag
  // accepted by callers but it no longer changes transport behavior.
  void skipAuth;
  const headers: Record<string, string> = {
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };
  // Let the browser add the multipart boundary for file uploads.
  if (
    !(
      typeof FormData !== "undefined" && fetchOptions.body instanceof FormData
    ) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  // SSR has no browser cookie jar. Forward the incoming request's cookie
  // header explicitly so the browser's `sid` reaches the same-origin proxy.
  const incomingCookie = import.meta.server
    ? headers["cookie"] || useRequestHeaders(["cookie"]).cookie
    : undefined;
  if (incomingCookie) {
    headers["cookie"] = incomingCookie;
  }

  // Build the same-origin proxy URL. On the client a relative URL resolves
  // against the browser origin; on SSR Node's `fetch` rejects relative URLs,
  // so reconstruct an absolute URL from the incoming request's host/protocol.
  const relativeUrl = `/api/proxy${endpoint}`;
  let url = relativeUrl;
  if (import.meta.server) {
    const event = useRequestEvent();
    const host = event?.node?.req?.headers?.host ?? "";
    const proto = String(
      event?.node?.req?.headers?.["x-forwarded-proto"] ?? "http",
    )
      .split(",")[0]
      .trim() || "http";
    url = `${proto}://${host}${relativeUrl}`;
  }

  // Same-origin proxy with no credentials: the browser sends the `sid` cookie
  // natively on the client; on SSR the `cookie` header is forwarded above.
  const response = await fetch(url, { ...fetchOptions, headers });

  // The proxy refreshes + retries once; a persistent 401 means the session is
  // truly expired. Clear local auth state and surface a friendly error.
  if (response.status === 401) {
    if (import.meta.client) {
      const auth = useAuth();
      auth.logout();
      throw new Error("Session expired. Please login again.");
    }
  }

  if (!response.ok) {
    const errorData = await parseResponse(response);
    throw ApiError.fromBody(response.status, errorData);
  }

  return response;
}

export async function fetchJson<T>(
  endpoint: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const response = await apiFetch(endpoint, options);
  return safeJsonParse<T>(response);
}

/**
 * Validate already-parsed data against a schema, failing loudly with a
 * CONTRACT_MISMATCH ApiError when the backend drifts from the contract.
 *
 * The response is case-converted (snake_case → camelCase) first, so schemas
 * describe the camelCase shape callers consume.
 */
function parseWithSchema<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  data: unknown,
): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => {
        const at = issue.path.length ? issue.path.join(".") : "(root)";
        return `${at}: ${issue.message}`;
      })
      .join("; ");
    throw new ApiError(
      `API contract mismatch for ${endpoint} — ${issues}`,
      502,
      { code: "CONTRACT_MISMATCH" },
    );
  }
  return parsed.data;
}

export async function fetchJsonZ<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options: ApiFetchOptions = {},
): Promise<T> {
  const response = await apiFetch(endpoint, options);
  return parseWithSchema(
    endpoint,
    schema,
    await safeJsonParse<unknown>(response),
  );
}

/**
 * Fetch + validate, also returning the raw response headers (needed for
 * `x-total` pagination metadata the backend sends alongside the body).
 */
export async function fetchJsonZHeaders<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options: ApiFetchOptions = {},
): Promise<{ data: T; headers: Headers }> {
  const response = await apiFetch(endpoint, options);
  const data = parseWithSchema(
    endpoint,
    schema,
    await safeJsonParse<unknown>(response),
  );
  return { data, headers: response.headers };
}

// Auth API
export async function createChallenge(
  account: string,
  deviceInfo: Record<string, unknown>,
): Promise<SnAuthChallenge> {
  return fetchJsonZ("/stargate/auth/challenge", SnAuthChallengeSchema, {
    method: "POST",
    body: JSON.stringify({ account, ...deviceInfo }),
    skipAuth: true,
  });
}

export async function getFactors(challengeId: string): Promise<SnAuthFactor[]> {
  return fetchJsonZ(
    `/stargate/auth/challenge/${challengeId}/factors`,
    SnAuthFactorSchema.array(),
    { skipAuth: true },
  );
}

export async function getChallenge(
  challengeId: string,
): Promise<SnAuthChallenge> {
  return fetchJsonZ(
    `/stargate/auth/challenge/${challengeId}`,
    SnAuthChallengeSchema,
    { skipAuth: true },
  );
}

export async function requestFactorCode(
  challengeId: string,
  factorId: string,
): Promise<unknown> {
  const response = await apiFetch(
    `/stargate/auth/challenge/${challengeId}/factors/${factorId}`,
    {
      method: "POST",
      skipAuth: true,
    },
  );
  return safeJsonParse<unknown>(response);
}

/** Account-known challenge: start WebAuthn assertion for a username login. */
export async function startPasskeyAuthentication(
  challengeId: string,
): Promise<PasskeyAuthenticationOptions> {
  return fetchJsonZ(
    `/stargate/auth/challenge/${challengeId}/passkey/start`,
    PasskeyAuthenticationOptionsSchema,
    { method: "POST", skipAuth: true },
  );
}

/**
 * Complete passkey assertion for an account-known challenge.
 * No factor_id — Padlock resolves the Passkey factor itself.
 */
export async function completePasskeyAuthentication(
  challengeId: string,
  credentialId: string,
  clientDataJson: string,
  authenticatorData: string,
  signature: string,
  userHandle?: string | null,
): Promise<SnAuthChallenge> {
  return fetchJsonZ(
    `/stargate/auth/challenge/${challengeId}/passkey/complete`,
    SnAuthChallengeSchema,
    {
      method: "POST",
      body: JSON.stringify(
        camelToSnake({
          credentialId,
          clientDataJson,
          authenticatorData,
          signature,
          userHandle,
        }),
      ),
      skipAuth: true,
    },
  );
}

/** Discoverable (resident) passkey login without a username. */
export async function startDiscoverablePasskeyAuthentication(payload: {
  deviceId: string;
  deviceName: string;
  platform?: number;
  audiences?: string[];
  scopes?: string[];
}): Promise<PasskeyAuthenticationOptions> {
  return fetchJsonZ("/stargate/auth/passkey/start", PasskeyAuthenticationOptionsSchema, {
    method: "POST",
    body: JSON.stringify(
      camelToSnake({
        deviceId: payload.deviceId,
        deviceName: payload.deviceName,
        platform: payload.platform ?? 1,
        audiences: payload.audiences ?? [],
        scopes: payload.scopes ?? [],
      }),
    ),
    skipAuth: true,
  });
}

export async function completeDiscoverablePasskeyAuthentication(
  challengeId: string,
  credentialId: string,
  clientDataJson: string,
  authenticatorData: string,
  signature: string,
  userHandle?: string | null,
): Promise<SnAuthChallenge> {
  return fetchJsonZ(
    `/stargate/auth/passkey/${challengeId}/complete`,
    SnAuthChallengeSchema,
    {
      method: "POST",
      body: JSON.stringify(
        camelToSnake({
          credentialId,
          clientDataJson,
          authenticatorData,
          signature,
          userHandle,
        }),
      ),
      skipAuth: true,
    },
  );
}

// ── QR Login (web polls; mobile scans/approves) ─────────────────────────────

/** Normalize backend enum (number) or string status to a stable client value. */
export function normalizeQrLoginStatus(
  status: number | string | undefined | null,
): QrLoginStatus {
  if (typeof status === "string") {
    const s = status.toLowerCase();
    if (
      s === "pending" ||
      s === "scanned" ||
      s === "approved" ||
      s === "declined" ||
      s === "expired"
    ) {
      return s;
    }
  }
  const map: QrLoginStatus[] = [
    "pending",
    "scanned",
    "approved",
    "declined",
    "expired",
  ];
  const idx = Number(status);
  return map[idx] ?? "pending";
}

/** Create a QR challenge for unauthenticated web/desktop clients. */
export async function generateQrLogin(payload: {
  deviceId: string;
  deviceName?: string;
  platform?: number;
  audiences?: string[];
  scopes?: string[];
}): Promise<QrLoginGenerateResponse> {
  return fetchJsonZ(
    "/stargate/auth/qr/generate",
    QrLoginGenerateResponseSchema,
    {
      method: "POST",
      body: JSON.stringify(
        camelToSnake({
          deviceId: payload.deviceId,
          deviceName: payload.deviceName,
          platform: payload.platform ?? 1, // ClientPlatform.Web
          audiences: payload.audiences ?? [],
          scopes: payload.scopes ?? [],
        }),
      ),
      skipAuth: true,
    },
  );
}

/** Poll QR challenge status (web cannot use WebSocket while unauthenticated). */
export async function getQrLoginStatus(
  qrChallengeId: string,
): Promise<QrLoginStatusResponse> {
  return fetchJsonZ(
    `/stargate/auth/qr/${qrChallengeId}`,
    QrLoginStatusResponseSchema,
    { skipAuth: true },
  );
}

/** Start WebAuthn registration (requires enabled Passkey factor). */
export async function startPasskeyRegistration(payload: {
  deviceId: string;
  deviceName?: string;
  rpId: string;
  rpName: string;
}): Promise<PasskeyRegistrationOptions> {
  return fetchJsonZ(
    "/stargate/factors/passkey/start",
    PasskeyRegistrationOptionsSchema,
    { method: "POST", body: JSON.stringify(camelToSnake(payload)) },
  );
}

export async function completePasskeyRegistration(payload: {
  deviceId: string;
  label: string;
  clientDataJson: string;
  attestationObject: string;
}): Promise<SnPasskey> {
  return fetchJsonZ(
    "/stargate/factors/passkey/complete",
    SnPasskeySchema,
    { method: "POST", body: JSON.stringify(camelToSnake(payload)) },
  );
}

export async function fetchPasskeys(): Promise<SnPasskey[]> {
  return fetchJsonZ("/stargate/factors/passkey", SnPasskeySchema.array());
}

export async function updatePasskey(
  passkeyId: string,
  label: string,
): Promise<SnPasskey> {
  return fetchJsonZ(
    `/stargate/factors/passkey/${passkeyId}`,
    SnPasskeySchema,
    { method: "PATCH", body: JSON.stringify({ label }) },
  );
}

export async function deletePasskey(passkeyId: string): Promise<void> {
  await apiFetch(`/stargate/factors/passkey/${passkeyId}`, {
    method: "DELETE",
  });
}

export async function verifyChallenge(
  challengeId: string,
  factorId: string,
  password: string,
): Promise<SnAuthChallenge> {
  return fetchJsonZ(
    `/stargate/auth/challenge/${challengeId}`,
    SnAuthChallengeSchema,
    {
      method: "PATCH",
      body: JSON.stringify(camelToSnake({ factorId, password })),
      skipAuth: true,
    },
  );
}

export async function getToken(code: string): Promise<SnAuthToken> {
  // The proxy stored the token pair server-side and set our `sid` cookie. It
  // returns display metadata in camelCase; the pair lives in the session store.
  return fetchJsonZ(
    "/stargate/auth/token",
    SnAuthTokenSchema,
    {
      method: "POST",
      body: JSON.stringify({ grant_type: "authorization_code", code }),
      skipAuth: true,
    },
  );
}

export async function getUserInfo(): Promise<SnAccount> {
  return fetchJsonZ("/stargate/accounts/me", SnAccountSchema);
}

// Unified logout: the proxy clears the server session + cookie.
export async function logoutApi(): Promise<void> {
  await apiFetch("/stargate/auth/logout", { method: "POST", skipAuth: true });
}

export async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch("/api/proxy/stargate/auth/refresh", {
      method: "POST",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function createAccount(payload: {
  name: string;
  nick: string;
  email: string;
  password: string;
  language: string;
  captchaToken: string;
}): Promise<unknown> {
  const response = await apiFetch("/stargate/accounts", {
    method: "POST",
    body: JSON.stringify(camelToSnake({ ...payload })),
    skipAuth: true,
  });
  return safeJsonParse<unknown>(response);
}

export async function requestPasswordReset(
  account: string,
  captchaToken: string,
): Promise<unknown> {
  const response = await apiFetch("/stargate/accounts/recovery/password", {
    method: "POST",
    body: JSON.stringify(camelToSnake({ account, captchaToken })),
    skipAuth: true,
  });
  return safeJsonParse<unknown>(response);
}

export async function getCaptchaConfig(): Promise<CaptchaConfig> {
  return fetchJsonZ("/stargate/auth/captcha", CaptchaConfigSchema, {
    skipAuth: true,
  });
}

export interface AuthorizeClientInfo {
  clientName?: string;
  homeUri?: string;
  picture?: { id?: string };
  background?: { id?: string };
  scopes?: string[];
}

export async function getAuthorizeClientInfo(query: URLSearchParams): Promise<AuthorizeClientInfo> {
  const response = await apiFetch(
    `/stargate/auth/open/authorize?${query.toString()}`,
    { skipAuth: true },
  );
  return safeJsonParse(response);
}

export async function submitAuthorizeDecision(
  query: URLSearchParams,
  authorize: boolean,
): Promise<{ redirectUri?: string }> {
  const payload = new URLSearchParams(query);
  payload.set("authorize", authorize ? "true" : "false");

  const response = await apiFetch("/stargate/auth/open/authorize", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
  });
  return safeJsonParse(response);
}

export async function getOrder(orderId: string): Promise<WalletOrder> {
  return fetchJsonZ(
    `/wallet/orders/${encodeURIComponent(orderId)}`,
    WalletOrderSchema,
  );
}

export async function payOrder(
  orderId: string,
  pinCode: string,
  payerWalletId?: string,
): Promise<WalletOrder> {
  const body: Record<string, string> = { pin_code: pinCode };
  if (payerWalletId) body.payer_wallet_id = payerWalletId;
  return fetchJsonZ(
    `/wallet/orders/${encodeURIComponent(orderId)}/pay`,
    WalletOrderSchema,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function fetchStoreProducts(
  appSlug: string,
): Promise<AppProduct[]> {
  return fetchJsonZ(
    `/develop/apps/${encodeURIComponent(appSlug)}/products`,
    AppProductSchema.array(),
  );
}

export async function getSpell(spellWord: string): Promise<SpellInfo> {
  return fetchJsonZ(
    `/stargate/spells/${encodeURIComponent(spellWord)}`,
    SpellInfoSchema,
  );
}

export async function applySpell(
  spellWord: string,
  newPassword?: string,
): Promise<unknown> {
  const response = await apiFetch(
    `/stargate/spells/${encodeURIComponent(spellWord)}/apply`,
    {
      method: "POST",
      body: newPassword ? JSON.stringify({ new_password: newPassword }) : null,
    },
  );
  return safeJsonParse(response);
}

export function getOidcLoginUrl(
  provider: string,
  deviceId: string,
  returnUrl: string,
): string {
  const params = new URLSearchParams({ returnUrl, deviceId, flow: "login" });
  return `${API_BASE_URL}/stargate/auth/login/${provider.toLowerCase()}?${params}`;
}

// Data API - Posts
export async function fetchPosts(
  take = 20,
  offset = 0,
  options: {
    replies?: boolean;
    realm?: string;
    media?: boolean;
    queryTerm?: string;
    type?: string;
    orderDesc?: boolean;
    pub?: string;
  } = {},
): Promise<{ posts: Post[]; total: number }> {
  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
    replies: String(options.replies ?? false),
  });

  if (options.realm) params.set("realm", options.realm);
  if (options.media) params.set("media", String(options.media));
  if (options.queryTerm) params.set("query", options.queryTerm);
  if (options.type) params.set("type", options.type);
  if (options.orderDesc) params.set("orderDesc", String(options.orderDesc));
  if (options.pub) params.set("pub", options.pub);

  // Send auth when logged in so API can return reactionsMade
  const { isAuthenticated } = useAuth();
  const { data, headers } = await fetchJsonZHeaders(
    `/sphere/posts?${params.toString()}`,
    PostSchema.array(),
    { skipAuth: !isAuthenticated.value },
  );

  const total = parseInt(headers.get("x-total") || "0", 10);
  return { posts: data, total };
}

// Data API - Timeline
export async function fetchTimeline(
  take = 20,
  options: {
    cursor?: string | null;
    mode?: string;
    filter?: string;
    aggressive?: boolean;
  } = {},
): Promise<TimelineResult> {
  const params = new URLSearchParams({
    take: String(take),
  });

  if (options.cursor) params.set("cursor", options.cursor);
  if (options.mode) params.set("mode", options.mode);
  if (options.filter) params.set("filter", options.filter);
  if (options.aggressive !== undefined)
    params.set("aggressive", String(options.aggressive));

  const { isAuthenticated } = useAuth();
  return fetchJsonZ(`/sphere/timeline?${params.toString()}`, TimelineResultSchema, {
    skipAuth: !isAuthenticated.value,
  });
}

export async function fetchFeaturedPosts(): Promise<Post[]> {
  const { isAuthenticated } = useAuth();
  return fetchJsonZ("/sphere/posts/featured", PostSchema.array(), {
    skipAuth: !isAuthenticated.value,
  });
}

export async function fetchPost(id: string): Promise<Post> {
  const { isAuthenticated } = useAuth();
  return fetchJsonZ(`/sphere/posts/${id}`, PostSchema, {
    skipAuth: !isAuthenticated.value,
  });
}

export async function fetchPostReplies(id: string): Promise<Post[]> {
  const { isAuthenticated } = useAuth();
  return fetchJsonZ(`/sphere/posts/${id}/replies`, PostSchema.array(), {
    skipAuth: !isAuthenticated.value,
  });
}

export async function fetchPostRepliesThreaded(
  id: string,
  take = 3,
  offset = 0,
): Promise<{ nodes: ThreadedReplyNode[]; total: number }> {
  const { data, headers } = await fetchJsonZHeaders(
    `/sphere/posts/${id}/replies/threaded?offset=${offset}&take=${take}`,
    ThreadedReplyNodeSchema.array(),
    { skipAuth: true },
  );

  const total = parseInt(headers.get("x-total") || "0", 10);
  return {
    total,
    nodes: data.map((node) => ({
      post: node.post,
      depth: node.depth ?? 0,
      parentId: node.parentId ?? null,
    })),
  };
}

// Reactions API
export async function fetchPostReactions(postId: string): Promise<Reaction[]> {
  return fetchJsonZ(`/sphere/posts/${postId}/reactions`, ReactionSchema.array(), {
    skipAuth: true,
  });
}

export async function fetchPostReactionList(
  postId: string,
  take = 20,
  offset = 0,
): Promise<{ items: PostReaction[]; total: number }> {
  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
  });
  const { data, headers } = await fetchJsonZHeaders(
    `/sphere/posts/${postId}/reactions?${params.toString()}`,
    PostReactionSchema.array(),
    { skipAuth: true },
  );
  const total = parseInt(headers.get("x-total") || "0", 10);
  return { items: data, total };
}

export async function reactToPost(
  postId: string,
  symbol: string,
  attitude: number,
): Promise<void> {
  await apiFetch(`/sphere/posts/${postId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ symbol, attitude }),
  });
}

export async function removeReaction(
  postId: string,
  symbol: string,
): Promise<void> {
  await apiFetch(`/sphere/posts/${postId}/reactions/${symbol}`, {
    method: "DELETE",
  });
}

export async function fetchPostBoosts(
  postId: string,
  take = 20,
  offset = 0,
): Promise<{ items: Boost[]; total: number }> {
  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
  });
  const { data, headers } = await fetchJsonZHeaders(
    `/sphere/posts/${postId}/boosts?${params.toString()}`,
    BoostSchema.array(),
    { skipAuth: true },
  );
  const total = parseInt(headers.get("x-total") || "0", 10);
  return { items: data, total };
}

export async function fetchPostForwards(
  postId: string,
  take = 20,
  offset = 0,
): Promise<{ posts: Post[]; total: number }> {
  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
  });
  const { data, headers } = await fetchJsonZHeaders(
    `/sphere/posts/${postId}/forwards?${params.toString()}`,
    PostSchema.array(),
    { skipAuth: true },
  );
  const total = parseInt(headers.get("x-total") || "0", 10);
  return { posts: data, total };
}

// Data API - Publishers
export async function fetchPublisher(name: string): Promise<Publisher> {
  return fetchJsonZ(
    `/sphere/publishers/${encodeURIComponent(name)}`,
    PublisherSchema,
  );
}

export async function fetchPublisherPosts(
  name: string,
  take = 20,
  offset = 0,
  options: {
    type?: string;
    replies?: boolean | null;
    media?: boolean;
    orderDesc?: boolean;
    queryTerm?: string;
  } = {},
): Promise<{ posts: Post[]; total: number }> {
  const params = new URLSearchParams({
    pub: name,
    take: String(take),
    offset: String(offset),
    replies: String(options.replies ?? false),
    orderDesc: String(options.orderDesc ?? true),
  });

  if (options.type) params.set("type", options.type);
  if (options.media) params.set("media", "true");
  if (options.queryTerm) params.set("query", options.queryTerm);

  const { data, headers } = await fetchJsonZHeaders(
    `/sphere/posts?${params.toString()}`,
    PostSchema.array(),
    { skipAuth: true },
  );

  const total = parseInt(headers.get("x-total") || "0", 10);
  return { posts: data, total };
}

export async function fetchPublishers(): Promise<Publisher[]> {
  return fetchJsonZ("/sphere/publishers", PublisherSchema.array(), {
    skipAuth: true,
  });
}

// Search API
export async function searchAccounts(
  query: string,
  take = 20,
): Promise<SnAccount[]> {
  const params = new URLSearchParams({ query, take: String(take) });
  return fetchJsonZ(
    `/stargate/accounts/search?${params.toString()}`,
    SnAccountSchema.array(),
    { skipAuth: true },
  );
}

export async function searchPublishers(
  query: string,
  take = 20,
): Promise<Publisher[]> {
  const params = new URLSearchParams({ query, take: String(take) });
  return fetchJsonZ(
    `/sphere/publishers/search?${params.toString()}`,
    PublisherSchema.array(),
    { skipAuth: true },
  );
}

export async function searchRealms(query: string, take = 20): Promise<Realm[]> {
  const params = new URLSearchParams({ query, take: String(take) });
  return fetchJsonZ(
    `/passport/realms/search?${params.toString()}`,
    RealmSchema.array(),
    { skipAuth: true },
  );
}

// Data API - Accounts
export async function fetchAccount(name: string): Promise<SnAccount> {
  return fetchJsonZ(
    `/stargate/accounts/${encodeURIComponent(name)}`,
    SnAccountSchema,
    { skipAuth: true },
  );
}

export async function fetchAccountPunishment(
  name: string,
): Promise<SnAccountPunishment | null> {
  try {
    return await fetchJsonZ(
      `/stargate/accounts/${encodeURIComponent(name)}/punishments/overview`,
      SnAccountPunishmentSchema,
      { skipAuth: true },
    );
  } catch {
    return null;
  }
}

export async function fetchAccountBotDeveloper(
  automatedId: string,
): Promise<{ publisher?: { name: string; nick?: string } } | null> {
  try {
    const response = await apiFetch(
      `/develop/bots/${encodeURIComponent(automatedId)}/developer`,
      { skipAuth: true },
    );
    return safeJsonParse(response);
  } catch {
    return null;
  }
}

// Data API - Account board
export function defaultAccountBoard(): AccountBoardItem[] {
  const keys = [
    "activity",
    "badges",
    "leveling",
    "social_credits",
    "contacts",
    "connections",
    "publishers",
    "notable_days",
    "verification",
    "links",
    "fortune",
  ] as const;
  return keys.map((widgetKey, order) => ({
    order,
    kind: "prebuilt" as const,
    widgetKey,
    isEnabled: true,
    payload: {},
  }));
}

export function parseAccountBoardItems(raw: unknown[]): AccountBoardItem[] {
  const items: AccountBoardItem[] = raw.map((entry) => {
    const map = (entry ?? {}) as Record<string, unknown>;
    const payloadRaw = map.payload;
    const kindRaw = map.kind;
    let kind: AccountBoardItem["kind"] = "prebuilt";
    if (kindRaw === 1 || kindRaw === "custom_app") kind = "custom_app";
    else if (kindRaw === 0 || kindRaw === "prebuilt") kind = "prebuilt";
    else if (typeof kindRaw === "number") kind = kindRaw === 1 ? "custom_app" : "prebuilt";

    return {
      id: typeof map.id === "string" ? map.id : undefined,
      accountId: typeof map.accountId === "string" ? map.accountId : undefined,
      order: typeof map.order === "number" ? map.order : 0,
      kind,
      widgetKey: (map.widgetKey as string | null | undefined) ?? null,
      customAppId: (map.customAppId as string | null | undefined) ?? null,
      customAppWidgetKey:
        (map.customAppWidgetKey as string | null | undefined) ?? null,
      isEnabled: map.isEnabled !== false,
      payload:
        payloadRaw && typeof payloadRaw === "object" && !Array.isArray(payloadRaw)
          ? (payloadRaw as AccountBoardItem["payload"])
          : {},
      createdAt: typeof map.createdAt === "string" ? map.createdAt : undefined,
      updatedAt: typeof map.updatedAt === "string" ? map.updatedAt : undefined,
    };
  });
  items.sort((a, b) => a.order - b.order);
  return items;
}

export async function fetchPublicAccountBoard(
  name: string,
): Promise<AccountBoardItem[]> {
  try {
    const response = await apiFetch(
      `/passport/accounts/${encodeURIComponent(name)}/board`,
      { skipAuth: true },
    );
    const list = await safeJsonParse<unknown[]>(response);
    if (!Array.isArray(list) || list.length === 0) return defaultAccountBoard();
    return parseAccountBoardItems(list);
  } catch {
    return defaultAccountBoard();
  }
}

export async function fetchPublicAccountConnections(
  name: string,
): Promise<PublicAccountConnection[]> {
  try {
    return await fetchJsonZ(
      `/stargate/accounts/${encodeURIComponent(name)}/connections`,
      PublicAccountConnectionSchema.array(),
      { skipAuth: true },
    );
  } catch {
    return [];
  }
}

export async function fetchAccountPublishers(
  accountId: string,
): Promise<Publisher[]> {
  try {
    return await fetchJsonZ(
      `/sphere/publishers/of/${encodeURIComponent(accountId)}`,
      PublisherSchema.array(),
      { skipAuth: true },
    );
  } catch {
    return [];
  }
}

// Data API - Realms
export async function fetchRealm(slug: string): Promise<Realm> {
  return fetchJsonZ(
    `/passport/realms/${encodeURIComponent(slug)}`,
    RealmSchema,
    { skipAuth: true },
  );
}

export async function fetchRealmPosts(
  slug: string,
  take = 20,
  offset = 0,
  options: {
    type?: string;
    replies?: boolean | null;
    media?: boolean;
    orderDesc?: boolean;
    queryTerm?: string;
  } = {},
): Promise<{ posts: Post[]; total: number }> {
  const params = new URLSearchParams({
    realm: slug,
    take: String(take),
    offset: String(offset),
    replies: String(options.replies ?? false),
    orderDesc: String(options.orderDesc ?? true),
  });

  if (options.type) params.set("type", options.type);
  if (options.media) params.set("media", "true");
  if (options.queryTerm) params.set("query", options.queryTerm);

  const { data, headers } = await fetchJsonZHeaders(
    `/sphere/posts?${params.toString()}`,
    PostSchema.array(),
    { skipAuth: true },
  );

  const total = parseInt(headers.get("x-total") || "0", 10);
  return { posts: data, total };
}

// Heatmap data for publisher activity
export async function fetchPublisherHeatmap(
  publisherName: string,
): Promise<HeatmapData> {
  return fetchJsonZ(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/heatmap`,
    HeatmapDataSchema,
    { skipAuth: true },
  );
}

// Publisher subscription status
export async function fetchPublisherSubscriptionStatus(
  publisherName: string,
): Promise<PublisherSubscriptionStatus | null> {
  try {
    return await fetchJsonZ(
      `/sphere/publishers/${encodeURIComponent(publisherName)}/subscription`,
      PublisherSubscriptionStatusSchema,
    );
  } catch (err) {
    // 404 means not subscribed
    if (err instanceof Error && err.message.includes("404")) {
      return null;
    }
    throw err;
  }
}

export async function subscribeToPublisher(
  publisherName: string,
): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/subscribers`,
    { method: "POST" },
  );
}

export async function unsubscribeFromPublisher(
  publisherName: string,
): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/subscribers/me`,
    { method: "DELETE" },
  );
}

export async function setPublisherNotify(
  publisherName: string,
  notify: boolean,
): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/subscribers/me/notify`,
    {
      method: "PATCH",
      body: JSON.stringify({ notify }),
    },
  );
}

// Pinned posts
export async function fetchPublisherPinnedPosts(
  publisherName: string,
): Promise<Post[]> {
  return fetchJsonZ(
    `/sphere/posts?pub=${encodeURIComponent(publisherName)}&pinned=true&take=10`,
    PostSchema.array(),
    { skipAuth: true },
  );
}

// Account timeline (user's posts)
export async function fetchAccountTimeline(
  accountName: string,
  take = 20,
  offset = 0,
): Promise<{ posts: Post[]; total: number }> {
  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
    account: accountName,
  });

  const { data, headers } = await fetchJsonZHeaders(
    `/sphere/posts?${params.toString()}`,
    PostSchema.array(),
    { skipAuth: true },
  );

  const total = parseInt(headers.get("x-total") || "0", 10);
  return { posts: data, total };
}

// Account activity timeline (status updates, activities, etc.)
export async function fetchAccountActivityTimeline(
  accountName: string,
  take = 20,
  offset = 0,
): Promise<{ items: SnAccountTimelineItem[]; total: number }> {
  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
  });

  const { data, headers } = await fetchJsonZHeaders(
    `/passport/accounts/${encodeURIComponent(accountName)}/timeline?${params.toString()}`,
    SnAccountTimelineItemSchema.array(),
    { skipAuth: true },
  );

  const total = parseInt(headers.get("x-total") || "0", 10);
  return { items: data, total };
}

// Account relationships
export async function fetchAccountRelationship(
  accountId: string,
): Promise<RelationshipStatus | null> {
  try {
    return await fetchJsonZ(
      `/passport/accounts/${accountId}/relationship`,
      RelationshipStatusSchema,
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      return null;
    }
    throw err;
  }
}

export async function addAccountAsFriend(accountId: string): Promise<void> {
  await apiFetch(`/passport/accounts/${accountId}/relationship`, {
    method: "POST",
  });
}

export async function blockAccount(accountId: string): Promise<void> {
  await apiFetch(`/passport/accounts/${accountId}/block`, {
    method: "POST",
  });
}

export async function unblockAccount(accountId: string): Promise<void> {
  await apiFetch(`/passport/accounts/${accountId}/block`, {
    method: "DELETE",
  });
}

// Relationships
export async function fetchRelationships(
  offset = 0,
  take = 20,
): Promise<{ items: Relationship[]; total: number; hasMore: boolean }> {
  const { data, headers } = await fetchJsonZHeaders(
    `/stargate/relationships?offset=${offset}&take=${take}`,
    RelationshipSchema.array(),
  );
  const total = parseInt(headers.get("x-total") || "0", 10);
  return {
    items: data,
    total,
    hasMore: offset + data.length < total,
  };
}

export async function fetchFriendRequests(): Promise<Relationship[]> {
  return fetchJsonZ(
    "/stargate/relationships/requests",
    RelationshipSchema.array(),
  );
}

export async function sendFriendRequest(accountId: string): Promise<void> {
  await apiFetch(`/stargate/relationships/${accountId}/friends`, {
    method: "POST",
  });
}

export async function acceptFriendRequest(accountId: string): Promise<void> {
  await apiFetch(`/stargate/relationships/${accountId}/friends/accept`, {
    method: "POST",
  });
}

export async function declineFriendRequest(accountId: string): Promise<void> {
  await apiFetch(`/stargate/relationships/${accountId}/friends/decline`, {
    method: "POST",
  });
}

export async function cancelFriendRequest(relatedId: string): Promise<void> {
  await apiFetch(`/stargate/relationships/${relatedId}/friends`, {
    method: "DELETE",
  });
}

export async function updateRelationship(
  accountId: string,
  status: number,
): Promise<void> {
  await apiFetch(`/stargate/relationships/${accountId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteRelationship(relatedId: string): Promise<void> {
  await apiFetch(`/stargate/relationships/${relatedId}`, {
    method: "DELETE",
  });
}

// Friends overview (dashboard module, mirrors the Solian clients).
export async function fetchFriendsOverview(): Promise<FriendOverviewItem[]> {
  return fetchJsonZ(
    "/passport/friends/overview",
    FriendOverviewItemSchema.array().nullable().transform((v) => v ?? []),
  );
}



// Wallet API
export async function fetchWallet(): Promise<Wallet | null> {
  try {
    return await fetchJsonZ("/wallet/wallets", WalletSchema);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      return null;
    }
    throw err;
  }
}

export async function fetchWallets(): Promise<Wallet[]> {
  return fetchJsonZ("/wallet/wallets/all", WalletSchema.array());
}

export async function fetchWalletById(id: string): Promise<Wallet> {
  return fetchJsonZ(`/wallet/wallets/${id}`, WalletSchema);
}

export async function createWallet(params?: {
  name?: string;
  realmId?: string;
}): Promise<Wallet> {
  return fetchJsonZ("/wallet/wallets", WalletSchema, {
    method: "POST",
    body: JSON.stringify({
      name: params?.name,
      realm_id: params?.realmId,
    }),
  });
}

export async function setDefaultWallet(walletId: string): Promise<void> {
  await apiFetch(`/wallet/wallets/${walletId}/set-default`, {
    method: "POST",
  });
}

export async function enableWalletPublicId(walletId: string): Promise<void> {
  await apiFetch(`/wallet/wallets/${walletId}/public-id`, {
    method: "POST",
  });
}

export async function disableWalletPublicId(walletId: string): Promise<void> {
  await apiFetch(`/wallet/wallets/${walletId}/public-id`, {
    method: "DELETE",
  });
}

export async function fetchWalletStats(params?: {
  period?: number;
  walletId?: string;
  currency?: string;
}): Promise<WalletStats> {
  const searchParams = new URLSearchParams();
  if (params?.period) searchParams.set("period", String(params.period));
  if (params?.walletId) searchParams.set("wallets", params.walletId);
  if (params?.currency) searchParams.set("currencies", params.currency);
  const query = searchParams.toString();
  return fetchJsonZ(
    `/wallet/wallets/stats${query ? "?" + query : ""}`,
    WalletStatsSchema,
  );
}

export async function fetchWalletPinStatus(): Promise<WalletPinStatus> {
  return fetchJsonZ("/stargate/accounts/me/pin-status", WalletPinStatusSchema);
}

// ── Stellar Program subscriptions ────────────────────────────────────────

export const STELLAR_SUBSCRIPTION_GROUP = "solian.stellar";

/**
 * Fetch the Stellar Program subscription group (catalog + active membership).
 * Returns null when the caller is not authenticated.
 */
export async function fetchSubscriptionGroup(
  groupId: string = STELLAR_SUBSCRIPTION_GROUP,
): Promise<SubscriptionGroup | null> {
  try {
    return await fetchJsonZ(
      `/wallet/subscriptions/groups/${encodeURIComponent(groupId)}`,
      SubscriptionGroupSchema,
    );
  } catch {
    return null;
  }
}

/** Fetch the currently active Stellar subscription, if any. */
export async function fetchActiveStellarSubscription(): Promise<StellarSubscription | null> {
  try {
    return await fetchJsonZ(
      `/wallet/subscriptions/groups/${STELLAR_SUBSCRIPTION_GROUP}/active`,
      StellarSubscriptionSchema,
    );
  } catch {
    return null;
  }
}

/**
 * Open a new wallet subscription for a catalog identifier.
 * Returns an already-active subscription when one is running.
 */
export async function createStellarSubscription(
  identifier: string,
  cycleDurationDays = 30,
): Promise<StellarSubscription> {
  return fetchJsonZ("/wallet/subscriptions", StellarSubscriptionSchema, {
    method: "POST",
    body: JSON.stringify({
      identifier,
      cycle_duration_days: cycleDurationDays,
      payment_details: { currency: "points" },
    }),
  });
}

/** Create an unpaid order for a subscription; pay it with `payOrder`. */
export async function createSubscriptionOrder(
  subscriptionId: string,
): Promise<WalletOrder> {
  return fetchJsonZ(
    `/wallet/subscriptions/${encodeURIComponent(subscriptionId)}/order`,
    WalletOrderSchema,
    { method: "POST" },
  );
}

/** Cancel an active wallet subscription. */
export async function cancelStellarSubscription(
  subscriptionId: string,
): Promise<void> {
  await apiFetch(
    `/wallet/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    { method: "POST" },
  );
}

/** Create an Afdian checkout URL for a catalog identifier. */
export async function createAfdianCheckout(
  identifier: string,
): Promise<AfdianCheckout> {
  const data = await fetchJsonZ(
    `/wallet/subscriptions/${encodeURIComponent(identifier)}/checkout/afdian`,
    AfdianCheckoutSchema,
    { method: "POST" },
  );
  return {
    checkoutUrl: data.checkoutUrl,
    providerReferenceId: data.providerReferenceId ?? null,
    planId: data.planId ?? null,
  };
}

// ── Shop products: golds, name change card, storage quota ────────────────

/** Wallet product catalog (Golden Solar Points pack and friends). */
export async function fetchWalletProductCatalog(): Promise<WalletProductCatalogItem[]> {
  try {
    return await fetchJsonZ(
      "/wallet/wallet-products/catalog",
      WalletProductCatalogItemSchema.array(),
    );
  } catch {
    return [];
  }
}

/** Create an Afdian checkout URL for the Golden Solar Points pack. */
export async function createGoldsAfdianCheckout(): Promise<AfdianCheckout> {
  const data = await fetchJsonZ(
    "/wallet/wallet-products/golds-resupply-pack/checkout/afdian",
    AfdianCheckoutSchema,
    { method: "POST" },
  );
  return {
    checkoutUrl: data.checkoutUrl,
    providerReferenceId: data.providerReferenceId ?? null,
    planId: data.planId ?? null,
  };
}

/** Quota purchase pricing. Returns null when unavailable or unauthenticated. */
export async function fetchQuotaPurchaseConfig(): Promise<QuotaPurchaseConfig | null> {
  try {
    return await fetchJsonZ(
      "/drive/billing/quota/purchase",
      QuotaPurchaseConfigSchema,
    );
  } catch {
    return null;
  }
}

/** Create a storage quota order; pay it with `payOrder`. */
export async function createQuotaPurchaseOrder(
  quantityGb: number,
): Promise<QuotaOrder> {
  return fetchJsonZ("/drive/billing/quota/purchase", QuotaOrderSchema, {
    method: "POST",
    body: JSON.stringify({ quantity_gb: quantityGb }),
  });
}

/** Order a name change card; pay the returned order with `payOrder`. */
export async function orderNameChangeCard(): Promise<NameChangeCardOrder> {
  return fetchJsonZ("/accounts/me/name-change-card/order", NameChangeCardOrderSchema, {
    method: "POST",
  });
}

export async function fetchTransactions(
  offset = 0,
  take = 20,
): Promise<{ items: Transaction[]; total: number; hasMore: boolean }> {
  const { data, headers } = await fetchJsonZHeaders(
    `/wallet/wallets/transactions?offset=${offset}&take=${take}`,
    TransactionSchema.array(),
  );
  const total = parseInt(headers.get("x-total") || "0", 10);
  return {
    items: data,
    total,
    hasMore: offset + data.length < total,
  };
}

export async function createTransfer(payload: {
  amount: number;
  currency: string;
  payeeAccountId?: string;
  payeePublicId?: string;
  remark?: string;
  pinCode?: string;
  freeze?: boolean;
  requireConfirmation?: boolean;
  payerWalletId?: string;
}): Promise<void> {
  await apiFetch("/wallet/wallets/transfer", {
    method: "POST",
    body: JSON.stringify({
      amount: payload.amount,
      currency: payload.currency,
      payee_account_id: payload.payeeAccountId,
      payee_public_id: payload.payeePublicId,
      remark: payload.remark,
      pin_code: payload.pinCode,
      freeze: payload.freeze,
      require_confirmation: payload.requireConfirmation,
      payer_wallet_id: payload.payerWalletId,
    }),
  });
}

export async function confirmTransaction(transactionId: string): Promise<void> {
  await apiFetch(`/wallet/wallets/transactions/${transactionId}/confirm`, {
    method: "POST",
  });
}

export async function rejectTransaction(transactionId: string): Promise<void> {
  await apiFetch(`/wallet/wallets/transactions/${transactionId}/reject`, {
    method: "POST",
  });
}

export async function createFund(payload: {
  currency: string;
  totalAmount?: number;
  splitType: number;
  amountOfSplits: number;
  recipientAccountIds?: string[];
  message?: string;
  pinCode?: string;
  isRaising?: boolean;
  isOpen?: boolean;
  targetAmount?: number;
  contributionType?: number;
  contributionAmount?: number;
  deadlineAt?: string;
  payerWalletId?: string;
}): Promise<Fund> {
  return fetchJsonZ("/wallet/wallets/funds", FundSchema, {
    method: "POST",
    body: JSON.stringify({
      currency: payload.currency,
      total_amount: payload.totalAmount,
      split_type: payload.splitType,
      amount_of_splits: payload.amountOfSplits,
      recipient_account_ids: payload.recipientAccountIds,
      message: payload.message,
      pin_code: payload.pinCode,
      is_raising: payload.isRaising,
      is_open: payload.isOpen,
      target_amount: payload.targetAmount,
      contribution_type: payload.contributionType,
      contribution_amount: payload.contributionAmount,
      deadline_at: payload.deadlineAt,
      payer_wallet_id: payload.payerWalletId,
    }),
  });
}

export async function fetchFund(fundId: string): Promise<Fund> {
  return fetchJsonZ(`/wallet/wallets/funds/${fundId}`, FundSchema);
}

export async function claimFund(fundId: string): Promise<void> {
  await apiFetch(`/wallet/wallets/funds/${fundId}/receive`, {
    method: "POST",
  });
}

export async function fetchFunds(
  offset = 0,
  take = 20,
): Promise<{ items: Fund[]; total: number; hasMore: boolean }> {
  const { data, headers } = await fetchJsonZHeaders(
    `/wallet/wallets/funds?offset=${offset}&take=${take}`,
    FundSchema.array(),
  );
  const total = parseInt(headers.get("x-total") || "0", 10);
  return {
    items: data,
    total,
    hasMore: offset + data.length < total,
  };
}

// Badges
export type Badge = SnAccountBadge;

export async function fetchMyBadges(): Promise<SnAccountBadge[]> {
  return fetchJsonZ(
    "/passport/accounts/me/badges",
    SnAccountBadgeSchema.array(),
  );
}

export async function activateBadge(badgeId: string): Promise<void> {
  await apiFetch(`/passport/accounts/me/badges/${badgeId}/activate`, {
    method: "POST",
  });
}

// Notifications
const NotificationSchema = z.object({
  id: z.string(),
  topic: z.string(),
  title: z.string(),
  subtitle: z.string(),
  content: z.string(),
  link: z.string().optional(),
  meta: z.record(z.string(), z.unknown()),
  viewedAt: z.string().optional(),
  createdAt: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export async function fetchNotifications(
  offset = 0,
  take = 20,
): Promise<{ items: Notification[]; total: number; hasMore: boolean }> {
  const { data, headers } = await fetchJsonZHeaders(
    `/ring/notifications?offset=${offset}&take=${take}`,
    NotificationSchema.array(),
  );
  const total = parseInt(headers.get("x-total") || "0", 10);
  return {
    items: data,
    total,
    hasMore: offset + data.length < total,
  };
}

export async function fetchNotificationCount(): Promise<number> {
  try {
    const response = await apiFetch("/ring/notifications/count");
    const data = await response.text();
    return parseInt(data, 10) || 0;
  } catch {
    return 0;
  }
}

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  await apiFetch(`/ring/notifications/${notificationId}/read`, {
    method: "POST",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/ring/notifications/all/read", {
    method: "POST",
  });
}

// Realm API
// Workspace API — served by WattEngine Valve, separate from Realm APIs.
export async function fetchWorkspaces(): Promise<Workspace[]> {
  return fetchJsonZ("/valve/workspaces", WorkspaceSchema.array());
}

export async function createWorkspace(payload: {
  slug: string;
  name: string;
  description?: string;
  type: number;
}): Promise<Workspace> {
  return fetchJsonZ("/valve/workspaces", WorkspaceSchema, {
    method: "POST",
    body: JSON.stringify(camelToSnake(payload)),
  });
}

export async function fetchWorkspaceMembers(slug: string): Promise<WorkspaceMember[]> {
  return fetchJsonZ(`/valve/workspaces/${encodeURIComponent(slug)}/members`, WorkspaceMemberSchema.array());
}

export async function inviteWorkspaceMember(slug: string, accountId: string, role: number): Promise<WorkspaceMember> {
  return fetchJsonZ(`/valve/workspaces/${encodeURIComponent(slug)}/members/invite`, WorkspaceMemberSchema, {
    method: "POST",
    body: JSON.stringify({ account_id: accountId, role }),
  });
}

export async function updateWorkspaceMemberRole(slug: string, accountId: string, role: number): Promise<WorkspaceMember> {
  return fetchJsonZ(`/valve/workspaces/${encodeURIComponent(slug)}/members/${encodeURIComponent(accountId)}`, WorkspaceMemberSchema, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function removeWorkspaceMember(slug: string, accountId: string): Promise<void> {
  await apiFetch(`/valve/workspaces/${encodeURIComponent(slug)}/members/${encodeURIComponent(accountId)}`, { method: "DELETE" });
}

export async function fetchWorkspaceMailboxes(workspaceId: string): Promise<WorkspaceMailbox[]> {
  return fetchJsonZ(`/postal/mailboxes?workspace_id=${encodeURIComponent(workspaceId)}`, WorkspaceMailboxSchema.array());
}

export async function fetchWorkspaceMailboxUsage(workspaceId: string): Promise<WorkspaceMailboxUsage> {
  return fetchJsonZ(`/postal/workspaces/${encodeURIComponent(workspaceId)}/mailbox-usage`, WorkspaceMailboxUsageSchema);
}

export async function fetchWorkspaceSendUsage(workspaceId: string): Promise<WorkspaceSendUsage> {
  return fetchJsonZ(`/postal/workspaces/${encodeURIComponent(workspaceId)}/send-usage`, WorkspaceSendUsageSchema);
}

export async function fetchWorkspaceCustomDomainUsage(workspaceId: string): Promise<WorkspaceCustomDomainUsage> {
  return fetchJsonZ(`/postal/workspaces/${encodeURIComponent(workspaceId)}/custom-domain-usage`, WorkspaceCustomDomainUsageSchema);
}

export async function fetchMailHost(): Promise<string> {
  const result = await fetchJsonZ(
    "/postal/mail/host",
    z.object({ host: z.string().optional() }),
    { skipAuth: true },
  );
  return result.host?.trim().toLowerCase() || "";
}

export async function createWorkspaceMailbox(payload: { address: string; workspaceId: string; name?: string; isDefault?: boolean }): Promise<WorkspaceMailbox> {
  return fetchJsonZ("/postal/mailboxes", WorkspaceMailboxSchema, { method: "POST", body: JSON.stringify({ address: payload.address, workspace_id: payload.workspaceId, name: payload.name, is_default: payload.isDefault ?? false }) });
}

export async function fetchMailboxAliases(mailboxId: string): Promise<WorkspaceMailboxAlias[]> {
  return fetchJsonZ(`/postal/mailboxes/${encodeURIComponent(mailboxId)}/aliases`, WorkspaceMailboxAliasSchema.array());
}

export async function createMailboxAlias(payload: { mailboxId: string; customDomainId: string; localPart: string; name?: string }): Promise<WorkspaceMailboxAlias> {
  return fetchJsonZ(`/postal/mailboxes/${encodeURIComponent(payload.mailboxId)}/aliases`, WorkspaceMailboxAliasSchema, { method: "POST", body: JSON.stringify({ custom_domain_id: payload.customDomainId, local_part: payload.localPart, name: payload.name }) });
}

export async function deleteMailboxAlias(mailboxId: string, aliasId: string): Promise<void> {
  await apiFetch(`/postal/mailboxes/${encodeURIComponent(mailboxId)}/aliases/${encodeURIComponent(aliasId)}`, { method: "DELETE" });
}

export async function fetchMailboxForwarding(mailboxId: string): Promise<WorkspaceMailboxForwardingRule[]> {
  return fetchJsonZ(`/postal/mailboxes/${encodeURIComponent(mailboxId)}/forwarding`, WorkspaceMailboxForwardingRuleSchema.array());
}

export async function fetchMailboxQuota(mailboxId: string): Promise<WorkspaceMailboxQuota> {
  return fetchJsonZ(`/postal/mailboxes/${encodeURIComponent(mailboxId)}/quota`, WorkspaceMailboxQuotaSchema);
}

export async function createMailboxForwarding(payload: { mailboxId: string; aliasId: string; destination: string }): Promise<WorkspaceMailboxForwardingRule> {
  return fetchJsonZ(`/postal/mailboxes/${encodeURIComponent(payload.mailboxId)}/forwarding`, WorkspaceMailboxForwardingRuleSchema, { method: "POST", body: JSON.stringify({ alias_id: payload.aliasId, destination: payload.destination }) });
}

export async function deleteMailboxForwarding(mailboxId: string, ruleId: string): Promise<void> {
  await apiFetch(`/postal/mailboxes/${encodeURIComponent(mailboxId)}/forwarding/${encodeURIComponent(ruleId)}`, { method: "DELETE" });
}

export async function fetchWorkspaceCustomDomains(workspaceId: string): Promise<WorkspaceCustomDomain[]> {
  return fetchJsonZ(`/postal/custom-domains?workspace_id=${encodeURIComponent(workspaceId)}`, WorkspaceCustomDomainSchema.array());
}

export async function createWorkspaceCustomDomain(payload: { workspaceId: string; domain: string }): Promise<WorkspaceCustomDomain> {
  return fetchJsonZ("/postal/custom-domains", WorkspaceCustomDomainSchema, { method: "POST", body: JSON.stringify({ workspace_id: payload.workspaceId, domain: payload.domain }) });
}

export async function refreshWorkspaceCustomDomain(domainId: string): Promise<WorkspaceCustomDomain> {
  return fetchJsonZ(`/postal/custom-domains/${encodeURIComponent(domainId)}/refresh`, WorkspaceCustomDomainSchema, { method: "POST" });
}

export async function deleteWorkspaceCustomDomain(domainId: string): Promise<void> {
  await apiFetch(`/postal/custom-domains/${encodeURIComponent(domainId)}`, { method: "DELETE" });
}

export async function fetchMailCredentials(): Promise<WorkspaceMailCredential[]> {
  return fetchJsonZ("/postal/credentials", WorkspaceMailCredentialSchema.array());
}

export async function createMailCredential(payload: { mailboxId: string; label: string; protocols: string[] }): Promise<WorkspaceMailCredentialCreated> {
  return fetchJsonZ("/postal/credentials", WorkspaceMailCredentialCreatedSchema, { method: "POST", body: JSON.stringify({ mailbox_id: payload.mailboxId, label: payload.label, protocols: payload.protocols }) });
}

export async function revokeMailCredential(credentialId: string): Promise<void> {
  await apiFetch(`/postal/credentials/${encodeURIComponent(credentialId)}`, { method: "DELETE" });
}

// ── Mail (ElecPostal via /postal) ─────────────────────────────────────────

export async function fetchMyMailboxes(): Promise<WorkspaceMailbox[]> {
  return fetchJsonZ("/postal/mailboxes", WorkspaceMailboxSchema.array());
}

export async function fetchMailStats(mailboxId?: string): Promise<MailStats> {
  const endpoint = mailboxId
    ? `/postal/mailboxes/${encodeURIComponent(mailboxId)}/stats`
    : "/postal/emails/stats";
  return fetchJsonZ(endpoint, MailStatsSchema);
}

export interface FetchEmailsOptions {
  mailboxId?: string;
  folder?: string;
  offset?: number;
  take?: number;
  q?: string;
  isRead?: boolean;
  isStarred?: boolean;
  labelId?: string;
}

export async function fetchEmails(
  options: FetchEmailsOptions = {},
): Promise<{ items: PostalEmail[]; total: number; hasMore: boolean }> {
  const params = new URLSearchParams();
  if (options.mailboxId) params.set("mailbox_id", options.mailboxId);
  if (options.folder) params.set("folder", options.folder);
  if (options.offset !== undefined) params.set("offset", String(options.offset));
  if (options.take !== undefined) params.set("take", String(options.take));
  if (options.q) params.set("q", options.q);
  if (options.isRead !== undefined) params.set("is_read", String(options.isRead));
  if (options.isStarred !== undefined) params.set("is_starred", String(options.isStarred));
  if (options.labelId) params.set("label_id", options.labelId);
  const query = params.toString();
  const { data, headers } = await fetchJsonZHeaders(
    `/postal/emails${query ? `?${query}` : ""}`,
    PostalEmailSchema.array(),
  );
  const total = parseInt(headers.get("x-total") || "0", 10);
  const offset = options.offset ?? 0;
  return { items: data, total, hasMore: offset + data.length < total };
}

export async function fetchEmail(id: string): Promise<PostalEmail> {
  return fetchJsonZ(`/postal/emails/${encodeURIComponent(id)}`, PostalEmailSchema);
}

export async function sendEmail(payload: SendEmailPayload): Promise<PostalEmail> {
  const body: Record<string, unknown> = {
    mailbox_id: payload.mailboxId,
    to: payload.to,
    cc: payload.cc,
    bcc: payload.bcc,
    subject: payload.subject,
    body: payload.body,
    content_type: payload.contentType || "text/plain",
    attachment_ids: payload.attachmentIds,
    is_draft: payload.isDraft ?? false,
  };
  if (payload.fromAliasId) body.from_alias_id = payload.fromAliasId;
  if (payload.threadId) body.thread_id = payload.threadId;
  if (payload.replyToId) body.reply_to_id = payload.replyToId;
  return fetchJsonZ("/postal/emails", PostalEmailSchema, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function markEmailRead(id: string, read: boolean): Promise<void> {
  await apiFetch(`/postal/emails/${encodeURIComponent(id)}/${read ? "read" : "unread"}`, { method: "POST" });
}

export async function starEmail(id: string, starred: boolean): Promise<void> {
  await apiFetch(`/postal/emails/${encodeURIComponent(id)}/${starred ? "star" : "unstar"}`, { method: "POST" });
}

export async function moveEmail(id: string, folder: string): Promise<void> {
  await apiFetch(`/postal/emails/${encodeURIComponent(id)}/move`, {
    method: "POST",
    body: JSON.stringify({ folder }),
  });
}

export async function deleteEmail(id: string): Promise<void> {
  await apiFetch(`/postal/emails/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function reportSpam(id: string, spam: boolean): Promise<void> {
  await apiFetch(`/postal/emails/${encodeURIComponent(id)}/${spam ? "spam" : "not-spam"}`, { method: "POST" });
}

export async function resendEmail(id: string): Promise<PostalEmail> {
  return fetchJsonZ(`/postal/emails/${encodeURIComponent(id)}/resend`, PostalEmailSchema, { method: "POST" });
}

export async function fetchThread(id: string): Promise<PostalEmail[]> {
  return fetchJsonZ(`/postal/threads/${encodeURIComponent(id)}`, PostalEmailSchema.array());
}

export async function fetchLabels(): Promise<MailLabel[]> {
  return fetchJsonZ("/postal/labels", MailLabelSchema.array());
}

export async function createLabel(payload: { name: string; color: string }): Promise<MailLabel> {
  return fetchJsonZ("/postal/labels", MailLabelSchema, {
    method: "POST",
    body: JSON.stringify({ name: payload.name, color: payload.color }),
  });
}

export async function deleteLabel(id: string): Promise<void> {
  await apiFetch(`/postal/labels/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function setEmailLabel(emailId: string, labelId: string, assigned: boolean): Promise<void> {
  await apiFetch(`/postal/emails/${encodeURIComponent(emailId)}/labels/${encodeURIComponent(labelId)}`, {
    method: assigned ? "POST" : "DELETE",
  });
}

export async function fetchBlockRules(): Promise<BlockRule[]> {
  return fetchJsonZ("/postal/blocklist", BlockRuleSchema.array());
}

export async function createBlockRule(payload: {
  scope: "mailbox" | "workspace";
  mailboxId?: string;
  workspaceId?: string;
  pattern: string;
}): Promise<BlockRule> {
  return fetchJsonZ("/postal/blocklist", BlockRuleSchema, {
    method: "POST",
    body: JSON.stringify({
      scope: payload.scope,
      mailbox_id: payload.mailboxId,
      workspace_id: payload.workspaceId,
      pattern: payload.pattern,
    }),
  });
}

export async function deleteBlockRule(id: string): Promise<void> {
  await apiFetch(`/postal/blocklist/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * Unread count for one mailbox's Inbox. The stats endpoint's `unread` is not
 * folder-filtered (it includes unread sent mail), so the badge reads the
 * X-Total of a filtered list instead.
 */
export async function fetchUnreadInboxCount(mailboxId: string): Promise<number> {
  const response = await apiFetch(
    `/postal/emails?mailbox_id=${encodeURIComponent(mailboxId)}&folder=inbox&is_read=false&take=1`,
  );
  return parseInt(response.headers.get("x-total") || "0", 10);
}

export async function fetchFlywheelApps(workspaceId: string): Promise<FlywheelOwnerApp[]> {
  return fetchJsonZ(`/flywheel/workspaces/${encodeURIComponent(workspaceId)}/apps`, FlywheelOwnerAppSchema.array());
}

export async function fetchFlywheelStorageQuota(workspaceId: string): Promise<FlywheelStorageQuota> {
  return fetchJsonZ(`/flywheel/workspaces/${encodeURIComponent(workspaceId)}/quota`, FlywheelStorageQuotaSchema);
}

export async function fetchFlywheelBlobs(workspaceId: string, appId: string): Promise<FlywheelOwnerBlob[]> {
  return fetchJsonZ(`/flywheel/workspaces/${encodeURIComponent(workspaceId)}/apps/${encodeURIComponent(appId)}/management/blobs`, FlywheelOwnerBlobSchema.array());
}

export async function fetchFlywheelAudit(workspaceId: string, appId: string): Promise<FlywheelAuditEntry[]> {
  return fetchJsonZ(`/flywheel/workspaces/${encodeURIComponent(workspaceId)}/apps/${encodeURIComponent(appId)}/management/audit`, FlywheelAuditEntrySchema.array());
}

export async function deleteFlywheelBlob(workspaceId: string, appId: string, blobId: string): Promise<void> {
  await apiFetch(`/flywheel/workspaces/${encodeURIComponent(workspaceId)}/apps/${encodeURIComponent(appId)}/management/blobs/${encodeURIComponent(blobId)}`, { method: "DELETE" });
}

export async function fetchWorkspacePlanStatus(slug: string): Promise<WorkspacePlanStatus> {
  return fetchJsonZ(`/valve/workspaces/${encodeURIComponent(slug)}/plan/status`, WorkspacePlanStatusSchema);
}

export async function subscribeWorkspacePlan(slug: string, plan: number): Promise<WorkspacePlanOrder> {
  return fetchJsonZ(`/valve/workspaces/${encodeURIComponent(slug)}/plan/subscribe`, WorkspacePlanOrderSchema, {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
}

export async function fetchRealms(): Promise<Realm[]> {
  return fetchJsonZ("/passport/realms", RealmSchema.array());
}

export async function createRealm(payload: {
  name: string;
  slug: string;
  description?: string;
  isPublic?: boolean;
  isCommunity?: boolean;
}): Promise<Realm> {
  return fetchJsonZ("/passport/realms", RealmSchema, {
    method: "POST",
    body: JSON.stringify(camelToSnake(payload)),
  });
}

export async function updateRealm(
  slug: string,
  payload: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  },
): Promise<Realm> {
  return fetchJsonZ(`/passport/realms/${encodeURIComponent(slug)}`, RealmSchema, {
    method: "PATCH",
    body: JSON.stringify(camelToSnake(payload)),
  });
}

export async function deleteRealm(slug: string): Promise<void> {
  await apiFetch(`/passport/realms/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}

// Realm membership
export async function joinRealm(slug: string): Promise<void> {
  await apiFetch(`/passport/realms/${encodeURIComponent(slug)}/members`, {
    method: "POST",
  });
}

export async function leaveRealm(slug: string): Promise<void> {
  await apiFetch(`/passport/realms/${encodeURIComponent(slug)}/members/me`, {
    method: "DELETE",
  });
}

export async function getMyRealmMembership(
  slug: string,
): Promise<RealmMember | null> {
  try {
    return await fetchJsonZ(
      `/passport/realms/${encodeURIComponent(slug)}/members/me`,
      RealmMemberSchema,
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      return null;
    }
    throw err;
  }
}

export async function fetchRealmMembers(
  slug: string,
  take = 50,
  offset = 0,
): Promise<{ members: RealmMember[]; total: number }> {
  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
  });
  const { data, headers } = await fetchJsonZHeaders(
    `/passport/realms/${encodeURIComponent(slug)}/members?${params.toString()}`,
    RealmMemberSchema.array(),
  );
  const total = parseInt(headers.get("x-total") || "0", 10);
  return { members: data, total };
}

// Realm invites
export async function fetchRealmInvites(): Promise<RealmInvite[]> {
  return fetchJsonZ("/passport/realms/invites", RealmInviteSchema.array());
}

export async function acceptRealmInvite(slug: string): Promise<void> {
  await apiFetch(
    `/passport/realms/invites/${encodeURIComponent(slug)}/accept`,
    {
      method: "POST",
    },
  );
}

export async function declineRealmInvite(slug: string): Promise<void> {
  await apiFetch(
    `/passport/realms/invites/${encodeURIComponent(slug)}/decline`,
    {
      method: "POST",
    },
  );
}

// Realm boost
export async function fetchRealmBoostStatus(
  slug: string,
): Promise<RealmBoostStatus> {
  return fetchJsonZ(
    `/passport/realms/${encodeURIComponent(slug)}/boost`,
    RealmBoostStatusSchema,
  );
}

export async function fetchRealmBoostLeaderboard(
  slug: string,
  take = 20,
): Promise<RealmBoostLeaderboardEntry[]> {
  return fetchJsonZ(
    `/passport/realms/${encodeURIComponent(slug)}/boost/leaderboard?take=${take}`,
    RealmBoostLeaderboardEntrySchema.array(),
  );
}

export async function boostRealm(
  slug: string,
  points: number,
  currency: string,
): Promise<void> {
  await apiFetch(`/passport/realms/${encodeURIComponent(slug)}/boost`, {
    method: "POST",
    body: JSON.stringify({ points, currency }),
  });
}

// Realm labels
export async function fetchRealmLabels(slug: string): Promise<RealmLabel[]> {
  return fetchJsonZ(
    `/passport/realms/${encodeURIComponent(slug)}/labels`,
    RealmLabelSchema.array(),
  );
}

export async function createRealmLabel(
  slug: string,
  payload: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  },
): Promise<RealmLabel> {
  return fetchJsonZ(
    `/passport/realms/${encodeURIComponent(slug)}/labels`,
    RealmLabelSchema,
    { method: "POST", body: JSON.stringify(camelToSnake(payload)) },
  );
}

export async function updateRealmLabel(
  slug: string,
  labelId: string,
  payload: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
  },
): Promise<RealmLabel> {
  return fetchJsonZ(
    `/passport/realms/${encodeURIComponent(slug)}/labels/${labelId}`,
    RealmLabelSchema,
    { method: "PATCH", body: JSON.stringify(camelToSnake(payload)) },
  );
}

export async function deleteRealmLabel(
  slug: string,
  labelId: string,
): Promise<void> {
  await apiFetch(
    `/passport/realms/${encodeURIComponent(slug)}/labels/${labelId}`,
    {
      method: "DELETE",
    },
  );
}

// Update my realm identity (nick, bio, label)
export async function updateRealmIdentity(
  slug: string,
  payload: {
    nick?: string;
    bio?: string;
    labelId?: string | null;
  },
): Promise<RealmMember> {
  return fetchJsonZ(
    `/passport/realms/${encodeURIComponent(slug)}/members/me`,
    RealmMemberSchema,
    { method: "PATCH", body: JSON.stringify(camelToSnake(payload)) },
  );
}

// Settings API - Account Management
export async function updateAccount(payload: {
  name?: string;
  nick?: string;
  language?: string;
  region?: string;
}): Promise<SnAccount> {
  return fetchJsonZ("/stargate/accounts/me", SnAccountSchema, {
    method: "PATCH",
    body: JSON.stringify(camelToSnake(payload)),
  });
}

export async function updateProfile(payload: {
  bio?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  pronouns?: string;
  location?: string;
  timeZone?: string;
  birthday?: string | null;
  pictureId?: string;
  backgroundId?: string;
  links?: { name: string; url: string }[];
}): Promise<SnAccount> {
  return fetchJsonZ("/stargate/accounts/me/profile", SnAccountSchema, {
    method: "PATCH",
    body: JSON.stringify(camelToSnake(payload)),
  });
}

export async function deleteAccount(): Promise<void> {
  await apiFetch("/stargate/accounts/me", {
    method: "DELETE",
  });
}

// Settings API - Auth Factors
export async function fetchAuthFactors(): Promise<SnAuthFactor[]> {
  return fetchJsonZ("/stargate/factors", SnAuthFactorSchema.array());
}

export async function createAuthFactor(payload: {
  type: number;
  secret?: string | null;
}): Promise<SnAuthFactor> {
  return fetchJsonZ("/stargate/factors", SnAuthFactorSchema, {
    method: "POST",
    body: JSON.stringify({ type: payload.type, secret: payload.secret ?? null }),
  });
}

export async function deleteAuthFactor(factorId: string): Promise<void> {
  await apiFetch(`/stargate/factors/${factorId}`, {
    method: "DELETE",
  });
}

export async function enableAuthFactor(
  factorId: string,
  verificationCode?: string,
): Promise<SnAuthFactor> {
  return fetchJsonZ(`/stargate/factors/${factorId}/enable`, SnAuthFactorSchema, {
    method: "POST",
    body: verificationCode ? JSON.stringify(verificationCode) : undefined,
  });
}

export async function disableAuthFactor(factorId: string): Promise<void> {
  await apiFetch(`/stargate/factors/${factorId}/disable`, {
    method: "POST",
  });
}

// Settings API - Contact Methods
export async function fetchContactMethods(): Promise<SnContactMethod[]> {
  return fetchJsonZ("/stargate/contacts", SnContactMethodSchema.array());
}

export async function createContactMethod(payload: {
  type: number;
  content: string;
}): Promise<SnContactMethod> {
  return fetchJsonZ("/stargate/contacts", SnContactMethodSchema, {
    method: "POST",
    body: JSON.stringify(camelToSnake(payload)),
  });
}

export async function deleteContactMethod(contactId: string): Promise<void> {
  await apiFetch(`/stargate/contacts/${contactId}`, {
    method: "DELETE",
  });
}

export async function verifyContactMethod(contactId: string): Promise<void> {
  await apiFetch(`/stargate/contacts/${contactId}/verify`, {
    method: "POST",
  });
}

export async function setPrimaryContactMethod(
  contactId: string,
): Promise<void> {
  await apiFetch(`/stargate/contacts/${contactId}/primary`, {
    method: "POST",
  });
}

export async function makeContactPublic(contactId: string): Promise<void> {
  await apiFetch(`/stargate/contacts/${contactId}/public`, {
    method: "POST",
  });
}

export async function makeContactPrivate(contactId: string): Promise<void> {
  await apiFetch(`/stargate/contacts/${contactId}/public`, {
    method: "DELETE",
  });
}

// Settings API - Account Connections
export async function fetchAccountConnections(): Promise<
  SnAccountConnection[]
> {
  return fetchJsonZ("/stargate/connections", SnAccountConnectionSchema.array());
}

export async function deleteAccountConnection(
  connectionId: string,
): Promise<void> {
  await apiFetch(`/stargate/connections/${connectionId}`, {
    method: "DELETE",
  });
}

export function getConnectionAuthUrl(provider: string): string {
  return `${API_BASE_URL}/stargate/auth/login/${provider.toLowerCase()}`;
}

// Settings API - Auth Devices & Sessions
export async function fetchAuthDevices(): Promise<SnAuthDevice[]> {
  const raw = await fetchJsonZ(
    "/stargate/devices",
    z.array(z.object({ sessions: z.array(SnAuthSessionSchema) })),
  );

  return raw.map((item) => {
    const sessions = item.sessions ?? [];
    const client = sessions.find((s) => s.client)?.client;
    const isCurrent = sessions.some((s) => s.isCurrent);

    return {
      deviceId: client?.deviceId ?? sessions[0]?.clientId ?? "unknown",
      deviceName: client?.deviceName ?? "Unknown Device",
      deviceLabel: client?.deviceLabel ?? undefined,
      platform: client?.platform ?? 0,
      isCurrent,
      sessions,
    };
  });
}

export async function fetchAuthSessions(
  type?: number,
): Promise<SnAuthSession[]> {
  const params = new URLSearchParams();
  if (type !== undefined) params.set("type", String(type));
  params.set("include_children", "false");
  return fetchJsonZ(
    `/stargate/sessions?${params.toString()}`,
    SnAuthSessionSchema.array(),
  );
}

export async function fetchSessionChildren(
  parentId: string,
): Promise<SnAuthSession[]> {
  const data = await fetchJsonZ(
    `/stargate/sessions/${parentId}/children`,
    z.object({ items: z.array(SnAuthSessionSchema) }),
  );
  return data.items;
}

export async function revokeDevice(deviceId: string): Promise<void> {
  await apiFetch(`/stargate/devices/${deviceId}`, {
    method: "DELETE",
  });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await apiFetch(`/stargate/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export async function revokeAllOtherSessions(): Promise<void> {
  await apiFetch("/stargate/sessions/others", {
    method: "DELETE",
  });
}

export async function updateDeviceLabel(
  deviceId: string,
  label: string,
): Promise<void> {
  await apiFetch(`/stargate/devices/${deviceId}/label`, {
    method: "PATCH",
    body: JSON.stringify({ label }),
  });
}

// Settings API - Publishing (matches Island sphere.getPublishingSettings)
const SnPublishingSettingsSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  defaultPostingPublisherId: z.string().nullable().optional(),
  defaultReplyPublisherId: z.string().nullable().optional(),
  defaultFediversePublisherId: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().nullable().optional(),
});
export type SnPublishingSettings = z.infer<typeof SnPublishingSettingsSchema>;

export async function fetchPublishingSettings(): Promise<SnPublishingSettings> {
  return fetchJsonZ("/sphere/account/publishing", SnPublishingSettingsSchema);
}

export async function updatePublishingSettings(payload: {
  defaultPostingPublisherId?: string | null;
  defaultReplyPublisherId?: string | null;
  defaultFediversePublisherId?: string | null;
}): Promise<SnPublishingSettings> {
  return fetchJsonZ("/sphere/account/publishing", SnPublishingSettingsSchema, {
    method: "PATCH",
    body: JSON.stringify(camelToSnake(payload)),
  });
}

// Settings API - Notification preferences (matches Island notifications API)
/** 0 = normal, 1 = silent, 2 = reject */
export type SnNotificationPreferenceLevel = 0 | 1 | 2;

export interface SnNotificationTopic {
  topic: string;
  description: string;
}

const SnNotificationPreferenceSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  topic: z.string(),
  preference: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type SnNotificationPreference = z.infer<typeof SnNotificationPreferenceSchema>;

/** Default topics from Island NotificationsApi._defaultTopics */
export const DEFAULT_NOTIFICATION_TOPICS: SnNotificationTopic[] = [
  { topic: "posts.mentions.new", description: "Post mentions" },
  { topic: "post.replies", description: "Post replies" },
  { topic: "posts.reactions.new", description: "New reactions" },
  { topic: "posts.awards.new", description: "Post awards" },
  {
    topic: "subscriptions.discontinued_in_app",
    description: "Subscription discontinued",
  },
  { topic: "subscriptions.begun", description: "Subscription started" },
  { topic: "gifts.claimed", description: "Gift claimed" },
  { topic: "wallets.transactions", description: "Wallet transactions" },
  { topic: "auth.verification", description: "Auth verification" },
  { topic: "invites.realms", description: "Realm invites" },
];

export async function fetchNotificationPreferences(): Promise<
  SnNotificationPreference[]
> {
  return fetchJsonZ(
    "/ring/notifications/preferences",
    SnNotificationPreferenceSchema.array(),
  );
}

export async function setNotificationPreference(
  topic: string,
  preference: SnNotificationPreferenceLevel,
): Promise<void> {
  await apiFetch(
    `/ring/notifications/preferences/${encodeURIComponent(topic)}`,
    {
      method: "PUT",
      body: JSON.stringify({ preference }),
    },
  );
}

export async function deleteNotificationPreference(
  topic: string,
): Promise<void> {
  await apiFetch(
    `/ring/notifications/preferences/${encodeURIComponent(topic)}`,
    { method: "DELETE" },
  );
}

export async function addCustomNotificationTopic(
  topic: string,
  description: string,
): Promise<void> {
  await apiFetch("/ring/notifications/topics", {
    method: "POST",
    body: JSON.stringify({ topic, description }),
  });
}

// Categories API
const PostCategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  usage: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PostCategory = z.infer<typeof PostCategorySchema>;

const PostTagSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string().nullable(),
  usage: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PostTag = z.infer<typeof PostTagSchema>;

const CategorySubscriptionSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  accountId: z.string(),
  createdAt: z.string(),
});
export type CategorySubscription = z.infer<typeof CategorySubscriptionSchema>;

export async function fetchCategories(
  take = 20,
  offset = 0,
): Promise<{ categories: PostCategory[]; total: number }> {
  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
  });

  const { data, headers } = await fetchJsonZHeaders(
    `/sphere/posts/categories?${params.toString()}`,
    PostCategorySchema.array(),
    { skipAuth: true },
  );

  const total = parseInt(headers.get("x-total") || "0", 10);
  return { categories: data, total };
}

export async function fetchCategory(slug: string): Promise<PostCategory> {
  return fetchJsonZ(`/sphere/posts/categories/${slug}`, PostCategorySchema, {
    skipAuth: true,
  });
}

export async function fetchCategorySubscription(
  slug: string,
): Promise<CategorySubscription | null> {
  try {
    return await fetchJsonZ(
      `/sphere/posts/categories/${slug}/subscription`,
      CategorySubscriptionSchema,
    );
  } catch {
    return null;
  }
}

export async function subscribeToCategory(slug: string): Promise<void> {
  await apiFetch(`/sphere/posts/categories/${slug}/subscribe`, {
    method: "POST",
  });
}

export async function unsubscribeFromCategory(slug: string): Promise<void> {
  await apiFetch(`/sphere/posts/categories/${slug}/unsubscribe`, {
    method: "POST",
  });
}

export async function fetchTags(
  take = 20,
  offset = 0,
): Promise<{ tags: PostTag[]; total: number }> {
  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
  });

  const { data, headers } = await fetchJsonZHeaders(
    `/sphere/posts/tags?${params.toString()}`,
    PostTagSchema.array(),
    { skipAuth: true },
  );

  const total = parseInt(headers.get("x-total") || "0", 10);
  return { tags: data, total };
}

export async function fetchTag(slug: string): Promise<PostTag> {
  return fetchJsonZ(`/sphere/posts/tags/${slug}`, PostTagSchema, {
    skipAuth: true,
  });
}

export async function fetchTagSubscription(
  slug: string,
): Promise<CategorySubscription | null> {
  try {
    return await fetchJsonZ(
      `/sphere/posts/tags/${slug}/subscription`,
      CategorySubscriptionSchema,
    );
  } catch {
    return null;
  }
}

export async function subscribeToTag(slug: string): Promise<void> {
  await apiFetch(`/sphere/posts/tags/${slug}/subscribe`, {
    method: "POST",
  });
}

export async function unsubscribeFromTag(slug: string): Promise<void> {
  await apiFetch(`/sphere/posts/tags/${slug}/unsubscribe`, {
    method: "POST",
  });
}

export async function fetchPostsByCategory(
  slug: string,
  take = 20,
  offset = 0,
): Promise<{ posts: Post[]; total: number }> {
  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
    categories: slug,
  });

  const { data, headers } = await fetchJsonZHeaders(
    `/sphere/posts?${params.toString()}`,
    PostSchema.array(),
    { skipAuth: true },
  );

  const total = parseInt(headers.get("x-total") || "0", 10);
  return { posts: data, total };
}

export async function fetchPostsByTag(
  slug: string,
  take = 20,
  offset = 0,
): Promise<{ posts: Post[]; total: number }> {
  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
    tags: slug,
  });

  const { data, headers } = await fetchJsonZHeaders(
    `/sphere/posts?${params.toString()}`,
    PostSchema.array(),
    { skipAuth: true },
  );

  const total = parseInt(headers.get("x-total") || "0", 10);
  return { posts: data, total };
}

// Check-In / Fortune API
export interface FortuneReport {
  version: number;
  poem: string;
  summary: string;
  summaryDetail: string | null;
  wish: string;
  love: string;
  study: string;
  career: string;
  health: string;
  lostItem: string;
  luckyColor: string;
  luckyDirection: string;
  luckyTime: string;
  luckyItem: string;
  luckyAction: string;
  avoidAction: string;
  ritual: string;
}

export interface FortuneTip {
  isPositive: boolean;
  title: string;
  content: string;
}

export interface CheckInResult {
  id: string;
  level: number;
  tips: FortuneTip[];
  fortuneReport: FortuneReport | null;
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

export async function getCheckInResultToday(): Promise<CheckInResult | null> {
  try {
    const response = await apiFetch("/passport/accounts/me/check-in?version=2");
    return safeJsonParse<CheckInResult>(response);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function performCheckIn(
  captchaToken?: string,
): Promise<CheckInResult> {
  const body = captchaToken
    ? JSON.stringify({ captcha_token: captchaToken })
    : undefined;
  const response = await apiFetch("/passport/accounts/me/check-in?version=2", {
    method: "POST",
    body,
  });
  return safeJsonParse<CheckInResult>(response);
}

// Event Calendar API
export interface EventCalendarEntry {
  date: string;
  checkInResult: CheckInResult | null;
}

export async function fetchEventCalendar(
  year: number,
  month: number,
  username?: string,
): Promise<EventCalendarEntry[]> {
  const path = username
    ? `/passport/accounts/${encodeURIComponent(username)}/calendar`
    : "/passport/accounts/me/calendar";
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
    includeNotableDays: "false",
  });
  const response = await apiFetch(`${path}?${params.toString()}`);
  return safeJsonParse<EventCalendarEntry[]>(response);
}

// Drive API
import type {
  SnCloudFile,
  SnFilePool,
  SnStorageNode,
  CreateDriveNodePayload,
  CreateDriveNodeResponse,
  UpdateDriveNodePayload,
  DriveUsage,
  DriveQuota,
  DriveFilePermission,
  PaginatedResult,
} from "~/types/drive";

export async function fetchDriveRootChildren(
  options: {
    query?: string;
    order?: string;
    orderDesc?: boolean;
    poolId?: string;
    usage?: string;
    applicationType?: string;
    take?: number;
    offset?: number;
  } = {},
): Promise<PaginatedResult<SnCloudFile>> {
  const params = new URLSearchParams();
  if (options.query) params.set("query", options.query);
  if (options.order) params.set("order", options.order);
  if (options.orderDesc !== undefined)
    params.set("orderDesc", String(options.orderDesc));
  if (options.poolId) params.set("pool", options.poolId);
  if (options.usage) params.set("usage", options.usage);
  if (options.applicationType)
    params.set("applicationType", options.applicationType);
  if (options.take) params.set("take", String(options.take));
  if (options.offset) params.set("offset", String(options.offset));

  const qs = params.toString();
  const endpoint = `/drive/files/root/children${qs ? `?${qs}` : ""}`;
  const response = await apiFetch(endpoint);
  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<SnCloudFile[]>(response);
  return { items: data, totalCount: total };
}

export async function fetchDriveFolderChildren(
  folderId: string,
  options: {
    query?: string;
    order?: string;
    orderDesc?: boolean;
    poolId?: string;
    usage?: string;
    applicationType?: string;
    take?: number;
    offset?: number;
  } = {},
): Promise<PaginatedResult<SnCloudFile>> {
  const params = new URLSearchParams();
  if (options.query) params.set("query", options.query);
  if (options.order) params.set("order", options.order);
  if (options.orderDesc !== undefined)
    params.set("orderDesc", String(options.orderDesc));
  if (options.poolId) params.set("pool", options.poolId);
  if (options.usage) params.set("usage", options.usage);
  if (options.applicationType)
    params.set("applicationType", options.applicationType);
  if (options.take) params.set("take", String(options.take));
  if (options.offset) params.set("offset", String(options.offset));

  const qs = params.toString();
  const endpoint = `/drive/files/${folderId}/children${qs ? `?${qs}` : ""}`;
  const response = await apiFetch(endpoint);
  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<SnCloudFile[]>(response);
  return { items: data, totalCount: total };
}

export async function fetchDriveFileInfo(fileId: string): Promise<SnCloudFile> {
  const response = await apiFetch(`/drive/files/${fileId}/info`);
  return safeJsonParse<SnCloudFile>(response);
}

export async function fetchDriveFilePermissions(
  fileId: string,
): Promise<DriveFilePermission[]> {
  const response = await apiFetch(`/drive/files/${fileId}/permissions`);
  return safeJsonParse<DriveFilePermission[]>(response);
}

export async function createDriveFolder(options: {
  name: string;
  parentId?: string | null;
  poolId?: string | null;
}): Promise<SnCloudFile> {
  const body: Record<string, unknown> = { name: options.name };
  if (options.parentId) body.parent_id = options.parentId;
  if (options.poolId) body.pool_id = options.poolId;
  const response = await apiFetch("/drive/files/folders", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return safeJsonParse<SnCloudFile>(response);
}

export async function renameDriveFile(
  fileId: string,
  newName: string,
): Promise<SnCloudFile> {
  const response = await apiFetch(`/drive/files/${fileId}`, {
    method: "PATCH",
    body: JSON.stringify({ name: newName }),
  });
  return safeJsonParse<SnCloudFile>(response);
}

export async function moveDriveFile(
  fileId: string,
  parentId: string | null,
  indexed?: boolean,
): Promise<SnCloudFile> {
  const body: Record<string, unknown> = { parent_id: parentId };
  if (indexed !== undefined) body.indexed = indexed;
  const response = await apiFetch(`/drive/files/${fileId}/move`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return safeJsonParse<SnCloudFile>(response);
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  await apiFetch(`/drive/files/${fileId}`, { method: "DELETE" });
}

export async function batchDeleteDriveFiles(
  fileIds: string[],
): Promise<number> {
  const response = await apiFetch("/drive/files/batch", {
    method: "DELETE",
    body: JSON.stringify({ ids: fileIds }),
  });
  const data = await safeJsonParse<{ count: number }>(response);
  return data.count;
}

export async function updateDriveFileSensitiveMarks(
  fileId: string,
  marks: string[],
): Promise<SnCloudFile> {
  const response = await apiFetch(`/drive/files/${fileId}/sensitive`, {
    method: "PATCH",
    body: JSON.stringify({ marks }),
  });
  return safeJsonParse<SnCloudFile>(response);
}

export async function updateDriveFileUserMeta(
  fileId: string,
  meta: Record<string, unknown>,
): Promise<SnCloudFile> {
  const response = await apiFetch(`/drive/files/${fileId}/meta`, {
    method: "PATCH",
    body: JSON.stringify({ meta }),
  });
  return safeJsonParse<SnCloudFile>(response);
}

export async function fetchDriveUsage(): Promise<DriveUsage> {
  const response = await apiFetch("/drive/billing/usage");
  return safeJsonParse<DriveUsage>(response);
}

export async function fetchDriveQuota(): Promise<DriveQuota> {
  const response = await apiFetch("/drive/billing/quota");
  return safeJsonParse<DriveQuota>(response);
}

export async function fetchDrivePools(): Promise<SnFilePool[]> {
  const response = await apiFetch("/drive/pools");
  return safeJsonParse<SnFilePool[]>(response);
}

export async function fetchDriveNodes(): Promise<SnStorageNode[]> {
  const response = await apiFetch("/drive/nodes");
  return safeJsonParse<SnStorageNode[]>(response);
}

export async function createDriveNode(
  payload: CreateDriveNodePayload,
): Promise<CreateDriveNodeResponse> {
  const response = await apiFetch("/drive/nodes", {
    method: "POST",
    body: JSON.stringify(camelToSnake(payload)),
  });
  return safeJsonParse<CreateDriveNodeResponse>(response);
}

export async function updateDriveNode(
  nodeId: string,
  payload: UpdateDriveNodePayload,
): Promise<SnStorageNode> {
  const response = await apiFetch(`/drive/nodes/${encodeURIComponent(nodeId)}`, {
    method: "PATCH",
    body: JSON.stringify(camelToSnake(payload)),
  });
  return safeJsonParse<SnStorageNode>(response);
}

export async function deleteDriveNode(nodeId: string): Promise<void> {
  await apiFetch(`/drive/nodes/${encodeURIComponent(nodeId)}`, {
    method: "DELETE",
  });
}

export async function fetchDriveUnindexedFiles(
  options: {
    poolId?: string;
    recycled?: boolean;
    query?: string;
    order?: string;
    orderDesc?: boolean;
    usage?: string;
    applicationType?: string;
    take?: number;
    offset?: number;
  } = {},
): Promise<PaginatedResult<SnCloudFile>> {
  const params = new URLSearchParams();
  if (options.poolId) params.set("pool", options.poolId);
  if (options.recycled !== undefined)
    params.set("recycled", String(options.recycled));
  if (options.query) params.set("query", options.query);
  if (options.order) params.set("order", options.order);
  if (options.orderDesc !== undefined)
    params.set("orderDesc", String(options.orderDesc));
  if (options.usage) params.set("usage", options.usage);
  if (options.applicationType)
    params.set("applicationType", options.applicationType);
  if (options.take) params.set("take", String(options.take));
  if (options.offset) params.set("offset", String(options.offset));

  const qs = params.toString();
  const endpoint = `/drive/files/unindexed${qs ? `?${qs}` : ""}`;
  const response = await apiFetch(endpoint);
  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<SnCloudFile[]>(response);
  return { items: data, totalCount: total };
}

export async function uploadDriveFile(
  file: File,
  options: {
    parentId?: string | null;
    poolId?: string | null;
    usage?: string;
    applicationType?: string;
  } = {},
): Promise<SnCloudFile> {
  const formData = new FormData();
  formData.append("file", file);
  if (options.parentId) formData.append("parent_id", options.parentId);
  if (options.poolId) formData.append("pool_id", options.poolId);
  if (options.usage) formData.append("usage", options.usage);
  if (options.applicationType)
    formData.append("application_type", options.applicationType);

  // Same-origin proxy upload: the proxy injects the session Bearer and strips
  // any backend cookie. The browser sends the `sid` cookie natively.
  const url = `/api/proxy/drive/files/upload/direct`;
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await parseResponse(response);
    throw ApiError.fromBody(response.status, errorData);
  }

  return safeJsonParse<SnCloudFile>(response);
}

export async function deleteDriveRecycledFiles(): Promise<number> {
  const response = await apiFetch("/drive/files/recycled", {
    method: "DELETE",
  });
  const data = await safeJsonParse<{ count: number }>(response);
  return data.count;
}

export interface DriveBreadcrumb {
  id: string;
  name: string;
  parentId: string | null;
  isFolder: boolean;
}

export async function fetchDriveBreadcrumb(
  fileId: string,
): Promise<DriveBreadcrumb[]> {
  const response = await apiFetch(`/drive/files/${fileId}/breadcrumb`);
  return safeJsonParse<DriveBreadcrumb[]>(response);
}

export interface WopiEditSession {
  actionUrl: string;
  action: string;
  method: string;
  formFields: Record<string, string>;
  wopiSrc: string;
  expiresAt: string;
}

export async function createWopiEditSession(
  fileId: string,
): Promise<WopiEditSession> {
  const response = await apiFetch(`/drive/files/${fileId}/edit`, {
    method: "POST",
  });
  return safeJsonParse<WopiEditSession>(response);
}

const OFFICE_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
  "application/vnd.openxmlformats-officedocument.presentationml.template",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
];

export function isOfficeFile(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  return OFFICE_MIME_TYPES.includes(mimeType);
}

// Chat API
import type { SnChatRoom } from "~/types/chat";

export async function fetchChatRoomBySlug(
  scope: string,
  slug: string,
): Promise<SnChatRoom | null> {
  const response = await apiFetch(
    `/messager/chat/public/${encodeURIComponent(scope)}/${encodeURIComponent(slug)}`,
  );
  if (response.status === 404) return null;
  const data = await safeJsonParse<SnChatRoom>(response);
  return snakeToCamel(data) as SnChatRoom;
 }

export async function fetchChatRooms(take = 20): Promise<SnChatRoom[]> {
  const response = await apiFetch(
    `/messager/chat/rooms?offset=0&take=${take}`,
  );
  const data = await safeJsonParse<SnChatRoom[]>(response);
  return (data ?? []).map((room) => snakeToCamel(room)) as SnChatRoom[];
}

// Device Authorization Flow (RFC 8628)
export interface DeviceCodeStatus {
  userCode: string;
  clientId: string;
  clientName?: string;
  picture?: { id?: string };
  scopes: string[];
  status: "pending" | "approved" | "declined" | "expired";
  expiresAt: string;
}

export async function getDeviceCodeStatus(
  userCode: string,
): Promise<DeviceCodeStatus> {
  const response = await apiFetch(
    `/stargate/auth/open/device/code/${encodeURIComponent(userCode)}`,
    { skipAuth: true },
  );
  return safeJsonParse<DeviceCodeStatus>(response);
}

export async function approveDeviceCode(userCode: string): Promise<void> {
  await apiFetch(
    `/stargate/auth/open/device/code/${encodeURIComponent(userCode)}/approve`,
    { method: "POST" },
  );
}

export async function declineDeviceCode(userCode: string): Promise<void> {
  await apiFetch(
    `/stargate/auth/open/device/code/${encodeURIComponent(userCode)}/decline`,
    { method: "POST" },
  );
}
