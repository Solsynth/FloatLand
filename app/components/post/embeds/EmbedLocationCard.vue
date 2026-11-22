<template>
  <div class="overflow-hidden rounded-card bg-base-300/60" @click.stop>
    <div class="flex items-start gap-3 p-4">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
      >
        <IconMapPin class="h-5 w-5" />
      </div>
      <div class="min-w-0 flex-1 space-y-1">
        <div class="text-sm font-semibold">
          {{ name || t("post.embed.location") }}
        </div>
        <p v-if="address" class="text-xs text-base-content/75">
          {{ address }}
        </p>
        <div v-if="coords" class="font-mono text-[11px] text-base-content/55">
          {{ coords.lat.toFixed(4) }}, {{ coords.lon.toFixed(4) }}
        </div>
      </div>
      <a
        v-if="mapUrl"
        :href="mapUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-ghost btn-xs shrink-0 gap-1"
        :title="t('post.embed.openInMaps')"
        @click.stop
      >
        <IconExternalLink class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">{{ t("post.embed.openInMaps") }}</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconExternalLink, IconMapPin } from "#components";

const props = defineProps<{
  name?: string | null;
  address?: string | null;
  wkt?: string | null;
}>();

const { t } = useI18n();

const coords = computed(() => {
  if (!props.wkt) return null;
  const match = /POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i.exec(props.wkt);
  if (!match) return null;
  const lon = Number(match[1]);
  const lat = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
});

const mapUrl = computed(() => {
  if (coords.value) {
    return `https://www.openstreetmap.org/?mlat=${coords.value.lat}&mlon=${coords.value.lon}#map=15/${coords.value.lat}/${coords.value.lon}`;
  }
  const query = [props.name, props.address].filter(Boolean).join(" ").trim();
  if (!query) return null;
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
});
</script>
