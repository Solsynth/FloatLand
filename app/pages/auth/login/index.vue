<template>
    <div class="auth-page">
        <div class="auth-panel auth-panel--split">
            <div class="grid md:grid-cols-2">
                <!-- Brand rail -->
                <aside class="auth-rail">
                    <div>
                        <img
                            src="/favicon.png"
                            alt="Solar Network"
                            class="auth-brand-mark"
                        >
                        <h1 class="mt-5 text-xl font-semibold tracking-tight">
                            {{ step === 'lookup' || step === 'qr' ? t("auth.signIn") : t("auth.welcomeBack") }}
                        </h1>
                        <p class="mt-1.5 text-sm leading-relaxed text-base-content/60">
                            {{ t("auth.description") }}
                        </p>

                        <!-- Account chip after lookup -->
                        <div
                            v-if="step !== 'lookup' && step !== 'success' && account"
                            class="mt-4 flex items-center gap-2 rounded-lg border border-base-300 bg-base-100 px-3 py-2"
                        >
                            <span class="truncate text-sm font-medium">{{ account }}</span>
                        </div>
                    </div>

                    <div>
                        <div
                            v-if="route.query.redirect"
                            class="rounded-lg border border-base-300 bg-base-100 p-3 text-sm"
                        >
                            <p class="text-xs text-base-content/50">{{ t("auth.loginToContinue") }}</p>
                            <p class="mt-1 break-all font-medium text-primary">
                                {{ redirectHost }}
                            </p>
                        </div>
                        <p v-else class="text-sm text-base-content/70">
                            {{ t("auth.noAccount") }}
                            <NuxtLink
                                :to="createAccountHref"
                                class="link link-primary font-medium"
                            >
                                {{ t("auth.createOne") }}
                            </NuxtLink>
                        </p>
                    </div>
                </aside>

                <!-- Form panel -->
                <section class="auth-main">
                    <ConfuseSpinner v-if="auth.isLoading.value" />

                    <template v-else>
                        <!-- Shared progress for multi-step verify -->
                        <div
                            v-if="step === 'picker' || step === 'check'"
                            class="mb-6"
                        >
                            <div class="mb-1.5 flex items-center justify-between text-xs text-base-content/50">
                                <span>{{ t("auth.verification") }}</span>
                                <span>{{ Math.round(auth.loginProgress.value * 100) }}%</span>
                            </div>
                            <div class="h-1 w-full overflow-hidden rounded-full bg-base-200">
                                <div
                                    class="h-full rounded-full bg-primary transition-all duration-300"
                                    :style="{ width: `${auth.loginProgress.value * 100}%` }"
                                />
                            </div>
                        </div>

                        <div
                            v-if="error && step !== 'check'"
                            class="alert alert-error mb-4 text-sm"
                        >
                            <IconAlertCircle class="h-4 w-4 shrink-0" />
                            <span>{{ error }}</span>
                        </div>

                        <!-- Step 1: Username Entry -->
                        <div v-if="step === 'lookup'" class="flex flex-1 flex-col">
                            <div class="space-y-4">
                                <fieldset class="fieldset">
                                    <legend class="fieldset-legend">{{ t("auth.usernameOrEmail") }}</legend>
                                    <input
                                        ref="accountInputRef"
                                        v-model="account"
                                        type="text"
                                        name="username"
                                        autocomplete="username"
                                        :placeholder="t('auth.emailPlaceholder')"
                                        class="input input-bordered w-full"
                                        :disabled="submitting"
                                        @keydown.enter="handleLookup"
                                    >
                                </fieldset>

                                <button
                                    type="button"
                                    class="btn btn-primary w-full"
                                    :disabled="!account.trim() || submitting"
                                    @click="handleLookup"
                                >
                                    <IconLoader
                                        v-if="submitting && !discoverablePasskeyBusy"
                                        class="h-4 w-4 animate-spin"
                                    />
                                    <IconArrowRight v-else class="h-4 w-4" />
                                    {{ t("auth.continue") }}
                                </button>
                            </div>

                            <div class="mt-auto pt-8">
                                <div class="divider my-0 text-xs text-base-content/40">
                                    {{ t("auth.orSignInWith") }}
                                </div>
                                <div class="mt-4 grid gap-2">
                                    <button
                                        type="button"
                                        class="btn btn-outline w-full gap-2"
                                        :disabled="submitting"
                                        @click="startQrLogin"
                                    >
                                        <IconQrCode class="h-4 w-4" />
                                        {{ t("auth.signInWithQr") }}
                                    </button>
                                    <button
                                        v-if="passkeySupported"
                                        type="button"
                                        class="btn btn-outline w-full gap-2"
                                        :disabled="submitting"
                                        @click="handleDiscoverablePasskeyLogin"
                                    >
                                        <IconLoader
                                            v-if="submitting && discoverablePasskeyBusy"
                                            class="h-4 w-4 animate-spin"
                                        />
                                        <IconFingerprint v-else class="h-4 w-4" />
                                        {{ t("auth.signInWithPasskey") }}
                                    </button>
                                    <div class="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            class="btn btn-outline gap-2"
                                            :disabled="submitting"
                                            @click="handleOidcLogin('github')"
                                        >
                                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                            </svg>
                                            GitHub
                                        </button>
                                        <button
                                            type="button"
                                            class="btn btn-outline gap-2"
                                            :disabled="submitting"
                                            @click="handleOidcLogin('google')"
                                        >
                                            <svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            Google
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- QR Login: show code + poll only (phone scans/approves) -->
                        <div v-if="step === 'qr'" class="flex flex-1 flex-col">
                            <div class="mb-4">
                                <h2 class="text-lg font-semibold">{{ t("auth.qrTitle") }}</h2>
                                <p class="mt-0.5 text-sm text-base-content/60">
                                    {{ t("auth.qrHint") }}
                                </p>
                            </div>

                            <div class="flex flex-1 flex-col items-center justify-center gap-4 py-2">
                                <div class="flex h-52 w-52 items-center justify-center rounded-lg border border-base-300 bg-white p-3">
                                    <IconLoader
                                        v-if="qrLoading"
                                        class="h-8 w-8 animate-spin text-base-content/40"
                                    />
                                    <img
                                        v-else-if="qrData && qrStatus !== 'declined' && qrStatus !== 'expired'"
                                        :src="qrImageUrl"
                                        alt="Login QR code"
                                        class="h-full w-full object-contain"
                                        width="200"
                                        height="200"
                                    >
                                    <div
                                        v-else
                                        class="flex flex-col items-center gap-2 text-center text-sm text-base-content/60"
                                    >
                                        <IconQrCode class="h-10 w-10 opacity-40" />
                                        <span>{{ qrStatus === 'declined' ? t("auth.qrDeclined") : t("auth.qrExpired") }}</span>
                                    </div>
                                </div>

                                <p
                                    class="text-sm"
                                    :class="{
                                        'text-base-content/60': qrStatus === 'pending' || qrLoading,
                                        'text-primary': qrStatus === 'scanned',
                                        'text-error': qrStatus === 'declined' || qrStatus === 'expired',
                                    }"
                                >
                                    <template v-if="qrLoading">{{ t("common.loading") }}</template>
                                    <template v-else-if="qrStatus === 'pending'">{{ t("auth.qrWaiting") }}</template>
                                    <template v-else-if="qrStatus === 'scanned'">{{ t("auth.qrScanned") }}</template>
                                    <template v-else-if="qrStatus === 'declined'">{{ t("auth.qrDeclined") }}</template>
                                    <template v-else-if="qrStatus === 'expired'">{{ t("auth.qrExpired") }}</template>
                                </p>

                                <p
                                    v-if="qrExpiresAt && (qrStatus === 'pending' || qrStatus === 'scanned')"
                                    class="text-xs text-base-content/40"
                                >
                                    {{ qrCountdownLabel }}
                                </p>
                            </div>

                            <div class="mt-auto grid grid-cols-2 gap-2 pt-6">
                                <button
                                    type="button"
                                    class="btn btn-ghost"
                                    :disabled="submitting"
                                    @click="stopQrLogin"
                                >
                                    <IconArrowLeft class="h-4 w-4" />
                                    {{ t("auth.back") }}
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-outline"
                                    :disabled="qrLoading || submitting"
                                    @click="startQrLogin"
                                >
                                    <IconLoader v-if="qrLoading" class="h-4 w-4 animate-spin" />
                                    <IconRefreshCw v-else class="h-4 w-4" />
                                    {{ t("auth.qrRefresh") }}
                                </button>
                            </div>
                        </div>

                        <!-- Step 2: Factor Selection -->
                        <div v-if="step === 'picker'" class="flex flex-1 flex-col">
                            <div class="mb-4">
                                <h2 class="text-lg font-semibold">{{ t("auth.selectMethod") }}</h2>
                                <p class="mt-0.5 text-sm text-base-content/60">
                                    {{ t("auth.selectMethodHint") }}
                                </p>
                            </div>

                            <LoginFactorList
                                :factors="auth.factors.value"
                                :selected-factor="auth.selectedFactor.value"
                                :challenge="auth.challenge.value"
                                @select="auth.selectFactor($event)"
                            />

                            <div class="mt-auto grid grid-cols-2 gap-2 pt-6">
                                <button
                                    type="button"
                                    class="btn btn-ghost"
                                    :disabled="submitting"
                                    @click="goBackToLookup"
                                >
                                    <IconArrowLeft class="h-4 w-4" />
                                    {{ t("auth.back") }}
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-primary"
                                    :disabled="!auth.selectedFactor.value || submitting"
                                    @click="handleFactorSelect"
                                >
                                    <IconLoader v-if="submitting" class="h-4 w-4 animate-spin" />
                                    <IconArrowRight v-else class="h-4 w-4" />
                                    {{ t("auth.continue") }}
                                </button>
                            </div>
                        </div>

                        <!-- Step 3: Verification -->
                        <div v-if="step === 'check'" class="flex flex-1 flex-col">
                            <div
                                v-if="error"
                                class="alert alert-error mb-4 text-sm"
                            >
                                <IconAlertCircle class="h-4 w-4 shrink-0" />
                                <span>{{ error }}</span>
                            </div>

                            <LoginAuthenticate
                                v-model="password"
                                :factor="auth.selectedFactor.value"
                                :submitting="submitting"
                                @submit="handleVerify"
                                @back="goBackToFactors"
                                @passkey="handlePasskeyAuth"
                            />
                        </div>

                        <!-- Step 4: Success -->
                        <div
                            v-if="step === 'success'"
                            class="flex flex-1 flex-col items-center justify-center py-10 text-center"
                        >
                            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                                <IconCheck class="h-6 w-6 text-success" />
                            </div>
                            <h2 class="text-lg font-semibold">{{ t("auth.loginSuccessful") }}</h2>
                            <p class="mt-1 text-sm text-base-content/60">
                                {{ t("auth.redirecting") }}
                            </p>
                        </div>
                    </template>
                </section>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    IconAlertCircle,
    IconLoader,
    IconArrowRight,
    IconArrowLeft,
    IconCheck,
    IconFingerprint,
    IconQrCode,
    IconRefreshCw,
} from "#components";
import {
    startPasskeyAuthentication,
    completePasskeyAuthentication,
    startDiscoverablePasskeyAuthentication,
    completeDiscoverablePasskeyAuthentication,
    generateQrLogin,
    getQrLoginStatus,
    normalizeQrLoginStatus,
} from "~/utils/api";
import type { SnAuthChallenge, QrLoginStatus } from "~/types/auth";
import {
    arrayBufferToBase64Url,
    base64UrlToArrayBuffer,
    getPasskeyDeviceName,
    isWebAuthnAvailable,
} from "~/utils/webauthn";

