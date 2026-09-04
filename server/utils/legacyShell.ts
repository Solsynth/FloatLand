// Legacy page render shell — emits a strict HTML 4.01 document with no
// client-side <script>, no <style>, no <link rel=stylesheet>, no external
// font/CSS. All formatting is inline or legacy-safe HTML 4 attributes.
// RFC 2119: no modern CSS classes are ever emitted by these helpers.

import { escAttr, escHtml, L10N, type LegacyLocale } from "./legacy"

export interface LegacyPage {
  /** Current locale. */
  locale: LegacyLocale
  /** Document title (no site suffix — add one in titleTemplate). */
  title: string
  /** Base path prefix ("" on legacy host, "/legacy" on main host). */
  base: string
  /** Modern-site absolute URL to feature in "switch" links. */
  mainHome: string
  /** One-paragraph description for <meta name="description">. */
  description?: string
  /** True when the request came in on the legacy host. */
  onLegacyHost: boolean
  /** Bandwidth mode active (suppresses images). */
  noImages: boolean
  /** Current request path (for same-page toggle links). */
  here: string
}

export function pageTitle(page: LegacyPage, suffix: string): string {
  return page.title ? `${page.title} · ${suffix}` : suffix
}

const SAFE_FONT = "Georgia, 'Times New Roman', Times, serif"

/**
 * Minimal header/footer with table-based layout (performs well in lynx-era
 * and IE5-6 class browsers). Inline style attributes only.
 */
export function legacyHeader(page: LegacyPage, suffix: string): string {
  const t = L10N[page.locale]
  const base = page.base
  const homeHref = `${base}/`
  const mainHref = page.mainHome

  return [
    '<table width="100%" cellpadding="0" cellspacing="0" style="font-family: ' + SAFE_FONT + '; font-size: 13px; background: #f5f2ea; margin: 0">',
    "<tr><td>",
    '<table width="100%" cellpadding="0" cellspacing="0" style="background: #17324a; border-bottom: 2px solid #c9a227">',
    "<tr>",
    '<td style="padding: 8px 14px; color: #f0e9d8">',
    `<a href="${homeHref}" style="color: #f5e9c8; text-decoration: none; font-size: 17px; font-weight: bold">Solar&nbsp;Network</a>`,
    `<span style="color: #a9b8c8; font-size: 11px; margin-left: 8px">${escHtml(t.nav.noJsNotice)}</span>`,
    "</td>",
    '<td align="right" style="padding: 8px 14px; white-space: nowrap">',
    navLink(base, "/", t.nav.home) + "&nbsp;&nbsp;|&nbsp;&nbsp;" +
      navLink(base, "/creators", t.nav.creators) + "&nbsp;&nbsp;|&nbsp;&nbsp;" +
      navLink(base, "/realms", t.nav.realms) + "&nbsp;&nbsp;|&nbsp;&nbsp;" +
      navLink(base, "/search", t.nav.search) + "&nbsp;&nbsp;|&nbsp;&nbsp;" +
      navLink(base, "/pricing", t.nav.pricing) + "&nbsp;&nbsp;|&nbsp;&nbsp;",
    `<a href="${mainHref}" style="color: #f5e9c8; font-size: 11px">${escHtml(t.nav.modernSite)}</a>`,
    "</td>",
    "</tr>",
    "</table>",
    "</td></tr>",
    "<tr><td>",
    '<table width="100%" cellpadding="0" cellspacing="0"><tr>',
    '<td width="20">&nbsp;</td>',
    '<td style="padding: 18px 0 6px 0">',
    `<h1 style="font-size: 22px; margin: 0 0 2px 0; color: #17222d">${escHtml(page.title)}</h1>`,
    page.description ? `<p style="margin: 2px 0 0 0; color: #5a524a; font-size: 13px">${escHtml(page.description)}</p>` : "",
    '<hr style="border: 0; border-top: 1px solid #cbbd9c; margin: 10px 0">',
    "</td>",
    '<td width="20">&nbsp;</td>',
    "</tr></table>",
    "</td></tr>",
    "<tr><td>",
    '<table width="100%" cellpadding="0" cellspacing="0"><tr>',
    '<td width="20">&nbsp;</td>',
    '<td style="font-size: 13px; color: #20242a">',
  ].join("\n")
}

