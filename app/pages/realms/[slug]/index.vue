<template>
  <NuxtLayout name="app">
    <!-- Not found -->
    <div
      v-if="notFound"
      class="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-16 text-center"
    >
      <IconUsers class="h-10 w-10 text-base-content/30" />
      <h1 class="text-lg font-bold">{{ t("realms.notFound") }}</h1>
      <p class="text-sm text-base-content/50">{{ t("realms.notFoundDesc") }}</p>
    </div>

    <!-- Error / loading skeleton -->
    <div
      v-else-if="!realm"
      class="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-16 text-center"
    >
      <span
        v-if="!error"
        class="loading loading-spinner loading-md text-base-content/40"
      />
      <div v-else class="alert alert-error max-w-md">
        <span>{{ error || t("realms.failedToLoad") }}</span>
      </div>
    </div>

    <!-- Realm profile -->
    <div
      v-else
      class="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-x-6"
    >
      <div class="min-w-0 space-y-4">
        <!-- Header card -->
        <section
          class="overflow-hidden rounded-box bg-base-100"
        >
          <div class="relative h-36 w-full bg-base-200 sm:h-44">
            <img
              v-if="backgroundUrl"
              :src="backgroundUrl"
              :alt="`${displayName} background`"
              class="h-full w-full object-cover"
            />
          </div>

          <div class="relative px-4 pb-4 pt-0 sm:px-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div
                class="-mt-10 shrink-0 overflow-hidden rounded-box ring-4 ring-base-100 sm:-mt-12"
              >
                <div v-if="avatarUrl" class="avatar">
                  <div class="h-20 w-20 sm:h-24 sm:w-24">
                    <img
                      :src="avatarUrl"
                      :alt="displayName"
                      class="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <div
                  v-else
                  class="flex h-20 w-20 items-center justify-center bg-primary text-xl font-bold text-primary-content sm:h-24 sm:w-24 sm:text-2xl"
                >
                  {{ getInitials(displayName) }}
                </div>
              </div>

              <div class="min-w-0 flex-1 pb-0.5">
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="truncate text-xl font-bold sm:text-2xl">
                    {{ displayName }}
                  </h1>
                  <span
                    v-if="realm.verification"
                    class="badge badge-primary badge-sm gap-1"
                  >
                    <IconShieldCheck class="h-3 w-3" />
                    {{ t("realms.verified") }}
                  </span>
                </div>
                <p class="truncate text-sm text-base-content/50">
                  @{{ realm.slug }}
                </p>
              </div>

              <div class="flex shrink-0 gap-2">
                <NuxtLink
                  :to="`/realms/${realm.slug}/members`"
                  class="rounded-box bg-base-200 px-3 py-2 text-center transition-colors hover:bg-base-300"
                >
                  <div class="text-sm font-semibold tabular-nums">
                    {{ memberCount }}
                  </div>
                  <div class="text-[11px] text-base-content/50">
                    {{ t("realms.members") }}
                  </div>
                </NuxtLink>
                <div
                  class="rounded-box bg-base-200 px-3 py-2 text-center"
                >
                  <div class="text-sm font-semibold tabular-nums">
                    {{ total }}
                  </div>
                  <div class="text-[11px] text-base-content/50">
                    {{ t("realms.posts") }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Description + meta -->
            <div class="mt-4 space-y-3">
              <p
                v-if="realm.description"
                class="text-sm leading-relaxed text-base-content/75"
              >
                {{ realm.description }}
              </p>
              <p v-else class="text-sm text-base-content/45">
                {{ t("realms.noDescription") }}
              </p>

              <div class="flex flex-wrap gap-1.5">
                <span
                  class="inline-flex items-center gap-1 rounded-box bg-base-200 px-2 py-0.5 text-[11px] font-medium text-base-content/70"
                >
                  <IconUsers v-if="realm.isCommunity" class="h-3 w-3" />
                  <IconBuilding2 v-else class="h-3 w-3" />
                  {{
                    realm.isCommunity
                      ? t("realms.community")
                      : t("realms.organization")
                  }}
                </span>
                <span
                  class="inline-flex items-center gap-1 rounded-box px-2 py-0.5 text-[11px] font-medium"
                  :class="
                    realm.isPublic
                      ? 'bg-success/12 text-success'
                      : 'bg-warning/15 text-warning'
                  "
                >
                  <IconGlobe v-if="realm.isPublic" class="h-3 w-3" />
                  <IconLock v-else class="h-3 w-3" />
                  {{
                    realm.isPublic
                      ? t("realms.realmPublic")
                      : t("realms.realmPrivate")
                  }}
                </span>
                <span
                  v-if="realm.boostLevel > 0"
                  class="inline-flex items-center gap-1 rounded-box bg-primary/12 px-2 py-0.5 text-[11px] font-medium text-primary"
                >
                  <IconRocket class="h-3 w-3" />
                  {{ t("realms.lv", { level: realm.boostLevel }) }}
                </span>
              </div>

              <div
                v-if="realm.verification"
                class="rounded-box bg-primary/10 px-3 py-2"
              >
                <p class="text-sm font-medium text-primary">
                  {{ realm.verification.title || t("realms.verified") }}
                </p>
                <p
                  v-if="realm.verification.description"
                  class="mt-0.5 text-xs text-base-content/60"
                >
                  {{ realm.verification.description }}
                </p>
              </div>

              <button
                v-if="realm.isPublic && !isMember"
                type="button"
                class="btn btn-primary btn-sm"
                :disabled="isJoining"
                @click="handleJoin"
              >
                <IconLoader
                  v-if="isJoining"
                  class="h-4 w-4 animate-spin"
                />
                <IconUserPlus v-else class="h-4 w-4" />
                {{ t("realms.joinRealm") }}
              </button>
            </div>
          </div>
        </section>

        <!-- Mobile sidebar strip -->
        <div class="xl:hidden">
          <RealmSidebar
            :realm-slug="realm.slug"
            :is-member="isMember"
            :membership="myMembership"
          />
        </div>

        <!-- Posts feed -->
        <section
          class="overflow-hidden rounded-box bg-base-100"
        >
          <!-- Filters toolbar -->
          <div class="space-y-3 px-3 py-3 sm:px-4">
            <div
              v-if="isRefreshing"
              class="flex items-center gap-2 text-xs text-base-content/50"
            >
              <IconLoader class="h-3.5 w-3.5 animate-spin" />
              <span>{{ t("realms.refreshing") }}</span>
            </div>

            <div class="flex rounded-box bg-base-200 p-0.5">
              <button
                v-for="tab in contentTabs"
                :key="tab.key"
                type="button"
                class="btn btn-sm flex-1 border-0"
                :class="
                  contentType === tab.key
                    ? 'btn-primary'
                    : 'btn-ghost text-base-content/60'
                "
                @click="setContentType(tab.key)"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                class="btn btn-ghost btn-xs gap-1 bg-base-200"
                @click="cycleRepliesFilter"
              >
                <IconMessageCircle class="h-3.5 w-3.5" />
                {{ t("realms.replies", { value: repliesLabel }) }}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs gap-1 bg-base-200"
                @click="toggleMediaOnly"
              >
                <IconImage class="h-3.5 w-3.5" />
                {{
                  t("realms.mediaOnly", {
                    value: mediaOnly ? t("realms.on") : t("realms.off"),
                  })
                }}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs gap-1 bg-base-200"
                @click="toggleOrder"
              >
                <IconArrowDownUp class="h-3.5 w-3.5" />
                {{
                  t("realms.order", {
                    value: orderDesc ? t("realms.newest") : t("realms.oldest"),
                  })
                }}
              </button>
              <div class="join ml-auto min-w-0 flex-1 sm:max-w-xs">
                <input
                  v-model="query"
                  class="input input-sm join-item w-full min-w-0 bg-base-200"
                  :placeholder="t('realms.searchPosts')"
                  @keydown.enter="reloadWithFilters"
                />
                <button
                  type="button"
                  class="btn btn-sm join-item btn-ghost bg-base-200"
                  @click="reloadWithFilters"
                >
                  <IconSearch class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="error"
            class="mx-3 rounded-box bg-error/10 px-4 py-3 text-sm text-error sm:mx-4"
          >
            {{ error }}
          </div>

          <!-- Feed posts -->
          <div
            v-if="posts.length > 0"
            class="space-y-3 px-3 pb-3 sm:px-4 sm:pb-4"
            :class="isRefreshing ? 'opacity-60' : ''"
          >
            <PostCard
              v-for="post in posts"
              :key="post.id"
              :post="post"
              variant="feed"
              @boost="handleBoost"
              @share="handleShare"
              @reply="handleReply"
            />
          </div>

          <div
            v-else-if="!error && !isLoading"
            class="px-4 py-12 text-center text-sm text-base-content/45"
          >
            {{ t("realms.noPostsWithFilters") }}
          </div>

          <div
            ref="loadMoreSentinel"
            class="flex min-h-12 flex-col items-center justify-center gap-2 px-4 py-4"
          >
            <div
              v-if="isLoading && posts.length > 0"
              class="flex items-center gap-2 text-xs text-base-content/45"
            >
              <span class="loading loading-spinner loading-xs" />
              <span>{{ t("common.loading") }}</span>
            </div>
            <button
              v-else-if="hasMore && posts.length > 0"
              type="button"
              class="btn btn-ghost btn-sm text-base-content/55"
              :disabled="isLoading"
              @click="loadMore"
            >
              {{ t("common.loadMore") }}
            </button>
            <p
              v-else-if="!hasMore && posts.length > 0"
              class="text-xs text-base-content/35"
            >
              {{ t("realms.noMorePosts") }}
            </p>
          </div>
        </section>
      </div>

      <!-- Desktop right rail (20rem) -->
      <aside class="hidden w-full self-start sticky top-20 xl:block">
        <RealmSidebar
          :realm-slug="realm.slug"
          :is-member="isMember"
          :membership="myMembership"
        />
      </aside>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Realm, RealmMember } from "~/types/realm";
