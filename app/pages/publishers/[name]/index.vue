<template>
  <NuxtLayout name="app">
    <ConsolePanel v-if="status === 'pending'" flush>
      <LoadingSkeleton variant="feed" :rows="3" />
    </ConsolePanel>

    <!-- Not Found State -->
    <div v-else-if="notFound" class="mx-auto max-w-2xl p-6">
      <div class="plate flex flex-col items-center gap-2 p-8 text-center">
          <IconUserX class="text-dim w-10 h-10" />
          <h1 class="text-xl font-bold">Publisher not found</h1>
          <p class="voice text-[13px]">
            The publisher you requested does not exist.
          </p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mx-auto max-w-2xl p-6">
      <div class="alert alert-error">
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- Publisher Profile -->
    <div v-else-if="publisher" class="mx-auto min-w-0">
      <!-- Header Section -->
      <section class="relative overflow-hidden">
        <div
          class="h-36 w-full overflow-hidden bg-base-200 sm:h-44"
        >
          <FileImage
            v-if="backgroundUrl"
            :file="backgroundUrl"
            :alt="`${displayName} background`"
            class="h-full w-full object-cover"
          />
        </div>
        <div
          class="flex flex-col gap-3 pb-4 sm:flex-row sm:items-end sm:gap-4"
        >
          <div class="shrink-0">
            <div v-if="avatarUrl" class="avatar">
              <div
                class="-mt-12 h-20 w-20 rounded-full border-4 border-base-100 bg-base-300 sm:h-24 sm:w-24"
              >
                <FileImage :file="avatarUrl" :alt="displayName" />
              </div>
            </div>
            <div v-else class="avatar avatar-placeholder">
              <div
                class="-mt-12 grid h-20 w-20 place-items-center rounded-full border-4 border-base-100 bg-base-300 text-dim sm:h-24 sm:w-24"
              >
                <span class="text-lg font-semibold">
                  {{ getInitials(displayName) }}
                </span>
              </div>
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="title truncate text-2xl text-base-content">
                {{ displayName }}
              </h1>
              <span
                v-if="publisher.verification"
                class="chip chip-active gap-1"
              >
                <IconShieldCheck class="size-3" />
                {{ publisher.verification.title || "Verified" }}
              </span>
              <!-- Livestream indicator removed -->
            </div>
            <p class="mono-id truncate">
              @{{ publisher.name }}
            </p>
            <!-- Account link for personal publishers -->
            <div v-if="publisher.type === 0 && publisher.account" class="mt-2">
              <NuxtLink
                :to="`/@${publisher.account.name}`"
                class="chip chip-active"
              >
                <IconUser class="size-3.5" />
                <span> Belongs to @{{ publisher.account.name }} </span>
              </NuxtLink>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- Subscribe/Unsubscribe -->
            <template v-if="isAuthenticated && !isOwnPublisher">
              <button
                v-if="subStatus?.status === 'none' || !subStatus"
                class="btn btn-primary"
                :disabled="isSubscribing"
                @click="subscribe"
              >
                <IconLoader v-if="isSubscribing" class="w-4 h-4 animate-spin" />
                <IconPlusCircle v-else class="size-3.5" />
                Subscribe
              </button>
              <button
                v-else-if="subStatus?.isPending"
                class="btn bg-base-200"
                :disabled="isSubscribing"
                @click="unsubscribe"
              >
                <IconLoader v-if="isSubscribing" class="w-4 h-4 animate-spin" />
                <IconHourglass v-else class="size-3.5" />
                Pending
              </button>
              <template v-else>
                <button
                  class="btn btn-primary"
                  :disabled="isSubscribing"
                  @click="unsubscribe"
                >
                  <IconLoader
                    v-if="isSubscribing"
                    class="w-4 h-4 animate-spin"
                  />
                  <IconCheckCircle v-else class="size-3.5" />
                  Subscribed
                </button>
                <button
                  class="btn btn-ghost btn-square"
                  :class="
                    subStatus?.subscription?.notify
                      ? 'text-primary'
                      : 'text-dim'
                  "
                  :title="
                    subStatus?.subscription?.notify
                      ? 'Notifications on'
                      : 'Notifications off'
                  "
                  @click="toggleNotify"
                >
                  <IconBell
                    v-if="subStatus?.subscription?.notify"
                    class="size-4"
                  />
                  <IconBellOff v-else class="size-4" />
                </button>
              </template>
            </template>

            <button class="btn btn-ghost btn-square bg-base-200" @click="shareProfile">
              <IconShare2 class="size-3.5" />
            </button>
          </div>
        </div>
      </section>

      <!-- Content Grid -->
      <div class="grid gap-4 py-4 lg:grid-cols-3">
        <!-- Left Column - Main Content -->
        <div class="min-w-0 space-y-4 lg:col-span-2">
          <!-- Bio Section -->
          <div class="card">
            <div class="p-4">
              <h2 class="eyebrow mb-2">
                Bio
              </h2>
              <!-- eslint-disable vue/no-v-html -->
              <div
                v-if="bioHtml"
                class="markdown markdown-compact"
                v-html="bioHtml"
                @click="handleMarkdownClick"
              />
              <!-- eslint-enable vue/no-v-html -->
              <p v-else class="voice text-[13px]">No bio yet.</p>
            </div>
          </div>

          <!-- Pinned Posts -->
          <PinnedPostsCarousel
            :posts="pinnedPosts"
            @boost="handleBoost"
            @share="handleShare"
            @reply="handleReply"
          />

          <!-- Collections -->
          <section
            v-if="collections.length > 0"
            aria-labelledby="publisher-collections-title"
            class="overflow-hidden rounded-card plate"
          >
            <div class="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-3.5">
              <div>
                <p class="eyebrow">
                  {{ t('publisher.collections') }}
                </p>
                <h2 id="publisher-collections-title" class="title mt-1 text-base text-base-content">
                  {{ t('publisher.collectionsTitle') }}
                </h2>
              </div>
              <span class="text-xs text-faint">{{ t('publisher.collectionsHint') }}</span>
            </div>
            <div class="grid gap-3 p-4 sm:grid-cols-2">
              <CollectionCard
                v-for="collection in collections"
                :key="collection.slug"
                :collection="collection"
                @select="openCollection"
              />
            </div>
          </section>

          <!-- Posts Section with Filters -->
          <section aria-labelledby="publisher-feed-title" class="space-y-4">
            <div class="overflow-hidden rounded-card plate">
              <div class="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-3.5">
                <div>
                  <p class="eyebrow">Publisher feed</p>
                  <h2 id="publisher-feed-title" class="title mt-1 text-base text-base-content">Posts</h2>
                </div>
                <div class="flex items-center gap-2 text-xs text-faint">
                  <span v-if="isRefreshing" class="inline-flex items-center gap-1.5">
                    <IconLoader class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    Refreshing
                  </span>
                  <span aria-live="polite">{{ posts.length }} shown</span>
                </div>
              </div>

              <div class="space-y-4 p-4">
                <!-- Content Type Tabs -->
                <div role="tablist" aria-label="Post content type" class="grid grid-cols-3 gap-0.5 rounded-card border border-line bg-base-200/30 p-1">
                  <button
                    type="button"
                    role="tab"
                    :aria-selected="contentType === 'all'"
                    class="btn btn-xs"
                    :class="contentType === 'all' ? 'bg-base-300 text-base-content' : 'btn-quiet'"
                    @click="setContentType('all')"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    role="tab"
                    :aria-selected="contentType === 'posts'"
                    class="btn btn-xs"
                    :class="contentType === 'posts' ? 'bg-base-300 text-base-content' : 'btn-quiet'"
                    @click="setContentType('posts')"
                  >
                    Posts
                  </button>
                  <button
                    type="button"
                    role="tab"
                    :aria-selected="contentType === 'articles'"
                    class="btn btn-xs"
                    :class="contentType === 'articles' ? 'bg-base-300 text-base-content' : 'btn-quiet'"
                    @click="setContentType('articles')"
                  >
                    Articles
                  </button>
                </div>

                <!-- Filter Buttons -->
                <div class="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    class="btn btn-quiet btn-xs justify-start"
                    :aria-pressed="includeReplies === true"
                    @click="cycleRepliesFilter"
                  >
                    <IconMessageCircle class="size-3.5" aria-hidden="true" />
                    <span>Replies: {{ includeReplies === null ? 'Auto' : includeReplies ? 'On' : 'Off' }}</span>
                  </button>
                  <button
                    type="button"
                    class="btn btn-quiet btn-xs justify-start"
                    :aria-pressed="mediaOnly"
                    @click="toggleMediaOnly"
                  >
                    <IconImage class="size-3.5" aria-hidden="true" />
                    <span>Media only: {{ mediaOnly ? 'On' : 'Off' }}</span>
                  </button>
                  <button
                    type="button"
                    class="btn btn-quiet btn-xs justify-start"
                    :aria-pressed="!orderDesc"
                    @click="toggleOrder"
                  >
                    <IconArrowDownUp class="size-3.5" aria-hidden="true" />
                    <span>Order: {{ orderDesc ? 'Newest' : 'Oldest' }}</span>
                  </button>
                  <form class="flex min-w-0 items-center gap-1" @submit.prevent="reloadWithFilters">
                    <input
                      v-model="query"
                      type="search"
                      class="input input-sm w-full"
                      placeholder="Search posts"
                      aria-label="Search posts"
                    >
                    <button type="submit" class="btn btn-primary btn-sm" aria-label="Search posts">
                      <IconSearch class="size-3.5" aria-hidden="true" />
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <!-- Error -->
            <div v-if="error" class="alert alert-error" role="alert">
              <span>{{ error }}</span>
            </div>

            <!-- Posts List -->
            <div
              v-if="posts.length > 0"
              class="space-y-4"
              :class="isRefreshing ? 'opacity-60' : 'opacity-100'"
            >
              <PostCard
                v-for="post in posts"
                :key="post.id"
                :post="post"
                @boost="handleBoost"
                @share="handleShare"
                @reply="handleReply"
              />
            </div>

            <!-- Load More -->
            <div v-if="posts.length > 0" class="flex flex-col items-center gap-2 py-2 text-center">
              <button
                v-if="hasMore"
                type="button"
                class="btn btn-outline"
                :disabled="isLoading"
                @click="loadMore"
              >
                <IconLoader v-if="isLoading" class="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Load more</span>
              </button>
              <p v-else class="voice text-[13px]">{{ posts.length }} shown · No more posts</p>
            </div>

            <!-- Empty State -->
            <div
              v-else-if="!error"
              class="plate px-5 py-10 text-center text-[13px] text-dim"
            >
              No posts from this publisher with current filters.
            </div>
          </section>
        </div>

        <!-- Right Column - Sidebar -->
        <div class="space-y-4">
          <!-- Activity Heatmap -->
          <ActivityHeatmap :heatmap="heatmap" :status="heatmapStatus" />

          <!-- Verification Info -->
          <div v-if="publisher.verification" class="card bg-primary/5">
            <div class="p-4">
              <div class="flex items-center gap-2 mb-2">
                <IconShieldCheck class="w-5 h-5 text-primary" />
                <h3 class="font-semibold">
                  {{ publisher.verification.title }}
                </h3>
              </div>
              <p
                v-if="publisher.verification.description"
                class="text-sm text-base-content/70"
              >
                {{ publisher.verification.description }}
              </p>
              <p
                v-if="publisher.verification.verifiedBy"
                class="text-xs text-dim mt-2"
              >
                Verified by {{ publisher.verification.verifiedBy }}
              </p>
            </div>
          </div>

          <!-- Publisher Stats -->
          <div class="card">
            <div class="p-4">
              <h3 class="text-sm font-semibold text-base-content/70 mb-3">
                Stats
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="well p-3 text-center">
                  <div class="text-2xl font-bold">
                    {{ totalPosts.toLocaleString() }}
                  </div>
                  <div class="mono-id">Posts</div>
                </div>
                <div class="well p-3 text-center">
                  <div class="text-2xl font-bold">
                    {{ pinnedPosts.length }}
                  </div>
                  <div class="mono-id">Pinned</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CollectionDetailDrawer
        v-model:open="collectionDrawerOpen"
        :publisher-name="publisherName"
        :collection="activeCollection"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Post, PostCollection, Publisher } from "~/types/post";
