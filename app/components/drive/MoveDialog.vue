<template>
  <dialog ref="dialogRef" class="modal" :open="!!file">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">{{ t('drive.moveTo') }}</h3>

      <!-- Current location -->
      <div class="mb-4">
        <p class="text-sm text-base-content/60 mb-2">{{ t('drive.currentLocation') }}:</p>
        <div class="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
          <IconFolder class="w-4 h-4 text-primary" />
          <span class="text-sm">{{ currentPath || t('drive.root') }}</span>
        </div>
      </div>

      <!-- Folder tree -->
      <div class="mb-4">
        <p class="text-sm text-base-content/60 mb-2">{{ t('drive.selectDestination') }}:</p>
        <div class="max-h-60 overflow-y-auto rounded-box bg-base-200 p-1">
          <div
            v-for="folder in availableFolders"
            :key="folder.id"
            class="flex items-center gap-2 p-2 hover:bg-base-200 cursor-pointer transition-colors"
            :class="{ 'bg-primary/10': selectedFolderId === folder.id }"
            @click="selectedFolderId = folder.id"
          >
            <IconFolder class="w-4 h-4 text-primary" />
            <span class="text-sm">{{ folder.name }}</span>
          </div>
          <div v-if="availableFolders.length === 0" class="p-4 text-center text-sm text-base-content/50">
            {{ t('drive.noFoldersAvailable') }}
          </div>
        </div>
      </div>

      <!-- Root option -->
      <div
        class="flex items-center gap-2 p-2 hover:bg-base-200 cursor-pointer transition-colors mb-4 rounded-lg"
        :class="{ 'bg-primary/10': selectedFolderId === null }"
        @click="selectedFolderId = null"
      >
        <IconHome class="w-4 h-4 text-primary" />
        <span class="text-sm">{{ t('drive.root') }}</span>
      </div>

      <div class="modal-action">
        <button class="btn" @click="$emit('close')">{{ t('common.cancel') }}</button>
        <button
          class="btn btn-primary"
          :disabled="!hasChanged"
          @click="handleMove"
        >
          {{ t('drive.moveHere') }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="$emit('close')">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import type { SnCloudFile } from '~/types/drive'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  file: SnCloudFile | null
  currentPath: string
}>()

const emit = defineEmits<{
  close: []
  confirm: [folderId: string | null]
}>()

const selectedFolderId = ref<string | null>(null)
const availableFolders = ref<Array<{ id: string; name: string }>>([])

const hasChanged = computed(() => {
  if (!props.file) return false
  return selectedFolderId.value !== props.file.parentId
})

watch(() => props.file, async (file) => {
  if (file) {
    selectedFolderId.value = file.parentId
    await loadAvailableFolders()
  }
})

async function loadAvailableFolders() {
  try {
    const data = await fetchDriveRootChildren({
      take: 100,
      order: 'name',
      orderDesc: false,
    })
    availableFolders.value = data.items
      .filter(item => item.isFolder && item.id !== props.file?.id)
      .map(item => ({ id: item.id, name: item.name }))
  } catch (err) {
    console.error('Failed to load folders:', err)
  }
}

function handleMove() {
  emit('confirm', selectedFolderId.value)
}
</script>
