import type MarkdownIt from 'markdown-it'

function spoilerPlugin(md: MarkdownIt): void {
  // Add inline rule for =!spoiler!= syntax
  md.inline.ruler.before('emphasis', 'spoiler', (state, silent) => {
    const start = state.pos
    const max = state.posMax

    // Check if we have =! at the start
    if (start + 1 >= max) return false
    if (state.src.charCodeAt(start) !== 0x3D) return false // '='
    if (state.src.charCodeAt(start + 1) !== 0x21) return false // '!'

    // Don't allow whitespace right after opening =!
    if (start + 2 < max && state.src.charCodeAt(start + 2) === 0x20) return false

    // Find closing !=
    let end = start + 2
    while (end < max) {
      if (state.src.charCodeAt(end) === 0x21 && // '!'
          end + 1 < max && 
          state.src.charCodeAt(end + 1) === 0x3D) { // '='
        // Don't allow whitespace right before closing !=
        if (end > start + 2 && state.src.charCodeAt(end - 1) === 0x20) {
          end++
          continue
        }
        break
      }
      end++
    }

    if (end >= max) return false
    if (end === start + 2) return false // Empty content

    if (!silent) {
      const token = state.push('spoiler', '', 0)
      token.markup = '=!'
      token.content = state.src.slice(start + 2, end)
    }

    state.pos = end + 2
    return true
  })

  // v-html content cannot use Vue event bindings. Delegate spoiler interaction
  // once so every markdown consumer gets the same click and keyboard behavior.
  if (
    typeof document !== 'undefined' &&
    document.documentElement.dataset.spoilerHandlerInstalled !== 'true'
  ) {
    const toggleSpoiler = (spoiler: Element) => {
      const revealed = spoiler.classList.toggle('revealed')
      spoiler.setAttribute('aria-expanded', String(revealed))
    }

    document.addEventListener(
      'click',
      (event) => {
        const target = event.target
        if (!(target instanceof Element)) return

        const spoiler = target.closest('.spoiler')
        if (!spoiler) return

        event.preventDefault()
        event.stopPropagation()
        toggleSpoiler(spoiler)
      },
      true,
    )

    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return

        const target = event.target
        if (!(target instanceof Element)) return

        const spoiler = target.closest('.spoiler')
        if (!spoiler) return

        event.preventDefault()
        event.stopPropagation()
        toggleSpoiler(spoiler)
      },
      true,
    )

    document.documentElement.dataset.spoilerHandlerInstalled = 'true'
  }

  // Add renderer rule for spoiler tokens
  md.renderer.rules.spoiler = (tokens, idx) => {
    const token = tokens[idx]
    return `<span class="spoiler" role="button" tabindex="0" aria-expanded="false" title="Click to reveal">${md.utils.escapeHtml(token.content)}</span>`
  }
}

export { spoilerPlugin }
