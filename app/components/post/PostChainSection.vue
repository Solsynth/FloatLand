<template>
  <div v-if="posts.length > 0" class="space-y-1 py-1">
    <NuxtLink
      v-for="(item, idx) in posts"
      :key="item.id"
      :to="`/posts/${item.id}`"
      class="group flex items-start gap-3 rounded-lg px-1 py-1.5 transition-colors hover:bg-base-200/60"
    >
      <div class="flex w-9 shrink-0 flex-col items-center self-stretch">
        <PublisherAvatar :publisher="item.publisher" size="sm" linked />
        <div
          v-if="idx < posts.length - 1"
          class="mt-1 w-px flex-1 bg-base-300/80"
        />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="min-w-0 truncate text-sm font-semibold">
            {{ item.publisher?.nick || item.publisher?.name }}
          </span>
          <span class="shrink-0 text-xs text-base-content/40">
            {{ formatRelative(item.publishedAt) }}
          </span>
        </div>
        <p
          class="line-clamp-2 text-xs leading-relaxed text-base-content/65 group-hover:text-base-content/80"
        >
          {{ item.content }}
        </p>
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { Post } from "~/types/post";

defineProps<{
  posts: Post[];
}>();

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
</script>