import type { Post } from "~/types/post";
import {
  fetchRealm,
  fetchRealmPosts,
  getMyRealmMembership,
  joinRealm,
  fetchRealmMembers,
} from "~/utils/api";
import { getFileUrl } from "~/utils/files";
import { useIntersectionObserver } from "@vueuse/core";
import {
  IconSearch,
  IconImage,
  IconMessageCircle,
  IconArrowDownUp,
  IconShieldCheck,
  IconUsers,
  IconBuilding2,
  IconGlobe,
  IconLock,
  IconLoader,
  IconUserPlus,
  IconRocket,
} from "#components";

const { t } = useI18n();

const route = useRoute();
const realmSlug = computed(() => route.params.slug as string);

const realm = ref<Realm | null>(null);
const posts = ref<Post[]>([]);
const myMembership = ref<RealmMember | null>(null);
const memberCount = ref(0);
const notFound = ref(false);
const error = ref<string | null>(null);
const isLoading = ref(false);
const isRefreshing = ref(false);
const isJoining = ref(false);
const isMember = ref(false);
const total = ref(0);
const offset = ref(0);
const hasMore = ref(false);
const loadMoreSentinel = ref<HTMLElement | null>(null);
const sentinelVisible = ref(false);

const contentType = ref<"all" | "posts" | "articles">("all");
const includeReplies = ref<boolean | null>(null);
const mediaOnly = ref(false);
const orderDesc = ref(true);
const query = ref("");

