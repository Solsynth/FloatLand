<template>
  <div class="feed-discovery-card relative flex h-full flex-col overflow-hidden">
    <div class="relative min-h-0 flex-1 overflow-hidden">
      <PostCard
        :post="post"
        variant="feed"
        :show-reference="false"
        @boost="$emit('boost', post)"
        @share="$emit('share', post)"
        @reply="$emit('reply', post)"
      />

      <!-- Rank badges (mirrored Flutter discoveryTopPick / discoveryNotRecommended) -->
      <div
        class="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1"
      >
        <span
          v-if="rank === 'highest'"
          class="rounded bg-primary/90 px-1.5 py-0.5 text-[11px] font-medium text-primary-content backdrop-blur"
        >
          {{ t("home.discovery.topPick") }}
        </span>
        <span
          v-else-if="rank === 'lowest'"
          class="rounded bg-error/90 px-1.5 py-0.5 text-[11px] font-medium text-error-content backdrop-blur"
        >
          {{ t("home.discovery.notRecommended") }}
        </span>
      </div>

      <!-- Feedback (more/less like this) -->
      <div class="absolute bottom-2 right-2">
        <DiscoveryFeedback
          kind="post"
          :reference-id="post.id"
          :show-not-interested="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DiscoveryItem, Post } from "~/types/post";
import DiscoveryFeedback from "~/components/timeline/DiscoveryFeedback.vue";

defineEmits<{
  boost: [post: Post];
  share: [post: Post];
  reply: [post: Post];
}>();

const props = defineProps<{
  item: DiscoveryItem;
}>();

const { t } = useI18n();

const post = computed(() => props.item.data as unknown as Post);
const rank = computed(() => props.item.rank ?? undefined);
</script>
