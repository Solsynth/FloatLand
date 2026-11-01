import type { SnAccount } from "~/types/auth";
import { getUserInfo, logoutApi } from "~/utils/api";

/**
 * The signed-in reader.
 *
 * There is no client-side login flow: signing in happens on Stargate, which
 * sets the `AuthToken`/`RefreshToken` cookies for the whole cookie domain. This
 * store only *reads* that session — it asks the API who the cookies belong to,
 * and exposes the answer — so every surface can render without knowing how the
 * reader arrived.
 */
export const useAuthStore = defineStore("auth", () => {
  const isLoading = ref(false);
  const user = ref<SnAccount | null>(null);

  const isAuthenticated = computed(() => user.value !== null);
  const displayName = computed(() => user.value?.nick || user.value?.name || "");
  const isSuperuser = computed(() => user.value?.isSuperuser === true);

  function isValidAccount(value: unknown): value is SnAccount {
    if (!value || typeof value !== "object") return false;
    const account = value as Partial<SnAccount>;
    return (
      typeof account.id === "string" &&
      account.id.trim().length > 0 &&
      typeof account.name === "string" &&
      account.name.trim().length > 0
    );
  }

  function setUser(userData: unknown) {
    if (!isValidAccount(userData)) {
      throw new Error("Authenticated user response is missing account identity");
    }
    user.value = userData;
  }

  /**
   * Resolve the session once per page load. A reader with no cookies, or with
   * an expired pair Stargate refuses to renew, is simply anonymous — that is
   * not an error state for an explorer that reads public content.
   */
  async function initAuth() {
    isLoading.value = true;
    try {
      setUser(await getUserInfo());
    } catch {
      user.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchUser() {
    isLoading.value = true;
    try {
      setUser(await getUserInfo());
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Forget the reader locally, without telling the API.
   *
   * This is what a `401` means: the pair the browser presented is already
   * dead, so asking the API to end a session it has just refused would be a
   * request that can only fail — and one that, since it is itself a 401, would
   * call straight back into this path.
   */
  function clearUser() {
    user.value = null;
  }

  /**
   * Sign out. The backend clears the cookie pair on the shared domain, so the
   * browser forgets the session for every host under it, not just this one.
   */
  async function logout() {
    try {
      await logoutApi();
    } catch {
      // The local state is cleared regardless: a network failure must not
      // leave the interface claiming a session the reader asked to end.
    }
    clearUser();
  }

  return {
    isLoading,
    user,
    isAuthenticated,
    displayName,
    isSuperuser,
    initAuth,
    fetchUser,
    logout,
    clearUser,
  };
});
