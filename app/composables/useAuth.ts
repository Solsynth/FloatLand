import { storeToRefs } from "pinia";
import { useAuthStore } from "~/stores/auth";

/**
 * Read the signed-in reader. The session itself is Stargate's: this only
 * surfaces who the shared cookies belong to, plus the one action that ends it.
 */
export function useAuth() {
  const store = useAuthStore();

  const { isAuthenticated, isLoading, user, displayName, isSuperuser } =
    storeToRefs(store);

  return {
    isAuthenticated,
    isLoading,
    user,
    displayName,
    isSuperuser,
    initAuth: store.initAuth,
    fetchUser: store.fetchUser,
    logout: store.logout,
  };
}
