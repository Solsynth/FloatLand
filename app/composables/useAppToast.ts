type AppToast = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

/**
 * `vue-sonner` only registers `$toast` on the client, so calling it from a load
 * handler that also runs during SSR throws. This wrapper degrades to a no-op on
 * the server instead of crashing the render.
 */
export function useAppToast(): AppToast {
  const toast = import.meta.client
    ? (useNuxtApp().$toast as AppToast | undefined)
    : undefined

  return {
    success: (message: string) => toast?.success(message),
    error: (message: string) => toast?.error(message),
    info: (message: string) => toast?.info(message),
    warning: (message: string) => toast?.warning(message),
  }
}
