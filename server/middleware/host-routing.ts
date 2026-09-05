// Dedicated-host middleware: one directive per branded surface, dispatched by
// the Host header. Non-matching hosts and static assets fall through untouched.
//
// - legacy.solian.app  → no-JS legacy pages, answered inline (h3 stops the chain).
// - mail.solarpass.one → /mail is a real Nuxt page tree, so we only redirect the
//   bare host root to /mail and let the renderer serve every /mail/* route.
//
// Security note: the deployment must terminate TLS and route only these hostnames
// to this middleware (the same trust model as the modern app's host behavior).

import { getQuery } from "h3"
import type { H3Event } from "h3"
import { setLocaleCookie, setNoImagesCookie } from "../utils/legacy"
import { defineHostRouting, redirectToHost } from "../utils/hostRouting"
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

const MAIL_HOST = "mail.solarpass.one"
const MAIL_HOME = "/mail/inbox"

// --- legacy.solian.app: inline no-JS page rendering ---------------------------

function legacyLocaleToggle(event: H3Event, lang: string, rawPath: string): Response | undefined {
  if (lang !== "en" && lang !== "zh") return undefined
  return redirectToHost(event, rawPath, { "Set-Cookie": setLocaleCookie(event, lang) })
}

function legacyImageToggle(event: H3Event, img: string, rawPath: string): Response | undefined {
  if (img !== "0" && img !== "1") return undefined
  return redirectToHost(event, rawPath, { "Set-Cookie": setNoImagesCookie(event, img === "1") })
}

function dispatchLegacy(event: H3Event, path: string): Response {
  if (path === "/") return renderHome(event)
  if (path === "/search") return renderSearch(event)
  if (path === "/creators") return renderCreators(event)
  if (path === "/pricing") return renderPricing(event)
  if (path === "/realms") return renderRealmsIndex(event)

  const realmMatch = /^\/realms\/([^/]+)$/.exec(path)
  if (realmMatch) {
    return withLegacyParam(event, "realms", "slug", realmMatch[1], renderRealm)
  }
  const postMatch = /^\/posts\/([^/]+)$/.exec(path)
  if (postMatch) {
    return withLegacyParam(event, "posts", "id", postMatch[1], renderPost)
  }
  const pubMatch = /^\/publishers\/([^/]+)$/.exec(path)
  if (pubMatch) {
    return withLegacyParam(event, "publishers", "name", pubMatch[1], renderPublisher)
  }
  const acctMatch = /^\/accounts\/([^/]+)$/.exec(path)
  if (acctMatch) {
    return withLegacyParam(event, "accounts", "name", acctMatch[1], renderAccount)
  }

  return renderNotFound(event)
}

function withLegacyParam(
  event: H3Event,
  kind: "realms" | "posts" | "publishers" | "accounts",
  key: string,
  value: string,
  render: (e: H3Event) => Response | Promise<Response>,
): Response | Promise<Response> {
  // The shared renderers read route params via getRouterParam (h3 context).
  const ctx = event.context as Record<string, unknown>
  const params = (ctx.params as Record<string, string> | undefined) ?? {}
  params[key] = decodeURIComponent(value)
  ctx.params = params
  ctx.matchedRoute = { path: `/${kind}/:${key}`, params }
  return render(event)
}

const legacyDirective = {
  host: "legacy.solian.app",
  handle(event: H3Event, rawPath: string): Response | undefined {
    // Locale + bandwidth toggles handled uniformly (shared cookies).
    const q = getQuery(event)
    const lang = typeof q.lang === "string" ? q.lang : ""
    const img = typeof q.img === "string" ? q.img : ""
    const toggle =
      legacyLocaleToggle(event, lang, rawPath) ?? legacyImageToggle(event, img, rawPath)
    if (toggle) return toggle

    // "/legacy*" on the legacy host: someone linked the main-host prefix.
    // Rewrite to the unprefixed equivalent (route handlers expect that here).
    if (rawPath === "/legacy" || rawPath.startsWith("/legacy/")) {
      return dispatchLegacy(event, rawPath.slice("/legacy".length) || "/")
    }

    return dispatchLegacy(event, rawPath)
  },
}

// --- mail.solarpass.one: native Nuxt /mail, root portaled to the inbox ---------

const mailDirective = {
  host: MAIL_HOST,
  handle(event: H3Event, rawPath: string): Response | undefined {
    // Bare root portals to the webmail home.
    if (rawPath === "/") {
      return redirectToHost(event, MAIL_HOME)
    }
    // Everything else is served by the Nuxt renderer natively: /mail/* are real
    // pages, and /auth/* must resolve so the mail pages' auth middleware can
    // send unauthenticated visitors to login (portal-ing it here would loop).
    return undefined
  },
}

export default defineHostRouting([legacyDirective, mailDirective])
