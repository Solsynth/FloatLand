/**
 * Auth middleware - checks if user is authenticated
 * Disabled in dev mode to avoid redirect loops during local development
 * Redirects to login page if not authenticated
 * Preserves the original URL as redirect parameter
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.dev) {
    console.log("[Auth] Development, skip auth.");
    return;
  }

  const auth = useAuth();

  if (!auth.isAuthenticated.value) {
    const redirectUrl = to.fullPath;
    const host = import.meta.client ? window.location.hostname : "";
    // Mirror runtimeConfig.auth.canonicalHost (private server config) — the
    // canonical host holds the session and mints cross-host sync tickets.
    const canonicalHost = "solian.app";

    // On a non-canonical host (e.g. mail.solarpass.one), sync the session from
    // the canonical host instead of forcing a login there. On the canonical
    // host (or when host is unknown, e.g. SSR), fall back to the login page.
    if (import.meta.client && host && host !== canonicalHost) {
      return navigateTo(
        `/auth/sync?next=${encodeURIComponent(redirectUrl)}`,
      );
    }

    return navigateTo(
      `/auth/login?redirect=${encodeURIComponent(redirectUrl)}`,
    );
  }
});
