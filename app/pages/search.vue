<template>
  <NuxtLayout name="app">
    <PageHeader :title="t('search.seoTitle')" :description="t('search.seoDescription')" />

    <div class="min-w-0">
      <form class="mb-4" role="search" @submit.prevent="onSubmit">
        <TextField
          ref="searchField"
          v-model="searchQuery"
          :placeholder="t('search.placeholder')"
          :aria-label="t('search.placeholder')"
          type="search"
          size="md"
          bare
          suffix-icon="IconSearch"
          autocomplete="off"
          @input="onInput"
        >
          <template #action>
            <button
              v-if="searchQuery"
              type="button"
              class="field-action"
              :aria-label="t('common.close')"
              @click="clearSearch"
            >
              <IconX class="size-3.5" aria-hidden="true" />
            </button>
          </template>
        </TextField>
      </form>

      <TabBox :tabs="tabs" :active="activeTab" :label="t('search.seoTitle')" @select="onTabSelect" />

      <div v-if="!debouncedQuery.trim()" class="py-16 text-center">
        <IconSearch class="mx-auto mb-3 size-6 text-faint" aria-hidden="true" />
        <p class="voice">{{ t("search.emptyState") }}</p>
      </div>

      <template v-else-if="activeTab === 'posts'">
        <LoadingSkeleton v-if="postsLoading && posts.length === 0" variant="feed" :rows="3" />

        <p v-else-if="posts.length === 0" class="voice py-12 text-center">
          {{ t("search.noPosts") }}
        </p>

        <template v-else>
          <div class="flex flex-col gap-3">
            <PostCard v-for="post in posts" :key="post.id" :post="post" />
          </div>

          <div class="mt-4 flex justify-center">
            <span v-if="postsLoading" class="mono-id">{{ t("common.loading") }}</span>
            <button
              v-else-if="hasMorePosts"
              type="button"
              class="btn btn-quiet btn-xs"
              @click="loadMorePosts"
            >
              {{ t("common.loadMore") }}
            </button>
            <p v-else class="mono-id">{{ t("search.noMoreResults") }}</p>
          </div>
        </template>
      </template>

      <template v-else-if="activeTab === 'accounts'">
        <LoadingSkeleton v-if="accountsLoading && allAccountResults.length === 0" variant="rows" :rows="4" />

        <p v-else-if="allAccountResults.length === 0" class="voice py-12 text-center">
          {{ t("search.noAccounts") }}
        </p>

        <ConsolePanel v-else flush>
          <ul class="space-y-0.5">
            <li v-for="result in allAccountResults" :key="`${result.type}-${result.data.id || result.data.name}`">
              <NuxtLink
                :to="
                  result.type === 'publisher'
                    ? `/publishers/${result.data.name}`
                    : `/accounts/${result.data.name}`
                "
                class="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-base-200/60"
              >
                <UserAvatar
                  :src="getAvatarUrl(result)"
                  :name="getDisplayName(result)"
                  size="md"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class="truncate text-[13px] font-semibold text-base-content">
                      {{ getDisplayName(result) }}
                    </span>
                    <span v-if="result.type === 'publisher'" class="chip">
                      {{ t("search.publisherBadge") }}
                    </span>
                  </div>
                  <p class="mono-id truncate">@{{ result.data.name }}</p>
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <div
                    v-if="getBio(result)"
                    class="markdown markdown-compact mt-0.5 line-clamp-1 text-faint"
                    v-html="renderMarkdown(getBio(result))"
                  />
                </div>
                <IconChevronRight class="size-3.5 shrink-0 text-faint" aria-hidden="true" />
              </NuxtLink>
            </li>
          </ul>
        </ConsolePanel>
      </template>

      <template v-else>
        <LoadingSkeleton v-if="realmsLoading && realms.length === 0" variant="rows" :rows="4" />

        <p v-else-if="realms.length === 0" class="voice py-12 text-center">
          {{ t("search.noRealms") }}
        </p>

        <div v-else class="flex flex-col gap-2">
          <RealmListTile v-for="realm in realms" :key="realm.id" :realm="realm" />
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  fetchPosts,
  searchAccounts,
  searchPublishers,
  searchRealms,
} from "~/utils/api";
import { renderMarkdown } from "~/utils/markdown";
import type { SnAccount } from "~/types/auth";
import type { Realm } from "~/types/realm";
import type { Post, Publisher } from "~/types/post";
import { IconSearch, IconX, IconChevronRight } from "#components";

type SearchTab = "posts" | "accounts" | "realms";

const { t } = useI18n();

defineOgImage("UniOgImage", {
  title: t("search.seoTitle"),
  description: t("search.seoDescription"),
});

useSolarSeo({
  title: t("search.seoTitle"),
  description: t("search.seoDescription"),
  breadcrumbs: [
    { name: "Home", item: "https://solian.app" },
    { name: "Search", item: "https://solian.app/search" },
  ],
});

