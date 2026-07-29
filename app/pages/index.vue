<template>
  <NuxtLayout name="app">
    <div class="feed-layout">
      <!-- Main Content -->
      <div class="min-w-0">
        <!-- Feed shell: continuous list like Flutter explore -->
        <div class="feed-stream">
          <!-- Compose -->
          <button
            v-if="isAuthenticated"
            type="button"
            class="feed-compose"
            @click="openCompose"
          >
            <div v-if="userAvatar" class="avatar shrink-0">
              <div class="h-9 w-9 rounded-full">
                <img
                  :src="userAvatar"
                  :alt="userName"
                  class="h-full w-full rounded-full object-cover"
                />
              </div>
            </div>
            <div v-else class="avatar avatar-placeholder shrink-0">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-content"
              >
                <span class="text-xs font-medium">{{ userInitials }}</span>
              </div>
            </div>
            <span
              class="min-w-0 flex-1 truncate text-sm text-base-content/45"
            >
              {{ t("home.composePlaceholder") }}
            </span>
          </button>

          <!-- Featured -->
          <ClientOnly>
            <FeaturedPostsCarousel
              class="border-b border-base-300/80"
              @boost="handleBoost"
              @share="handleShare"
              @reply="handleReply"
            />
          </ClientOnly>

          <!-- Loading -->
          <div
            v-if="status === 'pending' && timelineEvents.length === 0"
            class="flex justify-center py-16"
          >
            <ConfuseSpinner :message="t('home.loadingPosts')" />
          </div>

          <!-- Error -->
          <div
            v-else-if="error"
            class="flex flex-col items-center gap-3 px-4 py-12 text-center"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-error/10 text-error"
            >
              <IconAlertCircle class="h-5 w-5" />
            </div>
            <p class="max-w-sm text-sm text-base-content/70">
              {{ t("home.loadFailed", { error: String(error) }) }}
            </p>
            <button class="btn btn-sm btn-ghost" @click="refreshTimeline">
              {{ t("common.retry") }}
            </button>
          </div>

          <!-- Empty -->
          <div
            v-else-if="status !== 'pending' && timelineEvents.length === 0"
            class="flex flex-col items-center gap-2 px-4 py-14 text-center"
          >
            <p class="text-sm font-medium text-base-content/75">
              {{ t("home.emptyTitle") }}
            </p>
            <p class="max-w-xs text-xs leading-relaxed text-base-content/45">
              {{ t("home.emptyDesc") }}
            </p>
            <button
              class="btn btn-sm btn-ghost mt-1"
              @click="refreshTimeline"
            >
              {{ t("common.refresh") }}
            </button>
          </div>

          <!-- Events (divided list) -->
          <div
            v-if="timelineEvents.length > 0"
            class="divide-y divide-base-300/80"
          >
            <TimelineEventRenderer
              v-for="event in timelineEvents"
              :key="event.id"
              :event="event"
              @boost="handleBoost"
              @share="handleShare"
              @reply="handleReply"
            />
          </div>

          <!-- Footer / infinite scroll -->
          <div
            ref="loadMoreSentinel"
          class="feed-footer"
          >
            <div
              v-if="fetchingMore"
              class="flex items-center gap-2 text-xs text-base-content/45"
            >
              <span class="loading loading-spinner loading-xs" />
              <span>{{ t("common.loading") }}</span>
            </div>
            <button
              v-else-if="hasMore && timelineEvents.length > 0"
              type="button"
              class="btn btn-ghost btn-sm text-base-content/55"
              :disabled="fetchingMore"
              @click="loadMore"
            >
              {{ t("common.loadMore") }}
            </button>
            <p
              v-else-if="!hasMore && timelineEvents.length > 0"
              class="text-xs text-base-content/35"
            >
              {{ t("common.noMore") }}
            </p>
          </div>
        </div>
      </div>

      <!-- Right Sidebar (20rem rail) -->
      <aside class="feed-sidebar">
        <RightSidebar />
      </aside>
    </div>

    <ClientOnly>
      <OnboardingModal />
    </ClientOnly>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Post, SnTimelineEvent } from "~/types/post";
import { fetchTimeline } from "~/utils/api";
import { getFileUrl } from "~/utils/files";
import { IconAlertCircle } from "#components";
import { useIntersectionObserver } from "@vueuse/core";

const { t } = useI18n();

const seoTitle = computed(() => t("home.seoTitle"));
const seoDescription = computed(() => t("home.seoDescription"));

defineOgImage("UniOgImage", {
  title: seoTitle,
  description: seoDescription,
});

useSolarSeo({
  title: t("home.seoTitle"),
  description: t("home.seoDescription"),
  url: "https://solian.app",
  breadcrumbs: [{ name: "Home", item: "https://solian.app" }],
});