function navLink(base: string, to: string, label: string): string {
  return `<a href="${base}${to}" style="color: #e9dcc0; text-decoration: none; font-size: 12px">${escHtml(label)}</a>`
}

/** Images on/off toggle that returns to the current page (no-JS friendly). */
function imgToggle(page: LegacyPage, t: (typeof L10N)[LegacyLocale]["nav"]): string {
  const target = page.noImages ? "0" : "1"
  const label = page.noImages ? t.showImages : t.hideImages
  const state = page.noImages ? t.imagesOff : t.imagesOn
  const path = page.here && page.here !== "/" ? page.here : `${page.base}/`
  return `<a href="${escAttr(path)}?img=${target}" style="color: #f5e9c8; font-size: 11px; text-decoration: none">[${escHtml(label)} · ${escHtml(state)}]</a>&nbsp;&nbsp;|&nbsp;&nbsp;`
}

export function legacyFooter(page: LegacyPage, year: number): string {
  const t = L10N[page.locale]
  const base = page.base
  const mainHref = page.mainHome
  return [
    "</td>",
    '<td width="20">&nbsp;</td>',
    "</tr></table>",
    "</td></tr>",
    "<tr><td>",
    '<table width="100%" cellpadding="0" cellspacing="0" style="background: #17324a; color: #cdd8e2; margin-top: 16px; font-size: 11px">',
    "<tr>",
    '<td style="padding: 10px 14px">',
    `${escHtml(t.footer.tagline)}<br>`,
    escHtml(t.footer.legacyNote).replace(/\s+/g, " ") + "<br>",
    imgToggle(page, t.nav) + "<br>",
    escHtml(t.footer.copyright.replace("{year}", String(year))) + "&nbsp;&nbsp;",
    `<a href="${base}/" style="color: #e9dcc0">${escHtml(t.nav.home)}</a>&nbsp;|&nbsp;`,
    `<a href="${mainHref}" style="color: #e9dcc0">${escHtml(t.nav.modernSite)}</a>`,
    "</td>",
    "</tr>",
    "</table>",
    "</td></tr>",
    "</table>",
  ].join("\n")
}

/** Render a full legacy HTML 4.01 Transitional document. */
export function renderLegacyDoc(page: LegacyPage, body: string): string {
  const suffix = "Solar Network"
  const docTitle = pageTitle(page, suffix)
  const desc = escHtml(page.description ?? "Solar Network — a federated social network.")
  const header = legacyHeader(page, suffix)
  const footer = legacyFooter(page, new Date().getUTCFullYear())

  return [
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">',
    `<html lang="${page.locale}">`,
    "<head>",
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
    `<title>${escHtml(docTitle)}</title>`,
    `<meta name="description" content="${desc}">`,
    `<link rel="canonical" href="${escHtml(page.mainHome)}">`,
    "</head>",
    '<body style="margin: 0; padding: 0; background: #f5f2ea; font-family: ' + SAFE_FONT + '">',
    header,
    body,
    footer,
    "</body>",
    "</html>",
  ].join("")
}

export function renderErrorPage(opts: { title: string; body: string; locale: "en" | "zh"; base: string; mainHome: string; noImages?: boolean; here?: string }, status: number): Response {
  const { title, body, locale, base, mainHome } = opts
  const page: LegacyPage = { locale, title, base, mainHome, onLegacyHost: base === "", noImages: opts.noImages ?? false, here: opts.here ?? "/" }
  const inner = `<p style="color: #5a524a">${body}</p><p><a href="${base}/">${escHtml(L10N[locale].common.back)}</a></p>`
  const html = renderLegacyDoc(page, inner)
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  })
}