definePageMeta({
    layout: false,
});

const { t } = useI18n();

if (import.meta.server) {
    defineOgImage('UniOgImage', { title: t("auth.seoTitleLogIn"), description: t("auth.seoDescriptionLogIn") })
}

useSolarSeo({
    title: t("auth.seoTitleLogIn"),
    description: t("auth.seoDescriptionLogIn"),
});

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const { saveRedirect, getRedirect, clearRedirect } = useAuthRedirect();
const {
    startLogin,
    loadFactors,
    loadChallenge,
    submitVerification,
    exchangeToken,
    clearLoginFlow,
    clearFactor,
} = auth;

const step = ref<"lookup" | "picker" | "check" | "success" | "qr">("lookup");
const account = ref("");
const password = ref("");
const submitting = ref(false);
const error = ref<string | null>(null);
const discoverablePasskeyBusy = ref(false);
const passkeySupported = ref(false);
const accountInputRef = ref<HTMLInputElement | null>(null);

// QR login state
const qrLoading = ref(false);
const qrData = ref<string | null>(null);
const qrChallengeId = ref<string | null>(null);
const qrAuthChallengeId = ref<string | null>(null);
const qrStatus = ref<QrLoginStatus>("pending");
const qrExpiresAt = ref<Date | null>(null);
const qrNow = ref(Date.now());
let qrPollTimer: ReturnType<typeof setInterval> | null = null;
let qrCountdownTimer: ReturnType<typeof setInterval> | null = null;
let qrFinishing = false;

