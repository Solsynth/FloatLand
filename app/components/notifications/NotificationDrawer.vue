<template>
  <!-- Overlay backdrop -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="drawerOpen"
        class="fixed inset-0 z-[9998] bg-black/40"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Drawer panel -->
    <Transition name="slide-right">
      <div
        v-if="drawerOpen"
        class="fixed top-0 right-0 z-[9999] flex h-full w-full flex-col bg-base-100 shadow-sm sm:w-[28rem] md:w-[32rem]"
      >
        <!-- Header -->
        <div class="flex items-center justify-between bg-base-200 px-4 py-3">
          <h2 class="text-lg font-bold">
            {{ t('notifications.title') }}
          </h2>
          <div class="flex items-center gap-1">
            <button
              class="btn btn-ghost btn-sm"
              :disabled="isLoading"
              :title="t('notifications.markAllRead')"
              @click="handleMarkAllRead"
            >
              <IconCheckCheck class="h-4 w-4" />
            </button>
            <button
              class="btn btn-ghost btn-sm"
              :title="t('notifications.refresh')"
              @click="handleRefresh"
            >
              <IconRefreshCw
                class="h-4 w-4"
                :class="{ 'animate-spin': isLoading }"
              />
            </button>
            <button
              class="btn btn-ghost btn-sm"
              :title="t('notifications.close')"
              @click="closeDrawer"
            >
              <IconX class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Notification list -->
        <div
          ref="listContainer"
          class="flex-1 overflow-y-auto"
          @scroll="handleScroll"
        >
          <!-- Loading state -->
          <div
            v-if="isLoading && notifications.length === 0"
            class="flex items-center justify-center py-12"
          >
            <span class="loading loading-spinner loading-md text-primary" />
          </div>

          <!-- Empty state -->
          <div
            v-else-if="notifications.length === 0"
            class="flex flex-col items-center justify-center px-4 py-12 text-center"
          >
            <IconBellOff class="mb-3 h-12 w-12 text-base-content/30" />
            <p class="text-sm text-base-content/50">
              {{ t('notifications.empty') }}
            </p>
          </div>

          <!-- Notification items -->
          <div v-else>
            <NotificationItem
              v-for="notification in notifications"
              :key="notification.id"
              :notification="notification"
              @click="handleItemClick"
            />
          </div>

          <!-- Load more indicator -->
          <div
            v-if="isLoading && notifications.length > 0"
            class="flex items-center justify-center py-4"
          >
            <span class="loading loading-spinner loading-sm text-primary" />
          </div>

          <!-- End of list -->
          <div
            v-if="!hasMore && notifications.length > 0"
            class="py-4 text-center text-xs text-base-content/40"
          >
            {{ t('notifications.endOfList') }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  IconCheckCheck,
  IconRefreshCw,
  IconX,
  IconBellOff,
} from '#components'

const { t } = useI18n()
const {
  notifications,
  unreadCount,
  isLoading,
  hasMore,
  drawerOpen,
  closeDrawer,
  loadMore,
  refresh,
  markRead,
  markAllRead,
} = useNotifications()

const listContainer = ref<HTMLElement | null>(null)

function handleScroll() {
  const el = listContainer.value
  if (!el || isLoading.value || !hasMore.value) return

  // Load more when scrolled near bottom
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
    loadMore()
  }
}

async function handleMarkAllRead() {
  await markAllRead()
}

async function handleRefresh() {
  await refresh()
}

async function handleItemClick(notification: any) {
  if (!notification.viewedAt) {
    await markRead(notification.id)
  }
}

// Close on Escape key
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && drawerOpen.value) {
    closeDrawer()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-right-leave-active {
  transition: transform 0.25s ease-in;
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
</style>
