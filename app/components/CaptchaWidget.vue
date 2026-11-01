<template>
    <div class="flex w-full flex-col items-center gap-3">
        <span v-if="isLoading" class="dot animate-pulse bg-primary" aria-hidden="true" />
        <div
            v-else-if="error"
            class="flex flex-col items-center justify-center gap-1 text-sm text-base-content/70"
        >
            <IconAlertTriangle class="w-4.5 h-4.5" />
            <span>{{ error }}</span>
        </div>
        <div
            ref="captchaContainer"
            class="flex min-h-4.5 w-full justify-center"
        />
    </div>
</template>

<script setup lang="ts">
import { getCaptchaConfig } from "~/utils/api";

interface Props {
    provider?: string;
    apiKey?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    verified: [token: string];
}>();

const captchaContainer = ref<HTMLDivElement | null>(null);

const currentProvider = ref("");
const currentApiKey = ref("");
const isLoading = ref(true);
const error = ref("");
const widgetId = ref<string | number | null>(null);

interface CaptchaWindow extends Window {
    turnstile?: {
        render: (
            container: HTMLElement,
            options: Record<string, unknown>,
        ) => string;
        remove?: (widgetId: string) => void;
    };
    hcaptcha?: {
        render: (
            container: HTMLElement,
            options: Record<string, unknown>,
        ) => number;
        remove?: (widgetId: number) => void;
    };
    grecaptcha?: {
        render: (
            container: HTMLElement,
            options: Record<string, unknown>,
        ) => number;
        reset?: (widgetId: number) => void;
    };
}

async function loadScript(src: string, id: string): Promise<void> {
    if (typeof window === "undefined" || typeof document === "undefined")
        return;

    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
        if (existing.dataset.loaded === "true") return;
        await new Promise<void>((resolve, reject) => {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener(
                "error",
                () => reject(new Error(`Failed to load ${src}`)),
                { once: true },
            );
        });
        return;
    }

    await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.id = id;
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            script.dataset.loaded = "true";
            resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}

function cleanupWidget() {
    if (typeof window === "undefined") return;

    const w = window as unknown as CaptchaWindow;
    if (widgetId.value == null) return;

    if (currentProvider.value === "cloudflare") {
        w.turnstile?.remove?.(String(widgetId.value));
    }
    if (currentProvider.value === "hcaptcha") {
        w.hcaptcha?.remove?.(Number(widgetId.value));
    }
    if (currentProvider.value === "recaptcha") {
        w.grecaptcha?.reset?.(Number(widgetId.value));
    }
    widgetId.value = null;
}

function handleSuccess(token: string) {
    emit("verified", token);
}

async function renderWidget() {
    if (typeof window === "undefined" || typeof document === "undefined")
        return;
    if (
        !captchaContainer.value ||
        !currentProvider.value ||
        !currentApiKey.value
    )
        return;

    error.value = "";
    isLoading.value = true;
    cleanupWidget();
    captchaContainer.value.innerHTML = "";

    try {
        const w = window as unknown as CaptchaWindow;
        if (currentProvider.value === "cloudflare") {
            await loadScript(
                "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
                "captcha-turnstile-script",
            );
            if (!w.turnstile) throw new Error("Turnstile failed to initialize");
            widgetId.value = w.turnstile.render(captchaContainer.value, {
                sitekey: currentApiKey.value,
                callback: handleSuccess,
            });
        } else if (currentProvider.value === "hcaptcha") {
            await loadScript(
                "https://js.hcaptcha.com/1/api.js?render=explicit",
                "captcha-hcaptcha-script",
            );
            if (!w.hcaptcha) throw new Error("hCaptcha failed to initialize");
            widgetId.value = w.hcaptcha.render(captchaContainer.value, {
                sitekey: currentApiKey.value,
                callback: handleSuccess,
            });
        } else if (currentProvider.value === "recaptcha") {
            await loadScript(
                "https://www.google.com/recaptcha/api.js?render=explicit",
                "captcha-recaptcha-script",
            );
            if (!w.grecaptcha)
                throw new Error("reCAPTCHA failed to initialize");
            widgetId.value = w.grecaptcha.render(captchaContainer.value, {
                sitekey: currentApiKey.value,
                callback: handleSuccess,
            });
        } else {
            error.value = "Captcha provider not configured correctly.";
        }
    } catch (err) {
        error.value =
            err instanceof Error ? err.message : "Failed to initialize captcha";
    } finally {
        isLoading.value = false;
    }
}

onMounted(async () => {
    if (typeof window === "undefined") return;
    try {
        currentProvider.value = props.provider || "";
        currentApiKey.value = props.apiKey || "";

        if (!currentProvider.value || !currentApiKey.value) {
            const config = await getCaptchaConfig();
            currentProvider.value = config.provider || "";
            currentApiKey.value = config.apiKey || "";
        }
        await renderWidget();
    } catch (err) {
        error.value =
            err instanceof Error
                ? err.message
                : "Failed to load captcha configuration";
        isLoading.value = false;
    }
});

onUnmounted(() => {
    cleanupWidget();
});
</script>
