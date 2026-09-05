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

// Known multi-part public suffixes the app hosts on. A registrable domain is
// the public suffix plus the label before it (e.g. `solarpass.one`). We only
// ever host on `solian.app`, `solsynth.dev`, and `solarpass.one`, so this small
// case list is sufficient; anything else falls back to a registrable-domain
// heuristic (last two labels).
const MULTI_PART_PUBLIC_SUFFIXES = [
  "co.uk",
  "com.au",
  "co.jp",
  "com.br",
  "co.nz",
  "org.uk",
  "co.za",
  "net.au",
  "com.sg",
];

function isIpOrLocalhost(host: string): boolean {
  if (!host) return true;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
  );
}

/**
 * Resolve the registrable domain (e.g. `solarpass.one`) for a cookie `Domain`
 * attribute from the request Host header, INCLUDING the apex so the cookie is
 * sent to `example.com` and every `*.example.com`. Returns undefined for
 * localhost/IP hosts (where a Domain attribute would break the cookie) so the
 * cookie stays host-only in dev.
 */
export function cookieDomainFor(event: H3Event): string | undefined {
  const host = String(event.node?.req?.headers?.host ?? "")
    .split(":")[0]
    .trim()
    .toLowerCase();
  if (!host || isIpOrLocalhost(host)) return undefined;
  const labels = host.split(".");
  if (labels.length < 2) return host;
  const lastTwo = labels.slice(-2).join(".");
  const publicSuffixIsMultiPart = MULTI_PART_PUBLIC_SUFFIXES.some((suffix) =>
    host.endsWith(`.${suffix}`),
  );
  // Registrable domain = public suffix + the single label preceding it.
  const takeLabels = publicSuffixIsMultiPart ? 3 : 2;
  return labels.slice(-takeLabels).join(".");
}

export function cookieOptions(event: H3Event) {
  const cfg = authConfig(event);
  const domain = cookieDomainFor(event);
  return {
    httpOnly: true,
    secure: cfg.cookieSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: cfg.sessionTtl,
    ...(domain ? { domain } : {}),
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
 * All `name=value` cookie values for `name` in a raw cookie header, in order.
 * (A host-only `sid` and a `Domain`-scoped `sid` can coexist in the browser
 * jar; browsers send BOTH, oldest-first, so a stale one may precede a valid
 * one. h3's `getCookie` keeps the FIRST occurrence and would pick the stale.)
 */
export function getCookieValues(rawCookie: string, name: string): string[] {
  const out: string[] = [];
  if (!rawCookie) return out;
  for (const part of rawCookie.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (key !== name) continue;
    const value = part.slice(eq + 1).trim();
    if (value) out.push(value);
  }
  return out;
}

export function getAllSids(event: H3Event): string[] {
  return getCookieValues(event.node?.req?.headers?.cookie ?? "", sidCookieName(event));
}

/**
 * Resolve the browser's session by scanning every `sid` cookie (not just the
 * first, per h3's `getCookie`) and returning the first sid that actually holds
 * a valid session. Falls back to the single `getCookie` value for a clean
 * request. Returns `{ sid, pair }` or `{ sid: "", pair: null }`.
 */
export async function resolveAuthSession(
  event: H3Event,
): Promise<{ sid: string; pair: StoredPair | null }> {
  const sids = getAllSids(event);
  if (sids.length === 0) return { sid: "", pair: null };
  for (const sid of sids) {
    const pair = await getAuthSession(sid);
    if (pair) return { sid, pair };
  }
  // No valid session. Surface the LAST `sid` value (the most recently set) so
  // logout/refresh target the current cookie rather than a stale host-only one.
  return { sid: sids[sids.length - 1], pair: null };
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
  clearSessionCookies(event, cfg.cookieName);
}

/**
 * Clear the `sid` cookie in BOTH scopes a browser may have stored it.
 *
 * A stale host-only `sid` (no `Domain` attribute, from a login performed before
 * the cookie-domain logic applied a `Domain`, or when it returned `undefined`
 * for IP/localhost hosts) and the current `Domain`-scoped `sid` can coexist in
 * the browser jar. A deletion cookie only matches a cookie with the SAME
 * domain+path+name, so we must delete both the host-only and the Domain cookie
 * or the stale one lingers and keeps breaking `getCookie` (which returns the
 * first, oldest occurrence).
 */
export function clearSessionCookies(event: H3Event, cookieName: string): void {
  const opts = cookieOptions(event);
  // Domain-scoped cookie.
  deleteCookie(event, cookieName, opts);
  // Host-only cookie (no Domain attribute). `domain: undefined` must be set
  // explicitly to override the domain resolved in `cookieOptions`.
  deleteCookie(event, cookieName, { ...opts, domain: undefined });
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
