<template>
  <NuxtLink
    :to="`/publishers/${publisher.name}`"
    class="feed-discovery-card relative block aspect-[16/7] w-full overflow-hidden"
  >
    <!-- Cover background -->
    <FileImage
      v-if="publisherBackground"
      :file="publisherBackground"
      :alt="publisher.nick || publisher.name"
      class="absolute inset-0 h-full w-full object-cover"
    />
    <div
      v-else
      class="absolute inset-0 bg-gradient-to-br from-base-300 to-base-200"
    />

    <!-- Bottom gradient overlay -->
    <div
      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2"
    >
      <div class="flex items-start gap-2">
        <!-- Avatar (24px, mirrored Flutter ProfilePictureWidget radius 12) -->
        <div
          v-if="publisherPicture"
          class="h-6 w-6 shrink-0 overflow-hidden rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        >
          <FileImage
            :file="publisherPicture"
            :alt="publisher.nick || publisher.name"
            class="h-full w-full rounded-full object-cover"
          />
        </div>
        <div
          v-else
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        >
          <span class="text-[10px] font-medium">{{
            getInitials(publisher.nick || publisher.name)
          }}</span>
        </div>
        <p class="min-w-0 truncate text-sm font-bold leading-tight text-white">
          {{ publisher.nick || publisher.name }}
        </p>
      </div>
    </div>

    <!-- Feedback (more/less like this, not interested) -->
    <div class="absolute right-2 top-2">
      <DiscoveryFeedback kind="publisher" :reference-id="publisher.id" />
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { DiscoveryItem } from "~/types/post";
import { getInitials } from "~/utils/identity";
import DiscoveryFeedback from "~/components/timeline/DiscoveryFeedback.vue";

const props = defineProps<{
  item: DiscoveryItem;
}>();

const publisher = computed(() => {
  const data = props.item.data as unknown as {
    id: string;
    name: string;
    nick?: string;
    picture?: { id: string };
    background?: { id: string };
  };
  return data;
});

const publisherPicture = computed(() => publisher.value.picture ?? undefined);
const publisherBackground = computed(() => publisher.value.background ?? undefined);
</script>