const route = useRoute();
const searchField = ref<{ focus: () => void } | null>(null);

const tabs = computed(() => [
  { key: "posts", label: t("search.tabPosts") },
  { key: "accounts", label: t("search.tabAccounts") },
  { key: "realms", label: t("search.tabRealms") },
]);

const activeTab = ref<SearchTab>("posts");
const searchQuery = ref((route.query.q as string) || "");
const debouncedQuery = ref((route.query.q as string) || "");

const posts = ref<Post[]>([]);
const postsLoading = ref(false);
const postsOffset = ref(0);
const postsTotal = ref(0);
const hasMorePosts = computed(() => posts.value.length < postsTotal.value);

const accountResults = ref<SnAccount[]>([]);
const publisherResults = ref<Publisher[]>([]);
const accountsLoading = ref(false);

const allAccountResults = computed(() => {
  const results: { type: "account" | "publisher"; data: any }[] = [
    ...accountResults.value.map((a) => ({ type: "account" as const, data: a })),
    ...publisherResults.value.map((p) => ({ type: "publisher" as const, data: p })),
  ];
  return results;
});

const realms = ref<Realm[]>([]);
const realmsLoading = ref(false);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = searchQuery.value;
  }, 450);
}

function onSubmit() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debouncedQuery.value = searchQuery.value;
}

function onTabSelect(key: string) {
  activeTab.value = key as SearchTab;
}

function clearSearch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  searchQuery.value = "";
  debouncedQuery.value = "";
  resetResults();
  searchField.value?.focus();
}

async function performPostsSearch() {
  if (!debouncedQuery.value.trim()) return;
  postsLoading.value = true;
  try {
    const result = await fetchPosts(20, postsOffset.value, {
      queryTerm: debouncedQuery.value.trim(),
    });
    posts.value =
      postsOffset.value === 0 ? result.posts : [...posts.value, ...result.posts];
    postsTotal.value = result.total;
  } catch (e) {
    console.error("Posts search failed:", e);
  } finally {
    postsLoading.value = false;
  }
}

async function performAccountsSearch() {
  if (!debouncedQuery.value.trim()) return;
  accountsLoading.value = true;
  try {
    const query = debouncedQuery.value.trim();
    const [accounts, publishers] = await Promise.all([
      searchAccounts(query).catch(() => []),
      searchPublishers(query).catch(() => []),
    ]);
    accountResults.value = accounts;
    publisherResults.value = publishers;
  } catch (e) {
    console.error("Accounts search failed:", e);
  } finally {
    accountsLoading.value = false;
  }
}

async function performRealmsSearch() {
  if (!debouncedQuery.value.trim()) return;
  realmsLoading.value = true;
  try {
    realms.value = await searchRealms(debouncedQuery.value.trim());
  } catch (e) {
    console.error("Realms search failed:", e);
  } finally {
    realmsLoading.value = false;
  }
}

async function loadMorePosts() {
  if (!hasMorePosts.value || postsLoading.value) return;
  postsOffset.value += 20;
  await performPostsSearch();
}

watch(debouncedQuery, () => {
  resetResults();
  executeSearch();
});

watch(activeTab, () => {
  if (!debouncedQuery.value.trim()) return;

  if (activeTab.value === "posts" && posts.value.length === 0) {
    postsOffset.value = 0;
    performPostsSearch();
  } else if (activeTab.value === "accounts" && allAccountResults.value.length === 0) {
    performAccountsSearch();
  } else if (activeTab.value === "realms" && realms.value.length === 0) {
    performRealmsSearch();
  }
});

function resetResults() {
  posts.value = [];
  postsOffset.value = 0;
  postsTotal.value = 0;
  accountResults.value = [];
  publisherResults.value = [];
  realms.value = [];
}

function executeSearch() {
  if (!debouncedQuery.value.trim()) return;

  if (activeTab.value === "posts") performPostsSearch();
  else if (activeTab.value === "accounts") performAccountsSearch();
  else performRealmsSearch();
}

const { getFileUrl } = useFileUrls();

function getAvatarUrl(result: { type: string; data: any }): string {
  const fileId = result.data.profile?.picture?.id || result.data.picture?.id;
  return fileId ? (getFileUrl(fileId) ?? "") : "";
}

function getDisplayName(result: { type: string; data: any }): string {
  if (result.type === "publisher") return result.data.nick || result.data.name;
  return result.data.profile?.nick || result.data.name;
}

function getBio(result: { type: string; data: any }): string {
  if (result.type === "publisher") return result.data.bio || "";
  return result.data.profile?.bio || "";
}

onMounted(() => {
  if (route.query.q) {
    const query = route.query.q as string;
    searchQuery.value = query;
    debouncedQuery.value = query;
    nextTick(() => executeSearch());
  } else {
    nextTick(() => searchField.value?.focus());
  }
});
</script>
