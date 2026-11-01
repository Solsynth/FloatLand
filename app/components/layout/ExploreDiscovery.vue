<template>
  <div class="flex flex-col gap-4">
    <ConsolePanel v-if="categories.length > 0" :title="t('sidebar.categories')">
      <template #header>
        <NuxtLink to="/categories" class="text-2xs text-faint transition-colors hover:text-dim">
          {{ t("sidebar.viewAll") }}
        </NuxtLink>
      </template>
      <ul class="-mx-1.5 space-y-0.5">
        <li v-for="category in categories" :key="category.id">
          <NuxtLink
            :to="`/categories/${category.slug}`"
            class="flex items-center gap-2 rounded-control px-1.5 py-1.5 text-[13px] text-dim transition-colors hover:bg-base-300/60 hover:text-base-content"
          >
            <IconFolder class="size-3.5 shrink-0 text-faint" aria-hidden="true" />
            <span class="truncate">{{ category.name }}</span>
          </NuxtLink>
        </li>
      </ul>
    </ConsolePanel>

    <ConsolePanel v-if="tags.length > 0" :title="t('sidebar.tags')">
      <template #header>
        <NuxtLink to="/tags" class="text-2xs text-faint transition-colors hover:text-dim">
          {{ t("sidebar.viewAll") }}
        </NuxtLink>
      </template>
      <div class="flex flex-wrap gap-1.5">
        <NuxtLink
          v-for="tag in tags"
          :key="tag.id"
          :to="`/tags/${tag.slug}`"
          class="chip"
        >
          #{{ tag.name || tag.slug }}
        </NuxtLink>
      </div>
    </ConsolePanel>
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
