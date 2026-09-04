// Shared server-side utilities for the legacy (no-JS) mirror at /legacy/*
// and on the legacy.solian.app host. Everything here renders plain HTML 4.01
// + HTTP form flow; no client-side script or stylesheet is ever emitted.
//
// Keep this file dependency-light: it runs in the Nitro server bundle.

import MarkdownIt from "markdown-it"
import {
  getCookie,
  getQuery,
  getRequestHost,
  type H3Event,
} from "h3"

const HOST_LEGACY = "legacy.solian.app"
const API_BASE = "https://api.solian.app"
const FILE_BASE = `${API_BASE}/drive/files`

// ---------------------------------------------------------------------------
// Environment / locale / host helpers
// ---------------------------------------------------------------------------

/** Cookie-preserved legacy locale (mirrors the modern i18n cookie). */
export function legacyLocale(event: H3Event): "en" | "zh" {
  const v = getCookie(event, "i18n_locale")
  if (v === "zh") return "zh"
  return "en"
}

export function setLocaleCookie(event: H3Event, locale: "en" | "zh"): string {
  const cookie = `i18n_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`
  const res = event.node?.res as { setHeader?: (k: string, v: string | string[]) => void } | undefined
  if (res?.setHeader) {
    res.setHeader("Set-Cookie", cookie)
  }
  return cookie
}

const NOIMG_COOKIE = "legacy_noimg"

/** True when the legacy surface should suppress images for this visitor. */
export function legacyNoImages(event: H3Event): boolean {
  return getCookie(event, NOIMG_COOKIE) === "1"
}

/** Set (value "1") or clear (value "0") the no-images cookie. Returns the Set-Cookie value. */
export function setNoImagesCookie(event: H3Event, enabled: boolean): string {
  const cookie = `${NOIMG_COOKIE}=${enabled ? "1" : "0"}; Path=/; Max-Age=31536000; SameSite=Lax`
  const res = event.node?.res as { setHeader?: (k: string, v: string | string[]) => void } | undefined
  if (res?.setHeader) {
    res.setHeader("Set-Cookie", cookie)
  }
  return cookie
}

/** Host from the Host header, lowercased, without port. */
export function legacyHost(event: H3Event): string {
  return getRequestHost(event).split(":")[0].toLowerCase()
}

/** True when this request was routed via the dedicated legacy host. */
export function isLegacyHost(event: H3Event): boolean {
  return Boolean((event.context as Record<string, unknown>).legacyHost) || legacyHost(event) === HOST_LEGACY
}

/**
 * Base path prefix for legacy links. When the request came in on the legacy
 * host (routed via middleware or Host header), links are host-relative ("");
 * on the main host they are prefixed "/legacy".
 */
export function legacyBase(event: H3Event): string {
  return isLegacyHost(event) ? "" : "/legacy"
}

// ---------------------------------------------------------------------------
// Tiny translation table (hand-written; mirrors the subset used by legacy pages)
// ---------------------------------------------------------------------------

export type LegacyLocale = "en" | "zh"

