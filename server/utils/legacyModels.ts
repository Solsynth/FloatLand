// Typed accessors for the Solar Network API payloads used by the legacy
// pages. The upstream API returns snake_case JSON; every accessor here
// normalizes both shapes where the two apps differ (e.g. verification,
// file attachment, realm/account profiles).

// ---------------------------------------------------------------------------
// Files (attachments)
// ---------------------------------------------------------------------------

export interface LegacyFile {
  id: string | null
  mimeType: string | null
  name: string | null
}

export function fileId(file: unknown): string | null {
  if (!file || typeof file !== "object") return null
  const f = file as Record<string, unknown>
  const id = f.id
  return typeof id === "string" && id ? id : null
}

// ---------------------------------------------------------------------------
// Publishers
// ---------------------------------------------------------------------------

export interface LegacyPublisher {
  name: string
  nick: string | null
  type: number | null
  bio: string | null
  picture: LegacyFile | null
  accountName: string | null
  verification: string | null
  stat: { posts: number; subscribers: number; views: number } | null
}

const PROFILE_KEYS: Record<string, string> = {
  first_name: "firstName",
  last_name: "lastName",
}

/** Normalize a publisher JSON object (camel/snake tolerant). */
export function normalizePublisher(raw: unknown): LegacyPublisher | null {
  if (!raw || typeof raw !== "object") return null
  const p = raw as Record<string, unknown>
  const name = p.name
  if (typeof name !== "string" || !name) return null

  const nick = typeof p.nick === "string" ? p.nick : null
  const type = typeof p.type === "number" ? p.type : null
  const bio = typeof p.bio === "string" ? p.bio : null
  const picture = fileId(p.picture) ? { id: fileId(p.picture), mimeType: null, name: null } : null

  let accountName: string | null = null
  if (p.account && typeof p.account === "object") {
    const acc = p.account as Record<string, unknown>
    accountName = typeof acc.name === "string" ? acc.name : null
  }

  let verification: string | null = null
  const ver = p.verification
  if (ver && typeof ver === "object") {
    const v = ver as Record<string, unknown>
    const t = v.title ?? v["title"]
    const val = typeof t === "string" && t ? t : typeof v.verified_by === "string" ? v.verified_by : null
    verification = val
  }

  let stat: LegacyPublisher["stat"] = null
  const st = p.stat
  if (st && typeof st === "object") {
    const s = st as Record<string, unknown>
    const read = (key: string): number => {
      const v = s[key] ?? s[key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())]
      return typeof v === "number" ? v : 0
    }
    stat = { posts: read("total_posts"), subscribers: read("total_subscribers"), views: read("total_views") }
  }

  return { name, nick, type, bio, picture, accountName, verification, stat }
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export interface LegacyPost {
  id: string
  title: string | null
  description: string | null
  content: string
  type: number | null
  isTruncated: boolean
  publishedAt: string | null
  editedAt: string | null
  visibility: number | null
  boostCount: number
  repliesCount: number
  viewsTotal: number
  upvotes: number
  downvotes: number
  reactions: Record<string, number>
  publisher: LegacyPublisher | null
  realm: { slug: string; name: string } | null
  attachments: LegacyFile[]
  tags: Array<{ slug: string; name: string }>
  repliedPost: LegacyPost | null
  forwardedPost: LegacyPost | null
}

export function normalizePost(raw: unknown): LegacyPost | null {
  if (!raw || typeof raw !== "object") return null
  const p = raw as Record<string, unknown>
  const id = p.id
  if (typeof id !== "string" || !id) return null

  const num = (key: string, camel: string): number => {
    const v = p[key] ?? p[camel]
    return typeof v === "number" ? v : 0
  }

  let realm: LegacyPost["realm"] = null
  if (p.realm && typeof p.realm === "object") {
    const r = p.realm as Record<string, unknown>
    if (typeof r.slug === "string" && r.slug) {
      realm = { slug: r.slug, name: typeof r.name === "string" ? r.name : r.slug }
    }
  }

  const attachments: LegacyFile[] = []
  if (Array.isArray(p.attachments)) {
    for (const a of p.attachments) {
      const fid = fileId(a)
      if (fid) {
        const rec = a && typeof a === "object" ? (a as Record<string, unknown>) : null
        const mime = rec ? (rec.mime_type ?? rec.mimeType) : null
        const name = rec ? rec.name : null
        attachments.push({
          id: fid,
          mimeType: typeof mime === "string" ? mime : null,
          name: typeof name === "string" && name ? name : null,
        })
      }
    }
  }

  const tags: Array<{ slug: string; name: string }> = []
  if (Array.isArray(p.tags)) {
    for (const t of p.tags) {
      if (t && typeof t === "object") {
        const rec = t as Record<string, unknown>
        if (typeof rec.slug === "string" && rec.slug) {
          tags.push({ slug: rec.slug, name: typeof rec.name === "string" ? rec.name : rec.slug })
        }
      }
    }
  }

  const reactions: Record<string, number> = {}
  const rc = p.reactions_count ?? p.reactionsCount
  if (rc && typeof rc === "object") {
    for (const [sym, count] of Object.entries(rc as Record<string, unknown>)) {
      if (typeof count === "number") reactions[sym] = count
    }
  }

  const repliedRaw = p.replied_post ?? p.repliedPost
  const forwardedRaw = p.forwarded_post ?? p.forwardedPost

  const content = typeof p.content === "string" ? p.content : ""

  return {
    id,
    title: typeof p.title === "string" && p.title ? p.title : null,
    description: typeof p.description === "string" && p.description ? p.description : null,
    content,
    type: typeof p.type === "number" ? p.type : typeof p.content_type === "number" ? p.content_type : null,
    isTruncated: Boolean(p.is_truncated ?? p.isTruncated),
    publishedAt: typeof p.published_at === "string" ? p.published_at : typeof p.publishedAt === "string" ? p.publishedAt : typeof p.created_at === "string" ? p.created_at : null,
    editedAt: typeof p.edited_at === "string" ? p.edited_at : typeof p.editedAt === "string" ? p.editedAt : null,
    visibility: typeof p.visibility === "number" ? p.visibility : null,
    boostCount: num("boost_count", "boostCount"),
    repliesCount: num("replies_count", "repliesCount"),
    viewsTotal: num("views_total", "viewsTotal"),
    upvotes: num("upvotes", "upvotes"),
    downvotes: num("downvotes", "downvotes"),
    reactions,
    publisher: normalizePublisher(p.publisher),
    realm,
    attachments,
    tags,
    repliedPost: normalizePost(repliedRaw),
    forwardedPost: normalizePost(forwardedRaw),
  }
}

