<template>
  <div class="flex flex-col items-center gap-5 text-center">
    <!-- Sun / moon glyph — the one true-color moment, reflects real time -->
    <component
      :is="isDay ? IconSun : IconMoonStar"
      class="h-8 w-8"
      :class="isDay ? 'text-amber-400' : 'text-indigo-400'"
      :aria-hidden="true"
    />

    <!-- Greeting -->
    <p class="text-sm font-medium text-base-content/70">
      {{ greeting }}<template v-if="displayName">, {{ displayName }}</template>
    </p>

    <!-- Clock — instrumental mono, seconds recede -->
    <p class="dash-clock text-base-content">
      <span class="text-[clamp(3.5rem,10vw,6.5rem)]">{{ hm }}</span>
      <span class="text-[clamp(1.5rem,4vw,2.5rem)] text-base-content/45">:{{ ss }}</span>
    </p>

    <p class="text-sm font-medium text-base-content/50">{{ dateLabel }}</p>

    <!-- Search — flat pill, hairline border, primary focus -->
    <form class="w-full max-w-md" role="search" @submit.prevent="submit">
      <div class="relative">
        <IconSearch
          class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-base-content/40"
        />
        <input
          v-model="query"
          type="text"
          :placeholder="t('dashboard.searchPlaceholder')"
          class="h-13 w-full rounded-full border border-base-content/15 bg-base-100 pl-12 pr-12 text-base text-base-content shadow-none transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        >
        <button
          v-if="query"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
          :aria-label="t('common.close')"
          @click="query = ''"
        >
          <IconX class="h-4 w-4" />
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { IconSearch, IconX, IconSun, IconMoonStar } from "#components";

const { t, locale } = useI18n();
const auth = useAuth();
const { user } = auth;

const query = ref("");
const now = ref(new Date());

const displayName = computed(() => user.value?.nick || user.value?.name || "");

const hh = computed(() => String(now.value.getHours()).padStart(2, "0"));
const mm = computed(() => String(now.value.getMinutes()).padStart(2, "0"));
const ss = computed(() => String(now.value.getSeconds()).padStart(2, "0"));
const hm = computed(() => `${hh.value}:${mm.value}`);

const isDay = computed(() => {
  const h = now.value.getHours();
  return h >= 6 && h < 18;
});

const greeting = computed(() => {
  const hour = now.value.getHours();
  if (hour < 6) return t("dashboard.greetingNight");
  if (hour < 12) return t("dashboard.greetingMorning");
  if (hour < 18) return t("dashboard.greetingAfternoon");
  if (hour < 22) return t("dashboard.greetingEvening");
  return t("dashboard.greetingNight");
});

const dateLabel = computed(() => {
  const lang = locale.value === "zh" ? "zh-CN" : "en-US";
  return now.value.toLocaleDateString(lang, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
});

function submit() {
  const q = query.value.trim();
  if (!q) return;
  navigateTo(`/search?q=${encodeURIComponent(q)}`);
}

let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