import type { HeatmapData } from "~/utils/api";
import {
  fetchPublisher,
  fetchPublisherPosts,
  fetchPublisherCollections,
  fetchPublisherHeatmap,
  fetchPublisherPinnedPosts,
  fetchPublisherSubscriptionStatus,
  subscribeToPublisher,
  unsubscribeFromPublisher,
  setPublisherNotify,
} from "~/utils/api";
import { renderMarkdown } from "~/utils/markdown";
import { IconSearch } from "#components";

const route = useRoute();
const auth = useAuth();
const { t } = useI18n();
const publisherName = computed(() => route.params.name as string);

// State
const publisher = ref<Publisher | null>(null);
const pinnedPosts = ref<Post[]>([]);
const collections = ref<PostCollection[]>([]);
const activeCollection = ref<PostCollection | null>(null);
const collectionDrawerOpen = ref(false);
const posts = ref<Post[]>([]);
const heatmap = ref<HeatmapData | null>(null);
const subStatus = ref<{
  status: "none" | "pending" | "following" | "subscribed";
  isPending: boolean;
  subscription?: { isActive: boolean; notify: boolean };
} | null>(null);
const notFound = ref(false);
const error = ref<string | null>(null);
const isLoading = ref(false);
const isRefreshing = ref(false);
const isSubscribing = ref(false);
const totalPosts = ref(0);
const offset = ref(0);
const hasMore = ref(false);
const heatmapStatus = ref<"pending" | "success" | "error">("pending");

