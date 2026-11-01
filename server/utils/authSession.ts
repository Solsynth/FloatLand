import type { H3Event } from "h3";
import { deleteCookie, getRequestHeader, setCookie } from "h3";

/**
 * Session handling, adopted from Stargate's own cookie model.
 *
 * Stargate authenticates a request from `Authorization: Bearer`, a `tk` query
 * parameter, or — the browser case — the `AuthToken` cookie, and rotates an
 * expired access token from `RefreshToken`. Those are the two names the whole
 * network uses, and a host under Stargate's `[auth] cookieDomain` is signed in
 * by the browser simply presenting them.
 *
 * FloatLand therefore does not mint its own session. It proxies to Stargate and
 * forwards the browser's `AuthToken`/`RefreshToken` cookies upstream unchanged,
 * so:
 *
 *  - a reader signed in on any other host under the same cookie domain arrives
 *    already authenticated, with nothing to exchange;
 *  - Stargate's auto-renew middleware rotates the pair and answers with fresh
 *    `Set-Cookie` headers, which this proxy relays to the browser;
 *  - signing out is Stargate clearing those cookies, not a local table.
 *
 * No token is ever stored server-side, so the proxy holds no session state and
 * a restart cannot sign anyone out.
 */

/** The cookies Stargate reads and writes. Order matters: access first. */
const SESSION_COOKIES = ["AuthToken", "RefreshToken"] as const;

export type SessionCookieName = (typeof SESSION_COOKIES)[number];

/**
 * All `name=value` pairs for a cookie name in a raw `Cookie` header, in order.
 * A host-only cookie and a `Domain`-scoped one can coexist in a browser jar and
 * both are sent, so the caller decides which to trust rather than relying on a
 * `getCookie` that keeps only the first.
 */
export function cookieValues(rawCookie: string, name: string): string[] {
  const out: string[] = [];
  if (!rawCookie) return out;
  for (const part of rawCookie.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const value = part.slice(eq + 1).trim();
    if (value) out.push(value);
  }
  return out;
}

/** The `Cookie` header to forward upstream, or undefined when there is none. */
export function forwardedCookieHeader(event: H3Event): string | undefined {
  const raw = getRequestHeader(event, "cookie");
  if (!raw) return undefined;
  const kept = raw
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      const eq = part.indexOf("=");
      if (eq === -1) return false;
      const name = part.slice(0, eq).trim();
      // Only the session pair travels to the backend; everything else in the
      // jar belongs to this origin.
      return (SESSION_COOKIES as readonly string[]).includes(name);
    });
  return kept.length ? kept.join("; ") : undefined;
}

/** Whether the request carries an access token the backend can act on. */
export function hasSessionCookie(event: H3Event): boolean {
  return Boolean(forwardedCookieHeader(event));
}

/**
 * Standard reverse-proxy client-IP headers for server-to-backend calls.
 *
 * FloatLand proxies to the API on the same host, so the backend would otherwise
 * see FloatLand's IP. Forward the real client IP via the conventional
 * `X-Forwarded-For` (leftmost, client-controlled value first) and `X-Real-IP`
 * so login endpoints rate-limit and audit the actual user.
 */
export function clientIpHeaders(event: H3Event): Record<string, string> {
  const headers: Record<string, string> = {};
  const forwardedFor = getRequestHeader(event, "x-forwarded-for");
  const clientIp =
    (getRequestHeader(event, "x-real-ip") ?? "").trim() ||
    (forwardedFor ?? "").split(",")[0]?.trim() ||
    "";
  if (!clientIp) return headers;
  // Preserve an existing forwarded chain (a CDN in front), with the client IP
  // leftmost so the last hop (FloatLand) stays visible.
  const forwarded = forwardedFor?.trim();
  headers["x-forwarded-for"] =
    forwarded && !forwarded.split(",")[0]?.trim().startsWith(clientIp)
      ? `${clientIp}, ${forwarded}`
      : clientIp;
  headers["x-real-ip"] = clientIp;
  return headers;
}

/**
 * Relay one upstream `Set-Cookie` to the browser, re-scoped to this origin.
 *
 * Stargate sets the pair on its own cookie domain with its own `Secure` and
 * `SameSite` attributes. Forwarding that header verbatim would write a cookie
 * for a domain the browser may reject, so the attributes that decide *where*
 * the cookie is valid are rewritten here and everything else (name, value,
 * expiry, HttpOnly) is preserved from upstream.
 *
 * Returns false when the header is not one of the session pair, so the caller
 * can drop it: any other cookie Stargate sets belongs to Stargate's origin.
 */
export function relaySessionCookie(event: H3Event, header: string): boolean {
  const [pairPart] = header.split(";");
  const eq = pairPart?.indexOf("=") ?? -1;
  if (!pairPart || eq === -1) return false;
  const name = pairPart.slice(0, eq).trim();
  if (!(SESSION_COOKIES as readonly string[]).includes(name)) return false;
  const value = pairPart.slice(eq + 1).trim();

  const attributes: Record<string, string> = {};
  for (const raw of header.split(";").slice(1)) {
    const attribute = raw.trim();
    if (!attribute) continue;
    const at = attribute.indexOf("=");
    if (at === -1) attributes[attribute.toLowerCase()] = "";
    else attributes[attribute.slice(0, at).toLowerCase()] = attribute.slice(at + 1).trim();
  }

  // A clearing cookie (empty value or an expiry in the past) must stay a
  // clearing cookie, or signing out upstream would leave the browser signed in.
  const maxAge = Number(attributes["max-age"] ?? "");
  const expires = attributes.expires;
  const clearing =
    value === "" ||
    (Number.isFinite(maxAge) && maxAge <= 0) ||
    (expires ? new Date(expires).getTime() <= Date.now() : false);

  if (clearing) {
    deleteCookie(event, name, { path: "/" });
    return true;
  }

  const runtime = useRuntimeConfig(event).auth as { cookieSecure: boolean };
  const maxAgeSeconds = Number.isFinite(maxAge) && maxAge > 0 ? maxAge : undefined;
  const expiresAt = expires ? new Date(expires) : undefined;

  setCookie(event, name, value, {
    httpOnly: true,
    secure: runtime.cookieSecure,
    sameSite: "lax",
    path: "/",
    ...(maxAgeSeconds ? { maxAge: maxAgeSeconds } : {}),
    ...(expiresAt && !Number.isNaN(expiresAt.getTime()) ? { expires: expiresAt } : {}),
  });
  return true;
}
