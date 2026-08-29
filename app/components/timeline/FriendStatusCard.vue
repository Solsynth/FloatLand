<template>
  <div :class="rootClass">
    <div class="flex items-start gap-3" :class="bodyClass">
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
          :class="statusBgClass"
        >
          <component
            :is="statusIcon"
            class="h-4 w-4"
            :class="statusIconClass"
          />
        </div>

        <span
          class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-base-100"
          :class="statusBadgeClass"
        />
      </div>

      <div class="min-w-0 flex-1">
        <div v-if="account" class="mb-0.5 flex items-center gap-1.5 text-xs">
          <span class="truncate font-medium text-base-content/80">
            {{ accountDisplayName }}
          </span>
          <span class="text-base-content/30">·</span>
          <span class="shrink-0 text-base-content/40">
            {{ formatRelativeTime(createdAt) }}
          </span>
        </div>

        <div class="flex items-center gap-1.5">
          <span v-if="displaySymbol" class="text-base leading-none">{{
            displaySymbol
          }}</span>
          <span class="truncate text-sm font-medium">{{ displayLabel }}</span>
        </div>

        <p class="mt-0.5 truncate text-xs text-base-content/55">
          {{ statusTypeLabel }}
        </p>

        <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            class="rounded-md px-1.5 py-0.5 text-[11px] font-medium"
            :class="
              status.isOnline
                ? 'bg-success/15 text-success'
                : 'bg-base-200 text-base-content/60'
            "
          >
            {{ status.isOnline ? t("status.online") : t("status.offline") }}
          </span>
          <span
            v-if="status.isAutomated"
            class="rounded-box bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary"
          >
            {{ t("status.bot") }}
          </span>
          <span v-if="!account" class="text-xs text-base-content/40">
            {{ formatRelativeTime(createdAt) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SnAccountStatus, Account } from "~/types/post";
import { IconCircle, IconMoon, IconEyeOff } from "#components";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    status: SnAccountStatus;
    createdAt: string;
    variant?: "card" | "feed";
  }>(),
  { variant: "card" },
);

const isFeed = computed(() => props.variant === "feed");
const rootClass = computed(() =>
  isFeed.value
    ? "feed-post"
    : "card bg-base-100 shadow-sm",
);
const bodyClass = computed(() => (isFeed.value ? "px-4 py-3" : "card-body p-3"));

const account = computed<Account | null>(() => props.status.account ?? null);

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

const displayLabel = computed(() => {
  const label = props.status.label?.trim();
  if (label) return label;
  return statusTypeLabel.value;
});

const displaySymbol = computed(() => {
  const symbol = props.status.symbol?.trim();
  return symbol || null;
});

const statusTypeLabel = computed(() => {
  if (props.status.isIdleOrOnline) {
    return t("status.idle");
  }

  switch (props.status.type) {
    case 1:
      return t("status.busy");
    case 2:
      return t("status.doNotDisturb");
    case 3:
      return t("status.invisible");
    default:
      return props.status.isOnline ? t("status.online") : t("status.offline");
  }
});

const statusIcon = computed(() => {
  if (props.status.isIdleOrOnline) return IconMoon;

  switch (props.status.type) {
    case 1:
      return IconMoon;
    case 2:
      return IconCircle;
    case 3:
      return IconEyeOff;
    default:
      return IconCircle;
  }
});

const statusBgClass = computed(() => {
  if (props.status.isIdleOrOnline) return "bg-amber-500/15";

  switch (props.status.type) {
    case 1:
      return "bg-orange-500/15";
    case 2:
      return "bg-error/15";
    case 3:
      return "bg-base-300/60";
    default:
      return props.status.isOnline ? "bg-success/15" : "bg-base-300/60";
  }
});

const statusIconClass = computed(() => {
  if (props.status.isIdleOrOnline) return "text-amber-500";

  switch (props.status.type) {
    case 1:
      return "text-orange-500";
    case 2:
      return "text-error";
    case 3:
      return "text-base-content/50";
    default:
      return props.status.isOnline ? "text-success" : "text-base-content/50";
  }
});

const statusBadgeClass = computed(() => {
  if (props.status.isIdleOrOnline) return "bg-amber-500";

  switch (props.status.type) {
    case 1:
      return "bg-orange-500";
    case 2:
      return "bg-error";
    case 3:
      return "bg-base-300";
    default:
      return props.status.isOnline ? "bg-success" : "bg-base-300";
  }
});

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
</script>
