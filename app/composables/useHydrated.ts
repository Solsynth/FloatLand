/**
 * `false` during SSR and the first client render, `true` afterwards.
 *
 * Use it to keep SSR and the first hydration render identical for UI that can
 * only be resolved on the client (authenticated fetches), so hydration does not
 * pair client nodes with server-rendered ones.
 */
export function useHydrated() {
  const isHydrated = ref(false)
  onMounted(() => {
    isHydrated.value = true
  })
  return isHydrated
}