const qrImageUrl = computed(() => {
    if (!qrData.value) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.value)}`;
});

const qrCountdownLabel = computed(() => {
    if (!qrExpiresAt.value) return "";
    const remaining = Math.max(0, Math.floor((qrExpiresAt.value.getTime() - qrNow.value) / 1000));
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
});

const createAccountHref = computed(() => {
    const redirect = getRedirect();
    return redirect
        ? `/auth/create-account?redirect=${encodeURIComponent(redirect)}`
        : "/auth/create-account";
});

const redirectHost = computed(() => {
    const raw = route.query.redirect as string | undefined;
    if (!raw) return "";
    try {
        const decoded = decodeURIComponent(raw);
        // Prefer path-only display when a full URL is provided
        return decoded.replace(/^https?:\/\/[^/]+/i, "") || decoded;
    } catch {
        return raw;
    }
});

function focusAccountInput() {
    nextTick(() => {
        accountInputRef.value?.focus();
    });
}

function updateQuery(params: Record<string, string>) {
    const redirect = route.query.redirect as string | undefined;
    router.replace({
        query: redirect ? { ...params, redirect } : params,
    });
}

function goBackToLookup() {
    password.value = "";
    clearFactor();
    clearLoginFlow();
    stopQrPolling();
    resetQrState();
    step.value = "lookup";
    updateQuery({});
    focusAccountInput();
}

function resetQrState() {
    qrData.value = null;
    qrChallengeId.value = null;
    qrAuthChallengeId.value = null;
    qrStatus.value = "pending";
    qrExpiresAt.value = null;
    qrLoading.value = false;
    qrFinishing = false;
}

function stopQrPolling() {
    if (qrPollTimer) {
        clearInterval(qrPollTimer);
        qrPollTimer = null;
    }
    if (qrCountdownTimer) {
        clearInterval(qrCountdownTimer);
        qrCountdownTimer = null;
    }
}

function stopQrLogin() {
    stopQrPolling();
    resetQrState();
    step.value = "lookup";
    error.value = null;
    focusAccountInput();
}

async function finishQrLogin(authChallengeId: string) {
    if (qrFinishing) return;
    qrFinishing = true;
    stopQrPolling();
    submitting.value = true;
    error.value = null;
    try {
        step.value = "success";
        const redirectUrl = (route.query.redirect as string) || getRedirect();
        await exchangeToken(authChallengeId);
        clearLoginFlow();
        clearRedirect();
        router.replace({ query: {} });
        navigateTo(redirectUrl || "/");
    } catch (e) {
        error.value = e instanceof Error ? e.message : t("auth.verificationFailed");
        step.value = "qr";
        qrStatus.value = "expired";
        qrFinishing = false;
    } finally {
        submitting.value = false;
    }
}

async function pollQrStatus() {
    const id = qrChallengeId.value;
    const authId = qrAuthChallengeId.value;
    if (!id || !authId || qrFinishing) return;

    try {
        const statusRes = await getQrLoginStatus(id);
        const status = normalizeQrLoginStatus(statusRes.status);
        qrStatus.value = status;

        if (status === "approved") {
            await finishQrLogin(statusRes.authChallengeId || authId);
        } else if (status === "declined" || status === "expired") {
            stopQrPolling();
        }
    } catch {
        // 404 = expired / not found
        if (!qrFinishing) {
            qrStatus.value = "expired";
            stopQrPolling();
        }
    }
}

async function startQrLogin() {
    stopQrPolling();
    error.value = null;
    qrLoading.value = true;
    qrStatus.value = "pending";
    qrData.value = null;
    step.value = "qr";

    try {
        const deviceId = await auth.getDeviceId();
        const deviceInfo = auth.getDeviceInfo() as {
            device_name?: string;
            platform?: number;
        };
        const generated = await generateQrLogin({
            deviceId,
            deviceName: deviceInfo.device_name || getPasskeyDeviceName(),
            platform: typeof deviceInfo.platform === "number" ? deviceInfo.platform : 1,
        });

        qrChallengeId.value = generated.qrChallengeId;
        qrAuthChallengeId.value = generated.authChallengeId;
        qrData.value = generated.qrData;
        qrExpiresAt.value = generated.expiresAt
            ? new Date(generated.expiresAt)
            : new Date(Date.now() + (generated.expiresInSeconds || 300) * 1000);
        qrNow.value = Date.now();

        qrPollTimer = setInterval(() => {
            void pollQrStatus();
        }, 2000);

        qrCountdownTimer = setInterval(() => {
            qrNow.value = Date.now();
            if (qrExpiresAt.value && qrNow.value >= qrExpiresAt.value.getTime()) {
                if (qrStatus.value === "pending" || qrStatus.value === "scanned") {
                    qrStatus.value = "expired";
                    stopQrPolling();
                }
            }
        }, 1000);

        // First poll slightly delayed so generate has settled
        void pollQrStatus();
    } catch (e) {
        error.value = e instanceof Error ? e.message : t("auth.qrFailed");
        qrStatus.value = "expired";
    } finally {
        qrLoading.value = false;
    }
}

async function handleLookup() {
    const accountValue = account.value.trim();
    if (!accountValue) return;
    account.value = accountValue;
    submitting.value = true;
    error.value = null;

    try {
        await startLogin(accountValue);
        const challengeId = auth.challenge.value!.id;
        const factors = await loadFactors(challengeId);

        updateQuery({
            challenge: challengeId,
            step: factors.length > 1 ? "picker" : "check",
        });

        if (factors.length === 1) {
            auth.selectFactor(factors[0]!);
            step.value = "check";
        } else if (factors.length > 1) {
            step.value = "picker";
        } else {
            error.value = t("auth.noMethods");
        }
    } catch (e) {
        error.value = e instanceof Error ? e.message : t("auth.failedToStartLogin");
    } finally {
        submitting.value = false;
    }
}

async function handleFactorSelect() {
    const factor = auth.selectedFactor.value;
    const challengeId = auth.challenge.value?.id;
    if (!factor || !challengeId) return;

    submitting.value = true;
    error.value = null;

    try {
        await auth.requestCode(challengeId, factor.id);
    } catch (e) {
        // 400 errors are non-fatal (e.g. factor already verified), proceed anyway
        if (!(e instanceof Error && e.message.includes("400"))) {
            error.value = e instanceof Error ? e.message : t("auth.failedSelectFactor");
            submitting.value = false;
            return;
        }
    }

    submitting.value = false;
    step.value = "check";
    updateQuery({ challenge: challengeId, step: "check" });
}

async function handleVerify() {
    if (!password.value) {
        error.value = t("auth.passwordRequired");
        return;
    }
    if (!auth.challenge.value) {
        error.value = t("auth.sessionExpired");
        step.value = "lookup";
        return;
    }
    if (!auth.selectedFactor.value) {
        error.value = t("auth.selectMethodFirst");
        step.value = "picker";
        return;
    }

    submitting.value = true;
    error.value = null;

    try {
        const result = await submitVerification(
            auth.challenge.value.id,
            auth.selectedFactor.value.id,
            password.value,
        );

        if (result.stepRemain && result.stepRemain > 0) {
            // More steps needed - go back to factor picker
            password.value = "";
            clearFactor();
            const factors = await loadFactors(result.id);
            updateQuery({ challenge: result.id, step: "picker" });
            if (factors.length === 1) {
                auth.selectFactor(factors[0]!);
                step.value = "check";
            } else {
                step.value = "picker";
            }
        } else {
            // Login complete - show success and redirect
            step.value = "success";
            const code = auth.challenge.value!.id;
            // Get redirect URL from query or sessionStorage
            const redirectUrl = (route.query.redirect as string) || getRedirect();
            await exchangeToken(code);
            clearLoginFlow();
            clearRedirect();
            router.replace({ query: {} });
            // Redirect to original URL if redirect param exists, otherwise go home
            navigateTo(redirectUrl || "/");
        }
    } catch (e) {
        error.value = e instanceof Error ? e.message : t("auth.verificationFailed");
    } finally {
        submitting.value = false;
    }
}

function goBackToFactors() {
    password.value = "";
    clearFactor();
    step.value = "picker";
    if (auth.challenge.value) {
        updateQuery({ challenge: auth.challenge.value.id, step: "picker" });
    }
}

async function finishLoginFromChallenge(result: SnAuthChallenge) {
    auth.setChallengeState(result);

    if (result.stepRemain && result.stepRemain > 0) {
        password.value = "";
        clearFactor();
        const factors = await loadFactors(result.id);
        updateQuery({ challenge: result.id, step: "picker" });
        if (factors.length === 1) {
            auth.selectFactor(factors[0]!);
            step.value = "check";
        } else {
            step.value = "picker";
        }
        return;
    }

    step.value = "success";
    const redirectUrl = (route.query.redirect as string) || getRedirect();
    await exchangeToken(result.id);
    clearLoginFlow();
    clearRedirect();
    router.replace({ query: {} });
    navigateTo(redirectUrl || "/");
}

async function handlePasskeyAuth() {
    const challenge = auth.challenge.value;
    if (!challenge) {
        error.value = t("auth.sessionExpired");
        step.value = "lookup";
        return;
    }

    submitting.value = true;
    error.value = null;

    try {
        const options = await startPasskeyAuthentication(challenge.id);

        const credential = await navigator.credentials.get({
            publicKey: {
                challenge: base64UrlToArrayBuffer(options.challenge),
                rpId: options.rpId,
                allowCredentials: (options.allowCredentials ?? []).map(cred => ({
                    type: (cred.type || "public-key") as PublicKeyCredentialType,
                    id: base64UrlToArrayBuffer(cred.id),
                    transports: cred.transports as AuthenticatorTransport[] | undefined,
                })),
                userVerification: (options.userVerification || "preferred") as UserVerificationRequirement,
                timeout: options.timeout,
            },
        }) as PublicKeyCredential | null;

        if (!credential) {
            throw new Error(t("auth.passkeyAuthCancelled"));
        }

        const response = credential.response as AuthenticatorAssertionResponse;

        // No factor_id — Padlock resolves the Passkey factor from the account
        const result = await completePasskeyAuthentication(
            challenge.id,
            credential.id,
            arrayBufferToBase64Url(response.clientDataJSON),
            arrayBufferToBase64Url(response.authenticatorData),
            arrayBufferToBase64Url(response.signature),
            response.userHandle
                ? arrayBufferToBase64Url(response.userHandle)
                : null,
        );

        await finishLoginFromChallenge(result);
    } catch (e) {
        error.value = e instanceof Error ? e.message : t("auth.verificationFailed");
    } finally {
        submitting.value = false;
    }
}

async function handleDiscoverablePasskeyLogin() {
    if (!passkeySupported.value) {
        error.value = t("auth.passkeyNotSupported");
        return;
    }

    submitting.value = true;
    discoverablePasskeyBusy.value = true;
    error.value = null;

    try {
        const deviceId = await auth.getDeviceId();
        const deviceName = getPasskeyDeviceName();
        const options = await startDiscoverablePasskeyAuthentication({
            deviceId,
            deviceName,
            platform: 1,
        });

        if (!options.authChallengeId) {
            throw new Error(t("auth.failedToStartLogin"));
        }

        // Empty allowCredentials so the authenticator picks a discoverable credential
        const credential = await navigator.credentials.get({
            publicKey: {
                challenge: base64UrlToArrayBuffer(options.challenge),
                rpId: options.rpId,
                allowCredentials: [],
                userVerification: (options.userVerification || "preferred") as UserVerificationRequirement,
                timeout: options.timeout,
            },
        }) as PublicKeyCredential | null;

        if (!credential) {
            throw new Error(t("auth.passkeyAuthCancelled"));
        }

        const response = credential.response as AuthenticatorAssertionResponse;
        const result = await completeDiscoverablePasskeyAuthentication(
            options.authChallengeId,
            credential.id,
            arrayBufferToBase64Url(response.clientDataJSON),
            arrayBufferToBase64Url(response.authenticatorData),
            arrayBufferToBase64Url(response.signature),
            response.userHandle
                ? arrayBufferToBase64Url(response.userHandle)
                : null,
        );

        await finishLoginFromChallenge(result);
    } catch (e) {
        error.value = e instanceof Error ? e.message : t("auth.verificationFailed");
    } finally {
        submitting.value = false;
        discoverablePasskeyBusy.value = false;
    }
}

async function handleOidcLogin(provider: string) {
    const config = useRuntimeConfig();
    // Include redirect in callback URL so it's preserved after OIDC flow
    const redirectUrl = (route.query.redirect as string) || getRedirect();
    const redirectParam = redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : "";
    const returnUrl = `${window.location.origin}/auth/callback/${provider}?${redirectParam}`;
    const deviceId = await auth.getDeviceId();
    const url = `${config.public.apiBaseUrl}/padlock/auth/login/${provider}?returnUrl=${encodeURIComponent(returnUrl)}&deviceId=${deviceId}&flow=login`;
    window.location.href = url;
}

onMounted(async () => {
    auth.isLoading.value = false;
    clearLoginFlow();
    step.value = "lookup";
    passkeySupported.value = isWebAuthnAvailable();

    // Save redirect URL to sessionStorage if present
    const redirectFromQuery = route.query.redirect as string | undefined;
    if (redirectFromQuery) {
        saveRedirect(redirectFromQuery);
    }

    const challengeId = route.query.challenge as string;
    const requestedStep = route.query.step as string;

    if (challengeId) {
        try {
            await loadChallenge(challengeId);
            const factors = await loadFactors(challengeId);
            if (factors.length > 0) {
                if (requestedStep === "check" && factors.length === 1) {
                    auth.selectFactor(factors[0]!);
                    step.value = "check";
                } else if (requestedStep === "picker" || factors.length > 1) {
                    step.value = "picker";
                } else if (factors.length === 1) {
                    auth.selectFactor(factors[0]!);
                    step.value = "check";
                }
            }
        } catch {
            clearLoginFlow();
            step.value = "lookup";
        }
    }

    if (step.value === "lookup") {
        focusAccountInput();
    }
});

onUnmounted(() => {
    stopQrPolling();
});
</script>
