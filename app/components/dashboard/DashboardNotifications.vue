<template>
  <div class="dash-card p-5">
    <div class="flex items-center justify-between">
      <h3 class="dash-card__title">
        <IconBell class="h-4 w-4 text-base-content/45" />
        {{ t("dashboard.notifications.title") }}
        <span
          v-if="unreadCount > 0"
          class="badge badge-error badge-xs text-[10px]"
        >
          {{ unreadCount > 99 ? "99+" : unreadCount }}
        </span>
      </h3>
      <NuxtLink
        to="/accounts/me/notifications"
        class="text-xs font-medium text-base-content/55 transition-colors hover:text-primary"
      >
        {{ t("dashboard.viewAll") }}
      </NuxtLink>
    </div>

    <div v-if="isLoading && notifications.length === 0" class="flex justify-center py-6">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <div
      v-else-if="notifications.length === 0"
      class="flex flex-col items-center gap-1 py-6 text-center"
    >
      <IconBellOff class="h-6 w-6 text-base-content/30" />
      <p class="text-xs text-base-content/50">{{ t("dashboard.notifications.empty") }}</p>
    </div>

    <div v-else class="mt-2 -mx-2 flex flex-col">
      <NotificationItem
        v-for="notification in visibleNotifications"
        :key="notification.id"
        :notification="notification"
        @click="handleItemClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconBell, IconBellOff } from "#components";
import type { SnNotification } from "~/types/notification";

const { t } = useI18n();
const auth = useAuth();
const { isAuthenticated } = auth;
const { notifications, unreadCount, isLoading, refresh, markRead } = useNotifications();

const visibleNotifications = computed(() => notifications.value.slice(0, 5));

async function handleItemClick(notification: SnNotification) {
  if (!notification.viewedAt) {
    await markRead(notification.id);
  }
}

onMounted(() => {
  if (isAuthenticated.value && notifications.value.length === 0) {
    void refresh();
  }
});
</script>
