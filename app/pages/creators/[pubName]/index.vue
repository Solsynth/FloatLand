<template>
  <NuxtLayout name="creator">
    <div class="mx-auto max-w-5xl space-y-5">
      <div v-if="status === 'pending'" class="space-y-5" aria-busy="true" :aria-label="t('common.loading')">
        <div class="rounded-box bg-base-100 p-6 shadow-sm">
          <div class="skeleton h-3 w-28" />
          <div class="mt-3 skeleton h-8 w-64" />
          <div class="mt-3 skeleton h-4 w-36" />
        </div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div v-for="item in 5" :key="item" class="rounded-box bg-base-100 p-4 shadow-sm">
            <div class="skeleton mx-auto h-8 w-12" />
            <div class="skeleton mx-auto mt-2 h-3 w-20" />
          </div>
        </div>
      </div>

      <div v-else-if="error" class="alert alert-error">
        <span>{{ String(error) }}</span>
      </div>

      <template v-else>
        <header class="relative isolate overflow-hidden rounded-box bg-base-100 px-5 py-6 shadow-sm sm:px-7">
          <div class="absolute inset-y-0 right-0 -z-10 w-1/3 bg-primary/[0.06]" aria-hidden="true">
            <div class="absolute inset-y-0 left-0 w-px bg-primary/15" />
            <div class="absolute inset-y-0 left-5 w-px bg-primary/10" />
            <div class="absolute inset-y-0 left-10 w-px bg-primary/10" />
          </div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-primary">{{ t("creator.studio") }}</p>
          <div class="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div class="min-w-0">
              <h1 class="truncate text-2xl font-black tracking-tight sm:text-3xl">
                {{ currentPublisher?.nick || pubName }}
              </h1>
              <p class="mt-1 text-sm text-base-content/55">@{{ pubName }}</p>
            </div>
            <NuxtLink :to="`/creators/${encodeURIComponent(pubName)}/settings`" class="btn btn-ghost btn-sm">
              <IconSettings class="h-4 w-4" aria-hidden="true" />
              {{ t("creator.settings") }}
            </NuxtLink>
          </div>
        </header>

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div
            v-for="stat in statsCards"
            :key="stat.label"
            class="card h-full bg-base-100 shadow-sm"
          >
            <div class="card-body p-4 items-center text-center">
              <div class="text-2xl font-black tabular-nums text-primary">{{ stat.value }}</div>
              <div class="text-xs text-base-content/60">{{ stat.label }}</div>
            </div>
          </div>
        </div>

        <!-- Activity Heatmap -->
        <div v-if="heatmap" class="card bg-base-100 shadow-sm">
          <div class="card-body p-4">
            <ActivityHeatmap :heatmap="heatmap" />
          </div>
        </div>

        <!-- Rating Card -->
        <div
          v-if="rating"
          class="card cursor-pointer transition-all hover:shadow-md"
          :class="ratingCardBg"
          @click="navigateTo(`/creators/${pubName}/leaderboard`)"
        >
          <div class="card-body p-5">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <component
                    :is="ratingIcon"
                    class="w-6 h-6"
                    :class="ratingTextColor"
                  />
                  <span class="text-2xl font-bold" :class="ratingTextColor">{{
                    rating.grade
                  }}</span>
                </div>
                <p class="text-sm opacity-80" :class="ratingTextColor">
                  {{ t("creator.rating.title") }}:
                  {{ rating.rating.toFixed(1) }}
                </p>
              </div>
              <div class="text-right">
                <div class="text-4xl font-bold" :class="ratingTextColor">
                  {{ formatRating(rating.rating) }}
                </div>
                <div class="text-sm opacity-80" :class="ratingTextColor">
                  {{ t("creator.rating.rank", { rank: rating.rank }) }}
                </div>
                <div class="text-xs opacity-60" :class="ratingTextColor">
                  {{
                    t("creator.rating.percentile", {
                      percentile: rating.percentile.toFixed(1),
                    })
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Grid -->
        <section aria-labelledby="creator-tools-title" class="overflow-hidden rounded-box bg-base-100 shadow-sm">
          <div class="border-b border-base-300/60 px-5 py-4">
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-base-content/40">{{ t("creator.studio") }}</p>
            <h2 id="creator-tools-title" class="mt-1 text-lg font-bold">{{ t("creator.dashboard") }}</h2>
          </div>
          <div class="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
            <NuxtLink
              v-for="item in navItems"
              :key="item.href"
              :to="item.href"
              class="group flex items-center gap-4 rounded-box border border-base-300/60 p-4 outline-offset-2 transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-primary/40 hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <component
                :is="item.icon"
                class="h-5 w-5 shrink-0 text-base-content/50 transition-colors group-hover:text-primary"
                aria-hidden="true"
              />
              <span class="min-w-0 flex-1 truncate font-semibold">{{ item.label }}</span>
              <IconChevronRight class="h-4 w-4 shrink-0 text-base-content/25 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </NuxtLink>
          </div>
        </section>
      </template>
    </div>

  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconFileText,
  IconFolder,
  IconSticker,
  IconClipboardCheck,
  IconRss,
  IconUsers,
  IconUserPlus,
  IconSettings,
  IconChevronRight,
  IconTrophy,
  IconTrendingUp,
  IconTrendingDown,
  IconThumbsUp,
  IconMinus,
  IconMedal,
  IconGlobe,
} from "#components";
import {
  fetchPublisherStats,
  fetchPublisherRatingOverview,
  fetchManagedPublishers,
} from "~/utils/creator";
import { fetchPublisherHeatmap } from "~/utils/api";

definePageMeta({ middleware: "creator" });

const { t } = useI18n();
const route = useRoute();
const pubName = computed(() => route.params.pubName as string);

const creator = useCreator();
const { currentPublisher } = creator;

defineOgImage("UniOgImage", {
  title: computed(
    () =>
      `${currentPublisher.value?.nick ?? pubName.value} - ${t("creator.dashboard")}`,
  ),
});

useSolarSeo({
  title: computed(
    () =>
      `${currentPublisher.value?.nick ?? pubName.value} - ${t("creator.dashboard")}`,
  ),
});

const {
  data: stats,
  status,
  error,
} = await useAsyncData(`creator-stats-${pubName.value}`, () =>
  fetchPublisherStats(pubName.value),
);

const { data: rating } = await useAsyncData(
  `creator-rating-${pubName.value}`,
  () => fetchPublisherRatingOverview(pubName.value),
);

const { data: heatmap } = await useAsyncData(
  `creator-heatmap-${pubName.value}`,
  () => fetchPublisherHeatmap(pubName.value),
);

onMounted(async () => {
  if (
    !currentPublisher.value ||
    currentPublisher.value.name !== pubName.value
  ) {
    const publishers = await fetchManagedPublishers();
    const pub = publishers.find((p) => p.name === pubName.value);
    if (pub) await creator.selectPublisher(pub);
  }
});

const statsCards = computed(() => {
  const s = stats.value;
  if (!s) return [];
  return [
    { value: s.postsCreated, label: t("creator.stats.postsCreated") },
    {
      value: s.stickerPacksCreated,
      label: t("creator.stats.stickerPacksCreated"),
    },
    { value: s.stickersCreated, label: t("creator.stats.stickersCreated") },
    { value: s.upvoteReceived, label: t("creator.stats.upvoteReceived") },
    { value: s.downvoteReceived, label: t("creator.stats.downvoteReceived") },
  ];
});

const ratingIcon = computed(() => {
  const grade = rating.value?.grade;
  if (!grade) return IconMinus;
  if (grade.startsWith("S")) return IconMedal;
  if (grade.startsWith("A")) return IconTrendingUp;
  if (grade.startsWith("B")) return IconThumbsUp;
  if (grade === "D") return IconTrendingDown;
  return IconMinus;
});

const ratingTextColor = computed(() => {
  const grade = rating.value?.grade;
  if (!grade) return "text-base-content";
  if (grade.startsWith("S")) return "text-primary";
  if (grade.startsWith("A")) return "text-primary";
  if (grade.startsWith("B")) return "text-primary";
  if (grade === "D") return "text-error";
  return "text-base-content/60";
});

const ratingCardBg = computed(() => {
  const grade = rating.value?.grade;
  if (!grade) return "bg-base-100";
  if (grade.startsWith("S")) return "bg-primary/10";
  if (grade.startsWith("A")) return "bg-primary/10";
  if (grade.startsWith("B")) return "bg-primary/10";
  if (grade === "D") return "bg-error/10";
  return "bg-base-100";
});

const navItems = computed(() => {
  const p = pubName.value;
  return [
    {
      icon: IconFileText,
      label: t("creator.posts.title"),
      href: `/creators/${p}/posts`,
    },
    {
      icon: IconFolder,
      label: t("creator.collections.title"),
      href: `/creators/${p}/collections`,
    },
    {
      icon: IconSticker,
      label: t("creator.stickers.title"),
      href: `/creators/${p}/stickers`,
    },
    {
      icon: IconClipboardCheck,
      label: t("creator.surveys.title"),
      href: `/creators/${p}/surveys`,
    },
    {
      icon: IconRss,
      label: t("creator.feeds.title"),
      href: `/creators/${p}/feeds`,
    },
    {
      icon: IconTrophy,
      label: t("creator.leaderboard.title"),
      href: `/creators/${p}/leaderboard`,
    },
    {
      icon: IconUsers,
      label: t("creator.members.title"),
      href: `/creators/${p}/members`,
    },
    {
      icon: IconUserPlus,
      label: t("creator.subscribers.title"),
      href: `/creators/${p}/subscribers`,
    },
    {
      icon: IconSettings,
      label: t("creator.settings"),
      href: `/creators/${p}/settings`,
    },
    {
      icon: IconGlobe,
      label: t("creator.domains.title"),
      href: `/creators/${p}/domains`,
    },
  ];
});

function formatRating(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}
</script>
