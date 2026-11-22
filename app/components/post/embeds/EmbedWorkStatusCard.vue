<template>
  <div class="overflow-hidden rounded-card bg-base-300/60 p-3.5" @click.stop>
    <div class="flex items-start gap-3">
      <!-- Cover artwork -->
      <div
        class="flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-base-200"
        :class="domain === 'music' ? 'h-13 w-13' : 'h-19 w-13'"
      >
        <img
          v-if="artworkUrl"
          :src="artworkUrl"
          :alt="title"
          class="h-full w-full object-cover"
          loading="lazy"
        />
        <component :is="domainIcon" v-else class="h-5 w-5 text-base-content/50" />
      </div>

      <!-- Details -->
      <div class="min-w-0 flex-1 space-y-1">
        <div class="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
          <component :is="domainIcon" class="h-3.5 w-3.5 shrink-0" />
          <span class="truncate">{{ t("post.embed.workStatus") }}</span>
        </div>

        <div class="line-clamp-2 text-sm font-semibold leading-snug">
          {{ title }}
        </div>

        <div
          v-if="metaLine"
          class="truncate text-xs text-base-content/65"
        >
          {{ metaLine }}
        </div>

        <div
          v-if="status || rating !== null || progress !== null"
          class="flex flex-wrap items-center gap-1.5 pt-1"
        >
          <span
            v-if="status"
            class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            :class="statusColorClass"
          >
            {{ statusLabel }}
          </span>
          <span
            v-if="rating !== null"
            class="inline-flex items-center gap-1 rounded-full bg-base-200 px-2 py-0.5 text-[11px] font-semibold"
          >
            <IconStar class="h-3 w-3 text-primary" />
            {{ rating }}/10
          </span>
          <span
            v-if="progress !== null"
            class="rounded-full bg-base-200 px-2 py-0.5 text-[11px]"
          >
            {{ volumeProgress !== null ? `${volumeProgress} vol · ${progress}` : progress }}
          </span>
        </div>
      </div>
    </div>

    <!-- Note preview -->
    <button
      v-if="note"
      type="button"
      class="mt-2.5 block w-full rounded-lg bg-base-200/80 p-2.5 text-left text-xs leading-relaxed text-base-content/85 transition-colors hover:bg-base-200"
      @click="noteDialogOpen = true"
    >
      <p class="line-clamp-3">{{ note }}</p>
    </button>

    <!-- Full note modal -->
    <DialogRoot v-if="note" v-model:open="noteDialogOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-[100] bg-black/40" />
        <DialogContent
          class="fixed top-1/2 left-1/2 z-[101] max-h-[85vh] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-box bg-base-100 p-6 shadow-lg"
        >
          <DialogTitle class="text-base font-semibold">
            {{ t("post.embed.workStatusNote") }} — {{ title }}
          </DialogTitle>
          <p class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-base-content/85">
            {{ note }}
          </p>
          <div class="mt-4 flex justify-end">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              @click="noteDialogOpen = false"
            >
              {{ t("common.close") }}
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import {
  IconBookOpen,
  IconDisc,
  IconFilm,
  IconGamepad2,
  IconMusic,
  IconStar,
  IconTv,
} from "#components";

const props = defineProps<{
  embed: Record<string, unknown>;
}>();

const { t } = useI18n();
const noteDialogOpen = ref(false);

function getString(keys: string[]): string | null {
  for (const key of keys) {
    const val = props.embed[key];
    if (typeof val === "string" && val.trim() !== "") return val.trim();
  }
  return null;
}

function getInt(keys: string[]): number | null {
  for (const key of keys) {
    const val = props.embed[key];
    if (typeof val === "number" && Number.isFinite(val)) return Math.trunc(val);
    if (typeof val === "string" && val.trim() !== "") {
      const parsed = Number.parseInt(val, 10);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

const domain = computed(() => getString(["domain"]));
const title = computed(() => getString(["title"]) ?? "Unknown");
const subtitle = computed(() => getString(["subtitle"]));
const collectionName = computed(() => getString(["collectionName", "collection_name"]));
const status = computed(() => getString(["status"]));
const rating = computed(() => getInt(["rating"]));
const progress = computed(() => getInt(["progress"]));
const volumeProgress = computed(() => getInt(["volumeProgress", "volume_progress"]));
const note = computed(() => getString(["note"]));

const artworkUrl = computed(() => {
  const rawList = props.embed.artworkUrls ?? props.embed.artwork_urls;
  if (Array.isArray(rawList)) {
    const first = rawList.find(
      (item): item is string => typeof item === "string" && item.trim() !== "",
    );
    if (first) return first.trim();
  }
  return getString(["artwork"]);
});

const metaLine = computed(() =>
  [collectionName.value, subtitle.value].filter(Boolean).join(" · "),
);

const domainIcon = computed(() => {
  switch (domain.value) {
    case "music":
      return IconMusic;
    case "gaming":
      return IconGamepad2;
    case "video":
      return IconFilm;
    case "anime":
      return IconTv;
    case "book":
      return IconBookOpen;
    default:
      return IconDisc;
  }
});

const statusLabel = computed(() => {
  switch (status.value) {
    case "watching":
      return t("post.embed.statusWatching");
    case "plan_to_watch":
      return t("post.embed.statusPlanToWatch");
    case "completed":
      return t("post.embed.statusCompleted");
    case "on_hold":
      return t("post.embed.statusOnHold");
    case "dropped":
      return t("post.embed.statusDropped");
    default:
      return status.value ?? "";
  }
});

const statusColorClass = computed(() => {
  switch (status.value) {
    case "watching":
      return "bg-primary/15 text-primary";
    case "plan_to_watch":
      return "bg-secondary/15 text-secondary";
    case "completed":
      return "bg-success/15 text-success";
    case "on_hold":
      return "bg-warning/15 text-warning";
    case "dropped":
      return "bg-error/15 text-error";
    default:
      return "bg-base-200 text-base-content/70";
  }
});
</script>
