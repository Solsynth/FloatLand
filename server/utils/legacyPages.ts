// Shared legacy page renderers — used by BOTH the /legacy/* route handlers
// (main host) and the legacy.solian.app host middleware (which must answer
// directly because nitro middleware cannot re-route requests). Each function
// returns a full legacy HTML 4.01 Response.

import type { H3Event } from "h3"
import { getRouterParam } from "h3"
import { apiGet, escHtml, fileUrl, L10N, parseJson, renderMd, rewriteInternalLinks } from "./legacy"
import { renderLegacyDoc } from "./legacyShell"
import {
  normalizePost,
  normalizePosts,
  normalizePublisher,
  normalizeRealm,
  normalizeRealms,
  normalizeAccount,
  type LegacyPost,
  type LegacyPublisher,
  type LegacyRealm,
  type LegacyAccount,
} from "./legacyModels"
import { postCard, renderAttachments } from "./legacyContent"
import { legacyBase, legacyLocale, modernUrl } from "./legacyReq"
import { legacyNoImages } from "./legacy"

type L = (typeof L10N)["en"] | (typeof L10N)["zh"]

const P = 20

/** Per-request legacy render context (locale + path prefix + translations). */
export interface PageCtx {
  locale: "en" | "zh"
  base: string
  t: L
  /** Bandwidth mode: suppress images (cookie legacy_noimg). */
  noImages: boolean
  /** Current request path (for same-page toggle links). */
  here: string
}

function ctx(event: H3Event): PageCtx {
  const locale = legacyLocale(event)
  const base = legacyBase(event)
  const rawUrl = String((event.node?.req as { url?: string } | undefined)?.url ?? "/")
  const here = rawUrl.split("?")[0] || "/"
  return { locale, base, t: L10N[locale], noImages: legacyNoImages(event), here }
}

/** Card options shared by every listing on a page. */
function cardOpts(c: PageCtx): { base: string; locale: "en" | "zh"; noImages: boolean } {
  return { base: c.base, locale: c.locale, noImages: c.noImages }
}

function html(page: PageCtx, title: string, body: string, description: string | undefined, canonicalPath: string, cache: string): Response {
  return new Response(
    renderLegacyDoc(
      {
        locale: page.locale,
        title,
        base: page.base,
        description,
        mainHome: modernUrl(canonicalPath),
        onLegacyHost: page.base === "",
        noImages: page.noImages,
        here: page.here,
      },
      body,
    ),
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": cache } },
  )
}

