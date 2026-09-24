<template>
  <NuxtLink
    :to="`/realms/${realm.slug}`"
    class="feed-discovery-card relative block aspect-[16/7] w-full overflow-hidden"
  >
    <!-- Cover background -->
    <FileImage
      v-if="realmBackground"
      :file="realmBackground"
      :alt="realm.name"
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
          v-if="realmPicture"
          class="h-6 w-6 shrink-0 overflow-hidden rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        >
          <FileImage
            :file="realmPicture"
            :alt="realm.name"
            class="h-full w-full rounded-full object-cover"
          />
        </div>
        <div
          v-else
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        >
          <IconGlobe class="h-3.5 w-3.5" />
        </div>
        <p class="min-w-0 truncate text-sm font-bold leading-tight text-white">
          {{ realm.name }}
        </p>
      </div>
    </div>

    <!-- Feedback (more/less like this, not interested) -->
    <div class="absolute right-2 top-2">
      <DiscoveryFeedback kind="realm" :reference-id="realm.id" />
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { DiscoveryItem } from "~/types/post";
import { IconGlobe } from "#components";
import DiscoveryFeedback from "~/components/timeline/DiscoveryFeedback.vue";

const props = defineProps<{
  item: DiscoveryItem;
}>();

const realm = computed(() => {
  const data = props.item.data as unknown as {
    id: string;
    name: string;
    slug: string;
    picture?: { id: string };
    background?: { id: string };
  };
  return data;
});

const realmPicture = computed(() => realm.value.picture ?? undefined);
const realmBackground = computed(() => realm.value.background ?? undefined);
</script>
