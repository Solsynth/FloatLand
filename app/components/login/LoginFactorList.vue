<template>
    <div class="space-y-2">
        <label
            v-for="factor in availableFactors"
            :key="factor.id"
            class="auth-choice"
            :class="{
                'border-primary bg-primary/5': selectedFactor?.id === factor.id,
                'cursor-pointer hover:border-base-content/20 hover:bg-base-200/60': !isBlacklisted(factor.id) && selectedFactor?.id !== factor.id,
                'opacity-50 cursor-not-allowed': isBlacklisted(factor.id),
            }"
        >
            <input
                type="radio"
                name="factor"
                class="radio radio-primary radio-sm"
                :checked="selectedFactor?.id === factor.id"
                :disabled="isBlacklisted(factor.id)"
                @change="!isBlacklisted(factor.id) && $emit('select', factor)"
            >
            <IconKey
                v-if="getFactorIconType(factor.type) === 'key'"
                class="h-4 w-4 shrink-0 text-base-content/60"
            />
            <IconMail
                v-else-if="getFactorIconType(factor.type) === 'mail'"
                class="h-4 w-4 shrink-0 text-base-content/60"
            />
            <IconBell
                v-else-if="getFactorIconType(factor.type) === 'bell'"
                class="h-4 w-4 shrink-0 text-base-content/60"
            />
            <IconTimer
                v-else-if="getFactorIconType(factor.type) === 'timer'"
                class="h-4 w-4 shrink-0 text-base-content/60"
            />
            <IconNfc
                v-else-if="getFactorIconType(factor.type) === 'nfc'"
                class="h-4 w-4 shrink-0 text-base-content/60"
            />
            <IconKeySquare
                v-else-if="getFactorIconType(factor.type) === 'key-square'"
                class="h-4 w-4 shrink-0 text-base-content/60"
            />
            <IconShield v-else class="h-4 w-4 shrink-0 text-base-content/60" />
            <div class="min-w-0">
                <div class="text-sm font-medium">
                    {{ factor.name || getFactorLabel(factor.type) }}
                </div>
                <div class="text-xs text-base-content/50">
                    {{ getFactorDescription(factor.type) }}
                    <span v-if="isBlacklisted(factor.id)" class="text-warning">
                        {{ t("login.alreadyUsed") }}
                    </span>
                </div>
            </div>
        </label>
    </div>
</template>

<script setup lang="ts">
import {
    IconKey,
    IconMail,
    IconBell,
    IconTimer,
    IconShield,
    IconNfc,
    IconKeySquare,
} from "#components";
import type { SnAuthFactor, SnAuthChallenge } from "~/types/auth";
import { FACTOR_TYPES } from "~/types/auth";

const { t } = useI18n();

const props = defineProps<{
    factors: SnAuthFactor[];
    selectedFactor: SnAuthFactor | null;
    challenge?: SnAuthChallenge | null;
}>();

defineEmits<{
    select: [factor: SnAuthFactor];
}>();

const availableFactors = computed(() => {
    // Filter out factors unavailable on web (NFC) and QR Login (separate web flow)
    return props.factors.filter((f) => {
        if (FACTOR_TYPES[f.type]?.webUnavailable) return false;
        if (f.type === 8) return false; // QrLogin — use /auth/login QR panel instead
        if (f.type === 7) return false; // Passkey, use seperate way
        return true;
    });
});

function isBlacklisted(factorId: string): boolean {
    return props.challenge?.blacklistFactors?.includes(factorId) ?? false;
}

function getFactorLabel(type: number): string {
    return FACTOR_TYPES[type]?.label || "Unknown";
}

function getFactorDescription(type: number): string {
    return FACTOR_TYPES[type]?.description || "";
}

function getFactorIconType(type: number): string {
    return FACTOR_TYPES[type]?.icon || "key";
}
</script>
