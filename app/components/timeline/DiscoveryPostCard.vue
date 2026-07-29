<template>
  <div
    class="feed-discovery-card flex h-full flex-col overflow-hidden"
  >
    <div class="min-h-0 flex-1 overflow-hidden">
      <PostCard
        :post="post"
        variant="feed"
        :show-reference="false"
        @boost="$emit('boost', post)"
        @share="$emit('share', post)"
        @reply="$emit('reply', post)"
      />
    </div>
    <div
      v-if="reasons.length > 0"
      class="flex items-center gap-1 border-t border-base-200 px-3 py-1.5 text-[11px] text-base-content/45"
    >
      <IconSparkles class="h-3 w-3 shrink-0" />
      <span class="line-clamp-1">{{ reasons[0] }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DiscoveryItem, Post } from "~/types/post";
import { IconSparkles } from "#components";

const props = defineProps<{
  item: DiscoveryItem;
}>();

defineEmits<{
  boost: [post: Post];
  share: [post: Post];
  reply: [post: Post];
}>();

const post = computed(() => props.item.data as unknown as Post);
const reasons = computed(() => props.item.reasons ?? []);
</script>