export const L10N = {
  en: {
    nav: {
      home: "Home",
      creators: "Creators",
      realms: "Realms",
      search: "Search",
      pricing: "Pricing",
      signIn: "Sign In",
      modernSite: "Modern site",
      noJsNotice: "Legacy version",
      imagesOff: "Images off",
      imagesOn: "Images on",
      showImages: "Show images",
      hideImages: "Hide images",
    },
    common: {
      loading: "Loading...",
      error: "An error occurred",
      back: "Back",
      loadMore: "Load more",
      noMore: "No more posts to load",
      posts: "posts",
      members: "Members",
      verified: "Verified",
      community: "Community",
      organization: "Organization",
      nextPage: "Older posts",
      prevPage: "Newer posts",
      notFound: "Not found",
      notFoundDesc: "The page you requested does not exist.",
      serverError: "Server error",
      postsCount: "{count} posts",
    },
    home: {
      title: "Explore",
      subtitle: "Latest public posts across Solar Network.",
      featured: "Featured",
      latest: "Latest posts",
      empty: "No public posts right now.",
      failed: "Could not load the timeline right now.",
    },
    post: {
      title: "Post",
      article: "Article",
      reply: "Reply",
      replies: "Replies",
      forwards: "Forwards",
      boosts: "Boosts",
      reactions: "Reactions",
      views: "views",
      boostCount: "boosts",
      noReplies: "No replies yet.",
      edited: "edited",
      replyingTo: "Replying to",
      forwarded: "Forwarded",
      attachment: "attachment",
      published: "Published",
      replyOnMain: "Reply on the modern site",
      openOnMain: "Open in the modern site",
      deleted: "This post is not available.",
    },
    postCard: {
      replies: "Replies",
      boost: "Boost",
      attachments: "attachments",
      truncated: "Post truncated",
      viewThread: "View post",
      readMore: "Read more on the modern site",
    },
    realms: {
      title: "Realms",
      subtitle: "Public communities on Solar Network.",
      empty: "No public realms right now.",
      failed: "Could not load realms right now.",
      notFound: "Realm not found",
      notFoundDesc: "The realm you requested does not exist.",
      noDescription: "No description yet.",
      description: "Description",
      allPosts: "All posts",
      articles: "Articles",
      postsIn: "Posts in this realm",
      noPosts: "No public posts in this realm yet.",
      backToRealms: "Back to realms",
      failedPosts: "Could not load realm posts.",
      modernPage: "Open in the modern site",
      membersShort: "Members",
    },
    creators: {
      title: "Creators",
      subtitle: "Publishers and their latest posts.",
      search: "Search publishers",
      noResults: "No publishers found for your search.",
      posts: "Posts",
      subscribers: "Subscribers",
      views: "Views",
      noPosts: "No public posts yet.",
      modernPage: "Open in the modern site",
      searchPlaceholder: "Publisher name…",
      popular: "Popular publishers",
      featured: "Featured publishers",
    },
    search: {
      title: "Search",
      subtitle: "Posts, publishers, accounts and realms.",
      all: "All",
      postsTab: "Posts",
      accounts: "Accounts",
      realmsTab: "Realms",
      publishers: "Publishers",
      noPosts: "No posts found.",
      noAccounts: "No accounts found.",
      noRealms: "No realms found.",
      noPublishers: "No publishers found.",
      noResults: "No results for your search.",
      placeholder: "Search posts, publishers, accounts and realms…",
      results: "results",
      searchLabel: "Search",
    },
    account: {
      title: "Account",
      notFound: "Account not found",
      notFoundDesc: "The profile you requested does not exist.",
      publisherOf: "Publishes as",
      noPosts: "No public posts yet.",
      modernPage: "Open in the modern site",
      memberSince: "Member since",
    },
    pricing: {
      title: "Solar Network Shop",
      description: "Pick the Stellar plan that matches how you use Solar Network.",
      signInToPurchase: "Sign in to purchase",
      learnMore: "Learn more & buy",
      tiers: { stellar: "Stellar", nova: "Nova", supernova: "Supernova" },
      taglines: {
        stellar: "Core membership",
        nova: "Expanded creator tools",
        supernova: "Highest capacity tier",
      },
      descriptions: {
        stellar: "A lighter upgrade for members who want better identity tools and a faster pace.",
        nova: "Everything in Stellar, with more room for publishers, realms, and bot-driven workflows.",
        supernova: "Everything in Nova, with the largest storage tier and the most room to scale out your setup.",
      },
      storage: "Storage",
      progression: "Progression",
      usernameStyle: "Username style",
      billingNote: "Pay with Source Points or Afdian — App Store purchases aren't available on the web.",
      featuresStellar: [
        "+10GB extra cloud storage per perk level",
        "Limited username color options",
        "Translation",
        "1.5x leveling up boost",
        "Ability to get verified",
        "Publisher slots: 2 base, 3 from Lv30+, +2 per perk level",
      ],
      featuresNova: [
        "Everything in Stellar",
        "+25GB extra cloud storage per perk level",
        "Unlimited username color options",
        "Bot slots: 1 at Lv30, 2 at Lv60, 3 at Lv90, +1 per perk level",
        "Realm slots: same as bot slots",
        "2x leveling up boost",
      ],
      featuresSupernova: [
        "Everything in Nova",
        "+50GB extra cloud storage per perk level",
        "Unlimited username color options",
        "Bot slots: 1 at Lv30, 2 at Lv60, 3 at Lv90, +1 per perk level",
        "Realm slots: same as bot slots",
        "2.5x leveling up boost",
      ],
    },
    footer: {
      tagline: "Solar Network — a federated social network.",
      modernSite: "Switch to the modern site",
      legacyNote: "You are viewing the legacy version built for very old browsers.",
      copyright: "© {year} Solar Network.",
    },
    errors: {
      network: "Could not reach Solar Network right now. Please try again later.",
      retry: "Try again",
    },
    time: {
      justNow: "just now",
      minutesAgo: "{count}m ago",
      hoursAgo: "{count}h ago",
      daysAgo: "{count}d ago",
      yesterday: "yesterday",
    },
    auth: {
      signInTitle: "Sign in to Solar Network",
      signInDesc: "Interactive features (posting, joining realms, subscribing) need the modern web app and a supported browser.",
      goToLogin: "Go to the sign-in page",
      modernSite: "Open the modern site",
      tosNote: "Solar Network — FloatLand project",
    },
  },
  zh: {
    nav: {
      home: "首页",
      creators: "创作者",
      realms: "领域",
      search: "搜索",
      pricing: "定价",
      signIn: "登录",
      modernSite: "新版网站",
      noJsNotice: "旧版",
      imagesOff: "图片已关闭",
      imagesOn: "图片已开启",
      showImages: "显示图片",
      hideImages: "隐藏图片",
    },
    common: {
      loading: "正在加载…",
      error: "出了点问题",
      back: "返回",
      loadMore: "加载更多",
      noMore: "没有更多帖子了",
      posts: "篇帖子",
      members: "成员",
      verified: "已认证",
      community: "社区",
      organization: "组织",
      nextPage: "较旧的帖子",
      prevPage: "较新的帖子",
      notFound: "页面不存在",
      notFoundDesc: "你请求的页面不存在。",
      serverError: "服务器错误",
      postsCount: "{count} 篇帖子",
    },
    home: {
      title: "探索",
      subtitle: "Solar Network 上最新的公开帖子。",
      featured: "精选",
      latest: "最新帖子",
      empty: "当前没有公开帖子。",
      failed: "暂时无法加载时间线。",
    },
    post: {
      title: "帖子",
      article: "文章",
      reply: "回复",
      replies: "回复",
      forwards: "转发",
      boosts: "转推",
      reactions: "表态",
      views: "次浏览",
      boostCount: "次转推",
      noReplies: "还没有回复。",
      edited: "已编辑",
      replyingTo: "回复",
      forwarded: "转发",
      attachment: "个附件",
      published: "发布于",
      replyOnMain: "在新版网站回复",
      openOnMain: "在新版网站打开",
      deleted: "这篇帖子不可用。",
    },
    postCard: {
      replies: "回复",
      boost: "转推",
      attachments: "个附件",
      truncated: "帖子已截断",
      viewThread: "查看帖子",
      readMore: "在新版网站阅读全文",
    },
    realms: {
      title: "领域",
      subtitle: "Solar Network 上的公开社区。",
      empty: "当前没有公开领域。",
      failed: "暂时无法加载领域。",
      notFound: "领域不存在",
      notFoundDesc: "你请求的领域不存在。",
      noDescription: "暂无简介。",
      description: "简介",
      allPosts: "全部帖子",
      articles: "文章",
      postsIn: "该领域的帖子",
      noPosts: "该领域还没有公开帖子。",
      backToRealms: "返回领域列表",
      failedPosts: "无法加载领域帖子。",
      modernPage: "在新版网站打开",
      membersShort: "成员",
    },
    creators: {
      title: "创作者",
      subtitle: "发布者与他们的最新帖子。",
      search: "搜索发布者",
      noResults: "没有找到匹配的发布者。",
      posts: "帖子",
      subscribers: "订阅者",
      views: "浏览",
      noPosts: "还没有公开帖子。",
      modernPage: "在新版网站打开",
      searchPlaceholder: "发布者名称…",
      popular: "热门发布者",
      featured: "推荐发布者",
    },
    search: {
      title: "搜索",
      subtitle: "帖子、发布者、用户与领域。",
      all: "全部",
      postsTab: "帖子",
      accounts: "用户",
      realmsTab: "领域",
      publishers: "发布者",
      noPosts: "没有找到帖子。",
      noAccounts: "没有找到用户。",
      noRealms: "没有找到领域。",
      noPublishers: "没有找到发布者。",
      noResults: "没有找到与搜索相关的结果。",
      placeholder: "搜索帖子、发布者、用户与领域…",
      results: "条结果",
      searchLabel: "搜索",
    },
    account: {
      title: "账号",
      notFound: "账号不存在",
      notFoundDesc: "你请求的账号不存在。",
      publisherOf: "所属发布者",
      noPosts: "还没有公开帖子。",
      modernPage: "在新版网站打开",
      memberSince: "加入于",
    },
    pricing: {
      title: "Solar Network 商店",
      description: "选择适合你的 Solar Network 使用方式的 Stellar 方案。",
      signInToPurchase: "登录后购买",
      learnMore: "了解更多并购买",
      tiers: { stellar: "Stellar", nova: "Nova", supernova: "Supernova" },
      taglines: {
        stellar: "核心会员",
        nova: "进阶创作工具",
        supernova: "最高容量档位",
      },
      descriptions: {
        stellar: "适合想要更好身份工具与更快成长节奏的成员的轻量升级。",
        nova: "包含 Stellar 全部权益，并为发布者、领域与机器人工作流提供更多空间。",
        supernova: "包含 Nova 全部权益，提供最大的存储档位与最充裕的扩展空间。",
      },
      storage: "存储",
      progression: "成长",
      usernameStyle: "用户名样式",
      billingNote: "可使用 Solar Points 或爱发电支付——网页端不提供 App Store 内购。",
      featuresStellar: [
        "每个特权等级 +10GB 额外云存储",
        "有限用户名颜色选项",
        "翻译",
        "1.5 倍升级加速",
        "可获得认证",
        "发布者槽位：基础 2 个，Lv30+ 3 个，每特权等级 +2",
      ],
      featuresNova: [
        "包含 Stellar 全部权益",
        "每个特权等级 +25GB 额外云存储",
        "无限用户名颜色选项",
        "机器人槽位：Lv30 1 个、Lv60 2 个、Lv90 3 个，每特权等级 +1",
        "领域槽位：与机器人槽位相同",
        "2 倍升级加速",
      ],
      featuresSupernova: [
        "包含 Nova 全部权益",
        "每个特权等级 +50GB 额外云存储",
        "无限用户名颜色选项",
        "机器人槽位：Lv30 1 个、Lv60 2 个、Lv90 3 个，每特权等级 +1",
        "领域槽位：与机器人槽位相同",
        "2.5 倍升级加速",
      ],
    },
    footer: {
      tagline: "Solar Network — 联邦式社交网络。",
      modernSite: "切换到新版网站",
      legacyNote: "你正在浏览为老旧浏览器准备的旧版网站。",
      copyright: "© {year} Solar Network。",
    },
    errors: {
      network: "暂时无法连接 Solar Network，请稍后再试。",
      retry: "重试",
    },
    time: {
      justNow: "刚刚",
      minutesAgo: "{count} 分钟前",
      hoursAgo: "{count} 小时前",
      daysAgo: "{count} 天前",
      yesterday: "昨天",
    },
    auth: {
      signInTitle: "登录 Solar Network",
      signInDesc: "互动功能（发帖、加入领域、订阅等）需要新版网页应用与受支持的浏览器。",
      goToLogin: "前往登录页面",
      modernSite: "打开新版网站",
      tosNote: "Solar Network — FloatLand 项目",
    },
  },
} as const

