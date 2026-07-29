<template>
  <div v-if="posts.length > 0 || loading || error" class="feed-featured">
    <!-- Header -->
    <div
      class="feed-insert__header cursor-pointer select-none"
      @click="toggleCollapse"
    >
      <IconSparkles class="h-3.5 w-3.5 shrink-0 text-primary" />
      <span class="flex-1 text-xs font-semibold text-base-content/70">
        {{ t("home.featuredPosts") }}
      </span>

      <template v-if="!isCollapsed && posts.length > 1">
        <button
          type="button"
          class="btn btn-ghost btn-xs btn-square"
          :disabled="currentPage === 0"
          @click.stop="prevPage"
        >
          <IconChevronLeft class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-xs btn-square"
          :disabled="currentPage === posts.length - 1"
          @click.stop="nextPage"
        >
          <IconChevronRight class="h-4 w-4" />
        </button>
      </template>

      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square"
        @click.stop="toggleCollapse"
      >
        <IconChevronDown
          class="h-4 w-4 transition-transform duration-150"
          :class="{ '-rotate-180': !isCollapsed }"
        />
      </button>
    </div>

    <div
      ref="contentRef"
      class="overflow-hidden transition-[max-height] duration-200 ease-out"
      :style="{ maxHeight: contentHeight }"
    >
      <div class="px-4 pb-4">
        <div v-if="loading" class="flex items-center justify-center py-8">
          <span class="loading loading-spinner loading-sm text-base-content/40" />
        </div>

        <div
          v-else-if="error"
          class="py-4 text-center text-xs text-base-content/45"
        >
          {{ t("home.featuredPostsFailed") }}
        </div>

        <div v-else class="relative">
          <div class="overflow-hidden rounded-lg border border-base-300/70 bg-base-200/40">
            <div
              class="flex transition-transform duration-200 ease-out"
              :style="{ transform: `translateX(-${currentPage * 100}%)` }"
            >
              <div
                v-for="post in posts"
                :key="post.id"
                class="w-full shrink-0"
              >
                <PostCard
                  :post="post"
                  variant="feed"
                  @boost="(p: Post) => emit('boost', p)"
                  @share="(p: Post) => emit('share', p)"
                  @reply="(p: Post) => emit('reply', p)"
                />
              </div>
            </div>
          </div>

          <div
            v-if="posts.length > 1"
            class="mt-2.5 flex items-center justify-center gap-1"
          >
            <button
              v-for="(_, i) in posts"
              :key="i"
              type="button"
              class="h-1 rounded-full transition-all duration-150"
              :class="
                i === currentPage
                  ? 'w-3.5 bg-primary'
                  : 'w-1 bg-base-300 hover:bg-base-content/25'
              "
              @click="goToPage(i)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from "~/types/post";
import { fetchFeaturedPosts } from "~/utils/api";
import {
  IconSparkles,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
} from "#components";

const { t } = useI18n();

const emit = defineEmits<{
  boost: [post: Post];
  share: [post: Post];
  reply: [post: Post];
}>();

const STORAGE_KEY = "featured_posts_collapsed";

const posts = ref<Post[]>([]);
const loading = ref(true);
const error = ref(false);
const currentPage = ref(0);
const contentRef = ref<HTMLElement | null>(null);
const contentHeight = ref("0px");
const isCollapsed = ref(true);

function loadCollapseState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    isCollapsed.value = stored === "true";
  } catch {
    isCollapsed.value = false;
  }
}

function saveCollapseState() {
  try {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed.value));
  } catch {
    // localStorage unavailable
  }
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
  saveCollapseState();
}

watch(isCollapsed, () => {
  if (!contentRef.value) return;
  if (isCollapsed.value) {
    contentHeight.value = "0px";
  } else {
    const el = contentRef.value;
    el.style.maxHeight = "";
    requestAnimationFrame(() => {
      contentHeight.value = el.scrollHeight + "px";
    });
  }
});

onMounted(async () => {
  loadCollapseState();

  if (!isCollapsed.value && contentRef.value) {
    requestAnimationFrame(() => {
      if (contentRef.value) {
        contentHeight.value = contentRef.value.scrollHeight + "px";
      }
    });
  }

  try {
    const data = await fetchFeaturedPosts();
    posts.value = data;
  } catch (e) {
    console.error("Failed to fetch featured posts:", e);
    error.value = true;
  } finally {
    loading.value = false;
  }
});

function prevPage() {
  if (currentPage.value > 0) currentPage.value--;
}

function nextPage() {
  if (currentPage.value < posts.value.length - 1) currentPage.value++;
}

function goToPage(index: number) {
  currentPage.value = index;
}
</script>
