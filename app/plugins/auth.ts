import { useAuthStore } from "~/stores/auth";
import { refreshSession } from "~/utils/api";

export default defineNuxtPlugin(async () => {
  const store = useAuthStore();

  // Initialize auth state (runs on both SSR and client)
  await store.initAuth();

  // Ensure isLoading is false after initAuth completes
  store.isLoading = false;

  // Client-only: Set up periodic session refresh via the integrated proxy.
  if (import.meta.client) {
    const refreshInterval = setInterval(async () => {
      await refreshSession();
    }, 4 * 60 * 1000); // 4 minutes

    // Clean up interval on app unload
    window.addEventListener("beforeunload", () => {
      clearInterval(refreshInterval);
    });
  }
});
