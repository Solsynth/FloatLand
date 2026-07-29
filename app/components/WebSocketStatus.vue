<template>
  <div
    v-if="visible"
    class="fixed top-2 left-1/2 z-[10000] -translate-x-1/2 transition-all duration-300"
    :class="animateClass"
  >
    <div
      class="flex items-center gap-2 rounded-box px-4 py-2 text-sm font-medium shadow-sm"
      :class="statusClasses"
    >
      <span class="relative flex h-2.5 w-2.5">
        <span
          v-if="status === 'connecting'"
          class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          :class="dotColorClass"
        />
        <span
          class="relative inline-flex h-2.5 w-2.5 rounded-full"
          :class="dotColorClass"
        />
      </span>
      <span>{{ statusText }}</span>
      <button
        v-if="status === 'disconnected' || status === 'error'"
        class="ml-1 rounded-box bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30"
        @click="handleReconnect"
      >
        {{ t('ws.reconnect') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { status, manualReconnect } = useWebSocket()

const visible = ref(false)
const entered = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null
let removeTimer: ReturnType<typeof setTimeout> | null = null

const animateClass = computed(() => {
  if (!entered.value) return 'opacity-0 -translate-y-4 pointer-events-none'
  return 'opacity-100 translate-y-0'
})

function clearAllTimers() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  if (removeTimer) {
    clearTimeout(removeTimer)
    removeTimer = null
  }
}

onBeforeUnmount(() => {
  clearAllTimers()
  visible.value = false
  entered.value = false
})

watch(status, (newStatus) => {
  clearAllTimers()

  if (newStatus === 'connected') {
    // Show the "connected" banner briefly, then auto-hide
    visible.value = true
    nextTick(() => {
      entered.value = true
    })
    hideTimer = setTimeout(() => {
      hideTimer = null
      // Start leave animation
      entered.value = false
      // Remove from DOM after leave transition completes
      removeTimer = setTimeout(() => {
        removeTimer = null
        visible.value = false
      }, 300)
    }, 2000)
  } else {
    // Non-connected status - show immediately
    visible.value = true
    nextTick(() => {
      entered.value = true
    })
  }
})
</script>
