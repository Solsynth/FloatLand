<template>
  <NuxtLink
    to="/accounts/me/relationships"
    class="dash-card group block p-5 transition-colors hover:border-base-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
  >
    <div class="flex items-center justify-between">
      <h3 class="dash-card__title">
        <IconUsers class="h-4 w-4 text-base-content/45" />
        {{ t("dashboard.friends.title") }}
        <span
          v-if="friends.length"
          class="badge badge-ghost badge-xs font-medium text-base-content/70"
        >
          {{ friends.length }}
        </span>
      </h3>
      <span class="text-xs font-medium text-base-content/55 transition-colors group-hover:text-primary">
        {{ t("dashboard.viewAll") }}
      </span>
    </div>

    <div v-if="loading" class="flex justify-center py-6">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <div v-else-if="error" class="flex flex-col items-center gap-1 py-6 text-center">
      <IconUserX class="h-6 w-6 text-base-content/30" />
      <p class="text-xs text-base-content/50">{{ t("dashboard.friends.failed") }}</p>
    </div>

    <div v-else-if="displayFriends.length === 0" class="flex flex-col items-center gap-1 py-6 text-center">
      <IconUserPlus class="h-6 w-6 text-base-content/30" />
      <p class="text-xs text-base-content/50">{{ t("dashboard.friends.empty") }}</p>
    </div>

    <div v-else class="mt-2 -mx-2 flex flex-col">
      <div
        v-for="item in displayFriends"
        :key="item.account.id"
        class="flex items-center gap-3 rounded-box px-2 py-2 transition-colors hover:bg-base-200/70"
      >
        <span class="relative shrink-0">
          <img
            v-if="avatarUrl(item)"
            :src="avatarUrl(item)"
            alt=""
            class="h-9 w-9 rounded-full bg-base-200 object-cover"
          >
          <span
            v-else
            class="flex h-9 w-9 items-center justify-center rounded-full bg-base-200 text-xs font-bold text-base-content/40"
          >
            {{ initial(item) }}
          </span>
          <span
            class="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full ring-2 ring-base-100"
            :class="isOnline(item) ? 'bg-success' : 'bg-base-300'"
          />
        </span>
        <div class="min-w-0 flex-1">
          <AccountName :account="item.account" size="sm" class="text-sm" />
          <p v-if="statusLabel(item)" class="mt-0.5 truncate text-xs text-base-content/45">
            {{ statusLabel(item) }}
          </p>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { IconUsers, IconUserX, IconUserPlus } from "#components";
import type { FriendOverviewItem } from "~/utils/api";
import { fetchFriendsOverview } from "~/utils/api";
import { getFileUrl } from "~/utils/files";

const { t } = useI18n();
const auth = useAuth();
const { isAuthenticated } = auth;

const loading = ref(false);
const error = ref(false);
const friends = ref<FriendOverviewItem[]>([]);

// Mirrors the Solian dashboard: online friends first, else most-recently-seen.
const displayFriends = computed(() => {
  const online = friends.value.filter((item) => isOnline(item));
  const offline = friends.value
    .filter((item) => !isOnline(item))
    .sort((a, b) => {
      const at = a.account.profile?.lastSeenAt ?? a.status?.updatedAt ?? "";
      const bt = b.account.profile?.lastSeenAt ?? b.status?.updatedAt ?? "";
      return bt.localeCompare(at);
    });
  return (online.length > 0 ? online : offline).slice(0, 5);
});

function isOnline(item: FriendOverviewItem): boolean {
  const status = item.status;
  return !!status && status.isOnline && status.type !== 3; // 3 = invisible
}

function statusLabel(item: FriendOverviewItem): string {
  const status = item.status;
  if (!status) return t("dashboard.friends.offline");
  if (status.isOnline && status.isIdle) return t("dashboard.friends.idle");
  const custom = status.label?.trim();
  if (custom) return custom;
  switch (status.type) {
    case 1:
      return t("dashboard.friends.busy");
    case 2:
      return t("dashboard.friends.doNotDisturb");
    case 3:
      return t("dashboard.friends.invisible");
  }
  return status.isOnline ? t("dashboard.friends.online") : t("dashboard.friends.offline");
}

function avatarUrl(item: FriendOverviewItem): string {
  return getFileUrl(item.account.profile?.picture?.id) ?? "";
}

function initial(item: FriendOverviewItem): string {
  return (item.account.nick || item.account.name || "?").charAt(0).toUpperCase();
}

async function load() {
  if (!isAuthenticated.value) return;
  loading.value = true;
  error.value = false;
  try {
    friends.value = await fetchFriendsOverview();
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
});
</script>