const auth = useAuth();
const { isAuthenticated, user } = auth;

const PAGE_SIZE = 20;
const MAX_RETRY_ATTEMPTS = 1;
const RETRY_ADJUSTMENT_MS = 10_000;

const timelineEvents = useState<SnTimelineEvent[]>("home-timeline", () => []);
const cursor = ref<string | null>(null);
const timelineMode = ref("personalized");
const hasMore = ref(true);
const fetchingMore = ref(false);
const loadMoreSentinel = ref<HTMLElement | null>(null);

const userName = computed(() => user.value?.nick || user.value?.name || "");
const userAvatar = computed(() => getFileUrl(user.value?.profile?.picture?.id));
const userInitials = computed(() => {
  const name = user.value?.name || "?";
  return name.slice(0, 2).toUpperCase();
});

const {
  data: initialData,
  status,
  error,
  refresh: refreshAsyncData,
} = await useAsyncData(
  "home-timeline-fetch",
  () =>
    fetchTimeline(PAGE_SIZE, {
      aggressive: true,
    }),
  {
    default: () => ({ items: [], nextCursor: null, mode: "personalized" }),
  },
);

watch(
  initialData,
  (data) => {
    if (data?.items) {
      timelineEvents.value = data.items;
      cursor.value = data.nextCursor;
      timelineMode.value = data.mode;
      hasMore.value = data.nextCursor !== null;
    }
  },
  { immediate: true },
);

async function fetchTimelinePage(
  pageCursor: string | null,
  retryCount = 0,
): Promise<{
  items: SnTimelineEvent[];
  nextCursor: string | null;
  mode: string;
}> {
  const result = await fetchTimeline(PAGE_SIZE, {
    cursor: pageCursor,
    mode: timelineMode.value,
    aggressive: true,
  });

  const existing = new Set(timelineEvents.value.map((e) => e.id));
  const uniqueItems = (result?.items ?? []).filter((e) => !existing.has(e.id));
  let nextCursor = result?.nextCursor ?? null;

  if (result?.mode) {
    timelineMode.value = result.mode;
  }

  if (
    uniqueItems.length === 0 &&
    nextCursor &&
    retryCount < MAX_RETRY_ATTEMPTS
  ) {
    const prev = Date.parse(nextCursor);
    if (!Number.isNaN(prev)) {
      const adjusted = new Date(prev - RETRY_ADJUSTMENT_MS).toISOString();
      return fetchTimelinePage(adjusted, retryCount + 1);
    }
  }

  return {
    items: uniqueItems,
    nextCursor,
    mode: result?.mode ?? timelineMode.value,
  };
}

const sentinelVisible = ref(false);

async function loadMore() {
  if (!hasMore.value || fetchingMore.value || !cursor.value) return;
  fetchingMore.value = true;

  try {
    const result = await fetchTimelinePage(cursor.value);

    if (result.items.length === 0) {
      hasMore.value = result.nextCursor !== null;
      cursor.value = result.nextCursor;
      if (!result.nextCursor) hasMore.value = false;
      return;
    }

    timelineEvents.value = [...timelineEvents.value, ...result.items];
    cursor.value = result.nextCursor;
    hasMore.value = result.nextCursor !== null;
  } catch (e) {
    console.error("Failed to load more timeline events:", e);
  } finally {
    fetchingMore.value = false;
    if (
      sentinelVisible.value &&
      hasMore.value &&
      cursor.value &&
      timelineEvents.value.length > 0
    ) {
      await nextTick();
      loadMore();
    }
  }
}

async function refreshTimeline() {
  cursor.value = null;
  hasMore.value = true;
  await refreshAsyncData();
}

useIntersectionObserver(
  loadMoreSentinel,
  ([{ isIntersecting }]) => {
    sentinelVisible.value = isIntersecting;
    if (
      isIntersecting &&
      hasMore.value &&
      !fetchingMore.value &&
      timelineEvents.value.length > 0 &&
      cursor.value
    ) {
      loadMore();
    }
  },
  { rootMargin: "240px" },
);

function handleBoost(_post: Post) {}

function handleShare(post: Post) {
  if (navigator.share) {
    navigator.share({
      title: post.title || t("home.sharePostFallbackTitle"),
      text: post.content.slice(0, 100),
      url: `${window.location.origin}/posts/${post.id}`,
    });
  }
}

function handleReply(post: Post) {
  const compose = useCompose();
  compose.initializeFromState({
    content: "",
    replyingTo: post,
  });
  const event = new CustomEvent("open-compose");
  window.dispatchEvent(event);
}

function openCompose() {
  const event = new CustomEvent("open-compose");
  window.dispatchEvent(event);
}
</script>
