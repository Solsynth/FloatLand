import MarkdownIt from 'markdown-it'
import { mentionPlugin } from './plugins/mention'
import { stickerPlugin } from './plugins/sticker'
import { highlightPlugin } from './plugins/highlight'
import { spoilerPlugin } from './plugins/spoiler'
import { solianPlugin } from './plugins/solian'
import { postEmbedPlugin, splitPostEmbeds } from './plugins/postEmbed'
import type { MarkdownSegment } from './plugins/postEmbed'

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
})

// Register plugins
md.use(mentionPlugin)
md.use(stickerPlugin)
md.use(highlightPlugin)
md.use(spoilerPlugin)
md.use(solianPlugin)
md.use(postEmbedPlugin)

export { md }
export type { MarkdownSegment }

export interface MarkdownRenderOptions {
  /**
   * Render a paragraph holding nothing but a Solar post link as an inline post
   * preview instead of a link. Off by default: feed cards and reply previews
   * render through this same function, where a card inside a card reads wrong.
   */
  embedPosts?: boolean
}

export function renderMarkdown(
  content: string,
  options: MarkdownRenderOptions = {},
): string {
  return md.render(content, { embedPosts: options.embedPosts === true })
}

/**
 * Rendered markdown split into plain HTML runs and the inline post previews
 * between them. `MarkdownContent` is the component that turns these back into
 * DOM, mounting a real `<PostEmbed>` where a preview belongs.
 */
export function renderMarkdownSegments(content: string): MarkdownSegment[] {
  return splitPostEmbeds(md.render(content, { embedPosts: true }))
}
