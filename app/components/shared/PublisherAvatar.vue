<template>
  <component :is="linked && publisher ? 'NuxtLink' : 'span'" :to="avatarLink" class="block shrink-0">
    <div v-if="avatarUrl" class="avatar">
      <div class="overflow-hidden rounded-full" :class="sizeClass">
        <FileImage
          :src="avatarUrl"
          :alt="displayName"
          class="h-full w-full rounded-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
    <div v-else class="avatar avatar-placeholder">
      <div
        class="flex items-center justify-center rounded-full bg-primary font-medium text-primary-content"
        :class="[sizeClass, initialSizeClass]"
      >
        <span>{{ getInitials(displayName) }}</span>
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import type { Post } from "~/types/post";
import { getAvatarUrl, getDisplayName, getInitials } from "~/utils/identity";

interface Props {
  publisher: Post["publisher"] | null | undefined;
  /** `sm` = 7×7 (reference rows), `md` = 10×10 (card headers) */
  size?: "sm" | "md";
  /** Render as a link to the publisher page when one exists */
  linked?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
  linked: false,
});

const sizeClass = computed(() =>
  props.size === "sm" ? "h-7 w-7" : "h-10 w-10",
);

const initialSizeClass = computed(() =>
  props.size === "sm" ? "text-[10px]" : "text-sm",
);

const displayName = computed(() => getDisplayName(props.publisher));
const avatarUrl = computed(() => getAvatarUrl(props.publisher));
const avatarLink = computed(() =>
  props.publisher ? `/publishers/${props.publisher.name}` : undefined,
);
</script>
