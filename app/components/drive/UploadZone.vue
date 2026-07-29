<template>
  <div
    class="relative"
    @dragenter.prevent="onDragEnter"
    @dragleave.prevent="onDragLeave"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <slot />

    <!-- Drag overlay -->
    <Transition name="fade">
      <div
        v-if="isDragging"
        class="absolute inset-0 z-50 flex items-center justify-center rounded-box bg-base-100/95 shadow-sm"
      >
        <div class="flex flex-col items-center gap-3">
          <div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <IconUpload class="w-8 h-8 text-primary" />
          </div>
          <div class="text-center">
            <p class="text-lg font-semibold text-primary">{{ t('drive.dropFiles') }}</p>
            <p class="text-sm text-base-content/60">{{ t('drive.dropFilesHint') }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const emit = defineEmits<{
  drop: [files: File[]]
}>()

const isDragging = ref(false)
let dragCounter = 0

function onDragEnter(e: DragEvent) {
  dragCounter++
  if (e.dataTransfer?.types.includes('Files')) {
    isDragging.value = true
  }
}

function onDragLeave() {
  dragCounter--
  if (dragCounter <= 0) {
    isDragging.value = false
    dragCounter = 0
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  dragCounter = 0

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    emit('drop', Array.from(files))
  }
}
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
</style>