// ---------------------------------------------------------------------------
// API fetch (server-side only; undici handles gzip/redirects transparently)
// ---------------------------------------------------------------------------

export interface FetchResult {
  ok: boolean
  status: number
  text: string
  /** Response headers (for x-total etc.). */
  headers: Headers
}

export async function apiGet(path: string, headers: Record<string, string> = {}): Promise<FetchResult> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json", "Accept-Language": "en", ...headers },
    })
    const text = await res.text()
    return { ok: res.ok, status: res.status, text, headers: res.headers }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, status: 0, text: message, headers: new Headers() }
  }
}

export function parseJson<T>(result: FetchResult): T | null {
  if (!result.ok || !result.text) return null
  try {
    return JSON.parse(result.text) as T
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// HTML escaping / attribute safety
// ---------------------------------------------------------------------------

export function escHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function escAttr(input: unknown): string {
  return escHtml(input).replace(/'/g, "&#39;")
}

/** Full URL for an API file attachment (avatar, banner, media). */
export function fileUrl(id: string | null | undefined): string | null {
  if (!id) return null
  return `${FILE_BASE}/${encodeURIComponent(id)}`
}

// ---------------------------------------------------------------------------
// Markdown → safe legacy HTML (subset of the app's markdown-it pipeline)
// ---------------------------------------------------------------------------

export const markdown: MarkdownIt = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
})

const mentionRegex = /@(\w+(?:\/\w+)?)/g

markdown.core.ruler.push("legacy_mention", (state) => {
  for (const token of state.tokens) {
    if (token.type !== "inline") continue
    const children = token.children ?? []
    const out: typeof children = []

    // Walk with a link-nesting counter: text inside an existing <a> (e.g. a
    // linkified email address) must not be re-linked into mentions — HTML4
    // forbids nested anchors.
    let depth = 0
    for (const child of children) {
      if (child.type === "link_open" || child.type === "autolink" || child.type === "image") {
        depth += 1
        out.push(child)
        continue
      }
      if (child.type === "link_close") {
        depth = Math.max(0, depth - 1)
        out.push(child)
        continue
      }
      if (child.type !== "text") {
        out.push(child)
        continue
      }
      if (depth > 0) {
        out.push(child)
        continue
      }
      const text = child.content
      let last = 0
      let m: RegExpExecArray | null
      mentionRegex.lastIndex = 0
      while ((m = mentionRegex.exec(text)) !== null) {
        if (m.index > last) {
          const lead = new state.Token("text", "", 0)
          lead.content = text.slice(last, m.index)
          out.push(lead)
        }
        const full = m[1]
        const parts = full.split("/")
        let kind = "accounts"
        let id = parts[0]
        if (parts.length > 1) {
          kind = parts[0] === "u" ? "accounts" : parts[0] === "r" ? "realms" : "publishers"
          id = parts[1]
        }
        const open = new state.Token("link_open", "a", 1)
        const target = kind === "realms" ? `/realms/` : kind === "publishers" ? `/publishers/` : `/accounts/`
        open.attrSet("href", `${target}${encodeURIComponent(id)}`)
        out.push(open)
        const label = new state.Token("text", "", 0)
        label.content = `@${full}`
        out.push(label)
        out.push(new state.Token("link_close", "a", -1))
        last = m.index + m[0].length
      }
      if (last < text.length) {
        const tail = new state.Token("text", "", 0)
        tail.content = text.slice(last)
        out.push(tail)
      }
    }
    children.length = 0
    for (const c of out) children.push(c)
  }
  return true
})

const stickerRegex = /:([-\w]+\+[-\w]+):/g

markdown.core.ruler.push("legacy_sticker", (state) => {
  for (const token of state.tokens) {
    if (token.type !== "inline") continue
    const children = token.children ?? []
    const out: typeof children = []

    let depth = 0
    for (const child of children) {
      if (child.type === "link_open" || child.type === "autolink" || child.type === "image") {
        depth += 1
        out.push(child)
        continue
      }
      if (child.type === "link_close") {
        depth = Math.max(0, depth - 1)
        out.push(child)
        continue
      }
      if (child.type !== "text") {
        out.push(child)
        continue
      }
      if (depth > 0) {
        out.push(child)
        continue
      }
      const text = child.content
      let last = 0
      let m: RegExpExecArray | null
      stickerRegex.lastIndex = 0
      while ((m = stickerRegex.exec(text)) !== null) {
        if (m.index > last) {
          const lead = new state.Token("text", "", 0)
          lead.content = text.slice(last, m.index)
          out.push(lead)
        }
        const sym = m[1]
        const img = new state.Token("image", "img", 0)
        img.attrSet("src", `${API_BASE}/sphere/stickers/lookup/${encodeURIComponent(sym)}/open`)
        img.attrSet("alt", `:${sym}:`)
        img.attrSet("title", `:${sym}:`)
        out.push(img)
        last = m.index + m[0].length
      }
      if (last < text.length) {
        const tail = new state.Token("text", "", 0)
        tail.content = text.slice(last)
        out.push(tail)
      }
    }
    children.length = 0
    for (const c of out) children.push(c)
  }
  return true
})

const spoilerOpen = /^=!([^=\n][\s\S]*?)!=/

markdown.inline.ruler.before("emphasis", "legacy_spoiler", (state, silent) => {
  const start = state.pos
  const src = state.src
  if (src.charCodeAt(start) !== 0x3d || src.charCodeAt(start + 1) !== 0x21) return false
  const m = spoilerOpen.exec(src.slice(start))
  if (!m) return false
  if (!silent) {
    const token = state.push("legacy_spoiler", "span", 0)
    token.content = m[1].trim()
  }
  state.pos = start + m[0].length
  return true
})
markdown.renderer.rules.legacy_spoiler = (tokens, idx) => {
  const body = markdown.utils.escapeHtml(tokens[idx].content)
  return `<span title="spoiler">${body}</span>`
}

const defaultValidateLink = markdown.validateLink
markdown.validateLink = (url: string): boolean => {
  if (url.startsWith("solian://")) return true
  return defaultValidateLink(url)
}

const defaultLinkOpen = markdown.renderer.rules.link_open
markdown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const href = token.attrGet("href") ?? ""
  if (href.startsWith("solian://")) {
    token.attrSet("href", href.replace("solian://", "/"))
  }
  return defaultLinkOpen ? defaultLinkOpen(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
}

const defaultImage = markdown.renderer.rules.image
markdown.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const src = token.attrGet("src") ?? ""
  if (src.startsWith("solian://files/")) {
    token.attrSet("src", `${FILE_BASE}/${src.replace("solian://files/", "")}`)
  }
  return defaultImage ? defaultImage(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
}

/** Image renderer for bandwidth-saving mode: emits a plain text link instead
 *  of <img> so the browser never fetches image bytes. */
const noImageRule = (tokens: Array<{ attrGet: (k: string) => string | null }>, idx: number): string => {
  const token = tokens[idx]
  let src = token.attrGet("src") ?? ""
  if (src.startsWith("solian://files/")) {
    src = `${FILE_BASE}/${src.replace("solian://files/", "")}`
  }
  const alt = token.attrGet("alt") ?? ""
  const label = alt || src
  return `<a href="${markdown.utils.escapeHtml(src)}">${markdown.utils.escapeHtml(label)}</a>`
}

/** Render post/publisher content to safe legacy HTML. Pass noImages=true to
 *  replace images with plain text links (bandwidth-saving mode). The rule
 *  swap is safe: render() is synchronous. */
export function renderMd(content: string | null | undefined, noImages = false): string {
  if (!noImages) return markdown.render(content ?? "")
  const prev = markdown.renderer.rules.image
  markdown.renderer.rules.image = noImageRule
  try {
    return markdown.render(content ?? "")
  } finally {
    markdown.renderer.rules.image = prev
  }
}

/** Prefix root-relative internal links (posts/accounts/realms/publishers)
 *  with the legacy base so in-content mentions stay on this legacy surface
 *  instead of jumping to the SPA on the main host. Applies to rendered
 *  markdown only; external URLs are untouched. */
export function rewriteInternalLinks(html: string, base: string): string {
  if (!base) return html
  return html.replace(
    /href="\/(posts|accounts|realms|publishers)\/([^"]*)"/g,
    (m, kind: string, rest: string) => `href="${base}/${kind}/${rest}"`,
  )
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

