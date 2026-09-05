import { randomBytes } from "node:crypto";
import type { H3Event } from "h3";
import { getCookie, setCookie, deleteCookie, getRequestIP, getRequestHeader } from "h3";

/**
 * Unified auth session store.
 *
 * The Nitro server is the trust boundary. It holds the backend token pair in a
 * shared storage backend (`useStorage('auth')` — Redis in prod, fs in dev) and
 * exposes it to the browser only through an opaque HttpOnly `sid` cookie. All
 * authenticated backend traffic flows through the same-origin proxy, which
 * injects `Authorization: Bearer <access>` from the store.
 */

export interface StoredPair {
  token: string;
  refreshToken?: string;
  expiresAt?: string;
  refreshExpiresAt?: string;
}

interface AuthRuntimeConfig {
  canonicalHost: string;
  cookieName: string;
  cookieSecure: boolean;
  sessionTtl: number;
}

function authConfig(event: H3Event): AuthRuntimeConfig {
  return useRuntimeConfig(event).auth as AuthRuntimeConfig;
}

/** Decode the JWT `exp` claim (unix seconds) into a Date, or null if absent. */
export function decodeJwtExpiry(token: string): Date | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    if (!parts[1]) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(Buffer.from(normalized, "base64").toString());
    if (payload.exp && typeof payload.exp === "number") {
      return new Date(payload.exp * 1000);
    }
  } catch {
    return null;
  }
  return null;
}

/** Compute a Date `expiresIn` seconds from now, ISO string. */
function isoFromNow(seconds?: number): string | undefined {
  if (!seconds || typeof seconds !== "number") return undefined;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function cookieOptions(event: H3Event) {
  const cfg = authConfig(event);
  return {
    httpOnly: true,
    secure: cfg.cookieSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: cfg.sessionTtl,
  };
}

export function sidCookieName(event: H3Event): string {
  return authConfig(event).cookieName;
}

/**
 * Standard reverse-proxy client-IP headers for server-to-backend calls.
 *
 * FloatLand proxies request to the main API on the same host, so the backend
 * would otherwise see FloatLand's IP. Forward the real client IP via the
 * conventional `X-Forwarded-For` (leftmost, client-controlled value first) and
 * `X-Real-IP` so login endpoints rate-limit and audit the actual user.
 */
export function clientIpHeaders(event: H3Event): Record<string, string> {
  const headers: Record<string, string> = {};
  const forwardedFor = getRequestHeader(event, "x-forwarded-for");
  const clientIp =
    (getRequestIP(event, { xForwardedFor: true }) ?? "").trim() ||
    (getRequestHeader(event, "x-real-ip") ?? "").trim();
  if (clientIp) {
    // Preserve an existing forwarded chain (e.g. a CDN/load balancer in front);
    // the client IP goes leftmost so the last hop (FloatLand) stays visible.
    const forwarded = forwardedFor?.trim();
    headers["x-forwarded-for"] =
      forwarded && !forwarded.split(",")[0]?.trim().startsWith(clientIp)
        ? `${clientIp}, ${forwarded}`
        : clientIp;
    headers["x-real-ip"] = clientIp;
  }
  return headers;
}

/**
 * Create (or overwrite) a server-side session for a token pair and set the
 * opaque `sid` cookie on the response. Returns the sid.
 */
export async function createSession(event: H3Event, pair: StoredPair): Promise<{ sid: string }> {
  const cfg = authConfig(event);
  const sid = randomBytes(24).toString("base64url");
  await useStorage("auth").setItem(sid, { ...pair }, { ttl: cfg.sessionTtl });
  setCookie(event, cfg.cookieName, sid, cookieOptions(event));
  return { sid };
}

/** Read a session pair by sid, or null when missing/expired. */
export async function getAuthSession(sid: string): Promise<StoredPair | null> {
  if (!sid) return null;
  const value = await useStorage("auth").getItem<StoredPair>(sid);
  return value ?? null;
}

/**
 * Rotate the stored token pair via the backend refresh endpoint. Preserves the
 * existing sid. Returns true on success, false (and deletes the session) when
 * the refresh token is missing/expired or the backend rejects the refresh.
 */
export async function refreshSession(event: H3Event, sid: string): Promise<boolean> {
  const cfg = authConfig(event);
  const runtime = useRuntimeConfig(event);
  const apiProxiedUrl = (runtime.apiProxiedUrl ?? runtime.apiServerUrl) as string;
  const pair = await getAuthSession(sid);
  if (!pair) return false;

  if (!pair.refreshToken) {
    await deleteSession(event, sid);
    return false;
  }
  if (
    pair.refreshExpiresAt &&
    new Date(pair.refreshExpiresAt).getTime() <= Date.now()
  ) {
    await deleteSession(event, sid);
    return false;
  }

  try {
    const data = await $fetch<{
      token: string;
      refresh_token?: string;
      expires_in?: number;
      refresh_expires_in?: number;
    }>(`${apiProxiedUrl}/stargate/auth/token`, {
      method: "POST",
      headers: { ...clientIpHeaders(event) },
      body: {
        grant_type: "refresh_token",
        refresh_token: pair.refreshToken,
      },
    });

    if (!data?.token) {
      await deleteSession(event, sid);
      return false;
    }

    await useStorage("auth").setItem(
      sid,
      {
        token: data.token,
        refreshToken: data.refresh_token ?? pair.refreshToken,
        expiresAt: isoFromNow(data.expires_in) ?? pair.expiresAt,
        refreshExpiresAt:
          isoFromNow(data.refresh_expires_in) ?? pair.refreshExpiresAt,
      },
      { ttl: cfg.sessionTtl },
    );
    return true;
  } catch {
    await deleteSession(event, sid);
    return false;
  }
}

/** Delete the server-side session and clear the `sid` cookie. */
export async function deleteSession(event: H3Event, sid: string): Promise<void> {
  const cfg = authConfig(event);
  if (sid) {
    await useStorage("auth").removeItem(sid);
  }
  deleteCookie(event, cfg.cookieName, cookieOptions(event));
}

/** Mint a single-use cross-host sync ticket mapping to `sid` (5 min TTL). */
export async function createSyncTicket(sid: string): Promise<string> {
  const ticket = randomBytes(24).toString("base64url");
  await useStorage("auth").setItem(`tkt:${ticket}`, sid, { ttl: 300 });
  return ticket;
}

/** Redeem a sync ticket; returns the sid and consumes the ticket (single use). */
export async function exchangeSyncTicket(ticket: string): Promise<string | null> {
  if (!ticket) return null;
  const sid = await useStorage("auth").getItem<string>(`tkt:${ticket}`);
  if (!sid) return null;
  await useStorage("auth").removeItem(`tkt:${ticket}`);
  return sid;
}
