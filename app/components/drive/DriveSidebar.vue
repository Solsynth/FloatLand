<template>
  <aside class="flex h-full flex-col bg-base-100">

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none">
      <!-- Files -->
      <div class="space-y-0.5">
        <p class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-base-content/30">
          {{ t("drive.files") }}
        </p>
        <NuxtLink
          to="/drive"
          class="group flex items-center gap-3 rounded-box px-3 py-2.5 text-sm font-medium transition-colors"
          :class="isRootActive
            ? 'bg-primary/10 text-primary shadow-sm'
            : 'text-base-content/70 hover:bg-base-200/80 hover:text-base-content'"
        >
          <IconFolder
            class="w-5 h-5 shrink-0 transition-all"
            :class="isRootActive ? 'text-primary' : 'text-base-content/40 group-hover:text-base-content/70'"
          />
          <span>{{ t("drive.myFiles") }}</span>
        </NuxtLink>
        <NuxtLink
          to="/drive/recent"
          class="group flex items-center gap-3 rounded-box px-3 py-2.5 text-sm font-medium transition-colors"
          :class="isRecentActive
            ? 'bg-primary/10 text-primary shadow-sm'
            : 'text-base-content/70 hover:bg-base-200/80 hover:text-base-content'"
        >
          <IconClock
            class="w-5 h-5 shrink-0 transition-all"
            :class="isRecentActive ? 'text-primary' : 'text-base-content/40 group-hover:text-base-content/70'"
          />
          <span>{{ t("drive.recentAttachments") }}</span>
        </NuxtLink>
      </div>

      <!-- Management -->
      <div class="space-y-0.5">
        <p class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-base-content/30">
          {{ t("drive.management") }}
        </p>
        <NuxtLink
          to="/drive/trash"
          class="group flex items-center gap-3 rounded-box px-3 py-2.5 text-sm font-medium transition-colors"
          :class="isTrashActive
            ? 'bg-primary/10 text-primary shadow-sm'
            : 'text-base-content/70 hover:bg-base-200/80 hover:text-base-content'"
        >
          <IconTrash2
            class="w-5 h-5 shrink-0 transition-all"
            :class="isTrashActive ? 'text-primary' : 'text-base-content/40 group-hover:text-base-content/70'"
          />
          <span>{{ t("drive.trash") }}</span>
        </NuxtLink>
      </div>

      <!-- Storage -->
      <div class="space-y-0.5">
        <p class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-base-content/30">
          {{ t("drive.storageManagement") }}
        </p>
        <NuxtLink
          to="/drive/pools"
          class="group flex items-center gap-3 rounded-box px-3 py-2.5 text-sm font-medium transition-colors"
          :class="isPoolsActive
            ? 'bg-primary/10 text-primary shadow-sm'
            : 'text-base-content/70 hover:bg-base-200/80 hover:text-base-content'"
        >
          <IconDatabase
            class="w-5 h-5 shrink-0 transition-all"
            :class="isPoolsActive ? 'text-primary' : 'text-base-content/40 group-hover:text-base-content/70'"
          />
          <span>{{ t("drive.pools") }}</span>
        </NuxtLink>
        <NuxtLink
          to="/drive/nodes"
          class="group flex items-center gap-3 rounded-box px-3 py-2.5 text-sm font-medium transition-colors"
          :class="isNodesActive
            ? 'bg-primary/10 text-primary shadow-sm'
            : 'text-base-content/70 hover:bg-base-200/80 hover:text-base-content'"
        >
          <IconServer
            class="w-5 h-5 shrink-0 transition-all"
            :class="isNodesActive ? 'text-primary' : 'text-base-content/40 group-hover:text-base-content/70'"
          />
          <span>{{ t("drive.nodes") }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Storage Bar -->
    <div class="mt-2">
      <StorageBar :usage="usage" @details="$emit('storageDetails')" />
    </div>

    <!-- User Profile -->
    <div class="px-3 pb-4 pt-2">
      <div v-if="isAuthenticated && user" class="dropdown dropdown-end dropdown-top w-full">
        <button
          class="flex w-full items-center gap-3 rounded-box px-3 py-2.5 transition-colors hover:bg-base-200/80"
        >
          <div v-if="avatarUrl" class="avatar">
            <div class="w-8 rounded-full">
              <img :src="avatarUrl ?? ''" :alt="displayName || 'User'" />
            </div>
          </div>
          <div v-else class="avatar avatar-placeholder">
            <div class="w-8 rounded-full bg-primary/10 text-primary">
              <span class="text-xs font-bold">{{ fallbackInitials }}</span>
            </div>
          </div>
          <div class="min-w-0 flex-1 text-left">
            <div class="truncate text-sm font-semibold">{{ displayName }}</div>
            <div class="truncate text-[11px] text-base-content/40">@{{ username }}</div>
          </div>
          <IconChevronUp class="w-3.5 h-3.5 shrink-0 text-base-content/30" />
        </button>
        <ul class="dropdown-content menu mb-2 w-full min-w-[200px] rounded-box bg-base-200 p-2 shadow-sm">
          <li>
            <NuxtLink to="/accounts/me" class="flex items-center gap-3">
              <IconUser class="w-4 h-4" />
              {{ t("nav.account") }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/accounts/me/settings" class="flex items-center gap-3">
              <IconSettings class="w-4 h-4" />
              {{ t("nav.settings") }}
            </NuxtLink>
          </li>
          <li>
            <button @click="handleLogout" class="flex items-center gap-3 text-error">
              <IconLogOut class="w-4 h-4" />
              {{ t("nav.logout") }}
            </button>
          </li>
        </ul>
      </div>
      <NuxtLink
        v-else
        to="/auth/login"
        class="flex items-center gap-3 rounded-box px-3 py-2.5 transition-colors hover:bg-base-200/80"
      >
        <div class="avatar avatar-placeholder">
          <div class="w-8 rounded-full bg-base-300 text-base-content/60">
            <IconLogIn class="w-4 h-4" />
          </div>
        </div>
        <div class="text-left">
          <div class="text-sm font-semibold">{{ t("nav.signIn") }}</div>
          <div class="text-[11px] text-base-content/40">{{ t("nav.joinCommunity") }}</div>
        </div>
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { getFileUrl } from "~/utils/files";
import {
  IconFolder,
  IconClock,
  IconTrash2,
  IconChevronUp,
  IconLogOut,
  IconLogIn,
  IconUser,
  IconSettings,
  IconDatabase,
  IconServer,
} from "#components";
import type { DriveUsage } from "~/types/drive";
const { t } = useI18n();
const route = useRoute();
const { isAuthenticated, user, displayName: authDisplayName, logout } = useAuth();

defineProps<{
  usage: DriveUsage | null;
}>();

defineEmits<{
  storageDetails: [];
}>();

// Active route detection
const isRootActive = computed(() => {
  return route.path === "/drive" || (route.path.startsWith("/drive") && !route.path.split("/")[2]);
});

const isRecentActive = computed(() => route.path.startsWith("/drive/recent"));
const isTrashActive = computed(() => route.path.startsWith("/drive/trash"));
const isPoolsActive = computed(() => route.path.startsWith("/drive/pools"));
const isNodesActive = computed(() => route.path.startsWith("/drive/nodes"));

const displayName = computed(() => authDisplayName.value || user.value?.nick || user.value?.name || "");
const username = computed(() => user.value?.name || "");
const avatarUrl = computed(() => getFileUrl(user.value?.profile?.picture?.id));
const fallbackInitials = computed(() => (username.value || "?").slice(0, 2).toUpperCase());

function handleLogout() {
  logout();
  navigateTo("/");
}
</script>
