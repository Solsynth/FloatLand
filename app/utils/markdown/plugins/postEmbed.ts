import type MarkdownIt from 'markdown-it'
import type { StateCore, Token } from 'markdown-it'

/**
 * Solar post URLs, the public site form and the in-app scheme. Both carry the
 * post id as their single path segment.
 */
const SOLIAN_POST_URL =
  /^(?:https?:\/\/(?:www\.)?solian\.app\/posts\/|solian:\/\/posts\/)([0-9a-zA-Z_-]+)\/?$/i

/**
 * The placeholder `post_embed` renders. Written once here so the renderer and
 * `splitPostEmbeds` can never drift apart.
 */
const POST_EMBED_MARKER = /<div class="post-embed" data-post-id="([^"]+)"><\/div>/g

/** Rendered markdown split around the inline post previews it contains. */
export type MarkdownSegment =
  | { type: 'html'; html: string }
  | { type: 'post'; id: string }

function matchPostUrl(url: string): string | null {
  const match = SOLIAN_POST_URL.exec(url.trim())
  return match?.[1] ?? null
}

/**
 * A paragraph holding nothing but a Solar post link is the one place a preview
 * card beats a bare link. Only a standalone URL qualifies: one inside a
 * sentence, or a link the author labelled, keeps its text.
 */
function matchStandalonePostLink(inline: Token): string | null {
  const children = inline.children
  if (!children || children.length === 0) return null

  // `solian://posts/<id>` is not linkified, so a bare one arrives as plain text.
  if (children.length === 1) {
    const text = children[0]
    if (text?.type !== 'text') return null
    return matchPostUrl(text.content)
  }

  if (children.length !== 3) return null
  const [open, text, close] = children
  if (open?.type !== 'link_open' || close?.type !== 'link_close') return null
  if (text?.type !== 'text') return null

  const href = open.attrGet('href')
  if (!href) return null
  // The visible text must be the URL itself, i.e. the author pasted it bare.
  if (text.content.trim() !== href) return null

  return matchPostUrl(href)
}

function embedStandalonePostLinks(state: StateCore): void {
  if (!state.env?.embedPosts) return

  const tokens = state.tokens
  for (let i = 0; i < tokens.length; i++) {
    const open = tokens[i]
    const inline = tokens[i + 1]
    const close = tokens[i + 2]
    if (
      open?.type !== 'paragraph_open' ||
      inline?.type !== 'inline' ||
      close?.type !== 'paragraph_close'
    ) {
      continue
    }

    const id = matchStandalonePostLink(inline)
    if (!id) continue

    const token = new state.Token('post_embed', '', 0)
    token.block = true
    token.meta = { id }
    // The paragraph's three tokens collapse into the one embed token.
    tokens.splice(i, 3, token)
  }
}

function postEmbedPlugin(md: MarkdownIt): void {
  md.core.ruler.push('post_embed', embedStandalonePostLinks)

  md.renderer.rules.post_embed = (tokens, idx) => {
    const meta = tokens[idx]?.meta as { id?: string } | undefined
    if (!meta?.id) return ''
    return `<div class="post-embed" data-post-id="${md.utils.escapeHtml(meta.id)}"></div>`
  }
}

/** Split rendered HTML into plain HTML runs and the post embeds between them. */
function splitPostEmbeds(html: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = []
  let cursor = 0

  POST_EMBED_MARKER.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = POST_EMBED_MARKER.exec(html)) !== null) {
    const before = html.slice(cursor, match.index)
    if (before.trim() !== '') segments.push({ type: 'html', html: before })

    const id = match[1]
    if (id) segments.push({ type: 'post', id })

    cursor = match.index + match[0].length
  }

  const rest = html.slice(cursor)
  if (rest.trim() !== '') segments.push({ type: 'html', html: rest })

  return segments
}

export { postEmbedPlugin, splitPostEmbeds }
