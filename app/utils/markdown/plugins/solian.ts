import type MarkdownIt from 'markdown-it'

const FILE_BASE_URL = 'https://api.solian.app/drive/files'

function solianPlugin(md: MarkdownIt): void {
  // Allow solian:// scheme in link validation
  const defaultValidateLink = md.validateLink
  md.validateLink = (url: string): boolean => {
    if (url.startsWith('solian://')) return true
    return defaultValidateLink(url)
  }

  // Override link_open renderer to handle solian:// links
  const defaultLinkOpen = md.renderer.rules.link_open || ((tokens, idx, options, env, self) => {
    return self.renderToken(tokens, idx, options)
  })

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const href = token.attrGet('href') || ''

    if (href.startsWith('solian://')) {
      const path = href.replace('solian://', '/')
      token.attrSet('href', path)
      token.attrSet('data-internal', 'true')
      token.attrSet('data-solian-href', href)
    }

    return defaultLinkOpen(tokens, idx, options, env, self)
  }

  // Override image renderer to handle solian://files/ images
  const defaultImage = md.renderer.rules.image || ((tokens, idx, options, env, self) => {
    return self.renderToken(tokens, idx, options)
  })

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const src = token.attrGet('src') || ''

    if (src.startsWith('solian://files/')) {
      const fileId = src.replace('solian://files/', '')
      const fileUrl = `${FILE_BASE_URL}/${fileId}`
      token.attrSet('src', fileUrl)
      token.attrSet('data-file-id', fileId)
      token.attrSet('class', 'cloud-file-image')
      token.attrSet('loading', 'lazy')
      token.attrSet('decoding', 'async')
    }

    return defaultImage(tokens, idx, options, env, self)
  }
}

export { solianPlugin }
