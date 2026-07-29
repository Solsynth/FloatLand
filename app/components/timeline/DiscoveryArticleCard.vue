<template>
  <button
    type="button"
    class="feed-discovery-card flex h-full w-full flex-col overflow-hidden text-left"
    @click="openArticle"
  >
    <div
      v-if="article.image"
      class="aspect-[16/9] w-full overflow-hidden bg-base-200"
    >
      <img
        :src="article.image"
        :alt="article.title || 'Article'"
        class="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
    <div class="flex flex-1 flex-col p-3">
      <p
        v-if="article.title"
        class="line-clamp-2 text-sm font-semibold leading-snug"
      >
        {{ article.title }}
      </p>
      <p
        v-if="article.description"
        class="mt-1 line-clamp-2 text-xs leading-relaxed text-base-content/55"
      >
        {{ article.description }}
      </p>
      <div
        class="mt-auto flex items-center gap-1.5 pt-2 text-[11px] text-base-content/45"
      >
        <IconLink class="h-3 w-3 shrink-0" />
        <span class="truncate">{{
          article.siteName || getHost(article.url)
        }}</span>
        <IconExternalLink class="ml-auto h-3 w-3 shrink-0 opacity-60" />
      </div>
      <p
        v-if="reasons.length > 0"
        class="mt-1.5 flex items-start gap-1 text-[11px] text-base-content/45"
      >
        <IconSparkles class="mt-0.5 h-3 w-3 shrink-0" />
        <span class="line-clamp-1">{{ reasons[0] }}</span>
      </p>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { DiscoveryItem, SnWebArticle } from "~/types/post";
import { IconLink, IconExternalLink, IconSparkles } from "#components";

const props = defineProps<{
  item: DiscoveryItem;
}>();

const article = computed(() => props.item.data as unknown as SnWebArticle);
const reasons = computed(() => props.item.reasons ?? []);

function getHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function openArticle() {
  window.open(article.value.url, "_blank", "noopener,noreferrer");
}
</script>
