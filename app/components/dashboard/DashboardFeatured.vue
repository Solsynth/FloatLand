<template>
  <div class="dash-card p-5">
    <div class="flex items-center justify-between">
      <h3 class="dash-card__title">
        <IconSparkles class="h-4 w-4 text-base-content/45" />
        {{ t("dashboard.featured.title") }}
      </h3>
      <NuxtLink
        to="/timeline"
        class="text-xs font-medium text-base-content/55 transition-colors hover:text-primary"
      >
        {{ t("dashboard.viewAll") }}
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-6">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <div v-else-if="error" class="py-6 text-center text-xs text-base-content/50">
      {{ t("dashboard.featured.failed") }}
    </div>

    <div v-else-if="posts.length === 0" class="py-6 text-center text-xs text-base-content/45">
      —
    </div>

    <div v-else class="mt-2 flex flex-col divide-y divide-base-200">
      <NuxtLink
        v-for="post in posts.slice(0, 3)"
        :key="post.id"
        :to="`/posts/${post.id}`"
        class="group flex items-start gap-3 py-3 transition-colors"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium group-hover:text-primary">
            {{ post.title || post.content }}
          </p>
          <p v-if="post.title" class="mt-0.5 line-clamp-2 text-xs text-base-content/55">
            {{ post.content }}
          </p>
          <p class="mt-1 text-[11px] text-base-content/40">
            {{ getDisplayName(post.publisher) }}
          </p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconSparkles } from "#components";
import type { Post } from "~/types/post";
import { fetchFeaturedPosts } from "~/utils/api";
import { getDisplayName } from "~/utils/identity";

const { t } = useI18n();

const loading = ref(true);
const error = ref(false);
const posts = ref<Post[]>([]);

onMounted(async () => {
  try {
    posts.value = await fetchFeaturedPosts();
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>