// Filters
const contentType = ref<"all" | "posts" | "articles">("all");
const includeReplies = ref<boolean | null>(null);
const mediaOnly = ref(false);
const orderDesc = ref(true);
const query = ref("");

// Computed
const status = computed(() =>
  publisher.value ? "success" : error.value ? "error" : "pending",
);
const isAuthenticated = computed(() => auth.isAuthenticated);
const isOwnPublisher = computed(() => {
  if (!auth.user || !publisher.value?.account) return false;
  return auth.user.id === publisher.value.account.id;
});
const displayName = computed(
  () => publisher.value?.nick || publisher.value?.name || "Unknown",
);
const avatarUrl = computed(() => publisher.value?.picture ?? null);
const backgroundUrl = computed(() => publisher.value?.background ?? null);
const bioHtml = computed(() => {
  if (!publisher.value?.bio) return "";
  return renderMarkdown(publisher.value.bio);
});
const hasActiveLivestream = ref(false); // TODO: fetch from API

const seoTitle = computed(() => displayName.value);
const seoDescription = computed(() => publisher.value?.bio || `@${publisher.value?.name} on Solar Network`);
const seoUrl = computed(() => `https://solian.app/publishers/${publisher.value?.name}`);

// Fetch publisher data with useAsyncData for SSR
const {
  data: publisherData,
  status: publisherStatus,
  error: publisherError,
} = await useAsyncData(
  `publisher-${publisherName.value}`,
  () => fetchPublisher(publisherName.value),
  { watch: [publisherName] }
);

