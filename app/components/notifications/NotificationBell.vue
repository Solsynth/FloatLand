<template>
  <button
    class="btn btn-circle btn-ghost btn-sm relative"
    :aria-label="t('notifications.bellLabel')"
    @click="handleClick"
  >
    <IconBell class="h-5 w-5 shrink-0 transition-colors" />
    <span
      v-if="unreadCount > 0"
      class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-error-content"
    >
      {{ displayCount }}
    </span>
  </button>
</template>

<script setup lang="ts">
const { t } = useI18n()

const { unreadCount, openDrawer } = useNotifications()

const displayCount = computed(() => {
  if (unreadCount.value > 99) return '99+'
  return String(unreadCount.value)
})

function handleClick() {
  openDrawer()
}
</script>
