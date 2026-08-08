import type MarkdownIt from 'markdown-it'

const stickerRegex = /:([-\w]*\+[-\w]*):/g
const STICKER_BASE_URL = 'https://api.solian.app/sphere/stickers/lookup'

type StickerRenderSize = 'small' | 'medium' | 'large'

interface StickerMetadata {
  size: unknown
  mode: unknown
}

const stickerMetadataCache = new Map<string, StickerMetadata | null>()
interface PendingStickerMetadata {
  promise: Promise<StickerMetadata | null>
  resolve: (metadata: StickerMetadata | null) => void
}
const stickerMetadataPending = new Map<string, PendingStickerMetadata>()
const stickerMetadataQueue = new Set<string>()
let stickerMetadataQueueTimer: number | undefined

function parseStickerMetadata(value: unknown): StickerMetadata | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const sticker =
    record.sticker && typeof record.sticker === 'object'
      ? (record.sticker as Record<string, unknown>)
      : record

  if (!('size' in sticker) && !('mode' in sticker)) return null
  return {
    size: sticker.size,
    mode: sticker.mode,
  }
}

function resolveStickerSize(
  metadata: StickerMetadata | null,
  isStandalone: boolean,
): StickerRenderSize {
  const configuredSize = metadata?.size
  if (
    configuredSize === 1 ||
    configuredSize === '1' ||
    configuredSize === 'small'
  ) {
    return 'small'
  }
  if (
    configuredSize === 2 ||
    configuredSize === '2' ||
    configuredSize === 'medium'
  ) {
    return 'medium'
  }
  if (
    configuredSize === 3 ||
    configuredSize === '3' ||
    configuredSize === 'large'
  ) {
    return 'large'
  }

  const hasExplicitSize =
    configuredSize !== undefined &&
    configuredSize !== null &&
    configuredSize !== 0 &&
    configuredSize !== '0' &&
    configuredSize !== 'auto'
  if (hasExplicitSize) return 'medium'

  const mode =
    metadata?.mode === 1 || metadata?.mode === '1' || metadata?.mode === 'emote'

  if (mode) return isStandalone ? 'medium' : 'small'
  return isStandalone ? 'large' : 'medium'
}

function applyStickerSize(symbol: string, metadata: StickerMetadata | null): void {
  if (typeof document === 'undefined') return

  const apply = () => {
    document.querySelectorAll<HTMLImageElement>('.sticker-img').forEach((image) => {
      if (image.dataset.symbol !== symbol) return

      image.dataset.stickerSize = resolveStickerSize(
        metadata,
        image.dataset.standalone === 'true',
      )
    })
  }

  // v-html inserts the rendered nodes after renderMarkdown() returns.
  setTimeout(apply, 0)
}

function resolveStickerMetadata(symbol: string): Promise<StickerMetadata | null> {
  if (stickerMetadataCache.has(symbol)) {
    return Promise.resolve(stickerMetadataCache.get(symbol) ?? null)
  }

  const pending = stickerMetadataPending.get(symbol)
  if (pending) return pending.promise

  let resolvePending!: (metadata: StickerMetadata | null) => void
  const promise = new Promise<StickerMetadata | null>((resolve) => {
    resolvePending = resolve
  })

  stickerMetadataPending.set(symbol, { promise, resolve: resolvePending })
  stickerMetadataQueue.add(symbol)

  if (stickerMetadataQueueTimer === undefined) {
    stickerMetadataQueueTimer = window.setTimeout(() => {
      stickerMetadataQueueTimer = undefined
      void flushStickerMetadataQueue()
    }, 0)
  }

  return promise
}

