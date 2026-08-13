<template>
  <NuxtLayout name="creator">
    <div class="mx-auto max-w-4xl">
      <ConfuseSpinner v-if="status === 'pending'" />

      <div v-else-if="error" class="alert alert-error">
        <span>{{ String(error) }}</span>
      </div>

      <template v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div
            v-for="stat in statsCards"
            :key="stat.label"
            class="card bg-base-100 shadow-sm"
          >
            <div class="card-body p-4 items-center text-center">
              <div class="text-2xl font-bold">{{ stat.value }}</div>
              <div class="text-xs text-base-content/60">{{ stat.label }}</div>
            </div>
          </div>
        </div>

        <!-- Activity Heatmap -->
        <div v-if="heatmap" class="card bg-base-100 shadow-sm mb-6">
          <div class="card-body p-4">
            <ActivityHeatmap :heatmap="heatmap" />
          </div>
        </div>

        <!-- Rating Card -->
        <div
          v-if="rating"
          class="card shadow-sm mb-6 cursor-pointer transition-all hover:shadow-md"
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
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-2">
            <div>
              <NuxtLink
                v-for="item in navItems"
                :key="item.href"
                :to="item.href"
                class="flex items-center gap-4 rounded-box p-4 transition-colors hover:bg-base-200"
              >
                <component
                  :is="item.icon"
                  class="w-5 h-5 text-base-content/60"
                />
                <span class="flex-1 font-medium">{{ item.label }}</span>
                <IconChevronRight class="w-4 h-4 text-base-content/30" />
              </NuxtLink>
            </div>
          </div>
        </div>
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
