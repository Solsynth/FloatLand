import type { ActivationProgress, ParticipantTest } from '~/types/test'
import { apiFetch, safeJsonParse } from '~/utils/api'

export function useAccountActivation() {
  const progress = useState<ActivationProgress | null>('account-activation-progress', () => null)
  const pending = useState('account-activation-pending', () => false)
  const error = useState<string | null>('account-activation-error', () => null)

  async function loadProgress() {
    pending.value = true
    error.value = null
    try {
      progress.value = await safeJsonParse<ActivationProgress>(await apiFetch('/passport/accounts/me/activation/progress'))
      return progress.value
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Unable to load activation progress.'
      throw cause
    } finally { pending.value = false }
  }

  async function loadTest(key: string) {
    return safeJsonParse<ParticipantTest>(await apiFetch(`/passport/tests/${encodeURIComponent(key)}`))
  }

  async function recheck() {
    await apiFetch('/passport/tests/activation/recheck', { method: 'POST' })
    return loadProgress()
  }

  return { progress, pending, error, loadProgress, loadTest, recheck }
}
