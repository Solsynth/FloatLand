import { getFileUrl } from '~/utils/files'

/**
 * Central access to Solian file URL resolution.
 *
 * Components and composables should resolve drive-file URLs through this
 * helper (or the `FileImage` component) so image loading stays consistent
 * and replaceable in one place.
 */
export function useFileUrls() {
  return {
    getFileUrl,
  }
}
