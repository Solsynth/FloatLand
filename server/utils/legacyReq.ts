// Request-level helpers shared by all legacy route handlers.

import { getQuery, type H3Event } from "h3"
import {
  legacyBase,
  legacyHost,
  legacyLocale,
  setLocaleCookie,
  setNoImagesCookie,
  type LegacyLocale,
} from "./legacy"
export { legacyBase, legacyLocale } from "./legacy"

const HOST_MAIN = "solian.app"
const HOST_LEGACY = "legacy.solian.app"

export interface LegacyRequest {
  event: H3Event
  locale: LegacyLocale
  /** "" when on legacy host, else "/legacy". */
  base: string
  /** Path of the current request (for form actions / pagination). */
  here: string
  /** Modern-site URL matching the current page (canonical + switch links). */
  modern: string
  onLegacyHost: boolean
}

/**
 * Bootstrap per-request legacy context. Handles the ?lang=en|zh locale
 * switch: sets the i18n_locale cookie and 302-redirects to the same path
 * without the query string (pure no-JS flow).
 */
export function beginLegacy(event: H3Event, modernPath: string): LegacyRequest {
  const onLegacyHost = legacyHost(event) === HOST_LEGACY
  const base = legacyBase(event)
  const locale = legacyLocale(event)

  const q = getQuery(event)
  const lang = typeof q.lang === "string" ? q.lang : ""
  const img = typeof q.img === "string" ? q.img : ""
  if (lang === "en" || lang === "zh") {
    // Redirect with the cookie attached directly (the event's own response
    // headers are bypassed when a Response is thrown in nitro). Stay on the
    // same host (dev host or legacy subdomain in prod).
    const cookie = setLocaleCookie(event, lang)
    const url = reqUrl(event)
    const clean = url.split("?")[0]
    const target = `${getProto(event)}://${getHostHeader(event)}${clean}`
    throw new Response(null, {
      status: 302,
      headers: {
        Location: target,
        "Cache-Control": "no-store",
        "Set-Cookie": cookie,
      },
    })
  }
  if (img === "0" || img === "1") {
    // Bandwidth toggle: legacy_noimg=1 hides all images; =0 restores them.
    const cookie = setNoImagesCookie(event, img === "1")
    const url = reqUrl(event)
    const clean = url.split("?")[0]
    const target = `${getProto(event)}://${getHostHeader(event)}${clean}`
    throw new Response(null, {
      status: 302,
      headers: {
        Location: target,
        "Cache-Control": "no-store",
        "Set-Cookie": cookie,
      },
    })
  }

  return { event, locale, base, here: reqUrl(event), modern: modernPath, onLegacyHost }
}

function reqUrl(event: H3Event): string {
  return event.node?.req?.url ?? "/"
}

function getHostHeader(event: H3Event): string {
  return String(event.node?.req?.headers?.host ?? "localhost").split(":")[0]
}

function getProto(event: H3Event): string {
  const fwd = String(event.node?.req?.headers?.["x-forwarded-proto"] ?? "")
  const proto = fwd.split(",")[0].trim()
  return proto === "https" ? "https" : "http"
}

export function modernUrl(path: string): string {
  return `https://${HOST_MAIN}${path}`
}

// ---------------------------------------------------------------------------
// Query / body helpers
// ---------------------------------------------------------------------------

export function qInt(event: H3Event, key: string, fallback: number): number {
  const v = queryRaw(event, key)
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n >= 1 ? n : fallback
}

export function qStr(event: H3Event, key: string, fallback = ""): string {
  const v = queryRaw(event, key)
  return v || fallback
}

function queryRaw(event: H3Event, key: string): string {
  const v = getQuery(event)[key]
  if (v === undefined || v === null) return ""
  return Array.isArray(v) ? String(v[0] ?? "") : String(v)
}