function notFoundPage(page: PageCtx, title: string, detail: string): Response {
  const t = page.t
  return new Response(
    renderLegacyDoc(
      {
        locale: page.locale,
        title,
        base: page.base,
        description: undefined,
        mainHome: modernUrl("/"),
        onLegacyHost: page.base === "",
        noImages: page.noImages,
        here: page.here,
      },
      `<p>${escHtml(detail)}</p><p><a href="${page.base}/" style="color: #17324a">${escHtml(t.common.back)}</a></p>`,
    ),
    { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  )
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

/** Fetch the timeline for `page`. The API is cursor-based (no offset), so
 *  reaching page N requires following next_cursor N-1 times server-side.
 *  Cap the walk to keep pathological pagination from hammering the API. */
async function fetchTimelinePage(
  page: number,
): Promise<{ payload: { items?: unknown[] } | null; next: string | null }> {
  let cursor: string | null = null
  let final: { items?: unknown[]; next_cursor?: string | null } | null = null
  const hops = Math.min(Math.max(page - 1, 0), 20)
  for (let i = 0; i <= hops; i++) {
    const qs = cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""
    const res = await apiGet(`/sphere/timeline?mode=latest&take=${P}${qs}`)
    const payload = parseJson<{ items?: unknown[]; next_cursor?: string | null }>(res)
    if (!payload) return { payload: null, next: null }
    final = payload
    cursor = payload.next_cursor ?? null
    if (!cursor) break
  }
  return { payload: final, next: final?.next_cursor ?? null }
}

export async function renderHome(event: H3Event): Promise<Response> {
  const c = ctx(event)
  const { t } = c
  const page = Math.max(1, parseInt(String(getQuerySafe(event).page ?? "1"), 10) || 1)

  let featuredCards = ""
  if (page === 1) {
    const res = await apiGet("/sphere/posts/featured")
    const posts = normalizePosts(parseJson<unknown>(res))
    const cards = posts.slice(0, 5).map((p) => postCard(p, cardOpts(c))).join("\n")
    if (cards) featuredCards = `<h2 style="font-size: 16px; margin: 0 0 6px 0; color: #17222d">${escHtml(t.home.featured)}</h2>${cards}`
  }

  const tl = await fetchTimelinePage(page)
  const payload = tl.payload
  let postsHtml = ""
  let errorHtml = ""
  if (!payload) {
    errorHtml = `<p style="color: #8a2626">${escHtml(t.errors.network)}</p>`
  } else {
    const items: unknown[] = []
    for (const ev of payload.items ?? []) {
      if (ev && typeof ev === "object" && (ev as Record<string, unknown>).type === "posts.new") {
        const data = (ev as Record<string, unknown>).data
        if (data) items.push(data)
      }
    }
    const posts = normalizePosts(items)
    postsHtml = posts.length
      ? posts.map((p) => postCard(p, cardOpts(c))).join("\n") + pagesNav(c.base, page, tl.next, c.locale, "/", "?")
      : `<p>${escHtml(t.home.empty)}</p>`
  }

  const body = [
    featuredCards,
    `<h2 style="font-size: 16px; margin: 0 0 6px 0; color: #17222d">${escHtml(t.home.latest)}</h2>`,
    errorHtml,
    postsHtml,
  ].join("\n")
  return html(c, t.home.title, body, t.home.subtitle, "/", "public, max-age=60")
}

function pagesNav(base: string, page: number, next: string | null, locale: "en" | "zh", path: string, queryPrefix: string): string {
  if (!next && page <= 1) return ""
  const t = L10N[locale]
  const hrefFor = (p: number) => `${base}${path}${queryPrefix}page=${p}`
  const parts: string[] = []
  if (page > 1) parts.push(`<a href="${hrefFor(page - 1)}" rel="prev" style="color: #17324a">${escHtml(t.common.prevPage)}</a>`)
  parts.push(`<span>${page}</span>`)
  if (next) parts.push(`<a href="${hrefFor(page + 1)}" rel="next" style="color: #17324a">${escHtml(t.common.nextPage)}</a>`)
  return `<p style="margin: 8px 0">${parts.join(" &nbsp;·&nbsp; ")}</p>`
}

// ---------------------------------------------------------------------------
// Post detail
// ---------------------------------------------------------------------------

export async function renderPost(event: H3Event): Promise<Response> {
  const c = ctx(event)
  const { t } = c
  const id = getRouterParam(event, "id") ?? ""
  if (!id) return notFoundPage(c, t.common.notFound, t.post.deleted)

  const [postRes, repliesRes] = await Promise.all([
    apiGet(`/sphere/posts/${encodeURIComponent(id)}`),
    apiGet(`/sphere/posts/${encodeURIComponent(id)}/replies`),
  ])
  const post = normalizePost(parseJson<unknown>(postRes))
  if (!post) return notFoundPage(c, t.common.notFound, t.post.deleted)

  const replies = normalizePosts(parseJson<unknown>(repliesRes))
  const replyCards = replies.length
    ? replies.map((r) => postCard(r, cardOpts(c))).join("\n")
    : `<p style="color: #5a524a">${escHtml(t.post.noReplies)}</p>`

  const name = post.publisher?.nick || post.publisher?.name || "Unknown"
  const meta = (post.description || post.content || "").replace(/[#*`_>~|=![\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 200)

  const body = [
    detail(post, c),
    `<h2 style="font-size: 16px; margin: 18px 0 6px 0; color: #17222d">${escHtml(t.post.replies)} (${replies.length})</h2>`,
    replyCards,
    `<p style="margin-top: 16px"><a href="${c.base}/" style="color: #17324a">&larr; ${escHtml(t.common.back)}</a></p>`,
  ].join("\n")
  return html(c, post.title || `${name}'s Post`, body, meta || undefined, `/posts/${encodeURIComponent(id)}`, "public, max-age=120")
}

function detail(post: LegacyPost, c: PageCtx): string {
  const { t } = c
  const isArticle = post.type === 1
  const name = post.publisher?.nick || post.publisher?.name || "Unknown"
  const avatar = fileUrl(post.publisher?.picture?.id)
  const time = post.publishedAt ? new Date(post.publishedAt).toUTCString() : ""

  const bits: string[] = []
  if (avatar && !c.noImages) bits.push(`<img src="${escHtml(avatar)}" alt="" width="40" height="40" style="vertical-align: middle; margin-right: 8px; border: 0">`)
  bits.push(`<a href="${c.base}/publishers/${encodeURIComponent(post.publisher?.name ?? "")}" style="color: #17324a; font-weight: bold; text-decoration: none">${escHtml(name)}</a>`)
  if (post.realm) bits.push(`<span style="color: #8a8578">@</span><a href="${c.base}/realms/${encodeURIComponent(post.realm.slug)}" style="color: #8a8578; text-decoration: none">${escHtml(post.realm.name)}</a>`)
  const header = bits.join(" ")

  const content = post.isTruncated && !isArticle ? `${post.content}…` : post.content
  const att = renderAttachments(post, { singleLabel: t.post.attachment, multiLabel: t.postCard.attachments, noImages: c.noImages })
  return [
    `<div style="background: #fffdf6; border: 1px solid #d8cfb4; padding: 14px 16px; margin-bottom: 10px">`,
    `<p style="margin: 0 0 8px 0; font-size: 14px">${header}</p>`,
    isArticle ? `<p style="margin:0 0 4px 0"><span style="font-size:12px;color:#8a6d1a;text-transform:uppercase">${escHtml(t.post.article)}</span></p>` : "",
    post.title ? `<h1 style="font-size: 20px; margin: 4px 0 6px 0; color: #17222d">${escHtml(post.title)}</h1>` : "",
    `<div style="margin: 6px 0">${rewriteInternalLinks(renderMd(content, c.noImages), c.base)}</div>`,
    att,
    `<p style="margin: 8px 0 0 0; color: #8a8578; font-size: 11px">${escHtml(t.post.published)} ${escHtml(time)}</p>`,
    "</div>",
  ].join("\n")
}

// ---------------------------------------------------------------------------
// Realms directory
// ---------------------------------------------------------------------------

export async function renderRealmsIndex(event: H3Event): Promise<Response> {
  const c = ctx(event)
  const { t } = c
  const res = await apiGet("/passport/realms/public")
  const realms = normalizeRealms(parseJson<unknown>(res))
  const cards = realms.length
    ? realms.map((r) => realmRow(r, c.base, c.noImages)).join("\n")
    : `<p style="color: #5a524a">${escHtml(t.realms.empty)}</p>`
  const body = [
    `<h2 style="font-size: 16px; margin: 0 0 6px 0; color: #17222d">${escHtml(t.realms.title)}</h2>`,
    cards,
    `<p style="margin-top: 12px"><a href="${c.base}/" style="color: #17324a">&larr; ${escHtml(t.common.back)}</a></p>`,
  ].join("\n")
  return html(c, t.realms.title, body, t.realms.subtitle, "/realms", "public, max-age=300")
}

function realmRow(realm: LegacyRealm, base: string, noImg: boolean): string {
  const avatar = realm.picture?.id ? `https://api.solian.app/drive/files/${encodeURIComponent(realm.picture.id)}` : null
  const img = avatar && !noImg ? `<img src="${escHtml(avatar)}" alt="" width="40" height="40" style="vertical-align: middle; margin-right: 8px; border: 0">` : ""
  const desc = realm.description ? realm.description.split("\n")[0].slice(0, 160) : ""
  return `<div style="background: #fffdf6; border: 1px solid #d8cfb4; padding: 10px 12px; margin: 0 0 8px 0">${img}<a href="${base}/realms/${encodeURIComponent(realm.slug)}" style="color: #17324a; text-decoration: none; font-weight: bold">${escHtml(realm.name)}</a> <span style="color: #8a8578; font-size: 11px">@${escHtml(realm.slug)}</span><br><span style="color: #5a524a; font-size: 12px">${escHtml(desc)}</span></div>`
}

// ---------------------------------------------------------------------------
// Realm detail
// ---------------------------------------------------------------------------

export async function renderRealm(event: H3Event): Promise<Response> {
  const c = ctx(event)
  const { t } = c
  const slug = getRouterParam(event, "slug") ?? ""
  if (!slug) return notFoundPage(c, t.realms.notFound, t.realms.notFoundDesc)

  const [realmRes, postsRes] = await Promise.all([
    apiGet(`/passport/realms/${encodeURIComponent(slug)}`),
    apiGet(`/sphere/posts?realm=${encodeURIComponent(slug)}&take=30&offset=0&replies=false&orderDesc=true`),
  ])
  const realm = normalizeRealm(parseJson<unknown>(realmRes))
  if (!realm) return notFoundPage(c, t.realms.notFound, t.realms.notFoundDesc)

  const raw = parseJson<unknown>(postsRes)
  const posts = Array.isArray(raw) ? raw.map((p) => normalizePost(p)).filter((p): p is LegacyPost => !!p) : []

  const body = [
    realmHeader(realm, c.base, c.locale, c.noImages),
    `<h2 style="font-size: 16px; margin: 18px 0 6px 0; color: #17222d">${escHtml(t.realms.postsIn)}</h2>`,
    posts.length
      ? posts.map((p) => postCard(p, cardOpts(c))).join("\n")
      : `<p style="color: #5a524a">${escHtml(t.realms.noPosts)}</p>`,
    `<p style="margin-top: 16px"><a href="${c.base}/realms" style="color: #17324a">&larr; ${escHtml(t.realms.backToRealms)}</a></p>`,
  ].join("\n")
  return html(c, realm.name, body, realm.description ?? undefined, `/realms/${encodeURIComponent(slug)}`, "public, max-age=120")
}

function realmHeader(realm: LegacyRealm, base: string, locale: "en" | "zh", noImg: boolean): string {
  const t = L10N[locale]
  const avatar = realm.picture?.id ? `https://api.solian.app/drive/files/${encodeURIComponent(realm.picture.id)}` : null
  const img = avatar && !noImg ? `<img src="${escHtml(avatar)}" alt="" width="64" height="64" style="vertical-align: middle; margin-right: 10px; border: 0">` : ""
  const kind = realm.isCommunity === true ? t.common.community : realm.isCommunity === false ? t.common.organization : ""
  const verified = realm.verification ? `<span style="color: #8a6d1a; font-size: 12px">[${escHtml(realm.verification)}]</span>` : ""
  const desc = realm.description ? `<p style="margin: 6px 0 0 0; color: #5a524a; font-size: 13px">${escHtml(realm.description)}</p>` : `<p style="margin: 6px 0 0 0; color: #8a8578">${escHtml(t.realms.noDescription)}</p>`
  return `<div style="background: #fffdf6; border: 1px solid #d8cfb4; padding: 14px 16px; margin-bottom: 10px">${img}<h1 style="font-size: 20px; margin: 0 0 2px 0; color: #17222d">${escHtml(realm.name)}</h1><p style="margin: 0 0 6px 0; color: #8a8578; font-size: 12px">@${escHtml(realm.slug)}${kind ? " · " + escHtml(kind) : ""}</p>${verified ? `<p style="margin:0">${verified}</p>` : ""}${desc}</div>`
}

// ---------------------------------------------------------------------------
// Creators directory / search
// ---------------------------------------------------------------------------

export async function renderCreators(event: H3Event): Promise<Response> {
  const c = ctx(event)
  const { t } = c
  const q = String(getQuerySafe(event).q ?? "").trim()

  let rows: LegacyPublisher[] = []
  if (q) {
    const res = await apiGet(`/sphere/publishers/search?query=${encodeURIComponent(q)}&take=24`)
    rows = normalizePubs(parseJson<unknown>(res))
  } else {
    const res = await apiGet("/sphere/timeline?mode=latest&take=60")
    const payload = parseJson<{ items?: unknown[] }>(res)
    const seen = new Set<string>()
    for (const ev of payload?.items ?? []) {
      if (ev && typeof ev === "object" && (ev as Record<string, unknown>).type === "posts.new") {
        const data = (ev as Record<string, unknown>).data
        const pub = data && typeof data === "object" ? normalizePublisher((data as Record<string, unknown>).publisher) : null
        if (pub && !seen.has(pub.name)) {
          seen.add(pub.name)
          rows.push(pub)
        }
      }
    }
  }

  const resultsHtml = rows.length
    ? rows.map((p) => pubRow(p, c.base, c.locale, c.noImages)).join("\n")
    : `<p style="color: #5a524a">${escHtml(q ? t.creators.noResults : t.creators.noPosts)}</p>`
  const form = `<form method="get" action="${c.base}/creators" style="margin: 0 0 12px 0"><input type="text" name="q" value="${escHtml(q)}" size="24" style="font-family: inherit; font-size: 13px; padding: 3px 5px"> <button type="submit" style="font-family: inherit; font-size: 13px; padding: 3px 10px">${escHtml(t.creators.search)}</button></form>`
  const body = [
    form,
    `<h2 style="font-size: 16px; margin: 0 0 6px 0; color: #17222d">${escHtml(q ? `${t.creators.search}: ${q}` : t.creators.popular)}</h2>`,
    resultsHtml,
    `<p style="margin-top: 12px"><a href="${c.base}/" style="color: #17324a">&larr; ${escHtml(t.common.back)}</a></p>`,
  ].join("\n")
  return html(c, t.creators.title, body, t.creators.subtitle, "/creators", "public, max-age=60")
}

function normalizePubs(raw: unknown): LegacyPublisher[] {
  if (!Array.isArray(raw)) return []
  const out: LegacyPublisher[] = []
  for (const item of raw) {
    const p = normalizePublisher(item)
    if (p) out.push(p)
  }
  return out
}

function pubRow(publisher: LegacyPublisher, base: string, locale: "en" | "zh", noImg: boolean): string {
  const t = L10N[locale]
  const avatar = fileUrl(publisher.picture?.id)
  const img = avatar && !noImg ? `<img src="${escHtml(avatar)}" alt="" width="40" height="40" style="vertical-align: middle; margin-right: 8px; border: 0">` : ""
  const name = publisher.nick || publisher.name
  const verified = publisher.verification ? `<span style="color: #8a6d1a; font-size: 11px">[${escHtml(publisher.verification)}]</span>` : ""
  const subs = publisher.stat?.subscribers ? ` · ${publisher.stat.subscribers} ${t.creators.subscribers.toLowerCase()}` : ""
  return `<div style="background: #fffdf6; border: 1px solid #d8cfb4; padding: 8px 12px; margin: 0 0 6px 0">${img}<a href="${base}/publishers/${encodeURIComponent(publisher.name)}" style="color: #17324a; text-decoration: none; font-weight: bold">${escHtml(name)}</a>${verified} <span style="color: #8a8578; font-size: 11px">@${escHtml(publisher.name)}${subs}</span></div>`
}

// ---------------------------------------------------------------------------
// Publisher profile
// ---------------------------------------------------------------------------

export async function renderPublisher(event: H3Event): Promise<Response> {
  const c = ctx(event)
  const { t } = c
  const name = getRouterParam(event, "name") ?? ""
  const page = Math.max(1, parseInt(String(getQuerySafe(event).page ?? "1"), 10) || 1)
  const offset = (page - 1) * P

  if (!name) return notFoundPage(c, t.common.notFound, t.creators.noResults)
  const [pubRes, postsRes] = await Promise.all([
    apiGet(`/sphere/publishers/${encodeURIComponent(name)}`),
    apiGet(`/sphere/posts?pub=${encodeURIComponent(name)}&take=${P}&offset=${offset}&replies=false&orderDesc=true`),
  ])
  const publisher = normalizePublisher(parseJson<unknown>(pubRes))
  if (!publisher) return notFoundPage(c, t.common.notFound, t.creators.noResults)

  const raw = parseJson<unknown>(postsRes)
  const posts = Array.isArray(raw) ? raw.map((p) => normalizePost(p)).filter((p): p is LegacyPost => !!p) : []
  const total = readTotal(postsRes.headers)
  const pages = Math.max(1, Math.ceil(total / P))

  const body = [
    pubProfile(publisher, c.base, c.locale, c.noImages),
    `<h2 style="font-size: 16px; margin: 18px 0 6px 0; color: #17222d">${escHtml(t.creators.posts)}</h2>`,
    posts.length
      ? posts.map((p) => postCard(p, cardOpts(c))).join("\n")
      : `<p style="color: #5a524a">${escHtml(t.creators.noPosts)}</p>`,
    pagedNav(c.base, name, page, pages, c.locale, "publishers"),
  ].join("\n")
  return html(c, publisher.nick || publisher.name, body, publisher.bio ?? undefined, `/publishers/${encodeURIComponent(name)}`, "public, max-age=120")
}

function pubProfile(publisher: LegacyPublisher, base: string, locale: "en" | "zh", noImg: boolean): string {
  const t = L10N[locale]
  const avatar = fileUrl(publisher.picture?.id)
  const img = avatar && !noImg ? `<img src="${escHtml(avatar)}" alt="" width="64" height="64" style="vertical-align: middle; margin-right: 10px; border: 0">` : ""
  const name = publisher.nick || publisher.name
  const verified = publisher.verification ? `<span style="color: #8a6d1a; font-size: 12px">[${escHtml(publisher.verification)}]</span>` : ""
  const stats: string[] = []
  if (publisher.stat?.posts) stats.push(`${publisher.stat.posts} ${t.creators.posts.toLowerCase()}`)
  if (publisher.stat?.subscribers) stats.push(`${publisher.stat.subscribers} ${t.creators.subscribers.toLowerCase()}`)
  if (publisher.stat?.views) stats.push(`${publisher.stat.views} ${t.creators.views.toLowerCase()}`)
  const statLine = stats.length ? `<p style="margin: 2px 0 0 0; color: #8a8578; font-size: 11px">${stats.join(" · ")}</p>` : ""
  const bio = publisher.bio ? `<p style="margin: 6px 0 0 0; color: #5a524a; font-size: 13px">${escHtml(publisher.bio)}</p>` : ""
  const accLink = publisher.accountName ? `<p style="margin: 6px 0 0 0; font-size: 12px"><a href="${base}/accounts/${encodeURIComponent(publisher.accountName)}" style="color: #17324a">@${escHtml(publisher.accountName)}</a></p>` : ""
  return `<div style="background: #fffdf6; border: 1px solid #d8cfb4; padding: 14px 16px; margin-bottom: 10px">${img}<h1 style="font-size: 20px; margin: 0 0 2px 0; color: #17222d">${escHtml(name)}${verified}</h1><p style="margin: 0; color: #8a8578; font-size: 12px">@${escHtml(publisher.name)}</p>${statLine}${bio}${accLink}</div>`
}

function pagedNav(base: string, slug: string, page: number, pages: number, locale: "en" | "zh", kind: string): string {
  if (pages <= 1) return ""
  const t = L10N[locale]
  const parts: string[] = []
  const href = (p: number) => `${base}/${kind}/${encodeURIComponent(slug)}?page=${p}`
  if (page > 1) parts.push(`<a href="${href(page - 1)}" rel="prev" style="color: #17324a">${escHtml(t.common.prevPage)}</a>`)
  parts.push(`<span>${page} / ${pages}</span>`)
  if (page < pages) parts.push(`<a href="${href(page + 1)}" rel="next" style="color: #17324a">${escHtml(t.common.nextPage)}</a>`)
  return `<p style="margin: 8px 0">${parts.join(" &nbsp;·&nbsp; ")}</p>`
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export async function renderAccount(event: H3Event): Promise<Response> {
  const c = ctx(event)
  const { t } = c
  const name = getRouterParam(event, "name") ?? ""
  const page = Math.max(1, parseInt(String(getQuerySafe(event).page ?? "1"), 10) || 1)
  const offset = (page - 1) * P

  if (!name) return notFoundPage(c, t.account.notFound, t.account.notFoundDesc)
  const acctRes = await apiGet(`/stargate/accounts/${encodeURIComponent(name)}`)
  const account = normalizeAccount(parseJson<unknown>(acctRes))
  if (!account) return notFoundPage(c, t.account.notFound, t.account.notFoundDesc)

  const acctId = (parseJson<unknown>(acctRes) as { id?: unknown } | null)?.id
  const [postsRes, pubsRes] = await Promise.all([
    apiGet(`/sphere/posts?account=${encodeURIComponent(name)}&take=${P}&offset=${offset}&replies=false&orderDesc=true`),
    typeof acctId === "string" ? apiGet(`/sphere/publishers/of/${encodeURIComponent(acctId)}`).catch(() => null) : Promise.resolve(null),
  ])
  const raw = parseJson<unknown>(postsRes)
  const posts = Array.isArray(raw) ? raw.map((p) => normalizePost(p)).filter((p): p is LegacyPost => !!p) : []
  const total = readTotal(postsRes.headers)
  const pages = Math.max(1, Math.ceil(total / P))

  const pubRaw = pubsRes ? parseJson<unknown>(pubsRes) : null
  const pubNames: string[] = []
  if (Array.isArray(pubRaw)) {
    for (const item of pubRaw) {
      if (item && typeof item === "object") {
        const n = (item as Record<string, unknown>).name
        if (typeof n === "string" && n) pubNames.push(n)
      }
    }
  }

  const body = [
    acctProfile(account, pubNames, c.base, c.locale, c.noImages),
    `<h2 style="font-size: 16px; margin: 18px 0 6px 0; color: #17222d">${escHtml(t.creators.posts)}</h2>`,
    posts.length
      ? posts.map((p) => postCard(p, cardOpts(c))).join("\n")
      : `<p style="color: #5a524a">${escHtml(t.account.noPosts)}</p>`,
    pagedNav(c.base, name, page, pages, c.locale, "accounts"),
  ].join("\n")
  return html(c, account.nick || account.name, body, account.bio ?? undefined, `/accounts/${encodeURIComponent(name)}`, "public, max-age=120")
}

function acctProfile(account: LegacyAccount, pubNames: string[], base: string, locale: "en" | "zh", noImg: boolean): string {
  const t = L10N[locale]
  const avatar = fileUrl(account.picture?.id)
  const img = avatar && !noImg ? `<img src="${escHtml(avatar)}" alt="" width="64" height="64" style="vertical-align: middle; margin-right: 10px; border: 0">` : ""
  const name = account.nick || account.name
  const verified = account.verification ? `<span style="color: #8a6d1a; font-size: 12px">[${escHtml(account.verification)}]</span>` : ""
  const bio = account.bio ? `<p style="margin: 6px 0 0 0; color: #5a524a; font-size: 13px">${escHtml(account.bio)}</p>` : ""
  const since = account.createdAt ? `<p style="margin: 4px 0 0 0; color: #8a8578; font-size: 11px">${escHtml(t.account.memberSince)} ${escHtml(account.createdAt.slice(0, 10))}</p>` : ""
  const pubs = pubNames.length
    ? `<p style="margin: 6px 0 0 0; font-size: 12px">${escHtml(t.account.publisherOf)}: ${pubNames.map((n) => `<a href="${base}/publishers/${encodeURIComponent(n)}" style="color: #17324a">@${escHtml(n)}</a>`).join(", ")}</p>`
    : ""
  return `<div style="background: #fffdf6; border: 1px solid #d8cfb4; padding: 14px 16px; margin-bottom: 10px">${img}<h1 style="font-size: 20px; margin: 0 0 2px 0; color: #17222d">${escHtml(name)}${verified}</h1><p style="margin: 0; color: #8a8578; font-size: 12px">@${escHtml(account.name)}</p>${bio}${pubs}${since}</div>`
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function renderSearch(event: H3Event): Promise<Response> {
  const c = ctx(event)
  const { t } = c
  const q = String(getQuerySafe(event).q ?? "").trim()
  const type = String(getQuerySafe(event).type ?? "all")

  if (!q) {
    const body = [
      `<form method="get" action="${c.base}/search" style="margin: 0 0 12px 0"><input type="text" name="q" size="24" style="font-family: inherit; font-size: 13px; padding: 3px 5px"> <button type="submit" style="font-family: inherit; font-size: 13px; padding: 3px 10px">${escHtml(t.search.searchLabel)}</button></form>`,
      `<p style="color: #5a524a">${escHtml(t.search.subtitle)}</p>`,
    ].join("\n")
    return html(c, t.search.title, body, t.search.subtitle, "/search", "public, max-age=60")
  }

  const results: string[] = []
  const sections: Array<[string, boolean, () => Promise<string>]> = [
    ["posts", type === "all" || type === "posts", async () => postSearch(c, q)],
    ["publishers", type === "all" || type === "publishers", async () => pubSearch(c, q)],
    ["accounts", type === "all" || type === "accounts", async () => accountSearch(c, q)],
    ["realms", type === "all" || type === "realms", async () => realmSearch(c, q)],
  ]
  for (const [, enabled, run] of sections) {
    if (enabled) results.push(await run())
  }

  const body = [
    `<form method="get" action="${c.base}/search" style="margin: 0 0 12px 0"><input type="text" name="q" value="${escHtml(q)}" size="24" style="font-family: inherit; font-size: 13px; padding: 3px 5px"> <button type="submit" style="font-family: inherit; font-size: 13px; padding: 3px 10px">${escHtml(t.search.searchLabel)}</button></form>`,
    results.join("\n"),
    `<p style="margin-top: 14px"><a href="${c.base}/" style="color: #17324a">&larr; ${escHtml(t.common.back)}</a></p>`,
  ].join("\n")
  return html(c, `${q} — ${t.search.title}`, body, t.search.subtitle, "/search", "public, max-age=60")
}

async function postSearch(c: PageCtx, q: string): Promise<string> {
  const { t } = c
  const res = await apiGet(`/sphere/posts?query=${encodeURIComponent(q)}&take=20&offset=0&replies=false`)
  const raw = parseJson<unknown>(res)
  const posts = Array.isArray(raw) ? raw.map((p) => normalizePost(p)).filter((p): p is LegacyPost => !!p) : []
  return `<h2 style="font-size: 16px; margin: 14px 0 6px 0; color: #17222d">${escHtml(t.search.postsTab)} (${posts.length})</h2>` +
    (posts.length ? posts.map((p) => postCard(p, cardOpts(c))).join("\n") : `<p style="color: #5a524a">${escHtml(t.search.noPosts)}</p>`)
}

async function pubSearch(c: PageCtx, q: string): Promise<string> {
  const { t } = c
  const res = await apiGet(`/sphere/publishers/search?query=${encodeURIComponent(q)}&take=10`)
  const raw = parseJson<unknown>(res)
  const pubs = normalizePubs(raw)
  return `<h2 style="font-size: 16px; margin: 14px 0 6px 0; color: #17222d">${escHtml(t.search.publishers)} (${pubs.length})</h2>` +
    (pubs.length ? pubs.map((p) => pubRow(p, c.base, c.locale, c.noImages)).join("\n") : `<p style="color: #5a524a">${escHtml(t.search.noPublishers)}</p>`)
}

async function accountSearch(c: PageCtx, q: string): Promise<string> {
  const { t } = c
  const res = await apiGet(`/stargate/accounts/search?query=${encodeURIComponent(q)}&take=10`)
  const raw = parseJson<unknown>(res)
  const rows: string[] = []
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item && typeof item === "object") {
        const a = item as Record<string, unknown>
        const n = typeof a.name === "string" ? a.name : ""
        const nick = typeof a.nick === "string" ? a.nick : null
        const profile = a.profile && typeof a.profile === "object" ? (a.profile as Record<string, unknown>) : null
        const pic = profile && typeof profile.picture === "object" ? (profile.picture as Record<string, unknown>).id : null
        const avatar = typeof pic === "string" ? fileUrl(pic) : null
        const img = avatar && !c.noImages ? `<img src="${escHtml(avatar)}" alt="" width="32" height="32" style="vertical-align: middle; margin-right: 6px; border: 0">` : ""
        rows.push(`<div style="background: #fffdf6; border: 1px solid #d8cfb4; padding: 8px 12px; margin: 0 0 6px 0">${img}<a href="${c.base}/accounts/${encodeURIComponent(n)}" style="color: #17324a; text-decoration: none; font-weight: bold">${escHtml(nick || n)}</a> <span style="color: #8a8578; font-size: 11px">@${escHtml(n)}</span></div>`)
      }
    }
  }
  return `<h2 style="font-size: 16px; margin: 14px 0 6px 0; color: #17222d">${escHtml(t.search.accounts)} (${rows.length})</h2>` +
    (rows.length ? rows.join("\n") : `<p style="color: #5a524a">${escHtml(t.search.noAccounts)}</p>`)
}

async function realmSearch(c: PageCtx, q: string): Promise<string> {
  const { t } = c
  const res = await apiGet("/passport/realms/public")
  const raw = parseJson<unknown>(res)
  const realms = (Array.isArray(raw) ? raw.map((r) => normalizeRealm(r)).filter((r): r is LegacyRealm => !!r) : []).filter(
    (r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.slug.toLowerCase().includes(q.toLowerCase()),
  )
  const rows = realms.map((r) => `<div style="background: #fffdf6; border: 1px solid #d8cfb4; padding: 8px 12px; margin: 0 0 6px 0"><a href="${c.base}/realms/${encodeURIComponent(r.slug)}" style="color: #17324a; text-decoration: none; font-weight: bold">${escHtml(r.name)}</a> <span style="color: #8a8578; font-size: 11px">@${escHtml(r.slug)}</span></div>`).join("\n")
  return `<h2 style="font-size: 16px; margin: 14px 0 6px 0; color: #17222d">${escHtml(t.search.realmsTab)} (${realms.length})</h2>` +
    (rows.length ? rows : `<p style="color: #5a524a">${escHtml(t.search.noRealms)}</p>`)
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export function renderPricing(event: H3Event): Response {
  const c = ctx(event)
  const { t } = c
  const p = t.pricing
  const tiers = [
    { name: p.tiers.stellar, tagline: p.taglines.stellar, desc: p.descriptions.stellar, features: p.featuresStellar },
    { name: p.tiers.nova, tagline: p.taglines.nova, desc: p.descriptions.nova, features: p.featuresNova },
    { name: p.tiers.supernova, tagline: p.taglines.supernova, desc: p.descriptions.supernova, features: p.featuresSupernova },
  ]
  const cards = tiers.map((tier) => `<div style="background: #fffdf6; border: 1px solid #d8cfb4; padding: 14px 16px; margin: 0 0 10px 0"><h2 style="margin: 0 0 2px 0; color: #17222d; font-size: 18px">${escHtml(tier.name)}</h2><p style="margin: 0 0 6px 0; color: #8a6d1a; font-size: 12px; text-transform: uppercase">${escHtml(tier.tagline)}</p><p style="color: #5a524a">${escHtml(tier.desc)}</p><ul style="margin: 6px 0 8px 0; padding-left: 18px">${tier.features.map((f) => `<li>${escHtml(f)}</li>`).join("")}</ul><p style="margin: 0"><a href="https://solian.app/pricing" style="color: #17324a">${escHtml(p.learnMore)} &rarr;</a></p></div>`).join("\n")
  const body = [
    `<p style="color: #5a524a">${escHtml(p.description)}</p>`,
    `<p style="color: #8a8578; font-size: 12px">${escHtml(p.billingNote)}</p>`,
    cards,
    `<p style="margin-top: 14px"><a href="${c.base}/" style="color: #17324a">&larr; ${escHtml(t.common.back)}</a></p>`,
  ].join("\n")
  return html(c, p.title, body, p.description, "/pricing", "public, max-age=3600")
}

// ---------------------------------------------------------------------------
// Fallback 404
// ---------------------------------------------------------------------------

export function renderNotFound(event: H3Event): Response {
  const c = ctx(event)
  return notFoundPage(c, c.t.common.notFound, c.t.common.notFoundDesc)
}

function readTotal(headers: Headers): number {
  const v = headers.get("x-total")
  if (!v) return 0
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : 0
}

function getQuerySafe(event: H3Event): Record<string, unknown> {
  const q = (event as unknown as { context?: { query?: Record<string, unknown> } }).context?.query
  if (q) return q
  const raw = String((event.node?.req as { url?: string } | undefined)?.url ?? "").split("?")[1] ?? ""
  const out: Record<string, string> = {}
  for (const pair of raw.split("&")) {
    if (!pair) continue
    const eq = pair.indexOf("=")
    const k = eq >= 0 ? safeDecode(pair.slice(0, eq)) : safeDecode(pair)
    const v = eq >= 0 ? safeDecode(pair.slice(eq + 1)) : ""
    out[k] = v
  }
  return out
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "))
  } catch {
    return value
  }
}

export type { LegacyAccount, LegacyPublisher, LegacyRealm }
