<template>
  <div class="space-y-3">
    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <!-- Empty state -->
    <div v-else-if="files.length === 0" class="text-center py-12">
      <IconFolderX class="w-12 h-12 mx-auto text-base-content/30 mb-3" />
      <p class="text-sm text-base-content/50">{{ t('cloudFilePicker.noFiles') }}</p>
    </div>

    <!-- File grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <button
        v-for="file in files"
        :key="file.id"
        class="group relative rounded-box overflow-hidden bg-base-200 aspect-square text-left transition-colors hover:bg-base-300"
        @click="$emit('select', file)"
      >
        <!-- Image preview -->
        <img
          v-if="file.mimeType?.startsWith('image/')"
          :src="(file.hasThumbnail ? getFileUrl(file.id, 'thumbnail') : getFileUrl(file.id)) ?? undefined"
          class="w-full h-full object-cover"
        />
        <!-- Video preview -->
        <div v-else-if="file.mimeType?.startsWith('video/')" class="w-full h-full flex items-center justify-center bg-base-200">
          <IconVideo class="w-8 h-8 text-base-content/40" />
        </div>
        <!-- File icon -->
        <div v-else class="w-full h-full flex items-center justify-center bg-base-200">
          <IconFile class="w-8 h-8 text-base-content/40" />
        </div>

        <!-- Hover overlay -->
        <div class="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div class="btn btn-sm btn-primary btn-circle">
            <IconCheck class="w-4 h-4" />
          </div>
        </div>

        <!-- File info -->
        <div class="absolute bottom-0 inset-x-0 bg-neutral/85 p-2">
          <p class="text-xs text-white truncate">{{ file.name }}</p>
          <p class="text-[10px] text-white/60">{{ formatFileSize(file.size) }}</p>
        </div>
      </button>
    </div>

    <!-- Load more -->
    <div v-if="hasMore" class="text-center pt-2">
      <button
        class="btn btn-ghost btn-sm"
        :disabled="isLoadingMore"
        @click="$emit('loadMore')"
      >
        <span v-if="isLoadingMore" class="loading loading-spinner loading-xs" />
        {{ t('cloudFilePicker.loadMore') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconFolderX, IconFile, IconVideo, IconCheck } from '#components'
import { getFileUrl } from '~/utils/files'
import type { SnCloudFile } from '~/types/drive'

defineProps<{
  files: SnCloudFile[]
  isLoading: boolean
  hasMore: boolean
  isLoadingMore: boolean
  allowMultiple: boolean
}>()

defineEmits<{
  select: [file: SnCloudFile]
  loadMore: []
}>()

const { t } = useI18n()

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
