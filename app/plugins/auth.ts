import { useAuthStore } from "~/stores/auth";

/**
 * Resolve the reader's session once per page load.
 *
 * The session itself is Stargate's: a request either carries its cookie pair or
 * it does not, and renewal happens on the API side when a token has expired.
 * Nothing here polls, so an idle tab costs nothing and a reader who signs in on
 * another host under the same cookie domain is picked up on the next load.
 */
export default defineNuxtPlugin(async () => {
  const store = useAuthStore();
  await store.initAuth();
});
