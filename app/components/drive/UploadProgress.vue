<template>
  <Transition name="slide-up">
    <div v-if="uploads.length > 0" class="fixed bottom-20 right-6 z-50 w-80">
      <div class="bg-base-100 rounded-box shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-4 py-2 bg-base-200">
          <span class="text-sm font-medium">
            {{ t('drive.uploading') }} ({{ uploads.length }})
          </span>
          <button
            v-if="allDone"
            class="btn btn-ghost btn-xs"
            @click="$emit('clear')"
          >
            <IconX class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="max-h-60 space-y-1 overflow-y-auto p-1">
          <div
            v-for="upload in uploads"
            :key="upload.id"
            class="rounded-box px-3 py-2"
          >
            <div class="flex items-center gap-3">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium truncate">{{ upload.name }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <div class="flex-1 h-1.5 bg-base-300 rounded-box overflow-hidden">
                    <div
                      class="h-full rounded-box transition-all duration-200"
                      :class="getProgressColor(upload.status)"
                      :style="{ width: `${upload.progress}%` }"
                    />
                  </div>
                  <span class="text-[10px] text-base-content/50 w-8 text-right">
                    {{ upload.status === 'uploading' ? `${upload.progress}%` : '' }}
                  </span>
                </div>
              </div>
              <div class="shrink-0">
                <IconCheck v-if="upload.status === 'done'" class="w-4 h-4 text-success" />
                <IconAlertCircle v-else-if="upload.status === 'error'" class="w-4 h-4 text-error" />
                <div v-else class="loading loading-spinner loading-xs text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
export interface UploadItem {
  id: string
  name: string
  progress: number
  status: 'uploading' | 'done' | 'error'
}

const { t } = useI18n()

defineProps<{
  uploads: UploadItem[]
}>()

defineEmits<{
  clear: []
}>()

const allDone = computed(() => {
  return false // Always show, let user clear manually
})

function getProgressColor(status: UploadItem['status']) {
  switch (status) {
    case 'done': return 'bg-success'
    case 'error': return 'bg-error'
    default: return 'bg-primary'
  }
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active { transition: opacity 150ms ease; }
.slide-up-enter-from,
.slide-up-leave-to { opacity: 0; }
</style>