export function normalizePosts(raw: unknown): LegacyPost[] {
  if (!Array.isArray(raw)) return []
  const out: LegacyPost[] = []
  for (const item of raw) {
    const post = normalizePost(item)
    if (post) out.push(post)
  }
  return out
}

// ---------------------------------------------------------------------------
// Realms
// ---------------------------------------------------------------------------

export interface LegacyRealm {
  slug: string
  name: string
  description: string | null
  isCommunity: boolean | null
  isPublic: boolean | null
  picture: LegacyFile | null
  verification: string | null
}

export function normalizeRealm(raw: unknown): LegacyRealm | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const slug = r.slug
  if (typeof slug !== "string" || !slug) return null
  const name = typeof r.name === "string" && r.name ? r.name : slug

  let verification: string | null = null
  if (r.verification && typeof r.verification === "object") {
    const v = r.verification as Record<string, unknown>
    const t = v.title
    if (typeof t === "string" && t) verification = t
  }

  return {
    slug,
    name,
    description: typeof r.description === "string" && r.description ? r.description : null,
    isCommunity: typeof r.is_community === "boolean" ? r.is_community : typeof r.isCommunity === "boolean" ? r.isCommunity : null,
    isPublic: typeof r.is_public === "boolean" ? r.is_public : typeof r.isPublic === "boolean" ? r.isPublic : null,
    picture: fileId(r.picture) ? { id: fileId(r.picture), mimeType: null, name: null } : null,
    verification,
  }
}

export function normalizeRealms(raw: unknown): LegacyRealm[] {
  if (!Array.isArray(raw)) return []
  const out: LegacyRealm[] = []
  for (const item of raw) {
    const realm = normalizeRealm(item)
    if (realm) out.push(realm)
  }
  return out
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export interface LegacyAccount {
  name: string
  nick: string | null
  bio: string | null
  picture: LegacyFile | null
  verification: string | null
  createdAt: string | null
  isBot: boolean | null
}

export function normalizeAccount(raw: unknown): LegacyAccount | null {
  if (!raw || typeof raw !== "object") return null
  const a = raw as Record<string, unknown>
  const name = a.name
  if (typeof name !== "string" || !name) return null

  const nick = typeof a.nick === "string" ? a.nick : null
  const isBot = typeof a.automated_id === "string" && !!a.automated_id ? true : typeof a.isBot === "boolean" ? a.isBot : null

  let profile: Record<string, unknown> | null = null
  if (a.profile && typeof a.profile === "object") profile = a.profile as Record<string, unknown>

  const bio = profile && typeof profile.bio === "string" && profile.bio ? profile.bio : null
  const picture = profile ? fileId(profile.picture) : null

  let verification: string | null = null
  if (profile && profile.verification && typeof profile.verification === "object") {
    const v = profile.verification as Record<string, unknown>
    if (typeof v.title === "string" && v.title) verification = v.title
  }

  let createdAt: string | null = null
  for (const key of ["created_at", "createdAt", "activated_at", "activatedAt"]) {
    if (typeof a[key] === "string" && a[key]) {
      createdAt = a[key] as string
      break
    }
  }

  return { name, nick, bio, picture: picture ? { id: picture, mimeType: null, name: null } : null, verification, createdAt, isBot }
}

// ---------------------------------------------------------------------------
// Realm members (counts) and category usage
// ---------------------------------------------------------------------------

export function readXTotal(headers: Headers | undefined): number | null {
  if (!headers) return null
  const v = headers.get("x-total")
  if (!v) return null
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}

export function normalizeMemberCount(raw: unknown): number {
  if (Array.isArray(raw)) return raw.length
  return 0
}

export interface LegacyCategory {
  slug: string
  name: string
  usage: number
}

export function normalizeCategories(raw: unknown): LegacyCategory[] {
  if (!Array.isArray(raw)) return []
  const out: LegacyCategory[] = []
  for (const item of raw) {
    if (item && typeof item === "object") {
      const c = item as Record<string, unknown>
      if (typeof c.slug === "string" && c.slug) {
        out.push({
          slug: c.slug,
          name: typeof c.name === "string" && c.name ? c.name : c.slug,
          usage: typeof c.usage === "number" ? c.usage : 0,
        })
      }
    }
  }
  return out
}