const seoTitle = ref("");
const seoDescription = ref("");

const contentTabs = computed(() => [
  { key: "all" as const, label: t("realms.all") },
  { key: "posts" as const, label: t("realms.postsTab") },
  { key: "articles" as const, label: t("realms.articles") },
]);

defineOgImage("UniOgImage", {
  title: computed(() => seoTitle.value || "Solar Network"),
  description: computed(() => seoDescription.value || ""),
  iconImage: computed(() => avatarUrl.value || undefined),
});

useHead({
  title: computed(() => seoTitle.value || "Solar Network"),
  meta: [
    {
      name: "description",
      content: computed(
        () =>
          seoDescription.value ||
          "Explore posts, realms, and publishers on Solar Network.",
      ),
    },
    {
      property: "og:title",
      content: computed(() =>
        seoTitle.value
          ? `${seoTitle.value} • Solar Network`
          : "Solar Network",
      ),
    },
    {
      property: "og:description",
      content: computed(
        () =>
          seoDescription.value ||
          "Explore posts, realms, and publishers on Solar Network.",
      ),
    },
  ],
});

const displayName = computed(() => realm.value?.name || "Unknown Realm");
const avatarUrl = computed(() => getFileUrl(realm.value?.picture?.id));
const backgroundUrl = computed(() => getFileUrl(realm.value?.background?.id));

