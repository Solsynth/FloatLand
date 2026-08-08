<template>
  <div class="flex w-full flex-col gap-5">
    <!-- Search -->
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('common.search')"
        class="rail-search input w-full"
        @keyup.enter="handleSearch"
      />
      <button
        class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors"
        @click="handleSearch"
      >
        <IconSearch class="h-4 w-4" />
      </button>
    </div>

    <!-- Check-In Widget (authenticated only) -->
    <CheckInWidget v-if="isAuthenticated" />

    <!-- Categories -->
    <section v-if="categories.length > 0" class="right-rail-section">
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-base-content/70">{{ t("sidebar.categories") }}</h3>
          <NuxtLink
            to="/categories"
            class="text-xs text-primary hover:underline"
          >
            {{ t("sidebar.viewAll") }}
          </NuxtLink>
        </div>
        <div class="space-y-1">
          <NuxtLink
            v-for="category in categories.slice(0, 5)"
            :key="category.id"
            :to="`/categories/${category.slug}`"
            class="flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-base-200"
          >
            <div
              class="flex h-6 w-6 items-center justify-center rounded-md bg-base-200 text-primary"
            >
              <IconFolder class="h-3 w-3" />
            </div>
            <span class="text-sm truncate">{{ category.name }}</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Tags -->
    <section v-if="tags.length > 0" class="right-rail-section">
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-base-content/70">{{ t("sidebar.tags") }}</h3>
          <NuxtLink
            to="/categories?tab=tags"
            class="text-xs text-primary hover:underline"
          >
            {{ t("sidebar.viewAll") }}
          </NuxtLink>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <NuxtLink
            v-for="tag in tags.slice(0, 10)"
            :key="tag.id"
            :to="`/tags/${tag.slug}`"
            class="badge badge-sm badge-ghost hover:badge-primary transition-colors"
          >
            #{{ tag.name || tag.slug }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- External resources -->
    <div class="px-2 text-xs leading-relaxed text-base-content/40">
      <p>{{ t("sidebar.copyright", { year: currentYear }) }}</p>
      <div class="flex flex-wrap gap-2 text-xs">
        <a
          :href="aboutUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-hover"
        >{{ t("sidebar.about") }}</a>
        <span class="text-base-content/30">&middot;</span>
        <a
          :href="privacyUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-hover"
        >{{ t("sidebar.privacy") }}</a>
        <span class="text-base-content/30">&middot;</span>
        <a
          :href="userAgreementUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-hover"
        >{{ t("sidebar.terms") }}</a>
        <span class="text-base-content/30">&middot;</span>
        <a
          :href="helpUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-hover"
        >{{ t("sidebar.help") }}</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconSearch, IconFolder } from "#components";
import {
  fetchCategories,
  fetchTags,
  type PostCategory,
  type PostTag,
} from "~/utils/api";

const { t, locale } = useI18n();

const auth = useAuth();
const { isAuthenticated } = auth;
const currentYear = new Date().getFullYear();
const searchQuery = ref("");

const aboutUrl = "https://solsynth.dev/products-solar-network";
const privacyUrl = "https://solsynth.dev/legal/privacy-policy";
const userAgreementUrl = "https://solsynth.dev/legal/user-agreements";
const helpUrl = computed(() =>
  locale.value.startsWith("zh")
    ? "https://kb.solsynth.dev/zh/solar-network/"
    : "https://kb.solsynth.dev/solar-network/",
);

function handleSearch() {
  if (searchQuery.value.trim()) {
    navigateTo(`/search?q=${encodeURIComponent(searchQuery.value.trim())}`);
  }
}

const { data: sidebarData } = await useAsyncData(
  "explore-sidebar",
  async () => {
    try {
      const [categoriesResult, tagsResult] = await Promise.all([
        fetchCategories(5, 0),
        fetchTags(10, 0),
      ]);

      return {
        categories: categoriesResult.categories,
        tags: tagsResult.tags,
      };
    } catch (error) {
      console.error("Failed to load explore sidebar data:", error);
      return { categories: [], tags: [] };
    }
  },
  {
    default: () => ({
      categories: [] as PostCategory[],
      tags: [] as PostTag[],
    }),
  },
);

const categories = computed(() => sidebarData.value?.categories ?? []);
const tags = computed(() => sidebarData.value?.tags ?? []);
</script>
