<template>
  <div :class="rootClass">
    <!-- Steam hero -->
    <div v-if="isSteam && steamGameId" class="relative h-24 w-full">
      <img
        :src="steamHeroUrl"
        class="h-full w-full object-cover"
        alt=""
        loading="lazy"
        @error="handleSteamImageError"
      />
      <div class="absolute inset-0 bg-base-100/35" />
    </div>

    <div class="flex gap-3" :class="bodyClass">
      <!-- Avatar + activity badge -->
      <div class="relative shrink-0 self-start">
        <div v-if="account" class="avatar">
          <div class="h-9 w-9 rounded-full">
            <FileImage
              v-if="accountAvatar"
              :file="accountAvatar"
              :alt="accountName"
              class="h-full w-full rounded-full object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center rounded-full bg-primary"
            >
              <span class="text-xs font-medium text-primary-content">{{
                accountInitials
              }}</span>
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex h-9 w-9 items-center justify-center rounded-full"
          :class="activityBgClass"
        >
          <component
            :is="activityIcon"
            class="h-4 w-4"
            :class="activityIconClass"
          />
        </div>

        <span
          class="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-base-100"
          :class="activityBadgeClass"
        >
          <component :is="activityIcon" class="h-2.5 w-2.5 text-white" />
        </span>
      </div>

      <!-- Artwork -->
      <img
        v-if="hasArtwork && !isSteam"
        :src="artworkUrl"
        class="h-11 w-11 shrink-0 rounded-md object-cover"
        alt=""
        loading="lazy"
      />

      <div class="min-w-0 flex-1">
        <div v-if="account" class="mb-0.5 flex items-center gap-1.5 text-xs">
          <span class="truncate font-medium text-base-content/80">
            {{ accountDisplayName }}
          </span>
          <span class="text-base-content/30">·</span>
          <span class="shrink-0 text-base-content/40">
            {{ formatRelativeTime(activity.createdAt) }}
          </span>
        </div>

        <div class="flex items-center gap-1.5">
          <span class="truncate text-sm font-medium">
            {{ activity.title || t("presence.unknown") }}
          </span>
          <a
            v-if="activity.titleUrl"
            :href="activity.titleUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 text-base-content/40 hover:text-base-content/70"
            @click.stop
          >
            <IconExternalLink class="h-3 w-3" />
          </a>
        </div>

        <div v-if="activity.subtitle" class="mt-0.5 flex items-center gap-1">
          <span class="truncate text-xs text-base-content/55">
            {{ activity.subtitle }}
          </span>
          <a
            v-if="activity.subtitleUrl"
            :href="activity.subtitleUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 text-base-content/40 hover:text-base-content/70"
            @click.stop
          >
            <IconExternalLink class="h-3 w-3" />
          </a>
        </div>

        <p
          v-if="activity.caption"
          class="mt-0.5 truncate text-xs italic text-base-content/45"
        >
          {{ activity.caption }}
        </p>

        <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            class="rounded-md bg-base-200 px-1.5 py-0.5 text-[11px] font-medium text-base-content/70"
          >
            {{ activityTypeLabel }}
          </span>
          <span
            v-if="isActive"
            class="rounded-md bg-primary/12 px-1.5 py-0.5 text-[11px] font-medium text-primary"
          >
            {{ t("presence.ongoing") }}
          </span>
          <span v-if="!account" class="text-xs text-base-content/40">
            {{ formatRelativeTime(activity.createdAt) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SnPresenceActivity, Account } from "~/types/post";
import { API_BASE_URL } from "~/utils/api";
import {
  IconGamepad,
  IconMusic,
  IconHeart,
  IconActivity,
  IconExternalLink,
} from "#components";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    activity: SnPresenceActivity;
    rawData?: Record<string, unknown>;
    variant?: "card" | "feed";
  }>(),
  { variant: "card" },
);

const isFeed = computed(() => props.variant === "feed");
const rootClass = computed(() =>
  isFeed.value
    ? "feed-post overflow-hidden"
    : "card overflow-hidden bg-base-100 shadow-sm",
);
const bodyClass = computed(() => (isFeed.value ? "px-4 py-3" : "card-body p-3"));

const isSteam = computed(() => {
  const provider = props.rawData?.provider ?? props.activity.meta?.provider;
  return provider === "steam";
});

const isActive = computed(() => {
  if (props.rawData?.is_active !== undefined) {
    return props.rawData.is_active as boolean;
  }
  return (
    !props.activity.deletedAt &&
    new Date(props.activity.leaseExpiresAt) > new Date()
  );
});

const steamGameId = computed(() => {
  if (!isSteam.value || !props.activity.meta) return null;
  const gameId = props.activity.meta.game_id;
  return gameId ? String(gameId).replace(/"/g, "") : null;
});

const steamHeroUrl = computed(() => {
  if (!steamGameId.value) return "";
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamGameId.value}/library_hero.jpg`;
});

const hasArtwork = computed(
  () => !!(props.activity.largeImage || props.activity.smallImage),
);

const artworkUrl = computed(() => {
  const url = props.activity.largeImage || props.activity.smallImage;
  if (!url) return "";
  return resolveImageUrl(url);
});

const account = computed<Account | null>(() => props.activity.account ?? null);

const accountName = computed(
  () => account.value?.nick || account.value?.name || "",
);

const accountDisplayName = computed(() => {
  if (!account.value) return "";
  const nick = account.value.nick;
  const name = account.value.name;
  return nick ? `${nick} (@${name})` : `@${name}`;
});

const accountAvatar = computed(() => {
  return account.value?.profile?.picture ?? null;
});

const accountInitials = computed(() => {
  const name = account.value?.name || "?";
  return name.slice(0, 2).toUpperCase();
});

const activityIcon = computed(() => {
  switch (props.activity.type) {
    case 1:
      return IconGamepad;
    case 2:
      return IconMusic;
    case 3:
      return IconActivity;
    default:
      return IconHeart;
  }
});

const activityBgClass = computed(() => {
  switch (props.activity.type) {
    case 1:
      return "bg-purple-500/15";
    case 2:
      return "bg-green-500/15";
    case 3:
      return "bg-orange-500/15";
    default:
      return "bg-primary/15";
  }
});

const activityIconClass = computed(() => {
  switch (props.activity.type) {
    case 1:
      return "text-purple-500";
    case 2:
      return "text-green-500";
    case 3:
      return "text-orange-500";
    default:
      return "text-primary";
  }
});

const activityBadgeClass = computed(() => {
  switch (props.activity.type) {
    case 1:
      return "bg-purple-500";
    case 2:
      return "bg-green-500";
    case 3:
      return "bg-orange-500";
    default:
      return "bg-primary";
  }
});

const activityTypeLabel = computed(() => {
  switch (props.activity.type) {
    case 1:
      return t("presence.gaming");
    case 2:
      return t("presence.music");
    case 3:
      return t("presence.workout");
    default:
      return t("presence.activity");
  }
});

function resolveImageUrl(url: string): string {
  if (url.startsWith("sha256:")) {
    return `${API_BASE_URL}/passport/presence/artworks/${url}`;
  }
  return url;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return t("time.justNow");
  if (minutes < 60) return t("time.minutesAgo", { count: minutes });
  if (hours < 24) return t("time.hoursAgo", { count: hours });
  if (days < 7) return t("time.daysAgo", { count: days });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function handleSteamImageError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.display = "none";
}
</script>
