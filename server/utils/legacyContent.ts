// Legacy content renderers shared by the pages: post cards, article cards,
// tag chips, attachments. Emits HTML 4.01 + inline styles only.

import {
  displayName,
  escAttr,
  escHtml,
  fileUrl,
  fmtCount,
  L10N,
  relTime,
  renderMd,
  rewriteInternalLinks,
  stripTags,
} from "./legacy"
import { normalizePost, type LegacyPost } from "./legacyModels"

export type LegacyLocale = "en" | "zh"

export interface CardOpts {
  base: string
  locale: LegacyLocale
  /** Compact article card (teaser, no full body). */
  compact?: boolean
}

export function postCard(post: LegacyPost, opts: CardOpts): string {
  const t = L10N[opts.locale].postCard
  const isArticle = post.type === 1
  const author = post.publisher
  const name = displayName(author)
  const authorHref = `${opts.base}/publishers/${encodeURIComponent(author ? author.name : "")}`
  const realmHref = post.realm ? `${opts.base}/realms/${encodeURIComponent(post.realm.slug)}` : null
  const postHref = `${opts.base}/posts/${post.id}`
  const time = relTime(post.publishedAt, opts.locale)
  const avatar = fileUrl(author?.picture?.id)

  const headerBits: string[] = []
  if (avatar) {
    headerBits.push(`<img src="${escAttr(avatar)}" alt="" width="32" height="32" style="vertical-align: middle; margin-right: 6px; border: 0">`)
  }
  headerBits.push(`<a href="${authorHref}" style="color: #17324a; text-decoration: none; font-weight: bold">${escHtml(name)}</a>`)
  if (author?.verification) {
    headerBits.push(`<span title="${escAttr(author.verification)}" style="color: #8a6d1a; font-size: 11px">[${escHtml(author.verification)}]</span>`)
  }
  if (post.realm && realmHref) {
    headerBits.push(`<span style="color: #5a524a">@</span><a href="${realmHref}" style="color: #5a524a; text-decoration: none">${escHtml(post.realm.name)}</a>`)
  }
  const header = headerBits.join(" ")

  const edited = post.editedAt
    ? `<span style="color: #8a8578; font-size: 11px; font-style: italic"> (${escHtml(L10N[opts.locale].post.edited)})</span>`
    : ""

  // Reference (reply/forward) — only the deeper single level is expanded.
  const refPost = post.repliedPost ?? post.forwardedPost
  const isReply = !!post.repliedPost
  const refHtml = refPost ? renderReference(refPost, isReply, opts) : ""

  // Body
  let body: string
  let readMore = ""
  if (isArticle && !opts.compact) {
    body = renderArticleBody(post, opts)
  } else if (isArticle && opts.compact) {
    const excerpt = post.description ? stripTags(renderMd(post.description)) : ""
    const teaser = excerpt ? excerpt : stripTags(rewriteInternalLinks(renderMd(post.content), opts.base)).slice(0, 300)
    body = `<a href="${postHref}" style="color: #20242a; text-decoration: none"><span style="font-size: 12px; color: #8a6d1a; text-transform: uppercase">${escHtml(L10N[opts.locale].post.article)}</span><br><b>${escHtml(post.title ?? "")}</b><br><span style="color: #5a524a; font-size: 12px">${escHtml(teaser)}…</span></a>`
  } else {
    const contentRaw = post.isTruncated ? `${post.content}…` : post.content
    const contentHtml = rewriteInternalLinks(renderMd(contentRaw), opts.base)
    if (post.isTruncated) {
      readMore = `<p style="margin: 4px 0 0 0"><a href="${postHref}" style="color: #8a6d1a">${escHtml(L10N[opts.locale].post.openOnMain)} &rarr;</a></p>`
    }
    if (post.title) {
      body = `<h3 style="font-size: 15px; margin: 4px 0 2px 0"><a href="${postHref}" style="color: #17324a; text-decoration: none">${escHtml(post.title)}</a></h3>${contentHtml}`
    } else {
      body = contentHtml
    }
  }

  const attachmentHtml = renderAttachments(post, {
    singleLabel: L10N[opts.locale].post.attachment,
    multiLabel: L10N[opts.locale].postCard.attachments,
    limit: 1,
  })

  const tagHtml = post.tags.length
    ? `<p style="margin: 3px 0 0 0; font-size: 12px">${post.tags.map((tag) => `<a href="https://solian.app/tags/${encodeURIComponent(tag.slug)}" style="color: #5a6d7f; text-decoration: none; background: #e4e0d4; padding: 1px 5px; margin-right: 3px">#${escHtml(tag.name)}</a>`).join("")}</p>`
    : ""

  const meta = `<p style="margin: 4px 0 0 0; font-size: 11px; color: #8a8578"><a href="${postHref}" style="color: #8a8578; text-decoration: none">${time}</a>${edited} &nbsp; ${fmtCount(post.repliesCount)} ${escHtml(L10N[opts.locale].postCard.replies)} &nbsp; ${fmtCount(post.boostCount)} ${escHtml(L10N[opts.locale].postCard.boost)} &nbsp; ${fmtCount(post.viewsTotal)} ${escHtml(L10N[opts.locale].post.views)}</p>`

  return [
    `<div style="background: #fffdf6; border: 1px solid #d8cfb4; padding: 10px 12px; margin: 0 0 10px 0">`,
    `<p style="margin: 0 0 4px 0; font-size: 13px">${header}</p>`,
    refHtml,
    body,
    attachmentHtml,
    tagHtml,
    meta,
    readMore,
    "</div>",
  ].join("")
}

