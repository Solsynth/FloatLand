// Request-level helpers shared by all legacy route handlers.

import { getQuery, readBody, type H3Event } from "h3"
import {
  escHtml,
  formValue,
  L10N,
  legacyBase,
  legacyHost,
  legacyLocale,
  setLocaleCookie,
  type LegacyLocale,
} from "./legacy"
import { renderErrorPage, type LegacyPage } from "./legacyShell"

export { legacyBase } from "./legacy"

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

/** Render a 404/error legacy page with the proper charset + status. */
export function legacyError(event: H3Event, status: number, title: string, detail: string): Response {
  const locale = legacyLocale(event)
  const base = legacyBase(event)
  const modern = `https://${HOST_MAIN}/`
  return renderErrorPage({ title, body: escHtml(detail), locale, base, mainHome: modern }, status)
}

export function modernUrl(path: string): string {
  return `https://${HOST_MAIN}${path}`
}

export function legacyUrlForHost(event: H3Event, path: string): string {
  const host = legacyHost(event)
  const base = legacyBase(event)
  const proto = getProto(event)
  return `${proto}://${host}${base}${path}`
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

export async function readFormBody(event: H3Event): Promise<string> {
  try {
    const raw = await readBody(event)
    return typeof raw === "string" ? raw : ""
  } catch {
    return ""
  }
}

export function fieldValue(body: string, key: string): string {
  return formValue(body, key)
}

export { escHtml, L10N, legacyLocale }

/** Construct a page object used by the render helpers. */
export function pageCtx(locale: LegacyLocale, base: string, title: string, description: string | undefined, modern: string): LegacyPage {
  return { locale, title, base, description, mainHome: modern, onLegacyHost: base === "" }
}
