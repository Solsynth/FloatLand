<template>
  <NuxtLayout name="creator">
    <div class="mx-auto max-w-4xl">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold">{{ t("creator.posts.title") }}</h1>
        <div class="flex gap-2">
          <button
            v-if="!selectionMode"
            class="btn btn-ghost btn-sm"
            @click="selectionMode = true"
          >
            <IconCheckSquare class="w-4 h-4" />
            {{ t("creator.posts.selectAll") }}
          </button>
          <template v-else>
            <button class="btn btn-ghost btn-sm" @click="exitSelection">
              <IconX class="w-4 h-4" />
            </button>
            <div class="dropdown dropdown-end">
              <label tabindex="0" class="btn btn-sm">
                {{ t("creator.common.actions") }}
                <IconChevronDown class="w-3 h-3" />
              </label>
              <ul
                tabindex="0"
                class="dropdown-content menu z-[1] w-56 rounded-box bg-base-100 p-2 shadow"
              >
                <li>
                  <button @click="openVisibilityModal">
                    <IconEye class="w-4 h-4" />
                    {{ t("creator.posts.batchVisibility") }}
                  </button>
                </li>
                <li>
                  <button @click="openCollectionModal('add')">
                    <IconFolder class="w-4 h-4" />
                    {{ t("creator.posts.batchAddToCollection") }}
                  </button>
                </li>
                <li>
                  <button @click="openCollectionModal('remove')">
                    <IconFolderMinus class="w-4 h-4" />
                    {{ t("creator.posts.batchRemoveFromCollection") }}
                  </button>
                </li>
                <li class="border-t border-base-200 mt-1 pt-1">
                  <button class="text-error" @click="batchDelete">
                    <IconTrash class="w-4 h-4" />
                    {{ t("creator.posts.batchDelete") }}
                  </button>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </div>

      <!-- Selection Count -->
      <div v-if="selectedIds.size > 0" class="alert alert-info mb-4">
        <span>{{
          t("creator.common.selected", { count: selectedIds.size })
        }}</span>
      </div>

      <!-- Post List -->
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <div v-else-if="error" class="alert alert-error">
        <span>{{ String(error) }}</span>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="post in posts"
          :key="post.id"
          class="card bg-base-100 shadow-sm cursor-pointer transition-all hover:shadow-md"
          :class="{ 'ring-2 ring-primary': selectedIds.has(post.id) }"
          @click="handlePostClick(post)"
        >
          <div class="card-body p-4">
            <div class="flex items-start gap-3">
              <input
                v-if="selectionMode"
                type="checkbox"
                class="checkbox checkbox-sm mt-1"
                :checked="selectedIds.has(post.id)"
                @click.stop="toggleSelection(post.id)"
              />
              <div class="min-w-0 flex-1">
                <h3
                  v-if="post.title"
                  class="font-semibold text-sm mb-1 truncate"
                >
                  {{ post.title }}
                </h3>
                <p class="text-sm text-base-content/70 line-clamp-2">
                  {{ post.content }}
                </p>
                <div
                  class="flex items-center gap-3 mt-2 text-xs text-base-content/50"
                >
                  <span class="flex items-center gap-1">
                    <IconEye class="w-3 h-3" /> {{ post.viewsUnique }}
                  </span>
                  <span class="flex items-center gap-1">
                    <IconThumbsUp class="w-3 h-3" /> {{ post.upvotes }}
                  </span>
                  <span class="flex items-center gap-1">
                    <IconMessageCircle class="w-3 h-3" />
                    {{ post.repliesCount }}
                  </span>
                  <span class="ml-auto">{{
                    formatDate(post.publishedAt || post.createdAt)
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <div v-if="hasMore" class="flex justify-center py-4">
          <button
            class="btn btn-ghost btn-sm"
            :class="{ loading: loadingMore }"
            @click="loadMore"
          >
            {{ t("common.loadMore") }}
          </button>
        </div>
      </div>

      <!-- Post Detail Drawer -->
      <AdminDrawer
        :open="detailModalOpen"
        @update:open="detailModalOpen = $event"
      >
        <template #header>
          <h3 class="font-bold text-lg">{{ t("creator.posts.detail") }}</h3>
        </template>
        <template v-if="selectedPost">
          <div class="space-y-4">
            <div v-if="selectedPost.title" class="font-semibold text-lg">
              {{ selectedPost.title }}
            </div>
            <div class="text-sm whitespace-pre-wrap">
              {{ selectedPost.content }}
            </div>

            <!-- Analytics -->
            <div class="card bg-base-200">
              <div class="card-body p-4">
                <h4 class="font-semibold text-sm mb-2">
                  {{ t("creator.posts.analytics") }}
                </h4>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div class="text-center">
                    <div class="text-lg font-bold">
                      {{ selectedPost.viewsUnique }}
                    </div>
                    <div class="text-xs text-base-content/50">
                      {{ t("creator.posts.uniqueViews") }}
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="text-lg font-bold">
                      {{ selectedPost.viewsTotal }}
                    </div>
                    <div class="text-xs text-base-content/50">
                      {{ t("creator.posts.views") }}
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="text-lg font-bold">
                      {{ selectedPost.upvotes }}
                    </div>
                    <div class="text-xs text-base-content/50">
                      {{ t("creator.stats.upvoteReceived") }}
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="text-lg font-bold">
                      {{ selectedPost.downvotes }}
                    </div>
                    <div class="text-xs text-base-content/50">
                      {{ t("creator.stats.downvoteReceived") }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Meta -->
            <div class="text-xs text-base-content/50 space-y-1">
              <div>
                {{ t("creator.posts.created") }}:
                {{ formatDate(selectedPost.createdAt) }}
              </div>
              <div v-if="selectedPost.editedAt">
                {{ t("creator.posts.edited") }}:
                {{ formatDate(selectedPost.editedAt) }}
              </div>
            </div>
          </div>
        </template>
      </AdminDrawer>

      <!-- Visibility Drawer -->
      <AdminDrawer
        :open="visibilityModalOpen"
        :title="t('creator.posts.batchVisibility')"
        @update:open="visibilityModalOpen = $event"
      >
        <div class="space-y-2">
          <label
            v-for="opt in visibilityOptions"
            :key="opt.value"
            class="flex items-center gap-3 p-3 rounded-lg bg-base-200 cursor-pointer hover:bg-base-300"
          >
            <input
              type="radio"
              name="visibility"
              class="radio radio-primary radio-sm"
              :value="opt.value"
              v-model="selectedVisibility"
            />
            <span class="text-sm font-medium">{{ opt.label }}</span>
          </label>
        </div>
        <template #footer>
          <div class="flex items-center justify-between">
            <button class="btn btn-ghost" @click="closeVisibilityModal">
              {{ t("creator.cancel") }}
            </button>
            <button
              class="btn btn-primary"
              :disabled="batchLoading"
              @click="applyVisibility"
            >
              {{ t("creator.common.apply") }}
            </button>
          </div>
        </template>
      </AdminDrawer>

      <!-- Collection Drawer -->
      <AdminDrawer
        :open="collectionModalOpen"
        @update:open="collectionModalOpen = $event"
      >
        <template #header>
          <h3 class="font-bold text-lg">
            {{
              collectionAction === "add"
                ? t("creator.posts.batchAddToCollection")
                : t("creator.posts.batchRemoveFromCollection")
            }}
          </h3>
        </template>
        <div v-if="collectionsLoading" class="flex justify-center py-4">
          <span class="loading loading-spinner" />
        </div>
        <div
          v-else-if="!collections?.length"
          class="text-center py-4 text-base-content/50"
        >
          {{ t("creator.collections.empty") }}
        </div>
        <div v-else class="space-y-2">
          <button
            v-for="col in collections"
            :key="col.slug"
            class="flex items-center gap-3 w-full p-3 rounded-lg bg-base-200 hover:bg-base-300 text-left"
            @click="applyCollection(col.slug)"
          >
            <IconFolder class="w-4 h-4 text-primary" />
            <div class="min-w-0">
              <div class="text-sm font-medium truncate">
                {{ col.name || col.slug }}
              </div>
              <div class="text-xs text-base-content/50">{{ col.slug }}</div>
            </div>
          </button>
        </div>
        <template #footer>
          <button class="btn btn-ghost" @click="closeCollectionModal">
            {{ t("creator.cancel") }}
          </button>
        </template>
      </AdminDrawer>
    </div>

    <template #rightbar>
      <div class="card bg-base-100 shadow-sm rounded-none min-h-full">
        <div class="card-body p-4">
          <h3 class="font-semibold text-sm mb-3">
            {{ t("creator.posts.title") }}
          </h3>
          <div class="space-y-2 text-xs text-base-content/60">
            <p>{{ t("creator.posts.selectAll") }}</p>
            <p>{{ t("creator.posts.batchVisibility") }}</p>
            <p>{{ t("creator.posts.batchAddToCollection") }}</p>
          </div>
        </div>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconCheckSquare,
  IconX,
  IconEye,
  IconThumbsUp,
  IconMessageCircle,
  IconChevronDown,
  IconTrash,
  IconFolder,
  IconFolderMinus,
} from "#components";
import type { Post } from "~/types/post";
import type { SnPostCollection } from "~/types/creator";
import { fetchPublisherPosts } from "~/utils/api";
import {
  batchDeletePosts,
  batchUpdatePostVisibility,
  fetchCollections,
  batchAddPostsToCollection,
  batchRemovePostsFromCollection,
} from "~/utils/creator";

definePageMeta({ middleware: "creator" });

const { t } = useI18n();
const route = useRoute();
const pubName = computed(() => route.params.pubName as string);

const creator = useCreator();
const { currentPublisher } = creator;

defineOgImage("UniOgImage", {
  title: computed(
    () =>
      `${t("creator.posts.title")} - ${currentPublisher.value?.nick ?? pubName.value}`,
  ),
});

useSolarSeo({
  title: computed(
    () =>
      `${t("creator.posts.title")} - ${currentPublisher.value?.nick ?? pubName.value}`,
  ),
});

const selectionMode = ref(false);
const selectedIds = ref<Set<string>>(new Set());
const selectedPost = ref<Post | null>(null);
const detailModalOpen = ref(false);
const loadingMore = ref(false);
const offset = ref(0);
const pageSize = 20;
const batchLoading = ref(false);

// Visibility modal
const visibilityModalOpen = ref(false);
const selectedVisibility = ref<string>("public");

// Collection modal
const collectionModalOpen = ref(false);
const collectionAction = ref<"add" | "remove">("add");
const collections = ref<SnPostCollection[]>([]);
const collectionsLoading = ref(false);

const visibilityOptions = computed(() => [
  { value: "public", label: t("creator.posts.visibility.public") },
  { value: "friends", label: t("creator.posts.visibility.friends") },
  { value: "unlisted", label: t("creator.posts.visibility.unlisted") },
  { value: "private", label: t("creator.posts.visibility.private") },
]);

function openDetail(post: Post) {
  selectedPost.value = post;
  detailModalOpen.value = true;
}

function closeDetail() {
  detailModalOpen.value = false;
}

function openVisibilityModal() {
  visibilityModalOpen.value = true;
}

function closeVisibilityModal() {
  visibilityModalOpen.value = false;
}

async function openCollectionModal(action: "add" | "remove") {
  collectionAction.value = action;
  collectionModalOpen.value = true;
  collectionsLoading.value = true;
  try {
    collections.value = await fetchCollections(pubName.value);
  } catch (e) {
    console.error(e);
  } finally {
    collectionsLoading.value = false;
  }
}

function closeCollectionModal() {
  collectionModalOpen.value = false;
}

const {
  data: postResult,
  status,
  error,
  refresh,
} = await useAsyncData(`creator-posts-${pubName.value}`, () =>
  fetchPublisherPosts(pubName.value, pageSize, 0),
);

const posts = ref<Post[]>([]);
const hasMore = ref(false);

watch(
  postResult,
  (val) => {
    if (val) {
      posts.value = val.posts;
      hasMore.value = val.posts.length < val.total;
      offset.value = val.posts.length;
    }
  },
  { immediate: true },
);

async function loadMore() {
  if (loadingMore.value) return;
  loadingMore.value = true;
  try {
    const result = await fetchPublisherPosts(
      pubName.value,
      pageSize,
      offset.value,
    );
    posts.value = [...posts.value, ...result.posts];
    offset.value += result.posts.length;
    hasMore.value = posts.value.length < result.total;
  } finally {
    loadingMore.value = false;
  }
}

function handlePostClick(post: Post) {
  if (selectionMode.value) {
    toggleSelection(post.id);
  } else {
    openDetail(post);
  }
}

function toggleSelection(id: string) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
}

function exitSelection() {
  selectionMode.value = false;
  selectedIds.value = new Set();
}

async function batchDelete() {
  if (selectedIds.value.size === 0) return;
  if (!(await useAlert().confirm('Confirm', t("creator.posts.batchDelete")))) return;
  batchLoading.value = true;
  try {
    await batchDeletePosts(Array.from(selectedIds.value));
    exitSelection();
    await refresh();
  } catch (e) {
    console.error(e);
  } finally {
    batchLoading.value = false;
  }
}

async function applyVisibility() {
  if (selectedIds.value.size === 0) return;
  batchLoading.value = true;
  try {
    await batchUpdatePostVisibility(
      Array.from(selectedIds.value),
      selectedVisibility.value as "public" | "friends" | "unlisted" | "private",
    );
    closeVisibilityModal();
    exitSelection();
    await refresh();
  } catch (e) {
    console.error(e);
  } finally {
    batchLoading.value = false;
  }
}

async function applyCollection(slug: string) {
  if (selectedIds.value.size === 0) return;
  batchLoading.value = true;
  try {
    const ids = Array.from(selectedIds.value);
    if (collectionAction.value === "add") {
      await batchAddPostsToCollection(pubName.value, slug, ids);
    } else {
      await batchRemovePostsFromCollection(pubName.value, slug, ids);
    }
    closeCollectionModal();
    exitSelection();
  } catch (e) {
    console.error(e);
  } finally {
    batchLoading.value = false;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
}
</script>