const repliesLabel = computed(() => {
  if (includeReplies.value === null) return t("realms.auto");
  return includeReplies.value ? t("realms.on") : t("realms.off");
});

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

function postQueryOptions() {
  return {
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
  };
}

async function reloadWithFilters() {
  if (!realmSlug.value) return;
  isLoading.value = true;
  isRefreshing.value = true;
  error.value = null;
  try {
    const result = await fetchRealmPosts(
      realmSlug.value,
      20,
      0,
      postQueryOptions(),
    );
    posts.value = result.posts;
    total.value = result.total;
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
    const result = await fetchRealmPosts(
      realmSlug.value,
      20,
      offset.value,
      postQueryOptions(),
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
    if (sentinelVisible.value && hasMore.value) {
      await nextTick();
      loadMore();
    }
  }
}

useIntersectionObserver(
  loadMoreSentinel,
  ([{ isIntersecting }]) => {
    sentinelVisible.value = isIntersecting;
    if (
      isIntersecting &&
      hasMore.value &&
      !isLoading.value &&
      posts.value.length > 0
    ) {
      loadMore();
    }
  },
  { rootMargin: "240px" },
);

async function checkMembership() {
  if (!realm.value?.slug) return;
  try {
    const membership = await getMyRealmMembership(realm.value.slug);
    myMembership.value = membership;
    isMember.value = !!membership;
  } catch {
    myMembership.value = null;
    isMember.value = false;
  }
}

async function handleJoin() {
  if (!realm.value?.slug || isJoining.value || isMember.value) return;
  isJoining.value = true;
  try {
    await joinRealm(realm.value.slug);
    await checkMembership();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to join realm";
  } finally {
    isJoining.value = false;
  }
}

function handleBoost(_post: Post) {}

function handleShare(post: Post) {
  if (navigator.share) {
    navigator.share({
      title:
        post.title || `${post.publisher?.nick || post.publisher?.name}'s Post`,
      text: post.content.slice(0, 100),
      url: `${window.location.origin}/posts/${post.id}`,
    });
  }
}

function handleReply(post: Post) {
  navigateTo(`/posts/${post.id}`);
}

onMounted(async () => {
  try {
    const [data, membersResult] = await Promise.all([
      fetchRealm(realmSlug.value),
      fetchRealmMembers(realmSlug.value, 1, 0).catch(() => ({
        members: [],
        total: 0,
      })),
    ]);
    realm.value = data;
    memberCount.value = membersResult.total;

    const postsResult = await fetchRealmPosts(realmSlug.value, 20, 0);
    posts.value = postsResult.posts;
    total.value = postsResult.total;
    offset.value = postsResult.posts.length;
    hasMore.value = postsResult.posts.length < postsResult.total;

    await checkMembership();

    seoTitle.value = data.name;
    seoDescription.value = data.description || `Realm: ${data.name}`;
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      notFound.value = true;
    } else {
      error.value = err instanceof Error ? err.message : "Failed to load realm";
    }
  }
});
</script>
