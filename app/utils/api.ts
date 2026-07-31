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
} from "~/types/auth";

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
  SnTimelineEvent,
  TimelineResult,
} from "~/types/post";
import type {
  Realm,
  RealmMember,
  RealmLabel,
  RealmBoostStatus,
  RealmBoostLeaderboardEntry,
  RealmInvite,
  RealmChatRoom,
} from "~/types/realm";
import type { FlywheelAuditEntry, FlywheelOwnerApp, FlywheelOwnerBlob, Workspace, WorkspaceMailbox, WorkspaceMailCredential, WorkspaceMailCredentialCreated, WorkspaceMember, WorkspacePlanOrder, WorkspacePlanStatus } from "~/types/workspace";

import { snakeToCamel, camelToSnake } from "~/utils/case";
import {
  getValidToken,
  readTokenPair,
  refreshAccessToken,
  type StoredTokenPair,
} from "~/utils/token";

// Re-export types for convenience
export type { SpellInfo };

// Global API configuration
export const API_BASE = "api.solian.app";
export const API_BASE_URL = `https://${API_BASE}`;

// Helper to build API URL
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}

// Auth mode detection
// - 'cookie': Production mode - uses HttpOnly cookies set by backend
// - 'bearer': Development mode - uses localStorage + Authorization header
export function getAuthMode(): "cookie" | "bearer" {
  if (import.meta.server) return "cookie";
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" ? "bearer" : "cookie";
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

async function getAuthToken(): Promise<string | null> {
  if (import.meta.server) return null;
  if (getAuthMode() === "cookie") return null;
  return getValidToken(API_BASE_URL);
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
  const url = `${API_BASE_URL}${endpoint}`;
  const { skipAuth = false, retryCount = 0, ...fetchOptions } = options;
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

  // SSR: Forward cookies from incoming request
  if (import.meta.server) {
    const requestHeaders = useRequestHeaders(["cookie"]);
    if (requestHeaders.cookie) {
      headers["cookie"] = requestHeaders.cookie;
    }
  }

  // Client bearer mode: Add Authorization header
  if (!skipAuth && import.meta.client && getAuthMode() === "bearer") {
    const token = await getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Client cookie mode: Include credentials for cookies
  const credentials =
    import.meta.client && getAuthMode() === "cookie" ? "include" : undefined;

  const response = await fetch(url, { ...fetchOptions, headers, credentials });

  // Handle 401 Unauthorized
  if (response.status === 401 && !skipAuth && retryCount < 1) {
    // Skip session expiration handling on localhost (dev mode)
    if (import.meta.client && window.location.hostname === "localhost") {
      return response;
    }

    const mode = getAuthMode();

    if (mode === "cookie") {
      // Cookie mode: Call refresh endpoint (uses HttpOnly refresh cookie)
      try {
        const refreshResponse = await fetch(
          `${API_BASE_URL}/padlock/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (refreshResponse.ok) {
          return apiFetch(endpoint, { ...options, retryCount: retryCount + 1 });
        }
      } catch {
        // Refresh failed, proceed to logout
      }
    } else {
      // Bearer mode: Use localStorage refresh token
      const tokenPair = readTokenPair();
      if (tokenPair?.refreshToken) {
        const refreshed = await refreshAccessToken(API_BASE_URL, tokenPair);
        if (refreshed) {
          return apiFetch(endpoint, { ...options, retryCount: retryCount + 1 });
        }
      }
    }

    // Refresh failed - clear auth state
    if (import.meta.client) {
      const auth = useAuth();
      auth.logout();
    }
    throw new Error("Session expired. Please login again.");
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

// Auth API
export async function createChallenge(
  account: string,
  deviceInfo: Record<string, unknown>,
): Promise<SnAuthChallenge> {
  const response = await apiFetch("/padlock/auth/challenge", {
    method: "POST",
    body: JSON.stringify({ account, ...deviceInfo }),
    skipAuth: true,
  });
  return safeJsonParse<SnAuthChallenge>(response);
}

export async function getFactors(challengeId: string): Promise<SnAuthFactor[]> {
  const response = await apiFetch(
    `/padlock/auth/challenge/${challengeId}/factors`,
    { skipAuth: true },
  );
  return safeJsonParse<SnAuthFactor[]>(response);
}

export async function getChallenge(
  challengeId: string,
): Promise<SnAuthChallenge> {
  const response = await apiFetch(`/padlock/auth/challenge/${challengeId}`, {
    skipAuth: true,
  });
  return safeJsonParse<SnAuthChallenge>(response);
}

export async function requestFactorCode(
  challengeId: string,
  factorId: string,
): Promise<unknown> {
  const response = await apiFetch(
    `/padlock/auth/challenge/${challengeId}/factors/${factorId}`,
    {
      method: "POST",
      skipAuth: true,
    },
  );
  return safeJsonParse<unknown>(response);
}

export interface PasskeyAuthenticationOptions {
  challenge: string;
  rpId: string;
  allowCredentials: { type: string; id: string; transports?: string[] }[];
  userVerification: string;
  timeout?: number;
  /** Present for discoverable (username-less) passkey login. */
  authChallengeId?: string;
}

export interface PasskeyRegistrationOptions {
  challenge: string;
  rpId: string;
  rpName: string;
  userId: string;
  userName: string;
  displayName: string;
  pubKeyCredParams: { type: string; alg: number }[];
  timeout?: number;
  authenticatorSelection?: {
    authenticatorAttachment?: string;
    residentKey?: string;
    userVerification?: string;
  };
}

/** Account-known challenge: start WebAuthn assertion for a username login. */
export async function startPasskeyAuthentication(
  challengeId: string,
): Promise<PasskeyAuthenticationOptions> {
  const response = await apiFetch(
    `/padlock/auth/challenge/${challengeId}/passkey/start`,
    {
      method: "POST",
      skipAuth: true,
    },
  );
  // safeJsonParse already converts snake_case → camelCase
  const data = await safeJsonParse<PasskeyAuthenticationOptions>(response);
  return {
    challenge: data.challenge,
    rpId: data.rpId,
    allowCredentials: data.allowCredentials ?? [],
    userVerification: data.userVerification ?? "preferred",
    timeout: data.timeout,
  };
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
  const response = await apiFetch(
    `/padlock/auth/challenge/${challengeId}/passkey/complete`,
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
  return safeJsonParse<SnAuthChallenge>(response);
}

/** Discoverable (resident) passkey login without a username. */
export async function startDiscoverablePasskeyAuthentication(payload: {
  deviceId: string;
  deviceName: string;
  platform?: number;
  audiences?: string[];
  scopes?: string[];
}): Promise<PasskeyAuthenticationOptions> {
  const response = await apiFetch("/padlock/auth/passkey/start", {
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
  const data = await safeJsonParse<PasskeyAuthenticationOptions>(response);
  return {
    challenge: data.challenge,
    rpId: data.rpId,
    allowCredentials: data.allowCredentials ?? [],
    userVerification: data.userVerification ?? "preferred",
    timeout: data.timeout,
    authChallengeId: data.authChallengeId,
  };
}

export async function completeDiscoverablePasskeyAuthentication(
  challengeId: string,
  credentialId: string,
  clientDataJson: string,
  authenticatorData: string,
  signature: string,
  userHandle?: string | null,
): Promise<SnAuthChallenge> {
  const response = await apiFetch(
    `/padlock/auth/passkey/${challengeId}/complete`,
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
  return safeJsonParse<SnAuthChallenge>(response);
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
  const response = await apiFetch("/padlock/auth/qr/generate", {
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
  });
  return safeJsonParse<QrLoginGenerateResponse>(response);
}

/** Poll QR challenge status (web cannot use WebSocket while unauthenticated). */
export async function getQrLoginStatus(
  qrChallengeId: string,
): Promise<QrLoginStatusResponse> {
  const response = await apiFetch(`/padlock/auth/qr/${qrChallengeId}`, {
    skipAuth: true,
  });
  return safeJsonParse<QrLoginStatusResponse>(response);
}

/** Start WebAuthn registration (requires enabled Passkey factor). */
export async function startPasskeyRegistration(payload: {
  deviceId: string;
  deviceName?: string;
  rpId: string;
  rpName: string;
}): Promise<PasskeyRegistrationOptions> {
  const response = await apiFetch("/padlock/factors/passkey/start", {
    method: "POST",
    body: JSON.stringify(camelToSnake(payload)),
  });
  return safeJsonParse<PasskeyRegistrationOptions>(response);
}

export async function completePasskeyRegistration(payload: {
  deviceId: string;
  label: string;
  clientDataJson: string;
  attestationObject: string;
}): Promise<SnPasskey> {
  const response = await apiFetch("/padlock/factors/passkey/complete", {
    method: "POST",
    body: JSON.stringify(camelToSnake(payload)),
  });
  return safeJsonParse<SnPasskey>(response);
}

export async function fetchPasskeys(): Promise<SnPasskey[]> {
  const response = await apiFetch("/padlock/factors/passkey");
  return safeJsonParse<SnPasskey[]>(response);
}

export async function updatePasskey(
  passkeyId: string,
  label: string,
): Promise<SnPasskey> {
  const response = await apiFetch(`/padlock/factors/passkey/${passkeyId}`, {
    method: "PATCH",
    body: JSON.stringify({ label }),
  });
  return safeJsonParse<SnPasskey>(response);
}

export async function deletePasskey(passkeyId: string): Promise<void> {
  await apiFetch(`/padlock/factors/passkey/${passkeyId}`, {
    method: "DELETE",
  });
}

export async function verifyChallenge(
  challengeId: string,
  factorId: string,
  password: string,
): Promise<SnAuthChallenge> {
  const response = await apiFetch(`/padlock/auth/challenge/${challengeId}`, {
    method: "PATCH",
    body: JSON.stringify(camelToSnake({ factorId, password })),
    skipAuth: true,
  });
  return safeJsonParse<SnAuthChallenge>(response);
}

export async function getToken(code: string): Promise<SnAuthToken> {
  const response = await apiFetch("/padlock/auth/token", {
    method: "POST",
    body: JSON.stringify({ grant_type: "authorization_code", code }),
    skipAuth: true,
  });

  const data = await safeJsonParse<{
    token: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_expires_in?: number;
  }>(response);

  // Only store in localStorage for dev mode (bearer auth)
  // Production uses HttpOnly cookies set by backend
  if (getAuthMode() === "bearer") {
    setTokenFromResponse(
      data.token,
      data.refresh_token,
      data.expires_in,
      data.refresh_expires_in,
    );
  }

  return {
    token: data.token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    refreshExpiresIn: data.refresh_expires_in,
  };
}

export async function refreshApiAccessToken(
  refreshToken: string,
): Promise<StoredTokenPair | null> {
  try {
    const response = await apiFetch("/padlock/auth/token", {
      method: "POST",
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      skipAuth: true,
    });

    const data = await safeJsonParse<{
      token: string;
      refresh_token?: string;
      expires_in?: number;
      refresh_expires_in?: number;
    }>(response);

    setTokenFromResponse(
      data.token,
      data.refresh_token,
      data.expires_in,
      data.refresh_expires_in,
    );

    return readTokenPair();
  } catch (err) {
    console.error("Token refresh failed:", err);
    return null;
  }
}

export async function getUserInfo(): Promise<SnAccount> {
  const response = await apiFetch("/passport/accounts/me");
  return safeJsonParse<SnAccount>(response);
}

// Cookie-mode auth helpers
export async function logoutApi(): Promise<void> {
  await apiFetch("/padlock/auth/logout", { method: "POST", skipAuth: true });
}

export async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/padlock/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
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
  const response = await apiFetch("/padlock/accounts", {
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
  const response = await apiFetch("/padlock/accounts/recovery/password", {
    method: "POST",
    body: JSON.stringify(camelToSnake({ account, captchaToken })),
    skipAuth: true,
  });
  return safeJsonParse<unknown>(response);
}

export async function getCaptchaConfig(): Promise<CaptchaConfig> {
  const response = await apiFetch("/padlock/auth/captcha", { skipAuth: true });
  return safeJsonParse<CaptchaConfig>(response);
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
    `/padlock/auth/open/authorize?${query.toString()}`,
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

  const response = await apiFetch("/padlock/auth/open/authorize", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
  });
  return safeJsonParse(response);
}

export async function getOrder(orderId: string): Promise<WalletOrder> {
  const response = await apiFetch(
    `/wallet/orders/${encodeURIComponent(orderId)}`,
  );
  return safeJsonParse<WalletOrder>(response);
}

export async function payOrder(
  orderId: string,
  pinCode: string,
  payerWalletId?: string,
): Promise<WalletOrder> {
  const body: Record<string, string> = { pin_code: pinCode };
  if (payerWalletId) body.payer_wallet_id = payerWalletId;
  const response = await apiFetch(
    `/wallet/orders/${encodeURIComponent(orderId)}/pay`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return safeJsonParse<WalletOrder>(response);
}

export async function fetchStoreProducts(
  appSlug: string,
): Promise<AppProduct[]> {
  const response = await apiFetch(
    `/develop/apps/${encodeURIComponent(appSlug)}/products`,
  );
  return safeJsonParse<AppProduct[]>(response);
}

export async function getSpell(spellWord: string): Promise<SpellInfo> {
  const response = await apiFetch(
    `/passport/spells/${encodeURIComponent(spellWord)}`,
  );
  return safeJsonParse<SpellInfo>(response);
}

export async function applySpell(
  spellWord: string,
  newPassword?: string,
): Promise<unknown> {
  const response = await apiFetch(
    `/passport/spells/${encodeURIComponent(spellWord)}/apply`,
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
  return `${API_BASE_URL}/padlock/auth/login/${provider.toLowerCase()}?${params}`;
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
  const response = await apiFetch(`/sphere/posts?${params.toString()}`, {
    skipAuth: !isAuthenticated.value,
  });

  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<Post[]>(response);

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
  const response = await apiFetch(`/sphere/timeline?${params.toString()}`, {
    skipAuth: !isAuthenticated.value,
  });

  const payload = (await parseResponse(response)) as Record<string, unknown>;
  const rawItems = (payload.items as unknown[]) ?? [];
  // Support both snake_case and camelCase response shapes
  const nextCursor =
    (payload.next_cursor as string | null | undefined) ??
    (payload.nextCursor as string | null | undefined) ??
    null;
  const mode = (payload.mode as string) ?? "personalized";

  const items = rawItems
    .filter(
      (e): e is Record<string, unknown> => typeof e === "object" && e !== null,
    )
    .map((e) => snakeToCamel(e) as SnTimelineEvent);

  return {
    items,
    nextCursor: nextCursor && nextCursor.length > 0 ? nextCursor : null,
    mode,
  };
}

export async function fetchFeaturedPosts(): Promise<Post[]> {
  const { isAuthenticated } = useAuth();
  const response = await apiFetch("/sphere/posts/featured", {
    skipAuth: !isAuthenticated.value,
  });
  return safeJsonParse<Post[]>(response);
}

export async function fetchPost(id: string): Promise<Post> {
  const { isAuthenticated } = useAuth();
  const response = await apiFetch(`/sphere/posts/${id}`, {
    skipAuth: !isAuthenticated.value,
  });
  return safeJsonParse<Post>(response);
}

export async function fetchPostReplies(id: string): Promise<Post[]> {
  const { isAuthenticated } = useAuth();
  const response = await apiFetch(`/sphere/posts/${id}/replies`, {
    skipAuth: !isAuthenticated.value,
  });
  return safeJsonParse<Post[]>(response);
}

export interface ThreadedReplyNode {
  post: Post;
  depth: number;
  parentId: string | null;
}

export async function fetchPostRepliesThreaded(
  id: string,
  take = 3,
  offset = 0,
): Promise<{ nodes: ThreadedReplyNode[]; total: number }> {
  const response = await apiFetch(
    `/sphere/posts/${id}/replies/threaded?offset=${offset}&take=${take}`,
    { skipAuth: true },
  );

  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data =
    await safeJsonParse<
      Array<{ post: Post; depth?: number; parent_id?: string | null }>
    >(response);

  return {
    total,
    nodes: data.map((node) => ({
      post: node.post,
      depth: node.depth ?? 0,
      parentId: node.parent_id ?? null,
    })),
  };
}

// Reactions API
export interface Reaction {
  symbol: string;
  attitude: number;
  count: number;
}

export interface PostReaction {
  id: string;
  postId: string;
  symbol: string;
  attitude: number;
  accountId?: string;
  actorId?: string;
  account?: {
    id: string;
    name: string;
    nick: string;
    profile: {
      picture?: { id: string };
    };
  };
  createdAt: string;
}

export interface Boost {
  id: string;
  postId: string;
  accountId?: string;
  actorId?: string;
  account?: {
    id: string;
    name: string;
    nick: string;
    profile: {
      picture?: { id: string };
    };
  };
  boostedAt: string;
}

export async function fetchPostReactions(postId: string): Promise<Reaction[]> {
  const response = await apiFetch(`/sphere/posts/${postId}/reactions`, {
    skipAuth: true,
  });
  return safeJsonParse<Reaction[]>(response);
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
  const response = await apiFetch(
    `/sphere/posts/${postId}/reactions?${params.toString()}`,
    {
      skipAuth: true,
    },
  );
  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<PostReaction[]>(response);
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
  const response = await apiFetch(
    `/sphere/posts/${postId}/boosts?${params.toString()}`,
    {
      skipAuth: true,
    },
  );
  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<Boost[]>(response);
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
  const response = await apiFetch(
    `/sphere/posts/${postId}/forwards?${params.toString()}`,
    {
      skipAuth: true,
    },
  );
  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<Post[]>(response);
  return { posts: data, total };
}

// Data API - Publishers
export async function fetchPublisher(name: string): Promise<Publisher> {
  const response = await apiFetch(
    `/sphere/publishers/${encodeURIComponent(name)}`,
  );
  return safeJsonParse<Publisher>(response);
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

  const response = await apiFetch(`/sphere/posts?${params.toString()}`, {
    skipAuth: true,
  });

  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<Post[]>(response);

  return { posts: data, total };
}

export async function fetchPublishers(): Promise<Publisher[]> {
  const response = await apiFetch("/sphere/publishers", { skipAuth: true });
  return safeJsonParse<Publisher[]>(response);
}

// Search API
export async function searchAccounts(
  query: string,
  take = 20,
): Promise<SnAccount[]> {
  const params = new URLSearchParams({ query, take: String(take) });
  const response = await apiFetch(
    `/passport/accounts/search?${params.toString()}`,
    { skipAuth: true },
  );
  return safeJsonParse<SnAccount[]>(response);
}

export async function searchPublishers(
  query: string,
  take = 20,
): Promise<Publisher[]> {
  const params = new URLSearchParams({ query, take: String(take) });
  const response = await apiFetch(
    `/sphere/publishers/search?${params.toString()}`,
    { skipAuth: true },
  );
  return safeJsonParse<Publisher[]>(response);
}

export async function searchRealms(query: string, take = 20): Promise<Realm[]> {
  const params = new URLSearchParams({ query, take: String(take) });
  const response = await apiFetch(
    `/passport/realms/search?${params.toString()}`,
    { skipAuth: true },
  );
  return safeJsonParse<Realm[]>(response);
}

// Data API - Accounts
export async function fetchAccount(name: string): Promise<SnAccount> {
  const response = await apiFetch(
    `/passport/accounts/${encodeURIComponent(name)}`,
    { skipAuth: true },
  );
  return safeJsonParse<SnAccount>(response);
}

export async function fetchAccountPunishment(
  name: string,
): Promise<SnAccountPunishment | null> {
  try {
    const response = await apiFetch(
      `/padlock/accounts/${encodeURIComponent(name)}/punishments/overview`,
      { skipAuth: true },
    );
    if (!response.ok) return null;
    return safeJsonParse<SnAccountPunishment>(response);
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
    const response = await apiFetch(
      `/passport/accounts/${encodeURIComponent(name)}/connections`,
      { skipAuth: true },
    );
    return safeJsonParse<PublicAccountConnection[]>(response);
  } catch {
    return [];
  }
}

export async function fetchAccountPublishers(
  accountId: string,
): Promise<Publisher[]> {
  try {
    const response = await apiFetch(
      `/sphere/publishers/of/${encodeURIComponent(accountId)}`,
      { skipAuth: true },
    );
    return safeJsonParse<Publisher[]>(response);
  } catch {
    return [];
  }
}

// Data API - Realms
export async function fetchRealm(slug: string): Promise<Realm> {
  const response = await apiFetch(
    `/passport/realms/${encodeURIComponent(slug)}`,
    { skipAuth: true },
  );
  return safeJsonParse<Realm>(response);
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

  const response = await apiFetch(`/sphere/posts?${params.toString()}`, {
    skipAuth: true,
  });

  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<Post[]>(response);

  return { posts: data, total };
}

// Heatmap data for publisher activity
export interface HeatmapData {
  startDate: string;
  endDate: string;
  data: Record<string, number>;
}

export async function fetchPublisherHeatmap(
  publisherName: string,
): Promise<HeatmapData> {
  const response = await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/heatmap`,
    { skipAuth: true },
  );
  return safeJsonParse<HeatmapData>(response);
}

// Publisher subscription status
export interface PublisherSubscriptionStatus {
  status: "none" | "pending" | "following" | "subscribed";
  isPending: boolean;
  subscription?: {
    isActive: boolean;
    notify: boolean;
  };
}

export async function fetchPublisherSubscriptionStatus(
  publisherName: string,
): Promise<PublisherSubscriptionStatus | null> {
  try {
    const response = await apiFetch(
      `/sphere/publishers/${encodeURIComponent(publisherName)}/subscription`,
    );
    return safeJsonParse<PublisherSubscriptionStatus>(response);
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
  const response = await apiFetch(
    `/sphere/posts?pub=${encodeURIComponent(publisherName)}&pinned=true&take=10`,
    { skipAuth: true },
  );
  return safeJsonParse<Post[]>(response);
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

  const response = await apiFetch(`/sphere/posts?${params.toString()}`, {
    skipAuth: true,
  });

  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<Post[]>(response);

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

  const response = await apiFetch(
    `/passport/accounts/${encodeURIComponent(accountName)}/timeline?${params.toString()}`,
    { skipAuth: true },
  );

  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<SnAccountTimelineItem[]>(response);

  return { items: data, total };
}

// Account relationships
export interface RelationshipStatus {
  status: number; // -100 = blocked, 0 = none, >0 = friend
  isFriend: boolean;
  isBlocked: boolean;
}

export async function fetchAccountRelationship(
  accountId: string,
): Promise<RelationshipStatus | null> {
  try {
    const response = await apiFetch(
      `/passport/accounts/${accountId}/relationship`,
    );
    return safeJsonParse<RelationshipStatus>(response);
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
export interface Relationship {
  id: string;
  accountId: string;
  relatedId: string;
  status: number;
  expiredAt?: string;
  account?: {
    id: string;
    name: string;
    nick: string;
    profile: {
      picture?: { id: string };
    };
  };
  related?: {
    id: string;
    name: string;
    nick: string;
    profile: {
      picture?: { id: string };
    };
  };
}

export async function fetchRelationships(
  offset = 0,
  take = 20,
): Promise<{ items: Relationship[]; total: number; hasMore: boolean }> {
  const response = await apiFetch(
    `/passport/relationships?offset=${offset}&take=${take}`,
  );
  const data = await safeJsonParse<Relationship[]>(response);
  const total = parseInt(response.headers.get("x-total") || "0", 10);
  return {
    items: data,
    total,
    hasMore: offset + data.length < total,
  };
}

export async function fetchFriendRequests(): Promise<Relationship[]> {
  const response = await apiFetch("/passport/relationships/requests");
  return safeJsonParse<Relationship[]>(response);
}

export async function sendFriendRequest(accountId: string): Promise<void> {
  await apiFetch(`/passport/relationships/${accountId}/friends`, {
    method: "POST",
  });
}

export async function acceptFriendRequest(accountId: string): Promise<void> {
  await apiFetch(`/passport/relationships/${accountId}/friends/accept`, {
    method: "POST",
  });
}

export async function declineFriendRequest(accountId: string): Promise<void> {
  await apiFetch(`/passport/relationships/${accountId}/friends/decline`, {
    method: "POST",
  });
}

export async function cancelFriendRequest(relatedId: string): Promise<void> {
  await apiFetch(`/passport/relationships/${relatedId}/friends`, {
    method: "DELETE",
  });
}

export async function updateRelationship(
  accountId: string,
  status: number,
): Promise<void> {
  await apiFetch(`/passport/relationships/${accountId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteRelationship(relatedId: string): Promise<void> {
  await apiFetch(`/passport/relationships/${relatedId}`, {
    method: "DELETE",
  });
}

// Wallet Types
export interface WalletPocket {
  id: string;
  currency: string;
  amount: number;
  heldAmount: number;
  availableAmount: number;
  walletId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  accountId: string;
  name: string;
  realmId?: string;
  isPrimary: boolean;
  publicId?: string;
  pockets: WalletPocket[];
  createdAt: string;
  updatedAt: string;
}

export interface WalletStats {
  totalIncome: number;
  totalOutgoing: number;
}

export interface Transaction {
  id: string;
  payerWalletId?: string;
  payeeWalletId?: string;
  amount: number;
  currency: string;
  type: number; // 0: transfer, 1: payment
  status: number; // 0: pending, 1: frozen, 2: confirmed, 3: refunded, 4: cancelled
  isFrozen: boolean;
  requireConfirmation: boolean;
  remarks?: string;
  frozenAt?: string;
  expiresAt?: string;
  confirmedAt?: string;
  createdAt: string;
  payerWallet?: {
    account?: {
      id: string;
      name: string;
      nick: string;
      profile: {
        picture?: { id: string };
      };
    };
  };
  payeeWallet?: {
    account?: {
      id: string;
      name: string;
      nick: string;
      profile: {
        picture?: { id: string };
      };
    };
  };
}

export interface FundRecipient {
  id: string;
  recipientAccountId: string;
  amount: number;
  isReceived: boolean;
  receivedAt?: string;
  recipientAccount?: {
    id: string;
    name: string;
    nick: string;
    profile: {
      picture?: { id: string };
    };
  };
}

export interface Fund {
  id: string;
  senderId: string;
  currency: string;
  totalAmount: number;
  splitType: number; // 0: even, 1: random
  amountOfSplits: number;
  message?: string;
  remainingAmount: number;
  raisedAmount: number;
  status: number; // 0: created, 1: partial, 2: completed, 3: expired
  isRaising: boolean;
  isOpen: boolean;
  targetAmount: number;
  contributionType: number; // 0: free, 1: fixed
  contributionAmount: number;
  deadlineAt?: string;
  createdAt: string;
  expiresAt?: string;
  recipients: FundRecipient[];
  creatorAccount?: {
    id: string;
    name: string;
    nick: string;
    profile: {
      picture?: { id: string };
    };
  };
}

// Wallet API
export async function fetchWallet(): Promise<Wallet | null> {
  try {
    const response = await apiFetch("/wallet/wallets");
    return safeJsonParse<Wallet>(response);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      return null;
    }
    throw err;
  }
}

export async function fetchWallets(): Promise<Wallet[]> {
  const response = await apiFetch("/wallet/wallets/all");
  return safeJsonParse<Wallet[]>(response);
}

export async function fetchWalletById(id: string): Promise<Wallet> {
  const response = await apiFetch(`/wallet/wallets/${id}`);
  return safeJsonParse<Wallet>(response);
}

export async function createWallet(params?: {
  name?: string;
  realmId?: string;
}): Promise<Wallet> {
  const response = await apiFetch("/wallet/wallets", {
    method: "POST",
    body: JSON.stringify({
      name: params?.name,
      realm_id: params?.realmId,
    }),
  });
  return safeJsonParse<Wallet>(response);
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
  const response = await apiFetch(
    `/wallet/wallets/stats${query ? "?" + query : ""}`,
  );
  return safeJsonParse<WalletStats>(response);
}

export interface WalletPinStatus {
  hasPin: boolean;
  validationRequired: boolean;
}

export async function fetchWalletPinStatus(): Promise<WalletPinStatus> {
  const response = await apiFetch("/padlock/accounts/me/pin-status");
  return safeJsonParse<WalletPinStatus>(response);
}

export async function fetchTransactions(
  offset = 0,
  take = 20,
): Promise<{ items: Transaction[]; total: number; hasMore: boolean }> {
  const response = await apiFetch(
    `/wallet/wallets/transactions?offset=${offset}&take=${take}`,
  );
  const data = await safeJsonParse<Transaction[]>(response);
  const total = parseInt(response.headers.get("x-total") || "0", 10);
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
  const response = await apiFetch("/wallet/wallets/funds", {
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
  return safeJsonParse<Fund>(response);
}

export async function fetchFund(fundId: string): Promise<Fund> {
  const response = await apiFetch(`/wallet/wallets/funds/${fundId}`);
  return safeJsonParse<Fund>(response);
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
  const response = await apiFetch(
    `/wallet/wallets/funds?offset=${offset}&take=${take}`,
  );
  const data = await safeJsonParse<Fund[]>(response);
  const total = parseInt(response.headers.get("x-total") || "0", 10);
  return {
    items: data,
    total,
    hasMore: offset + data.length < total,
  };
}

// Badges
export type Badge = SnAccountBadge;

export async function fetchMyBadges(): Promise<SnAccountBadge[]> {
  const response = await apiFetch("/passport/accounts/me/badges");
  return safeJsonParse<Badge[]>(response);
}

export async function activateBadge(badgeId: string): Promise<void> {
  await apiFetch(`/passport/accounts/me/badges/${badgeId}/activate`, {
    method: "POST",
  });
}

// Notifications
export interface Notification {
  id: string;
  topic: string;
  title: string;
  subtitle: string;
  content: string;
  link?: string;
  meta: Record<string, unknown>;
  viewedAt?: string;
  createdAt: string;
}

export async function fetchNotifications(
  offset = 0,
  take = 20,
): Promise<{ items: Notification[]; total: number; hasMore: boolean }> {
  const response = await apiFetch(
    `/ring/notifications?offset=${offset}&take=${take}`,
  );
  const data = await safeJsonParse<Notification[]>(response);
  const total = parseInt(response.headers.get("x-total") || "0", 10);
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

// Direct messages
export async function getDirectChat(
  accountId: string,
): Promise<unknown | null> {
  try {
    const response = await apiFetch(`/passport/chat/direct/${accountId}`);
    return safeJsonParse<unknown>(response);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      return null;
    }
    throw err;
  }
}

export async function createDirectChat(accountId: string): Promise<unknown> {
  const response = await apiFetch(`/passport/chat/direct`, {
    method: "POST",
    body: JSON.stringify({ account_id: accountId }),
  });
  return safeJsonParse<unknown>(response);
}

// Realm API
// Workspace API — served by WattEngine Valve, separate from Realm APIs.
export async function fetchWorkspaces(): Promise<Workspace[]> {
  return fetchJson<Workspace[]>("/valve/workspaces");
}

export async function createWorkspace(payload: {
  slug: string;
  name: string;
  description?: string;
  type: number;
}): Promise<Workspace> {
  return fetchJson<Workspace>("/valve/workspaces", {
    method: "POST",
    body: JSON.stringify(camelToSnake(payload)),
  });
}

export async function fetchWorkspaceMembers(slug: string): Promise<WorkspaceMember[]> {
  return fetchJson<WorkspaceMember[]>(`/valve/workspaces/${encodeURIComponent(slug)}/members`);
}

export async function inviteWorkspaceMember(slug: string, accountId: string, role: number): Promise<WorkspaceMember> {
  return fetchJson<WorkspaceMember>(`/valve/workspaces/${encodeURIComponent(slug)}/members/invite`, {
    method: "POST",
    body: JSON.stringify({ account_id: accountId, role }),
  });
}

export async function updateWorkspaceMemberRole(slug: string, accountId: string, role: number): Promise<WorkspaceMember> {
  return fetchJson<WorkspaceMember>(`/valve/workspaces/${encodeURIComponent(slug)}/members/${encodeURIComponent(accountId)}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function removeWorkspaceMember(slug: string, accountId: string): Promise<void> {
  await fetchJson<unknown>(`/valve/workspaces/${encodeURIComponent(slug)}/members/${encodeURIComponent(accountId)}`, { method: "DELETE" });
}

export async function fetchWorkspaceMailboxes(workspaceId: string): Promise<WorkspaceMailbox[]> {
  return fetchJson<WorkspaceMailbox[]>(`/postal/mailboxes?workspace_id=${encodeURIComponent(workspaceId)}`);
}

export async function createWorkspaceMailbox(payload: { address: string; workspaceId: string; name?: string; isDefault?: boolean }): Promise<WorkspaceMailbox> {
  return fetchJson<WorkspaceMailbox>("/postal/mailboxes", { method: "POST", body: JSON.stringify({ address: payload.address, workspace_id: payload.workspaceId, name: payload.name, is_default: payload.isDefault ?? false }) });
}

export async function fetchMailCredentials(): Promise<WorkspaceMailCredential[]> {
  return fetchJson<WorkspaceMailCredential[]>("/postal/credentials");
}

export async function createMailCredential(payload: { mailboxId: string; label: string; protocols: string[] }): Promise<WorkspaceMailCredentialCreated> {
  return fetchJson<WorkspaceMailCredentialCreated>("/postal/credentials", { method: "POST", body: JSON.stringify({ mailbox_id: payload.mailboxId, label: payload.label, protocols: payload.protocols }) });
}

export async function revokeMailCredential(credentialId: string): Promise<void> {
  await fetchJson<unknown>(`/postal/credentials/${encodeURIComponent(credentialId)}`, { method: "DELETE" });
}

export async function fetchFlywheelApps(workspaceId: string): Promise<FlywheelOwnerApp[]> {
  return fetchJson<FlywheelOwnerApp[]>(`/flywheel/workspaces/${encodeURIComponent(workspaceId)}/apps`);
}

export async function fetchFlywheelBlobs(workspaceId: string, appId: string): Promise<FlywheelOwnerBlob[]> {
  return fetchJson<FlywheelOwnerBlob[]>(`/flywheel/workspaces/${encodeURIComponent(workspaceId)}/apps/${encodeURIComponent(appId)}/management/blobs`);
}

export async function fetchFlywheelAudit(workspaceId: string, appId: string): Promise<FlywheelAuditEntry[]> {
  return fetchJson<FlywheelAuditEntry[]>(`/flywheel/workspaces/${encodeURIComponent(workspaceId)}/apps/${encodeURIComponent(appId)}/management/audit`);
}

export async function deleteFlywheelBlob(workspaceId: string, appId: string, blobId: string): Promise<void> {
  await fetchJson<unknown>(`/flywheel/workspaces/${encodeURIComponent(workspaceId)}/apps/${encodeURIComponent(appId)}/management/blobs/${encodeURIComponent(blobId)}`, { method: "DELETE" });
}

export async function fetchWorkspacePlanStatus(slug: string): Promise<WorkspacePlanStatus> {
  return fetchJson<WorkspacePlanStatus>(`/valve/workspaces/${encodeURIComponent(slug)}/plan/status`);
}

export async function subscribeWorkspacePlan(slug: string, plan: number): Promise<WorkspacePlanOrder> {
  return fetchJson<WorkspacePlanOrder>(`/valve/workspaces/${encodeURIComponent(slug)}/plan/subscribe`, {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
}

export async function fetchRealms(): Promise<Realm[]> {
  const response = await apiFetch("/passport/realms");
  const data = await safeJsonParse<Realm[]>(response);
  return data;
}

export async function createRealm(payload: {
  name: string;
  slug: string;
  description?: string;
  isPublic?: boolean;
  isCommunity?: boolean;
}): Promise<Realm> {
  const response = await apiFetch("/passport/realms", {
    method: "POST",
    body: JSON.stringify(camelToSnake(payload)),
  });
  return safeJsonParse<Realm>(response);
}

export async function updateRealm(
  slug: string,
  payload: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  },
): Promise<Realm> {
  const response = await apiFetch(
    `/passport/realms/${encodeURIComponent(slug)}`,
    {
      method: "PATCH",
      body: JSON.stringify(camelToSnake(payload)),
    },
  );
  return safeJsonParse<Realm>(response);
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
    const response = await apiFetch(
      `/passport/realms/${encodeURIComponent(slug)}/members/me`,
    );
    return safeJsonParse<RealmMember>(response);
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
  const response = await apiFetch(
    `/passport/realms/${encodeURIComponent(slug)}/members?${params.toString()}`,
  );
  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<RealmMember[]>(response);
  return { members: data, total };
}

// Realm invites
export async function fetchRealmInvites(): Promise<RealmInvite[]> {
  const response = await apiFetch("/passport/realms/invites");
  return safeJsonParse<RealmInvite[]>(response);
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
  const response = await apiFetch(
    `/passport/realms/${encodeURIComponent(slug)}/boost`,
  );
  return safeJsonParse<RealmBoostStatus>(response);
}

export async function fetchRealmBoostLeaderboard(
  slug: string,
  take = 20,
): Promise<RealmBoostLeaderboardEntry[]> {
  const response = await apiFetch(
    `/passport/realms/${encodeURIComponent(slug)}/boost/leaderboard?take=${take}`,
  );
  return safeJsonParse<RealmBoostLeaderboardEntry[]>(response);
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
  const response = await apiFetch(
    `/passport/realms/${encodeURIComponent(slug)}/labels`,
  );
  return safeJsonParse<RealmLabel[]>(response);
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
  const response = await apiFetch(
    `/passport/realms/${encodeURIComponent(slug)}/labels`,
    {
      method: "POST",
      body: JSON.stringify(camelToSnake(payload)),
    },
  );
  return safeJsonParse<RealmLabel>(response);
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
  const response = await apiFetch(
    `/passport/realms/${encodeURIComponent(slug)}/labels/${labelId}`,
    {
      method: "PATCH",
      body: JSON.stringify(camelToSnake(payload)),
    },
  );
  return safeJsonParse<RealmLabel>(response);
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
  const response = await apiFetch(
    `/passport/realms/${encodeURIComponent(slug)}/members/me`,
    {
      method: "PATCH",
      body: JSON.stringify(camelToSnake(payload)),
    },
  );
  return safeJsonParse<RealmMember>(response);
}

// Realm chat rooms
export async function fetchRealmChatRooms(
  slug: string,
): Promise<RealmChatRoom[]> {
  const response = await apiFetch(
    `/passport/realms/${encodeURIComponent(slug)}/chat`,
  );
  return safeJsonParse<RealmChatRoom[]>(response);
}

// Settings API - Account Management
export async function updateAccount(payload: {
  name?: string;
  nick?: string;
  language?: string;
  region?: string;
}): Promise<SnAccount> {
  const response = await apiFetch("/padlock/accounts/me", {
    method: "PATCH",
    body: JSON.stringify(camelToSnake(payload)),
  });
  return safeJsonParse<SnAccount>(response);
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
  const response = await apiFetch("/passport/accounts/me/profile", {
    method: "PATCH",
    body: JSON.stringify(camelToSnake(payload)),
  });
  return safeJsonParse<SnAccount>(response);
}

export async function deleteAccount(): Promise<void> {
  await apiFetch("/passport/accounts/me", {
    method: "DELETE",
  });
}

// Settings API - Auth Factors
export async function fetchAuthFactors(): Promise<SnAuthFactor[]> {
  const response = await apiFetch("/padlock/factors");
  return safeJsonParse<SnAuthFactor[]>(response);
}

export async function createAuthFactor(payload: {
  type: number;
  secret?: string | null;
  /** @deprecated Prefer top-level `secret`. Kept for older callers. */
  data?: Record<string, string>;
}): Promise<SnAuthFactor> {
  const secret =
    payload.secret !== undefined
      ? payload.secret
      : (payload.data?.secret ?? null);
  const response = await apiFetch("/padlock/factors", {
    method: "POST",
    body: JSON.stringify({ type: payload.type, secret }),
  });
  return safeJsonParse<SnAuthFactor>(response);
}

export async function deleteAuthFactor(factorId: string): Promise<void> {
  await apiFetch(`/padlock/factors/${factorId}`, {
    method: "DELETE",
  });
}

export async function enableAuthFactor(
  factorId: string,
  verificationCode?: string,
): Promise<SnAuthFactor> {
  const response = await apiFetch(`/padlock/factors/${factorId}/enable`, {
    method: "POST",
    body: verificationCode ? JSON.stringify(verificationCode) : undefined,
  });
  return safeJsonParse<SnAuthFactor>(response);
}

export async function disableAuthFactor(factorId: string): Promise<void> {
  await apiFetch(`/padlock/factors/${factorId}/disable`, {
    method: "POST",
  });
}

// Settings API - Contact Methods
export async function fetchContactMethods(): Promise<SnContactMethod[]> {
  const response = await apiFetch("/padlock/contacts");
  return safeJsonParse<SnContactMethod[]>(response);
}

export async function createContactMethod(payload: {
  type: number;
  content: string;
}): Promise<SnContactMethod> {
  const response = await apiFetch("/padlock/contacts", {
    method: "POST",
    body: JSON.stringify(camelToSnake(payload)),
  });
  return safeJsonParse<SnContactMethod>(response);
}

export async function deleteContactMethod(contactId: string): Promise<void> {
  await apiFetch(`/padlock/contacts/${contactId}`, {
    method: "DELETE",
  });
}

export async function verifyContactMethod(contactId: string): Promise<void> {
  await apiFetch(`/padlock/contacts/${contactId}/verify`, {
    method: "POST",
  });
}

export async function setPrimaryContactMethod(
  contactId: string,
): Promise<void> {
  await apiFetch(`/padlock/contacts/${contactId}/primary`, {
    method: "POST",
  });
}

export async function makeContactPublic(contactId: string): Promise<void> {
  await apiFetch(`/padlock/contacts/${contactId}/public`, {
    method: "POST",
  });
}

export async function makeContactPrivate(contactId: string): Promise<void> {
  await apiFetch(`/padlock/contacts/${contactId}/public`, {
    method: "DELETE",
  });
}

// Settings API - Account Connections
export async function fetchAccountConnections(): Promise<
  SnAccountConnection[]
> {
  const response = await apiFetch("/padlock/connections");
  return safeJsonParse<SnAccountConnection[]>(response);
}

export async function deleteAccountConnection(
  connectionId: string,
): Promise<void> {
  await apiFetch(`/padlock/connections/${connectionId}`, {
    method: "DELETE",
  });
}

export function getConnectionAuthUrl(provider: string): string {
  return `${API_BASE_URL}/padlock/auth/login/${provider.toLowerCase()}`;
}

// Settings API - Auth Devices & Sessions
export async function fetchAuthDevices(): Promise<SnAuthDevice[]> {
  const response = await apiFetch("/padlock/devices");
  const raw = await safeJsonParse<{ sessions: SnAuthSession[] }[]>(response);

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
  const response = await apiFetch(`/padlock/sessions?${params.toString()}`);
  const data = await safeJsonParse<SnAuthSession[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function fetchSessionChildren(
  parentId: string,
): Promise<SnAuthSession[]> {
  const response = await apiFetch(`/padlock/sessions/${parentId}/children`);
  const data = await safeJsonParse<{ items: SnAuthSession[] }>(response);
  return data.items;
}

export async function revokeDevice(deviceId: string): Promise<void> {
  await apiFetch(`/padlock/devices/${deviceId}`, {
    method: "DELETE",
  });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await apiFetch(`/padlock/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export async function revokeAllOtherSessions(): Promise<void> {
  await apiFetch("/padlock/sessions/others", {
    method: "DELETE",
  });
}

export async function updateDeviceLabel(
  deviceId: string,
  label: string,
): Promise<void> {
  await apiFetch(`/padlock/devices/${deviceId}/label`, {
    method: "PATCH",
    body: JSON.stringify({ label }),
  });
}

// Settings API - Publishing (matches Island sphere.getPublishingSettings)
export interface SnPublishingSettings {
  id: string;
  accountId: string;
  defaultPostingPublisherId?: string | null;
  defaultReplyPublisherId?: string | null;
  defaultFediversePublisherId?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export async function fetchPublishingSettings(): Promise<SnPublishingSettings> {
  const response = await apiFetch("/sphere/account/publishing");
  return safeJsonParse<SnPublishingSettings>(response);
}

export async function updatePublishingSettings(payload: {
  defaultPostingPublisherId?: string | null;
  defaultReplyPublisherId?: string | null;
  defaultFediversePublisherId?: string | null;
}): Promise<SnPublishingSettings> {
  const response = await apiFetch("/sphere/account/publishing", {
    method: "PATCH",
    body: JSON.stringify(camelToSnake(payload)),
  });
  return safeJsonParse<SnPublishingSettings>(response);
}

// Settings API - Notification preferences (matches Island notifications API)
/** 0 = normal, 1 = silent, 2 = reject */
export type SnNotificationPreferenceLevel = 0 | 1 | 2;

export interface SnNotificationTopic {
  topic: string;
  description: string;
}

export interface SnNotificationPreference {
  id: string;
  accountId: string;
  topic: string;
  preference: SnNotificationPreferenceLevel;
  createdAt?: string;
  updatedAt?: string;
}

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
  const response = await apiFetch("/ring/notifications/preferences");
  return safeJsonParse<SnNotificationPreference[]>(response);
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
export interface PostCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  usage: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostTag {
  id: string;
  slug: string;
  name: string | null;
  usage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySubscription {
  id: string;
  categoryId: string;
  accountId: string;
  createdAt: string;
}

export async function fetchCategories(
  take = 20,
  offset = 0,
): Promise<{ categories: PostCategory[]; total: number }> {
  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
  });

  const response = await apiFetch(
    `/sphere/posts/categories?${params.toString()}`,
    {
      skipAuth: true,
    },
  );

  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<PostCategory[]>(response);

  return { categories: data, total };
}

export async function fetchCategory(slug: string): Promise<PostCategory> {
  const response = await apiFetch(`/sphere/posts/categories/${slug}`, {
    skipAuth: true,
  });
  return safeJsonParse<PostCategory>(response);
}

export async function fetchCategorySubscription(
  slug: string,
): Promise<CategorySubscription | null> {
  try {
    const response = await apiFetch(
      `/sphere/posts/categories/${slug}/subscription`,
    );
    return safeJsonParse<CategorySubscription>(response);
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

  const response = await apiFetch(`/sphere/posts/tags?${params.toString()}`, {
    skipAuth: true,
  });

  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<PostTag[]>(response);

  return { tags: data, total };
}

export async function fetchTag(slug: string): Promise<PostTag> {
  const response = await apiFetch(`/sphere/posts/tags/${slug}`, {
    skipAuth: true,
  });
  return safeJsonParse<PostTag>(response);
}

export async function fetchTagSubscription(
  slug: string,
): Promise<CategorySubscription | null> {
  try {
    const response = await apiFetch(`/sphere/posts/tags/${slug}/subscription`);
    return safeJsonParse<CategorySubscription>(response);
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

  const response = await apiFetch(`/sphere/posts?${params.toString()}`, {
    skipAuth: true,
  });

  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<Post[]>(response);

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

  const response = await apiFetch(`/sphere/posts?${params.toString()}`, {
    skipAuth: true,
  });

  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<Post[]>(response);

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

  const url = `${API_BASE_URL}/drive/files/upload/direct`;
  const headers: Record<string, string> = {};

  if (import.meta.client && getAuthMode() === "bearer") {
    const token = await getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const credentials =
    import.meta.client && getAuthMode() === "cookie" ? "include" : undefined;
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers,
    credentials,
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
import type {
  SnChatRoom,
  SnChatMessage,
  SnChatMember,
  SnChatSummary,
} from "~/types/chat";

export async function fetchChatRooms(): Promise<SnChatRoom[]> {
  const response = await apiFetch("/messager/chat");
  const data = await parseResponse(response);
  console.log("[API] fetchChatRooms raw response:", data);
  // Ensure we return an array
  if (Array.isArray(data)) {
    return snakeToCamel(data) as SnChatRoom[];
  }
  // If it's an object with a data/items/rooms key, try that
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return snakeToCamel(obj.data) as SnChatRoom[];
    if (Array.isArray(obj.items))
      return snakeToCamel(obj.items) as SnChatRoom[];
    if (Array.isArray(obj.rooms))
      return snakeToCamel(obj.rooms) as SnChatRoom[];
  }
  console.warn(
    "[API] fetchChatRooms: unexpected response format, returning empty array",
  );
  return [];
}

export async function fetchChatRoom(roomId: string): Promise<SnChatRoom> {
  const response = await apiFetch(`/messager/chat/${roomId}`);
  return safeJsonParse<SnChatRoom>(response);
}

export async function fetchChatMessages(
  roomId: string,
  offset = 0,
  take = 50,
): Promise<{ messages: SnChatMessage[]; total: number }> {
  const params = new URLSearchParams({
    offset: String(offset),
    take: String(take),
  });
  const response = await apiFetch(
    `/messager/chat/${roomId}/messages?${params.toString()}`,
  );
  const total = parseInt(response.headers.get("x-total") || "0", 10);
  const data = await safeJsonParse<SnChatMessage[]>(response);
  return { messages: data, total };
}

export async function sendChatMessage(
  roomId: string,
  payload: {
    content?: string;
    type?: string;
    clientMessageId?: string;
    nonce?: string;
    meta?: Record<string, unknown>;
    membersMentioned?: string[];
    repliedMessageId?: string;
    forwardedMessageId?: string;
  },
): Promise<SnChatMessage> {
  const response = await apiFetch(`/messager/chat/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify(camelToSnake(payload)),
  });
  return safeJsonParse<SnChatMessage>(response);
}

export async function editChatMessage(
  roomId: string,
  messageId: string,
  payload: {
    content?: string;
    meta?: Record<string, unknown>;
  },
): Promise<SnChatMessage> {
  const response = await apiFetch(
    `/messager/chat/${roomId}/messages/${messageId}`,
    {
      method: "PATCH",
      body: JSON.stringify(camelToSnake(payload)),
    },
  );
  return safeJsonParse<SnChatMessage>(response);
}

export async function deleteChatMessage(
  roomId: string,
  messageId: string,
): Promise<void> {
  await apiFetch(`/messager/chat/${roomId}/messages/${messageId}`, {
    method: "DELETE",
  });
}

export async function fetchChatSummary(): Promise<
  Record<string, SnChatSummary>
> {
  const response = await apiFetch("/messager/chat/summary");
  return safeJsonParse<Record<string, SnChatSummary>>(response);
}

export async function fetchChatUnreadCount(): Promise<number> {
  try {
    const response = await apiFetch("/messager/chat/unread");
    const data = await response.text();
    return parseInt(data, 10) || 0;
  } catch {
    return 0;
  }
}

export async function markChatRoomRead(roomId: string): Promise<void> {
  await apiFetch(`/messager/chat/${roomId}/read`, {
    method: "POST",
  });
}

export async function markAllChatsRead(): Promise<void> {
  await apiFetch("/messager/chat/read-all", {
    method: "POST",
  });
}

export async function fetchChatRoomMembers(
  roomId: string,
): Promise<SnChatMember[]> {
  const response = await apiFetch(`/messager/chat/${roomId}/members`);
  return safeJsonParse<SnChatMember[]>(response);
}

export async function fetchChatRoomIdentity(
  roomId: string,
): Promise<SnChatMember> {
  const response = await apiFetch(`/messager/chat/${roomId}/members/me`);
  return safeJsonParse<SnChatMember>(response);
}

export async function fetchChatInvites(): Promise<
  Array<{ id: string; chatRoom?: SnChatRoom; invitedByAccount?: SnAccount }>
> {
  const response = await apiFetch("/messager/chat/invites");
  return safeJsonParse(response);
}

export async function acceptChatInvite(roomId: string): Promise<void> {
  await apiFetch(`/messager/chat/invites/${roomId}/accept`, {
    method: "POST",
  });
}

export async function declineChatInvite(roomId: string): Promise<void> {
  await apiFetch(`/messager/chat/invites/${roomId}/decline`, {
    method: "POST",
  });
}

export async function addReactionToMessage(
  roomId: string,
  messageId: string,
  symbol: string,
): Promise<void> {
  await apiFetch(`/messager/chat/${roomId}/messages/${messageId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ symbol }),
  });
}

export async function removeReactionFromMessage(
  roomId: string,
  messageId: string,
  symbol: string,
): Promise<void> {
  await apiFetch(
    `/messager/chat/${roomId}/messages/${messageId}/reactions/${symbol}`,
    { method: "DELETE" },
  );
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
    `/padlock/auth/open/device/code/${encodeURIComponent(userCode)}`,
    { skipAuth: true },
  );
  return safeJsonParse<DeviceCodeStatus>(response);
}

export async function approveDeviceCode(userCode: string): Promise<void> {
  await apiFetch(
    `/padlock/auth/open/device/code/${encodeURIComponent(userCode)}/approve`,
    { method: "POST" },
  );
}

export async function declineDeviceCode(userCode: string): Promise<void> {
  await apiFetch(
    `/padlock/auth/open/device/code/${encodeURIComponent(userCode)}/decline`,
    { method: "POST" },
  );
}
