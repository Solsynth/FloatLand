<template>
    <NuxtLink
        to="/calendar"
        class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer block"
    >
        <div class="card-body p-4 gap-3">
            <div class="flex items-center gap-2">
                <IconChurch class="w-5 h-5 text-primary" />
                <h3 class="text-sm font-bold">Daily Fortune</h3>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex items-center gap-2">
                <span class="loading loading-spinner loading-xs text-primary" />
                <span class="text-xs text-base-content/50">Loading...</span>
            </div>

            <!-- Not Checked In -->
            <div v-else-if="!result" class="space-y-2">
                <div class="flex items-center gap-2">
                    <IconFlame class="w-4 h-4 text-primary" />
                    <span class="text-sm font-semibold">Not checked in yet</span>
                </div>
                <p class="text-xs text-base-content/50">
                    Visit the temple to draw today's fortune.
                </p>
            </div>

            <!-- Checked In -->
            <div v-else class="space-y-2">
                <div class="flex items-center gap-2">
                    <span
                        class="text-sm font-bold"
                        :style="{ color: getLevelColor(result.level) }"
                    >
                        {{ getLevelLabel(result.level) }}
                    </span>
                </div>
                <p
                    v-if="result.fortuneReport?.poem || result.fortuneReport?.summary"
                    class="text-xs text-base-content/60 line-clamp-2 leading-relaxed"
                >
                    {{ result.fortuneReport.poem || result.fortuneReport.summary }}
                </p>
            </div>
        </div>
    </NuxtLink>
</template>

<script setup lang="ts">
import { IconChurch, IconFlame } from "#components";
import type { CheckInResult } from "~/utils/api";
import { getCheckInResultToday } from "~/utils/api";

const loading = ref(true);
const result = ref<CheckInResult | null>(null);

const levelColors: Record<number, string> = {
    0: "#7A587D",
    1: "#79709C",
    2: "#8DB7EF",
    3: "#FEDE81",
    4: "#E04A46",
    5: "#FFB7C0",
};

const levelLabels: Record<number, string> = {
    0: "Terrible Fortune",
    1: "Bad Fortune",
    2: "Good Fortune",
    3: "Excellent Fortune",
    4: "Great Fortune",
    5: "Best of Luck",
};

function getLevelColor(level: number): string {
    return levelColors[level] ?? "#8DB7EF";
}

function getLevelLabel(level: number): string {
    return levelLabels[level] ?? "Fortune";
}

async function load() {
    loading.value = true;
    try {
        result.value = await getCheckInResultToday();
    } catch {
        // Silently fail for sidebar widget
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    load();
});
</script>
