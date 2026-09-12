<template>
  <NuxtLink
    to="/accounts/me/check-in"
    class="dash-card block p-5 transition-colors hover:border-base-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
  >
    <h3 class="dash-card__title">
      <IconChurch class="h-4 w-4 text-base-content/45" />
      {{ t("dashboard.oracle.title") }}
    </h3>

    <div v-if="loading" class="flex items-center gap-2 py-6">
      <span class="loading loading-spinner loading-xs text-primary" />
    </div>

    <div v-else-if="error" class="py-6">
      <IconFlame class="mb-2 h-5 w-5 text-base-content/30" />
      <p class="text-sm font-medium text-base-content/75">{{ t("dashboard.oracle.notCheckedIn") }}</p>
    </div>

    <div v-else-if="!result" class="py-6">
      <IconFlame class="mb-2 h-5 w-5 text-base-content/30" />
      <p class="text-sm font-medium text-base-content/75">{{ t("dashboard.oracle.notCheckedIn") }}</p>
    </div>

    <div v-else class="mt-4 space-y-2">
      <span class="text-sm font-bold" :style="{ color: getLevelColor(result.level) }">
        {{ getLevelLabel(result.level) }}
      </span>
      <p
        v-if="result.fortuneReport?.poem || result.fortuneReport?.summary"
        class="text-xs text-base-content/60 line-clamp-2 leading-relaxed"
      >
        {{ result.fortuneReport.poem || result.fortuneReport.summary }}
      </p>
      <p v-else class="text-xs text-base-content/45">{{ t("dashboard.oracle.drawFortune") }}</p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { IconChurch, IconFlame } from "#components";
import type { CheckInResult } from "~/utils/api";
import { getCheckInResultToday } from "~/utils/api";

const { t } = useI18n();
const auth = useAuth();
const { isAuthenticated } = auth;

const loading = ref(false);
const error = ref(false);
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
  if (!isAuthenticated.value) return;
  loading.value = true;
  error.value = false;
  try {
    result.value = await getCheckInResultToday();
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
});
</script>
