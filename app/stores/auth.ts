import type { SnAuthFactor, SnAuthChallenge, SnAuthToken, SnAccount } from "~/types/auth";
import {
    createChallenge,
    getFactors,
    getChallenge,
    requestFactorCode,
    verifyChallenge,
    getToken,
    getUserInfo,
    logoutApi,
    getAuthMode,
} from "~/utils/api";
import {
    readTokenPair,
    clearTokenPair,
    setTokenFromResponse,
} from "~/utils/token";
import FingerprintJS, { type Agent } from "@fingerprintjs/fingerprintjs";

let fpPromise: Promise<Agent> | null = null;

async function getFingerprint(): Promise<string> {
    if (!fpPromise) {
        fpPromise = FingerprintJS.load();
    }
    const fp = await fpPromise;
    const result = await fp.get();
    return result.visitorId;
}

function getDeviceInfo(): Record<string, unknown> {
    if (import.meta.server) {
        return { device_id: "", device_name: "Server", platform: 1 };
    }
    const ua = navigator.userAgent;
    const platform = 1; // 1 = web

    const deviceName =
        ua.includes("Chrome") && !ua.includes("Edg")
            ? "Chrome Browser"
            : ua.includes("Edg")
                ? "Edge Browser"
                : ua.includes("Firefox")
                    ? "Firefox Browser"
                    : ua.includes("Safari") && !ua.includes("Chrome")
                        ? "Safari Browser"
                        : "Web Browser";

    return {
        device_id: "",
        device_name: deviceName,
        platform,
    };
}

export const useAuthStore = defineStore("auth", () => {
    // State
    const isAuthenticated = ref(false);
    const isLoading = ref(false);
    const user = ref<SnAccount | null>(null);
    const token = ref<SnAuthToken | null>(null);

    // Login flow state
    const challenge = ref<SnAuthChallenge | null>(null);
    const factors = ref<SnAuthFactor[]>([]);
    const selectedFactor = ref<SnAuthFactor | null>(null);

    // Computed
    const loginProgress = computed(() => {
        const ch = challenge.value;
        if (!ch) return 0;
        const { stepRemain, stepTotal } = ch;
        if (!stepTotal || stepTotal <= 0) return 0;
        if (stepRemain == null) return 0;
        return Math.max(0, Math.min(1, 1 - stepRemain / stepTotal));
    });

    const loginStep = computed(() => {
        const ch = challenge.value;
        if (!ch) return 0;
        const { stepRemain, stepTotal } = ch;
        if (stepTotal == null || stepRemain == null) return 0;
        return Math.max(0, stepTotal - stepRemain);
    });

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

    function setAuthenticatedUser(userData: unknown): asserts userData is SnAccount {
        if (!isValidAccount(userData)) {
            throw new Error("Authenticated user response is missing account identity");
        }

        user.value = userData;
        isAuthenticated.value = true;
    }

    const displayName = computed(() => user.value?.nick || user.value?.name || "");

    const isSuperuser = computed(() => user.value?.isSuperuser === true);

    // Actions
    async function initAuth() {
        isLoading.value = true;
        try {
            const mode = import.meta.client ? getAuthMode() : "cookie";
            const saved = mode === "bearer" ? readTokenPair() : null;

            // Avoid an unauthenticated /me request when bearer mode has no token.
            if (mode === "bearer" && !saved) {
                user.value = null;
                isAuthenticated.value = false;
                token.value = null;
                return;
            }

            const userData = await getUserInfo();
            setAuthenticatedUser(userData);

            if (saved) {
                token.value = { token: saved.token, expiresAt: saved.expiresAt };
            }
        } catch {
            user.value = null;
            isAuthenticated.value = false;
            token.value = null;
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchUser() {
        try {
            isLoading.value = true;
            const userData = await getUserInfo();
            setAuthenticatedUser(userData);
        } catch (error) {
            console.error("Failed to fetch user:", error);
            user.value = null;
            isAuthenticated.value = false;
            token.value = null;
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    function setToken(
        tokenString: string,
        refreshToken?: string,
        expiresIn?: number,
        refreshExpiresIn?: number,
    ) {
        // Only store in localStorage for dev mode (bearer auth)
        // Production uses HttpOnly cookies set by backend
        if (import.meta.client && getAuthMode() === "bearer") {
            setTokenFromResponse(tokenString, refreshToken, expiresIn, refreshExpiresIn);
            const saved = readTokenPair();
            token.value = { token: tokenString, expiresAt: saved?.expiresAt };
        }
        isAuthenticated.value = true;
    }

    async function logout(): Promise<void> {
        try {
            // Clear server-side session (cookie mode)
            if (import.meta.client && getAuthMode() === "cookie") {
                await logoutApi();
            }
        } catch {
            // Ignore logout API errors
        }

        // Clear local state
        token.value = null;
        user.value = null;
        isAuthenticated.value = false;
        challenge.value = null;
        factors.value = [];
        selectedFactor.value = null;
        clearTokenPair();
    }

    // Login flow
    async function startLogin(account: string) {
        const deviceId = await getFingerprint();
        const deviceInfo = { ...getDeviceInfo(), device_id: deviceId };
        const result = await createChallenge(account, deviceInfo);
        challenge.value = result;
        return result;
    }

    async function loadFactors(challengeId: string) {
        const result = await getFactors(challengeId);
        factors.value = result;
        return result;
    }

    async function loadChallenge(challengeId: string) {
        const result = await getChallenge(challengeId);
        challenge.value = result;
        return result;
    }

    async function requestCode(challengeId: string, factorId: string) {
        return requestFactorCode(challengeId, factorId);
    }

    async function submitVerification(challengeId: string, factorId: string, password: string) {
        const result = await verifyChallenge(challengeId, factorId, password);
        challenge.value = result;
        return result;
    }

    async function exchangeToken(code: string) {
        const result = await getToken(code);
        setToken(
            result.token,
            result.refreshToken,
            result.expiresIn,
            result.refreshExpiresIn,
        );
        await fetchUser();
        return result;
    }

    async function getDeviceId(): Promise<string> {
        return getFingerprint();
    }

    return {
        // State
        isAuthenticated,
        isLoading,
        user,
        token,
        challenge,
        factors,
        selectedFactor,
        // Computed
        loginProgress,
        loginStep,
        displayName,
        isSuperuser,
        // Actions
        initAuth,
        fetchUser,
        setToken,
        logout,
        startLogin,
        loadFactors,
        loadChallenge,
        requestCode,
        submitVerification,
        exchangeToken,
        getDeviceId,
        getDeviceInfo,
    };
});