async function flushStickerMetadataQueue(): Promise<void> {
  const symbols = [...stickerMetadataQueue]
  stickerMetadataQueue.clear()
  if (symbols.length === 0) return

  for (let offset = 0; offset < symbols.length; offset += 100) {
    const batch = symbols.slice(offset, offset + 100)

    try {
      const response = await fetch(`${STICKER_BASE_URL}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeholders: batch }),
      })

      if (!response.ok) {
        throw new Error(`Sticker lookup failed: ${response.status}`)
      }

      const payload: unknown = await response.json()
      const results = Array.isArray(payload) ? payload : []
      const metadataBySymbol = new Map<string, StickerMetadata | null>()

      for (const result of results) {
        if (!result || typeof result !== 'object') continue
        const record = result as Record<string, unknown>
        const placeholder = record.placeholder
        if (typeof placeholder !== 'string') continue
        metadataBySymbol.set(placeholder, parseStickerMetadata(record))
      }

      for (const symbol of batch) {
        const metadata = metadataBySymbol.get(symbol) ?? null
        stickerMetadataCache.set(symbol, metadata)
        const pending = stickerMetadataPending.get(symbol)
        stickerMetadataPending.delete(symbol)
        pending?.resolve(metadata)
      }
    } catch {
      for (const symbol of batch) {
        stickerMetadataCache.set(symbol, null)
        const pending = stickerMetadataPending.get(symbol)
        stickerMetadataPending.delete(symbol)
        pending?.resolve(null)
      }
    }
  }
}

function stickerPlugin(md: MarkdownIt): void {
  // Core chain rule to replace stickers in text tokens
  md.core.ruler.push('sticker', (state) => {
    const tokens = state.tokens

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'inline') continue

      // Flutter uses one sticker plus no other paragraph content as standalone.
      const fullContent = tokens[i].content.trim()
      const stickerMatches = fullContent.match(stickerRegex) || []
      const isStandalone =
        stickerMatches.length === 1 &&
        fullContent.replace(stickerRegex, '').trim().length === 0

      const inlineTokens = tokens[i].children || []
      const newTokens: typeof inlineTokens = []

      for (let j = 0; j < inlineTokens.length; j++) {
        const token = inlineTokens[j]

        if (token.type !== 'text') {
          newTokens.push(token)
          continue
        }

        const text = token.content
        let lastIndex = 0
        let match: RegExpExecArray | null

        stickerRegex.lastIndex = 0

        while ((match = stickerRegex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            const textToken = new state.Token('text', '', 0)
            textToken.content = text.slice(lastIndex, match.index)
            newTokens.push(textToken)
          }

          const symbol = match[1]
          const stickerToken = new state.Token('sticker', 'img', 0)
          stickerToken.attrSet(
            'src',
            `${STICKER_BASE_URL}/${encodeURIComponent(symbol)}/open`,
          )
          stickerToken.attrSet('alt', `:${symbol}:`)
          stickerToken.attrSet('class', 'sticker-img')
          stickerToken.attrSet(
            'data-sticker-size',
            resolveStickerSize(null, isStandalone),
          )
          stickerToken.attrSet('data-standalone', String(isStandalone))
          stickerToken.attrSet('data-symbol', symbol)
          stickerToken.attrSet('loading', 'lazy')
          if (typeof window !== 'undefined') {
            void resolveStickerMetadata(symbol).then((metadata) => {
              applyStickerSize(symbol, metadata)
            })
          }
          newTokens.push(stickerToken)

          lastIndex = match.index + match[0].length
        }

        if (lastIndex < text.length) {
          const textToken = new state.Token('text', '', 0)
          textToken.content = text.slice(lastIndex)
          newTokens.push(textToken)
        }
      }

      tokens[i].children = newTokens
    }
  })

  // Add renderer rule for sticker tokens
  md.renderer.rules.sticker = (tokens, idx) => {
    const token = tokens[idx]
    const src = token.attrGet('src') || ''
    const alt = token.attrGet('alt') || ''
    const cls = token.attrGet('class') || 'sticker-img'
    const size = token.attrGet('data-sticker-size') || 'medium'
    const standalone = token.attrGet('data-standalone') || 'false'
    const symbol = token.attrGet('data-symbol') || ''

    return `<img src="${src}" alt="${md.utils.escapeHtml(alt)}" class="${cls}" data-sticker-size="${size}" data-standalone="${standalone}" data-symbol="${md.utils.escapeHtml(symbol)}" loading="lazy" />`
  }
}

export { stickerPlugin }
