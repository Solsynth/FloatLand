// Host-based routing engine shared by the dedicated surfaces (legacy + mail).
//
// Nitro middleware cannot re-route a request by mutating req.url — h3 recomputes
// the path per layer (`h3/dist/index.mjs` createAppEventHandler) — so a directive
// must either answer inline with a Response (stopping the layer chain) or return
// undefined to let the next handler (the Nuxt renderer) serve the route natively.
//
// Security note: the Host header selects the surface; the deployment must
// terminate TLS and route only the matching hostnames to this middleware (the
// same trust model as the modern app's own host-based behavior).

import { defineEventHandler } from "h3"
import type { H3Event } from "h3"

// Static assets a dedicated host must never intercept; Nuxt serves them as-is.
const STATIC_PREFIXES = ["/_nuxt", "/_", "/images/", "/fonts/", "/apple-touch", "/icon-outline.svg"]
const STATIC_EXACT: Record<string, true> = { "/favicon.png": true, "/robots.txt": true }

export interface HostDirective {
  /** Hostname (lowercase, no port) this directive owns, e.g. "legacy.solian.app". */
  host: string
  /**
   * Answer inline with a Response, or return undefined to let the Nuxt
   * renderer serve the route. `path` is the request path (query stripped).
   */
  handle(event: H3Event, path: string): Response | undefined | Promise<Response | undefined>
}

/** Same-host 302 to `location` on the request's own registered host, cache-bypassed. */
export function redirectToHost(event: H3Event, location: string, headers?: Record<string, string>): Response {
  const host = String(event.node?.req?.headers?.host ?? "").split(":")[0].toLowerCase()
  const proto = String(event.node?.req?.headers?.["x-forwarded-proto"] ?? "http").split(",")[0].trim() || "http"
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${proto}://${host}${location}`,
      "Cache-Control": "no-store",
      ...headers,
    },
  })
}

/**
 * Build a Nitro middleware that dispatches to the directive matching the
 * request Host header. Static assets and unowned hosts fall through untouched.
 */
export function defineHostRouting(directives: HostDirective[]) {
  return defineEventHandler((event: H3Event) => {
    const host = String(event.node?.req?.headers?.host ?? "").split(":")[0].toLowerCase()
    const directive = directives.find((d) => d.host === host)
    if (!directive) return

    const rawPath = String(event.node?.req?.url ?? "/").split("?")[0]
    const isStatic =
      STATIC_EXACT[rawPath] === true || STATIC_PREFIXES.some((prefix) => rawPath.startsWith(prefix))
    if (isStatic) return

    return directive.handle(event, rawPath)
  })
}
