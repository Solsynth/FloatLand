<template>
  <div class="flex w-full flex-col gap-5">
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
  </div>
</template>

<script setup lang="ts">
import { IconFolder } from "#components";
import {
  fetchCategories,
  fetchTags,
  type PostCategory,
  type PostTag,
} from "~/utils/api";

const { t } = useI18n();

const { data: discoveryData } = await useAsyncData(
  "explore-discovery",
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
      console.error("Failed to load explore discovery data:", error);
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

const categories = computed(() => discoveryData.value?.categories ?? []);
const tags = computed(() => discoveryData.value?.tags ?? []);
</script>
