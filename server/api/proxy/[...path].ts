import {
  defineEventHandler,
  getRouterParam,
  getCookie,
  getMethod,
  getRequestHeaders,
  getRequestIP,
  readRawBody,
  readBody,
  setResponseStatus,
  createError,
} from "h3";
import {
  createSession,
  getAuthSession,
  refreshSession,
  deleteSession,
  sidCookieName,
  clientIpHeaders,
} from "../../utils/authSession";

// Backend request methods whose body must be forwarded.
const PAYLOAD_METHODS = new Set(["PATCH", "POST", "PUT", "DELETE"]);

// Headers proxyRequest/h3 never forwards upstream (connection-level or
// client-only). We drop the client `cookie` for authenticated backend calls —
// the backend is auth'd via `Authorization: Bearer`, never its own cookie —
// except on SSR where we must pass the `sid` for bootstrap routes.
const DROP_ON_GENERIC = new Set([
  "transfer-encoding",
  "accept-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
  "host",
]);

function isoFromNow(seconds?: number): string | undefined {
  if (!seconds || typeof seconds !== "number") return undefined;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event);
  // Proxied backend calls go to the internal base URL (same host as FloatLand),
  // distinct from the public `apiBaseUrl` used only for display/OG/curl strings.
  const apiProxiedUrl = (cfg.apiProxiedUrl ?? cfg.apiServerUrl) as string;
  const cookieName = sidCookieName(event);

  const path = getRouterParam(event, "path") || "";
  const target = `${apiProxiedUrl}/${path}`;

  const sid = getCookie(event, cookieName) ?? "";
  let pair = sid ? await getAuthSession(sid) : null;

  // ── Bootstrap token exchange (authorization_code OR refresh_token) ──────
  if (path === "stargate/auth/token") {
    const body = await readBody<{
      grant_type?: string;
      code?: string;
      refresh_token?: string;
    }>(event);
    try {
      const data = await $fetch<{
        token: string;
        refresh_token?: string;
        expires_in?: number;
        refresh_expires_in?: number;
      }>(target, {
        method: "POST",
        headers: { ...clientIpHeaders(event) },
        body,
      });

      if (!data?.token) {
        throw createError({ status: 502, statusMessage: "Bad Gateway" });
      }

      await createSession(event, {
        token: data.token,
        refreshToken: data.refresh_token,
        expiresAt: isoFromNow(data.expires_in),
        refreshExpiresAt: isoFromNow(data.refresh_expires_in),
      });

      // Client only needs display metadata; the pair lives server-side.
      return {
        token: data.token,
        expiresIn: data.expires_in,
        refreshExpiresIn: data.refresh_expires_in,
      };
    } catch (err) {
      if (err && typeof err === "object" && "statusCode" in err) throw err;
      throw createError({ status: 502, statusMessage: "Bad Gateway", cause: err });
    }
  }

  // ── Periodic client refresh ping ──────────────────────────────────────
  if (path === "stargate/auth/refresh") {
    if (!pair) {
      throw createError({ status: 401, statusMessage: "Unauthorized" });
    }
    const ok = await refreshSession(event, sid);
    if (!ok) throw createError({ status: 401, statusMessage: "Unauthorized" });
    return { ok: true };
  }

  // ── Logout ────────────────────────────────────────────────────────────
  if (path === "stargate/auth/logout") {
    if (pair) {
      await $fetch(target, {
        method: "POST",
        headers: { Authorization: `Bearer ${pair.token}`, ...clientIpHeaders(event) },
      }).catch(() => {});
    }
    await deleteSession(event, sid);
    return { ok: true };
  }

  // ── Generic passthrough (with 401 → refresh → retry once) ─────────────
  const method = getMethod(event, "GET");
  const incomingHeaders = getRequestHeaders(event);

  // The `sid` cookie arrives at the proxy via `getCookie(event)` above (sent
  // natively by the browser on the client, or forwarded as the `cookie` header
  // on SSR). We authenticate the backend with `Authorization: Bearer` and never
  // forward the client cookie upstream. Forward the real client IP so login
  // endpoints rate-limit and audit the actual user (not FloatLand's own IP).
  const headers: Record<string, string> = {
    ...clientIpHeaders(event),
  };
  for (const [key, value] of Object.entries(incomingHeaders)) {
    if (DROP_ON_GENERIC.has(key.toLowerCase())) continue;
    headers[key] = value as string;
  }
  if (pair) {
    headers["authorization"] = `Bearer ${pair.token}`;
  }
  delete headers["cookie"];

  // Capture the request body once so the 401-retry can resend it without
  // re-consuming the request stream.
  const requestBody = PAYLOAD_METHODS.has(method)
    ? await readRawBody(event).catch(() => undefined)
    : undefined;

  async function forward(authPair: typeof pair): Promise<Response> {
    const fheaders: Record<string, string> = { ...headers };
    if (authPair) {
      fheaders["authorization"] = `Bearer ${authPair.token}`;
    }
    // `responseType: "stream"` keeps the upstream body un-consumed so we can
    // re-read it after a 401-refresh-retry; `ignoreResponseError` prevents
    // $fetch from throwing on 4xx/5xx so we can inspect the status first.
    return $fetch.raw(target, {
      method,
      headers: fheaders,
      body: requestBody,
      duplex: PAYLOAD_METHODS.has(method) ? "half" : undefined,
      responseType: "stream",
      ignoreResponseError: true,
    });
  }

  let response: Response;
  try {
    response = await forward(pair);
  } catch (err) {
    // Upstream unreachable (bad port, ECONNREFUSED, DNS failure). Surface a
    // controlled 502 rather than leaking an unhandled fetch error as a 500.
    throw createError({
      status: 502,
      statusMessage: "Bad Gateway",
      cause: err,
    });
  }

  if (pair && response.status === 401) {
    const ok = await refreshSession(event, sid);
    if (ok) {
      pair = await getAuthSession(sid);
    }
    if (ok && pair) {
      try {
        response = await forward(pair);
      } catch (err) {
        throw createError({
          status: 502,
          statusMessage: "Bad Gateway",
          cause: err,
        });
      }
    } else {
      await deleteSession(event, sid);
      setResponseStatus(event, 401);
      return { ok: false };
    }
  }

  // Re-emit the response, stripping any backend `set-cookie` (the backend is
  // decoupled from the browser; only our own `sid` cookie matters). With
  // `responseType: "stream"`, the body is `_data` (an un-consumed ReadableStream),
  // so we pass it through as-is to avoid re-reading a consumed buffer.
  //
  // Also drop `content-encoding` + `content-length`: undici auto-decompresses a
  // gzip response stream, but keeps the original (encoded) `Content-Length`
  // header. Forwarding that stale length with the decoded stream makes Node cut
  // the body early (mid-JSON) — the truncation that produced invalid JSON.
  const status = response.status;
  const cleanHeaders = new Headers();
  response.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === "set-cookie") return;
    if (k === "content-encoding" || k === "content-length") return;
    cleanHeaders.set(key, value);
  });
  // With `responseType: "stream"` ofetch sets `_data` to the un-consumed body.
  let body: ReadableStream | null | undefined;
  if ("_data" in response) {
    const data = response._data;
    if (data instanceof ReadableStream) body = data;
  }
  return new Response(body, { status, headers: cleanHeaders });
});