function renderReference(ref: LegacyPost, isReply: boolean, opts: CardOpts): string {
  const label = isReply ? L10N[opts.locale].post.replyingTo : L10N[opts.locale].post.forwarded
  const name = displayName(ref.publisher)
  const href = `${opts.base}/posts/${ref.id}`
  const snippet = ref.content ? stripTags(renderMd(ref.content)).slice(0, 180) : ""
  return `<div style="border-left: 3px solid #cbbd9c; padding: 2px 8px; margin: 0 0 6px 8px; font-size: 12px; color: #5a524a"><a href="${href}" style="color: #17324a; text-decoration: none"><b>${escHtml(label)} ${escHtml(name)}</b></a> &mdash; ${escHtml(snippet)}${ref.isTruncated ? "…" : ""}</div>`
}

/**
 * Render a post's attachments. Images display inline (old browsers render
 * <img> fine); everything else becomes a download link. Listings pass
 * `limit: 1` to show a single preview; the detail page passes no limit to
 * show every attachment.
 */
export function renderAttachments(post: LegacyPost, opts: { singleLabel: string; multiLabel: string; limit?: number }): string {
  const list = post.attachments.filter((a) => a.id)
  const shown = opts.limit && list.length > opts.limit ? list.slice(0, opts.limit) : list
  if (shown.length === 0) return ""

  const items = shown.map((a) => {
    const url = fileUrl(a.id)
    if (!url) return ""
    const isImage = (a.mimeType ?? "").startsWith("image/")
    const label = a.name || a.id || url
    if (isImage) {
      return `<p style="margin: 6px 0 0 0"><a href="${escAttr(url)}"><img src="${escAttr(url)}" alt="${escAttr(label)}" style="border: 1px solid #cbbd9c; max-width: 420px; height: auto; width: auto"></a></p>`
    }
    return `<p style="margin: 4px 0 0 0; font-size: 12px"><a href="${escAttr(url)}" style="color: #17324a">${escHtml(label)}</a></p>`
  }).filter((x) => x !== "")

  if (items.length === 0) return ""
  const countLabel = list.length === 1 ? opts.singleLabel : opts.multiLabel
  const extraCount = list.length - shown.length
  const suffix = extraCount > 0 ? ` (+${extraCount} ${escHtml(extraCount === 1 ? opts.singleLabel : opts.multiLabel)})` : ""
  return [`<p style="margin: 6px 0 0 0; color: #8a8578; font-size: 11px">${list.length} ${escHtml(countLabel)}${suffix}</p>`, ...items].join("\n")
}

function renderArticleBody(post: LegacyPost, opts: CardOpts): string {
  const t = L10N[opts.locale].post
  const headerBits = `<span style="font-size: 12px; color: #8a6d1a; text-transform: uppercase">${escHtml(t.article)}</span>`
  const title = post.title ? `<h1 style="font-size: 20px; margin: 4px 0 0 0; color: #17222d">${escHtml(post.title)}</h1>` : ""
  const desc = post.description ? `<p style="color: #5a524a">${escHtml(post.description)}</p>` : ""
  const contentHtml = renderMd(post.content)
  return `${headerBits}${title}${desc}<div style="margin-top: 6px">${contentHtml}</div>`
}
