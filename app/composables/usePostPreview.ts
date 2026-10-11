import type { Post } from '~/types/post'
import { fetchPost } from '~/utils/api'

/**
 * Posts already resolved in this session, keyed by id. A page can hold several
 * previews of the same post (a quoted post and its embed), and a preview inside
 * a list re-renders on scroll — neither should refetch.
 */
const cache = new Map<string, Post>()
const inFlight = new Map<string, Promise<Post>>()

export type PostPreviewStatus = 'pending' | 'ready' | 'error'

/**
 * Lazily fetch a post for an inline preview. Resolution starts on mount and only
 * on the client: a page with several previews must not fan out into several
 * blocking API calls during SSR.
 */
export function usePostPreview(postId: MaybeRefOrGetter<string>) {
  const id = computed(() => toValue(postId))
  const cached = cache.get(id.value)

  const post = ref<Post | null>(cached ?? null)
  const status = ref<PostPreviewStatus>(cached ? 'ready' : 'pending')

  async function load(): Promise<void> {
    const target = id.value
    if (!target) return

    const resolved = cache.get(target)
    if (resolved) {
      post.value = resolved
      status.value = 'ready'
      return
    }

    try {
      const pending = inFlight.get(target) ?? fetchPost(target)
      inFlight.set(target, pending)

      const result = await pending
      cache.set(target, result)

      if (id.value === target) {
        post.value = result
        status.value = 'ready'
      }
    } catch {
      // A deleted, private, or blocked post must not break the content around
      // it — the preview falls back to its link.
      if (id.value === target && !post.value) status.value = 'error'
    } finally {
      inFlight.delete(target)
    }
  }

  onMounted(load)

  return { post, status, load }
}
