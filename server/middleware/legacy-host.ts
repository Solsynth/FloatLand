// Host-based routing: legacy.solian.app is served by the shared no-JS legacy
// page module directly from this middleware (returning a Response stops the
// h3 layer chain). Nitro middleware cannot re-route requests by mutating the
// URL — h3 recomputes req.url per layer — so answering inline is the only
// reliable host dispatch. The main host keeps serving /legacy/* through the
// ordinary route handlers (same renderers).
//
// Security note: the Host header selects the surface; the deployment must
// terminate TLS and route only legacy.solian.app to this middleware (the
// same trust model as the modern app's own host-based behavior).

import type { H3Event } from "h3"
import { defineEventHandler } from "h3"
import { legacyBase, legacyLocale } from "../utils/legacy"
import { setLocaleCookie } from "../utils/legacy"
import { getQuery } from "h3"
import {
  renderAccount,
  renderCreators,
  renderHome,
  renderNotFound,
  renderPost,
  renderPricing,
  renderPublisher,
  renderRealm,
  renderRealmsIndex,
  renderSearch,
} from "../utils/legacyPages"

const LEGACY_HOST = "legacy.solian.app"
const STATIC_PREFIXES = ["/_nuxt", "/_", "/images/", "/fonts/", "/apple-touch", "/icon-outline.svg"]
const STATIC_EXACT = new Set(["/favicon.png", "/robots.txt"])

export default defineEventHandler((event: H3Event) => {
  const host = String(event.node?.req?.headers?.host ?? "").split(":")[0].toLowerCase()
  if (host !== LEGACY_HOST) {
    return
  }

  const rawPath = String(event.node?.req?.url ?? "/").split("?")[0]
  const isStatic = STATIC_EXACT.has(rawPath) || STATIC_PREFIXES.some((p) => rawPath.startsWith(p))
  if (isStatic) {
    return
  }

  // Locale toggle handled uniformly (shared cookie + same-host redirect).
  const q = getQuery(event)
  const lang = typeof q.lang === "string" ? q.lang : ""
  if (lang === "en" || lang === "zh") {
    const cookie = setLocaleCookie(event, lang)
    const proto = String(event.node?.req?.headers?.["x-forwarded-proto"] ?? "http").split(",")[0].trim() || "http"
    throw new Response(null, {
      status: 302,
      headers: { Location: `${proto}://${host}${rawPath}`, "Cache-Control": "no-store", "Set-Cookie": cookie },
    })
  }

  // "/legacy*" on the legacy host: someone linked the main-host prefix.
  if (rawPath === "/legacy" || rawPath.startsWith("/legacy/")) {
    // Rewrite to the unprefixed equivalent by re-dispatching through the
    // host path (the route handlers expect unprefixed paths on this host).
    return dispatch(event, rawPath.slice("/legacy".length) || "/")
  }

  return dispatch(event, rawPath)
})

function dispatch(event: H3Event, path: string): Response | Promise<Response> {
  // Public page routes (mirroring the modern app's URLs).
  if (path === "/" ) return renderHome(event)
  if (path === "/search") return renderSearch(event)
  if (path === "/creators") return renderCreators(event)
  if (path === "/pricing") return renderPricing(event)
  if (path === "/realms") return renderRealmsIndex(event)

  const realmMatch = /^\/realms\/([^/]+)$/.exec(path)
  if (realmMatch) {
    return withParam(event, "realms", "slug", realmMatch[1], renderRealm)
  }
  const postMatch = /^\/posts\/([^/]+)$/.exec(path)
  if (postMatch) {
    return withParam(event, "posts", "id", postMatch[1], renderPost)
  }
  const pubMatch = /^\/publishers\/([^/]+)$/.exec(path)
  if (pubMatch) {
    return withParam(event, "publishers", "name", pubMatch[1], renderPublisher)
  }
  const acctMatch = /^\/accounts\/([^/]+)$/.exec(path)
  if (acctMatch) {
    return withParam(event, "accounts", "name", acctMatch[1], renderAccount)
  }

  return renderNotFound(event)
}

function withParam(event: H3Event, kind: "realms" | "posts" | "publishers" | "accounts", key: string, value: string, render: (e: H3Event) => Response | Promise<Response>): Response | Promise<Response> {
  // The shared renderers read route params via getRouterParam (h3 context).
  const ctx = event.context as Record<string, unknown>
  const params = (ctx.params as Record<string, string> | undefined) ?? {}
  params[key] = decodeURIComponent(value)
  ctx.params = params
  ctx.matchedRoute = { path: `/${kind}/:${key}`, params }
  return render(event)
}
