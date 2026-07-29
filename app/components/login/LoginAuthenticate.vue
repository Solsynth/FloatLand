<template>
    <div class="flex flex-1 flex-col">
        <div class="mb-4">
            <h2 class="text-lg font-semibold">{{ factorLabel }}</h2>
            <p class="mt-0.5 text-sm text-base-content/60">{{ factorDescription }}</p>
        </div>

        <div v-if="error" class="alert alert-error mb-4 text-sm">
            <IconAlertCircle class="h-4 w-4 shrink-0" />
            <span>{{ error }}</span>
        </div>

        <!-- Passkey: show button instead of input -->
        <div v-if="isPasskey" class="flex flex-1 flex-col">
            <button
                type="button"
                class="btn btn-primary w-full gap-2"
                :disabled="submitting"
                @click="$emit('passkey')"
            >
                <IconLoader v-if="submitting" class="h-4 w-4 animate-spin" />
                <IconFingerprint v-else class="h-4 w-4" />
                {{ t("login.authenticateWithPasskey") }}
            </button>
            <button
                type="button"
                class="btn btn-ghost mt-auto w-full"
                :disabled="submitting"
                @click="$emit('back')"
            >
                <IconArrowLeft class="h-4 w-4" />
                {{ t("auth.back") }}
            </button>
        </div>

        <!-- Standard input for other factor types -->
        <div v-else class="flex flex-1 flex-col">
            <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ inputPlaceholder }}</legend>
                <input
                    ref="inputRef"
                    :type="isPassword ? 'password' : 'text'"
                    :placeholder="inputPlaceholder"
                    class="input input-bordered auth-input w-full"
                    :value="modelValue"
                    :autocomplete="isPassword ? 'current-password' : 'one-time-code'"
                    :disabled="submitting"
                    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
                    @keydown.enter="$emit('submit')"
                >
            </fieldset>

            <div class="mt-auto grid grid-cols-2 gap-2 pt-6">
                <button
                    type="button"
                    class="btn btn-ghost"
                    :disabled="submitting"
                    @click="$emit('back')"
                >
                    <IconArrowLeft class="h-4 w-4" />
                    {{ t("auth.back") }}
                </button>
                <button
                    type="button"
                    class="btn btn-primary"
                    :disabled="!modelValue || submitting"
                    @click="$emit('submit')"
                >
                    <IconLoader v-if="submitting" class="h-4 w-4 animate-spin" />
                    <IconCheck v-else class="h-4 w-4" />
                    {{ submitLabel }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    IconAlertCircle,
    IconLoader,
    IconArrowLeft,
    IconCheck,
    IconFingerprint,
} from "#components";
import type { SnAuthFactor } from "~/types/auth";
import { FACTOR_TYPES } from "~/types/auth";

const { t } = useI18n();

const props = defineProps<{
    factor: SnAuthFactor | null;
    modelValue: string;
    submitting: boolean;
}>();

defineEmits<{
    "update:modelValue": [value: string];
    submit: [];
    back: [];
    passkey: [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const isPasskey = computed(() => props.factor?.type === 7);

const isPassword = computed(() => {
    const type = props.factor?.type;
    return type === 0 || type === 4; // Password or PIN
});

const factorLabel = computed(() => FACTOR_TYPES[props.factor?.type ?? -1]?.label || "Verification");
const factorDescription = computed(() => FACTOR_TYPES[props.factor?.type ?? -1]?.description || "");
const inputPlaceholder = computed(() => isPassword.value ? t("login.enterPassword") : t("login.enterCode"));
const submitLabel = computed(() => isPassword.value ? t("login.verify") : t("login.submit"));

const error = ref<string | null>(null);

watch(() => props.factor, () => {
    error.value = null;
}, { immediate: true });

onMounted(() => {
    if (!isPasskey.value) {
        nextTick(() => {
            inputRef.value?.focus();
        });
    }
});
</script>
