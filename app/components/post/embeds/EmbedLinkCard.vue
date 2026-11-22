<template>
  <a
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    class="lift block overflow-hidden rounded-card bg-base-300/60 text-left transition-colors hover:bg-base-300/80"
    :class="compact ? 'flex items-center' : 'w-full'"
    @click.stop
  >
    <!-- Compact layout (collapsed preview) -->
    <template v-if="compact">
      <div v-if="hasImage" class="h-15 w-15 shrink-0 overflow-hidden bg-base-200">
        <img
          :src="resolvedImageUrl!"
          :alt="title || 'Link preview'"
          class="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div class="min-w-0 flex-1 p-2.5">
        <div v-if="title" class="truncate text-sm font-semibold leading-snug">
          {{ title }}
        </div>
        <div class="mt-0.5 flex items-center gap-1.5 text-[11px] text-base-content/60">
          <img
            v-if="resolvedFaviconUrl"
            :src="resolvedFaviconUrl"
            alt=""
            class="h-3 w-3 shrink-0 rounded-xs object-cover"
            loading="lazy"
          />
          <IconLink v-else class="h-3 w-3 shrink-0" />
          <span class="truncate">{{ siteName || host }}</span>
        </div>
      </div>
    </template>

    <!-- Full layout -->
    <template v-else>
      <div
        v-if="hasImage"
        class="aspect-video w-full overflow-hidden bg-base-200"
      >
        <img
          :src="resolvedImageUrl!"
          :alt="title || 'Link preview'"
          class="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div class="space-y-1 p-3">
        <div class="flex items-center gap-2 text-xs text-base-content/60">
          <img
            v-if="resolvedFaviconUrl"
            :src="resolvedFaviconUrl"
            alt=""
            class="h-4 w-4 shrink-0 rounded object-cover"
            loading="lazy"
          />
          <IconLink v-else class="h-3.5 w-3.5 shrink-0" />
          <span class="min-w-0 flex-1 truncate">{{ siteName || host }}</span>
          <IconExternalLink class="h-3.5 w-3.5 shrink-0" />
        </div>
        <div v-if="title" class="line-clamp-2 text-sm font-semibold">
          {{ title }}
        </div>
        <div
          v-if="description"
          class="line-clamp-2 text-xs text-base-content/75"
        >
          {{ description }}
        </div>
      </div>
    </template>
  </a>
</template>

<script setup lang="ts">
import { IconExternalLink, IconLink } from "#components";

const props = withDefaults(
  defineProps<{
    embed: Record<string, unknown>;
    compact?: boolean;
  }>(),
  {
    compact: false,
  },
);

function getString(keys: string[]): string | null {
  for (const key of keys) {
    const val = props.embed[key];
    if (typeof val === "string" && val.trim() !== "") return val.trim();
  }
  return null;
}

function resolveAssetUrl(baseUrl: string, rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  if (rawUrl.startsWith("//")) return `https:${rawUrl}`;
  if (rawUrl.startsWith("/")) {
    try {
      const parsed = new URL(baseUrl);
      return `${parsed.protocol}//${parsed.host}${rawUrl}`;
    } catch {
      return rawUrl;
    }
  }
  return rawUrl;
}

const url = computed(() => getString(["url", "uri", "href"]) ?? "#");
const title = computed(() => getString(["title"]));
const description = computed(() => getString(["description"]));
const siteName = computed(() => getString(["siteName", "site_name"]));
const rawFavicon = computed(() => getString(["faviconUrl", "favicon_url"]));
const rawImage = computed(() => getString(["imageUrl", "image_url"]));

const resolvedFaviconUrl = computed(() => resolveAssetUrl(url.value, rawFavicon.value));
const resolvedImageUrl = computed(() => resolveAssetUrl(url.value, rawImage.value));

const hasImage = computed(
  () =>
    Boolean(resolvedImageUrl.value) &&
    resolvedImageUrl.value !== resolvedFaviconUrl.value,
);

const host = computed(() => {
  try {
    return new URL(url.value).host || url.value;
  } catch {
    return url.value;
  }
});
</script>
