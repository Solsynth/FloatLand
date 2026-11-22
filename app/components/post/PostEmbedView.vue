<template>
  <div
    class="overflow-hidden rounded-card bg-base-300/60"
    :style="{ maxHeight: `${maxHeight}px` }"
    @click.stop
  >
    <!-- Header -->
    <div class="flex items-center gap-2 bg-base-300/80 px-3 py-2">
      <IconGlobe
        v-if="embedView.renderer === 0"
        class="h-4 w-4 shrink-0 text-primary"
      />
      <IconAppWindow v-else class="h-4 w-4 shrink-0 text-primary" />
      <span class="min-w-0 flex-1 truncate text-xs text-base-content/70">
        {{ displayUri }}
      </span>
      <a
        :href="embedView.uri"
        target="_blank"
        rel="noopener noreferrer"
        class="text-base-content/60 transition-colors hover:text-base-content"
        :title="t('post.embed.openExternal')"
        @click.stop
      >
        <IconExternalLink class="h-4 w-4" />
      </a>
    </div>

    <!-- Lazy-loaded iframe body -->
    <div
      class="relative w-full bg-base-200/50"
      :style="{
        aspectRatio: String(safeAspectRatio),
        maxHeight: `${Math.max(120, maxHeight - 36)}px`,
      }"
    >
      <template v-if="shouldLoad">
        <iframe
          :src="embedView.uri"
          class="h-full w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
          loading="lazy"
          referrerpolicy="no-referrer"
          @load="isLoading = false"
          @error="isLoading = false"
        />
        <div
          v-if="isLoading"
          class="pointer-events-none absolute inset-0 flex items-center justify-center bg-base-200/80"
        >
          <IconLoader class="h-6 w-6 animate-spin text-primary" />
        </div>
      </template>

      <button
        v-else
        type="button"
        class="flex h-full w-full flex-col items-center justify-center gap-2 text-base-content/60 transition-colors hover:bg-base-200/80 hover:text-base-content"
        @click="startLoad"
      >
        <IconPlay class="h-10 w-10 fill-current opacity-70" />
        <span class="text-xs font-medium">{{ t("post.embed.loadViewHint") }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostEmbedView } from "~/types/post";
import {
  IconAppWindow,
  IconExternalLink,
  IconGlobe,
  IconLoader,
  IconPlay,
} from "#components";

const props = withDefaults(
  defineProps<{
    embedView: PostEmbedView;
    maxHeight?: number;
  }>(),
  {
    maxHeight: 400,
  },
);

const { t } = useI18n();

const shouldLoad = ref(false);
const isLoading = ref(false);

const safeAspectRatio = computed(() => {
  const ratio = props.embedView.aspectRatio;
  if (typeof ratio === "number" && Number.isFinite(ratio) && ratio > 0) {
    return ratio;
  }
  return 16 / 9;
});

const displayUri = computed(() => {
  try {
    const parsed = new URL(props.embedView.uri);
    return parsed.host || props.embedView.uri;
  } catch {
    return props.embedView.uri;
  }
});

function startLoad() {
  shouldLoad.value = true;
  isLoading.value = true;
}
</script>
