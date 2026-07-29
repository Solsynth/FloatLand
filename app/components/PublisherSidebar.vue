<template>
  <div class="flex w-full flex-col gap-4">
    <!-- Publisher Card -->
    <div v-if="publisher" class="card w-full overflow-hidden bg-base-100">
      <!-- Background Banner -->
      <div class="h-20 w-full bg-base-200">
        <img
          v-if="backgroundUrl"
          :src="backgroundUrl"
          :alt="`${displayName} background`"
          class="h-full w-full object-cover"
        />
      </div>

      <div class="card-body p-4">
        <!-- Avatar and Name -->
        <div class="flex items-center gap-3 -mt-8 mb-3">
          <NuxtLink :to="`/publishers/${publisher.name}`" class="shrink-0">
            <div v-if="avatarUrl" class="avatar">
              <div class="w-16 h-16 rounded-full ring-4 ring-base-100">
                <img :src="avatarUrl" :alt="displayName" />
              </div>
            </div>
            <div v-else class="avatar avatar-placeholder">
              <div
                class="w-16 h-16 rounded-box bg-primary text-primary-content flex items-center justify-center text-xl font-bold ring-4 ring-base-100"
              >
                {{ getInitials(displayName) }}
              </div>
            </div>
          </NuxtLink>
          <div class="min-w-0 flex-1 pt-6">
            <p class="font-bold text-lg truncate hover:underline">
              {{ displayName }}
            </p>
            <p class="text-sm text-base-content/60 truncate">
              @{{ publisher.name }}
            </p>
          </div>
        </div>

        <!-- Bio -->
        <!-- eslint-disable vue/no-v-html -->
        <div
          v-if="bioHtml"
          class="prose prose-sm max-w-none break-words line-clamp-4 prose-headings:mb-2 prose-headings:mt-4 prose-p:my-1 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:break-all prose-code:text-primary prose-code:bg-base-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:italic mb-3"
          v-html="bioHtml"
        />
        <!-- eslint-enable vue/no-v-html -->

        <!-- Verification Badge -->
        <div
          v-if="publisher.verification"
          class="flex items-center gap-2 p-2 rounded-box bg-primary/10 text-primary text-sm"
        >
          <IconShieldCheck class="w-4 h-4" />
          <span class="font-medium">{{ publisher.verification.title }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 mt-3">
          <NuxtLink
            :to="`/publishers/${publisher.name}`"
            class="btn btn-primary btn-sm flex-1"
          >
            View Profile
          </NuxtLink>
          <button
            class="btn btn-outline btn-sm btn-square"
            @click="sharePublisher"
          >
            <IconShare2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Publisher } from "~/types/post";
import { getFileUrl } from "~/utils/files";
import { renderMarkdown } from "~/utils/markdown";

const props = defineProps<{
  publisher: Publisher | null;
}>();

const displayName = computed(
  () => props.publisher?.nick || props.publisher?.name || "Unknown",
);
const avatarUrl = computed(() => getFileUrl(props.publisher?.picture?.id));
const backgroundUrl = computed(() =>
  getFileUrl(props.publisher?.background?.id),
);
const bioHtml = computed(() => {
  if (!props.publisher?.bio) return "";
  return renderMarkdown(props.publisher.bio);
});

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "?"
  );
}

async function sharePublisher() {
  if (props.publisher?.name) {
    const url = `${window.location.origin}/${props.publisher.name}`;
    if (navigator.share) {
      await navigator.share({
        title: displayName.value,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }
}
</script>