// Fetch pinned posts
const { data: pinnedData } = await useAsyncData(
  `publisher-pinned-${publisherName.value}`,
  () => fetchPublisherPinnedPosts(publisherName.value),
  { watch: [publisherName], default: () => [] }
);

// Fetch heatmap
const { data: heatmapData } = await useAsyncData(
  `publisher-heatmap-${publisherName.value}`,
  () => fetchPublisherHeatmap(publisherName.value),
  { watch: [publisherName] }
);

// Fetch collections
const { data: collectionsData } = await useAsyncData(
  `publisher-collections-${publisherName.value}`,
  () => fetchPublisherCollections(publisherName.value),
  { watch: [publisherName], default: () => [] }
);

// Watch and update refs
watch(publisherData, (data) => {
  if (data) {
    publisher.value = data;
    notFound.value = false;
    error.value = null;
  }
}, { immediate: true });

watch(pinnedData, (data) => {
  if (data) pinnedPosts.value = data;
}, { immediate: true });

watch(heatmapData, (data) => {
  if (data) {
    heatmap.value = data;
    heatmapStatus.value = 'success';
  }
}, { immediate: true });

watch(collectionsData, (data) => {
  if (data) collections.value = data;
}, { immediate: true });

watch(publisherError, (err) => {
  if (err) {
    if (err.message?.includes('404')) {
      notFound.value = true;
    } else {
      error.value = err.message || 'Failed to load publisher';
    }
  }
}, { immediate: true });

watch(publisherStatus, (s) => {
  if (s === 'success' && publisherData.value) {
    publisher.value = publisherData.value;
  }
}, { immediate: true });

// OG Image - pass only name, component fetches data server-side
defineOgImage('PublisherOgImage', { publisherName: computed(() => route.params.name as string) })

useSolarSeo({
	title: () => seoTitle.value,
	description: () => seoDescription.value,
	image: () => avatarUrl.value,
	url: () => seoUrl.value,
	type: 'profile',
	breadcrumbs: () => [
		{ name: 'Home', item: 'https://solian.app' },
		{ name: 'Publishers', item: 'https://solian.app/publishers' },
		{ name: seoTitle.value, item: seoUrl.value }
	]
});

// Methods
function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "?"
  );
}

function handleMarkdownClick(e: MouseEvent) {
  const target = e.target as HTMLElement;

  // Handle mention chip clicks
  if (target.closest(".mention-chip")) {
    e.preventDefault();
    const href = target.closest("a")?.getAttribute("href");
    if (href) {
      navigateTo(href);
    }
    return;
  }

  // Handle spoiler toggles
  if (target.classList.contains("spoiler")) {
    target.classList.toggle("revealed");
  }
}

