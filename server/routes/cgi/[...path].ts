import {
  defineEventHandler,
  getRouterParam,
  getMethod,
  getRequestHeaders,
  readRawBody,
  createError,
} from "h3";
import { clientIpHeaders, forwardedCookieHeader, relaySessionCookie } from "../../utils/authSession";

/**
 * Same-origin proxy to the Solar Network API.
 *
 * The browser talks to FloatLand on its own origin, and every API call leaves
 * from here. Two things are forwarded and nothing else:
 *
 *  - the session pair (`AuthToken`, `RefreshToken`) as cookies, which is how
 *    Stargate authenticates a browser request;
 *  - the real client IP, so rate limits and audit logs name the reader rather
 *    than this server.
 *
 * Stargate's own middleware renews an expired access token and answers with
 * fresh `Set-Cookie` headers; those are relayed back so the browser keeps the
 * rotated pair. There is no local session table, so this proxy holds no state.
 */

// Backend request methods whose body must be forwarded.
const PAYLOAD_METHODS: Record<string, true> = {
  PATCH: true,
  POST: true,
  PUT: true,
  DELETE: true,
};

// Connection-level headers that belong to the client/server hop, never the
// upstream request.
const DROP_HEADERS: Record<string, true> = {
  "transfer-encoding": true,
  "accept-encoding": true,
  connection: true,
  "keep-alive": true,
  upgrade: true,
  expect: true,
  host: true,
  // Replaced with the filtered session cookie header below.
  cookie: true,
  authorization: true,
};

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event);
  const apiProxiedUrl = (cfg.apiProxiedUrl ?? cfg.apiServerUrl) as string;

  const path = getRouterParam(event, "path") || "";
  // `getRouterParam("path")` strips the query, which would silently drop
  // pagination and filters; rebuild it from the raw request URL.
  const rawUrl = event.node?.req?.url ?? "";
  const qIdx = rawUrl.indexOf("?");
  const query = qIdx === -1 ? "" : rawUrl.slice(qIdx);
  const target = `${apiProxiedUrl}/${path}${query}`;

  const method = getMethod(event, "GET");
  const incomingHeaders = getRequestHeaders(event);

  const headers: Record<string, string> = { ...clientIpHeaders(event) };
  for (const [key, value] of Object.entries(incomingHeaders)) {
    if (DROP_HEADERS[key.toLowerCase()]) continue;
    headers[key] = value as string;
  }
  const cookie = forwardedCookieHeader(event);
  if (cookie) headers.cookie = cookie;

  // Capture the body once so a retry can resend it without re-consuming the
  // request stream. MUST read as a raw Buffer (`encoding: false`): h3's default
  // utf8 decode turns binary bytes (images, zips, videos) into U+FFFD, and
  // re-encoding that string corrupts every non-text upload.
  const requestBody = PAYLOAD_METHODS[method]
    ? await readRawBody(event, false).catch(() => undefined)
    : undefined;

  let response: Response;
  try {
    response = await $fetch.raw(target, {
      method,
      headers,
      body: requestBody,
      duplex: PAYLOAD_METHODS[method] ? "half" : undefined,
      responseType: "stream",
      ignoreResponseError: true,
    });
  } catch (err) {
    // Upstream unreachable (bad port, ECONNREFUSED, DNS failure). Surface a
    // controlled 502 rather than leaking an unhandled fetch error as a 500.
    throw createError({ status: 502, statusMessage: "Bad Gateway", cause: err });
  }

  // Relay the rotated session pair, drop every other cookie: the rest belong to
  // the API's own origin and mean nothing here.
  for (const header of response.headers.getSetCookie()) {
    relaySessionCookie(event, header);
  }

  // Re-emit the response body and headers. `content-encoding` and
  // `content-length` are dropped because undici auto-decompresses the stream
  // while keeping the encoded length, and forwarding that stale length makes
  // Node cut the body short — the truncation that produced invalid JSON.
  const cleanHeaders = new Headers();
  response.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === "set-cookie" || k === "content-encoding" || k === "content-length") return;
    cleanHeaders.set(key, value);
  });

  let body: ReadableStream | null | undefined;
  if ("_data" in response) {
    const data = response._data;
    if (data instanceof ReadableStream) body = data;
  }
  return new Response(body, { status: response.status, headers: cleanHeaders });
});