export function queryInt(event: H3Event, key: string, fallback: number): number {
  const raw = getQuery(event)[key]
  const n = parseInt(Array.isArray(raw) ? raw[0] ?? "" : String(raw ?? ""), 10)
  return Number.isFinite(n) && n >= 1 ? n : fallback
}

export function queryStr(event: H3Event, key: string, fallback = ""): string {
  const raw = getQuery(event)[key]
  if (raw === undefined || raw === null) return fallback
  return Array.isArray(raw) ? raw[0] ?? fallback : String(raw)
}

export function formValue(body: string, key: string): string {
  const m = new RegExp(`(?:^|&)${encodeURIComponent(key)}=([^&]*)`).exec(body)
  if (!m) return ""
  try {
    return decodeURIComponent(m[1].replace(/\+/g, " "))
  } catch {
    return ""
  }
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number): string => String(n).padStart(2, "0")
  const y = d.getUTCFullYear()
  const mo = pad(d.getUTCMonth() + 1)
  const day = pad(d.getUTCDate())
  const h = pad(d.getUTCHours())
  const mi = pad(d.getUTCMinutes())
  return `${y}-${mo}-${day} ${h}:${mi} UTC`
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number): string => String(n).padStart(2, "0")
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function relTime(iso: string | null | undefined, locale: "en" | "zh"): string {
  if (!iso) return ""
  const then = new Date(iso).getTime()
  if (isNaN(then)) return ""
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000))
  const t = L10N[locale].time
  if (s < 60) return t.justNow
  const minutes = Math.floor(s / 60)
  if (minutes < 60) return t.minutesAgo.replace("{count}", String(minutes))
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t.hoursAgo.replace("{count}", String(hours))
  const days = Math.floor(hours / 24)
  if (days === 1) return t.yesterday
  if (days < 7) return t.daysAgo.replace("{count}", String(days))
  return fmtDate(iso)
}

export function fmtCount(n: number | undefined | null): string {
  const num = Number(n ?? 0)
  if (num >= 1_000_000) return `${trimZero((num / 1_000_000).toFixed(1))}M`
  if (num >= 1_000) return `${trimZero((num / 1_000).toFixed(1))}K`
  return String(num)
}

function trimZero(one: string): string {
  return one.endsWith(".0") ? one.slice(0, -2) : one
}

export function displayName(p: { nick?: string | null; name?: string | null } | null | undefined): string {
  if (!p) return "Unknown"
  return p.nick || p.name || "Unknown"
}

export function initials(name: string | null | undefined): string {
  const n = (name ?? "").trim()
  if (!n || n === "Unknown") return "?"
  const parts = n.split(/\s+/).slice(0, 2)
  const letters = parts.map((part) => part.charAt(0).toUpperCase()).join("")
  return letters || "?"
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}