function cycleRepliesFilter() {
  if (includeReplies.value === null) includeReplies.value = true;
  else if (includeReplies.value === true) includeReplies.value = false;
  else includeReplies.value = null;
  reloadWithFilters();
}

function toggleMediaOnly() {
  mediaOnly.value = !mediaOnly.value;
  reloadWithFilters();
}

function toggleOrder() {
  orderDesc.value = !orderDesc.value;
  reloadWithFilters();
}

function setContentType(type: "all" | "posts" | "articles") {
  contentType.value = type;
  reloadWithFilters();
}

async function reloadWithFilters() {
  if (!publisherName.value) return;
  isLoading.value = true;
  isRefreshing.value = true;
  error.value = null;
  try {
    const result = await fetchPublisherPosts(publisherName.value, 20, 0, {
      type:
        contentType.value === "posts"
          ? "0"
          : contentType.value === "articles"
            ? "1"
            : undefined,
      replies: includeReplies.value,
      media: mediaOnly.value,
      orderDesc: orderDesc.value,
      queryTerm: query.value.trim() || undefined,
    });
    posts.value = result.posts;
    totalPosts.value = result.total;
    offset.value = result.posts.length;
    hasMore.value = result.posts.length < result.total;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load posts";
  } finally {
    isLoading.value = false;
    isRefreshing.value = false;
  }
}

async function loadMore() {
  if (!hasMore.value || isLoading.value) return;
  isLoading.value = true;
  error.value = null;
  try {
    const result = await fetchPublisherPosts(
      publisherName.value,
      20,
      offset.value,
      {
        type:
          contentType.value === "posts"
            ? "0"
            : contentType.value === "articles"
              ? "1"
              : undefined,
        replies: includeReplies.value,
        media: mediaOnly.value,
        orderDesc: orderDesc.value,
        queryTerm: query.value.trim() || undefined,
      },
    );
    const more = result.posts;
    posts.value = [...posts.value, ...more];
    offset.value += more.length;
    hasMore.value = posts.value.length < result.total;
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to load more posts";
  } finally {
    isLoading.value = false;
  }
}

async function subscribe() {
  if (!publisherName.value) return;
  isSubscribing.value = true;
  try {
    await subscribeToPublisher(publisherName.value);
    await loadSubscriptionStatus();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to subscribe";
  } finally {
    isSubscribing.value = false;
  }
}

async function unsubscribe() {
  if (!publisherName.value) return;
  const confirmed = await useAlert().confirm("Confirm", "Are you sure you want to unsubscribe?");
  if (!confirmed) return;
  isSubscribing.value = true;
  try {
    await unsubscribeFromPublisher(publisherName.value);
    await loadSubscriptionStatus();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to unsubscribe";
  } finally {
    isSubscribing.value = false;
  }
}

async function toggleNotify() {
  if (!publisherName.value || !subStatus.value?.subscription) return;
  const currentNotify = subStatus.value.subscription.notify;
  try {
    await setPublisherNotify(publisherName.value, !currentNotify);
    await loadSubscriptionStatus();
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to update notification";
  }
}

async function loadSubscriptionStatus() {
  if (!isAuthenticated.value || !publisherName.value) return;
  try {
    const status = await fetchPublisherSubscriptionStatus(publisherName.value);
    subStatus.value = status;
  } catch {
    subStatus.value = null;
  }
}

async function shareProfile() {
  if (publisher.value?.name) {
    const url = `https://solian.app/${publisher.value.name}`;
    if (navigator.share) {
      await navigator.share({
        title: displayName.value,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }
}

function openCollection(collection: PostCollection) {
  activeCollection.value = collection;
  collectionDrawerOpen.value = true;
}

function handleBoost(_post: Post) {
  // TODO: Implement boost
}

function handleShare(post: Post) {
  navigator.share?.({
    title:
      post.title || `${post.publisher?.nick || post.publisher?.name}'s Post`,
    text: post.content.slice(0, 100),
    url: `${window.location.origin}/posts/${post.id}`,
  });
}

function handleReply(post: Post) {
  navigateTo(`/posts/${post.id}`);
}

// Load additional data on mount
onMounted(async () => {
  try {
    // Load posts
    await reloadWithFilters();

    // Load subscription if authenticated
    if (isAuthenticated.value) {
      await loadSubscriptionStatus();
    }
  } catch (err) {
    console.error('Failed to load additional data:', err);
  }
});
</script>
