<template>
  <ClientOnly>
  <DrawerRoot v-bind="$attrs" :open="open" @update:open="$emit('update:open', $event)">
    <DrawerPortal>
      <DrawerOverlay class="fixed inset-0 bg-black/40 z-50" />
      <DrawerContent
        class="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[80vh] max-w-lg flex-col rounded-t-box bg-base-100"
      >
        <!-- Drag handle -->
        <div class="flex justify-center pt-3 pb-2">
          <div class="w-10 h-1 rounded-full bg-base-content/20" />
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between px-5 pb-3">
          <h3 class="text-lg font-semibold">{{ t('cloudFilePicker.title') }}</h3>
          <button class="btn btn-sm btn-ghost btn-square" @click="$emit('update:open', false)">
            <IconX class="w-4 h-4" />
          </button>
        </div>

        <!-- Main Tabs (Upload / Browse) -->
        <TabsRoot v-model="activeTab" class="flex-1 flex flex-col min-h-0">
          <TabsList class="tabs mx-5 mb-3 bg-base-200">
            <TabsTrigger value="upload" class="tab" :class="{ 'tab-active': activeTab === 'upload' }">
              <IconUpload class="w-4 h-4 mr-1.5" />
              {{ t('cloudFilePicker.upload') }}
            </TabsTrigger>
            <TabsTrigger value="browse" class="tab" :class="{ 'tab-active': activeTab === 'browse' }">
              <IconFolder class="w-4 h-4 mr-1.5" />
              {{ t('cloudFilePicker.browse') }}
            </TabsTrigger>
          </TabsList>

          <!-- Upload Content -->
          <TabsContent value="upload" class="flex-1 overflow-y-auto px-5 pb-5">
            <div class="space-y-4">
              <!-- Drop zone -->
              <div
                class="cursor-pointer rounded-box bg-base-200 p-8 text-center transition-colors hover:bg-primary/5"
                :class="{ 'bg-primary/10': isDragging }"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
                @click="fileInput?.click()"
              >
                <IconCloudUpload class="w-12 h-12 mx-auto text-base-content/40 mb-3" />
                <p class="text-sm text-base-content/60">{{ t('cloudFilePicker.dropHint') }}</p>
                <p class="text-xs text-base-content/40 mt-1">{{ allowedTypesText }}</p>
              </div>

              <input
                ref="fileInput"
                type="file"
                class="hidden"
                :accept="acceptAttribute"
                :multiple="allowMultiple"
                @change="handleFileInput"
              >

              <!-- Preview selected files -->
              <div v-if="selectedFiles.length > 0" class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">
                    {{ t('cloudFilePicker.selected', { count: selectedFiles.length }) }}
                  </span>
                  <button v-if="!isUploading" class="btn btn-ghost btn-xs text-error" @click="clearFiles">
                    {{ t('cloudFilePicker.clearAll') }}
                  </button>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div
                    v-for="(file, idx) in selectedFiles"
                    :key="idx"
                    class="group relative aspect-square overflow-hidden rounded-box bg-base-200"
                  >
                    <FileImage v-if="file.preview" :src="file.preview" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center bg-base-200">
                      <IconFile class="w-8 h-8 text-base-content/40" />
                    </div>

                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        v-if="file.preview && !isUploading"
                        class="btn btn-sm btn-circle btn-ghost text-white"
                        :title="t('cloudFilePicker.crop')"
                        @click="openCropper(idx)"
                      >
                        <IconCrop class="w-4 h-4" />
                      </button>
                      <button
                        v-if="!isUploading"
                        class="btn btn-sm btn-circle btn-ghost text-white"
                        :title="t('cloudFilePicker.remove')"
                        @click="removeFile(idx)"
                      >
                        <IconX class="w-4 h-4" />
                      </button>
                    </div>

                    <div
                      v-if="isUploading && uploadProgress[idx] !== undefined"
                      class="absolute inset-0 bg-black/60 flex items-center justify-center"
                    >
                      <div class="radial-progress text-primary" :style="`--value: ${uploadProgress[idx]}; --size: 2.5rem; --thickness: 3px;`">
                        <span class="text-xs">{{ Math.round(uploadProgress[idx]) }}</span>
                      </div>
                    </div>

                    <div class="absolute inset-x-0 bottom-0 bg-black/60 p-2">
                      <p class="text-xs text-white truncate">{{ file.file.name }}</p>
                    </div>
                  </div>
                </div>

                <button class="btn btn-primary w-full" :disabled="isUploading" @click="startUpload">
                  <span v-if="isUploading" class="loading loading-spinner loading-sm" />
                  <IconUpload v-else class="w-4 h-4 mr-1.5" />
                  {{ isUploading
                    ? t('cloudFilePicker.uploading', { current: uploadingIdx + 1, total: selectedFiles.length })
                    : t('cloudFilePicker.uploadAll')
                  }}
                </button>
              </div>
            </div>
          </TabsContent>

          <!-- Browse Content -->
          <TabsContent value="browse" class="flex-1 flex flex-col min-h-0">
            <!-- Sub-tabs (Indexed / Unindexed) -->
            <TabsRoot v-model="browseMode" class="flex flex-col min-h-0 flex-1">
              <TabsList class="flex gap-1 px-5 mb-3">
                <TabsTrigger
                  value="indexed"
                  class="btn btn-xs"
                  :class="browseMode === 'indexed' ? 'btn-primary' : 'btn-ghost'"
                >
                  <IconFolder class="w-3.5 h-3.5 mr-1" />
                  {{ t('cloudFilePicker.indexed') }}
                </TabsTrigger>
                <TabsTrigger
                  value="unindexed"
                  class="btn btn-xs"
                  :class="browseMode === 'unindexed' ? 'btn-primary' : 'btn-ghost'"
                >
                  <IconPackage class="w-3.5 h-3.5 mr-1" />
                  {{ t('cloudFilePicker.unindexed') }}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="indexed" class="flex-1 overflow-y-auto px-5 pb-5">
                <BrowseFileGrid
                  :files="indexedFiles"
                  :is-loading="isLoadingIndexed"
                  :has-more="hasMoreIndexed"
                  :is-loading-more="isLoadingMoreIndexed"
                  :allow-multiple="allowMultiple"
                  @select="selectExistingFile"
                  @load-more="loadMoreIndexed"
                />
              </TabsContent>

              <TabsContent value="unindexed" class="flex-1 overflow-y-auto px-5 pb-5">
                <BrowseFileGrid
                  :files="unindexedFiles"
                  :is-loading="isLoadingUnindexed"
                  :has-more="hasMoreUnindexed"
                  :is-loading-more="isLoadingMoreUnindexed"
                  :allow-multiple="allowMultiple"
                  @select="selectExistingFile"
                  @load-more="loadMoreUnindexed"
                />
              </TabsContent>
            </TabsRoot>
          </TabsContent>
        </TabsRoot>

        <!-- Cropper Dialog -->
        <dialog ref="cropperDialog" class="modal modal-bottom sm:modal-middle">
          <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-lg mb-4">{{ t('cloudFilePicker.cropImage') }}</h3>
            <div class="aspect-square overflow-hidden rounded-box bg-base-300">
              <VueCropper
                v-if="cropperImageSrc"
                ref="cropperRef"
                :src="cropperImageSrc"
                :aspect-ratio="cropAspectRatio"
                :view-mode="1"
                :auto-crop-area="0.8"
                :background="false"
                :responsive="true"
              />
            </div>
            <div class="modal-action">
              <button class="btn btn-ghost" @click="closeCropper">{{ t('common.cancel') }}</button>
              <button class="btn btn-primary" @click="applyCrop">
                <IconCrop class="w-4 h-4 mr-1" />
                {{ t('cloudFilePicker.applyCrop') }}
              </button>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button @click="closeCropper">close</button>
          </form>
        </dialog>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
  <template #fallback>
    <span></span>
  </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import {
  DrawerRoot,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
} from 'vaul-vue'
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
} from 'reka-ui'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import VueCropper from 'vue-cropperjs'
import {
  IconX,
  IconUpload,
  IconFolder,
  IconCloudUpload,
  IconFile,
  IconCrop,
  IconPackage,
} from '#components'
import { uploadDriveFile, fetchDriveRootChildren, fetchDriveUnindexedFiles } from '~/utils/api'
import type { SnCloudFile } from '~/types/drive'

interface SelectedFile {
  file: File
  preview: string | null
}

const props = withDefaults(defineProps<{
  open: boolean
  allowMultiple?: boolean
  allowedTypes?: ('image' | 'video' | 'file')[]
  usage?: string
  cropAspectRatio?: number | null
}>(), {
  allowMultiple: false,
  allowedTypes: () => ['image', 'video', 'file'],
  cropAspectRatio: null,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [files: SnCloudFile | SnCloudFile[] | null]
}>()

const { t } = useI18n()

// State
const activeTab = ref('upload')
const browseMode = ref('indexed')
const selectedFiles = ref<SelectedFile[]>([])
const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref<Record<number, number>>({})
const uploadingIdx = ref(0)
const fileInput = ref<HTMLInputElement | null>(null)

// Indexed files state
const indexedFiles = ref<SnCloudFile[]>([])
const isLoadingIndexed = ref(false)
const isLoadingMoreIndexed = ref(false)
const hasMoreIndexed = ref(false)
const indexedPage = ref(0)

// Unindexed files state
const unindexedFiles = ref<SnCloudFile[]>([])
const isLoadingUnindexed = ref(false)
const isLoadingMoreUnindexed = ref(false)
const hasMoreUnindexed = ref(false)
const unindexedPage = ref(0)

const pageSize = 24

// Cropper state
const cropperDialog = ref<HTMLDialogElement | null>(null)
const cropperRef = ref<any>(null)
const cropperImageSrc = ref<string | null>(null)
const cropperFileIdx = ref<number>(-1)

// Computed
const acceptAttribute = computed(() => {
  const map: Record<string, string> = { image: 'image/*', video: 'video/*', file: '*/*' }
  return props.allowedTypes.map(t => map[t] || '*/*').join(',')
})

const allowedTypesText = computed(() => {
  const labels = props.allowedTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1) + 's')
  return labels.join(', ')
})

// Watch for tab changes to trigger load
watch(activeTab, (tab) => {
  if (tab === 'browse') {
    loadBrowseFiles(browseMode.value as 'indexed' | 'unindexed')
  }
})

// Watch for browse mode changes
watch(browseMode, (mode) => {
  if (activeTab.value === 'browse') {
    loadBrowseFiles(mode as 'indexed' | 'unindexed')
  }
})

// Methods
function handleDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files))
}

function handleFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  addFiles(Array.from(input.files))
  input.value = ''
}

function addFiles(filesToAdd: File[]) {
  const filtered = filesToAdd.filter(f => {
    if (props.allowedTypes.includes('image') && f.type.startsWith('image/')) return true
    if (props.allowedTypes.includes('video') && f.type.startsWith('video/')) return true
    if (props.allowedTypes.includes('file')) return true
    return false
  })

  const newFiles: SelectedFile[] = filtered.map(file => ({
    file,
    preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
  }))

  if (props.allowMultiple) {
    selectedFiles.value = [...selectedFiles.value, ...newFiles]
  } else {
    selectedFiles.value.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview) })
    selectedFiles.value = newFiles.slice(0, 1)
  }
}

function removeFile(idx: number) {
  const file = selectedFiles.value[idx]
  if (file?.preview) URL.revokeObjectURL(file.preview)
  selectedFiles.value.splice(idx, 1)
}

function clearFiles() {
  selectedFiles.value.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview) })
  selectedFiles.value = []
}

function openCropper(idx: number) {
  const file = selectedFiles.value[idx]
  if (!file?.preview) return
  cropperFileIdx.value = idx
  cropperImageSrc.value = file.preview
  cropperDialog.value?.showModal()
}

function closeCropper() {
  cropperDialog.value?.close()
  cropperImageSrc.value = null
  cropperFileIdx.value = -1
}

function applyCrop() {
  if (!cropperRef.value || cropperFileIdx.value < 0) return
  const canvas = cropperRef.value.getCroppedCanvas()
  if (!canvas) return

  canvas.toBlob((blob: Blob | null) => {
    if (!blob) return
    const idx = cropperFileIdx.value
    const oldFile = selectedFiles.value[idx]
    if (!oldFile) return

    const newFile = new File([blob], oldFile.file.name, { type: 'image/png' })
    if (oldFile.preview) URL.revokeObjectURL(oldFile.preview)
    selectedFiles.value[idx] = { file: newFile, preview: URL.createObjectURL(newFile) }
    closeCropper()
  }, 'image/png')
}

async function startUpload() {
  if (selectedFiles.value.length === 0 || isUploading.value) return
  isUploading.value = true
  uploadProgress.value = {}
  uploadingIdx.value = 0

  const results: SnCloudFile[] = []
  try {
    for (let i = 0; i < selectedFiles.value.length; i++) {
      uploadingIdx.value = i
      uploadProgress.value[i] = 0
      const file = selectedFiles.value[i]?.file
      if (!file) continue

      const result = await uploadDriveFile(file, { usage: props.usage })
      results.push(result)
      uploadProgress.value[i] = 100
    }

    emit('select', props.allowMultiple ? results : (results[0] || null))
    emit('update:open', false)
    clearFiles()
  } catch (err) {
    console.error('Upload failed:', err)
    useNuxtApp().$toast.error(t('cloudFilePicker.uploadFailed'))
  } finally {
    isUploading.value = false
    uploadProgress.value = {}
  }
}

// Browse functions
async function loadBrowseFiles(mode: 'indexed' | 'unindexed') {
  if (mode === 'indexed') {
    if (indexedFiles.value.length > 0) return
    isLoadingIndexed.value = true
    try {
      const result = await fetchDriveRootChildren({ take: pageSize, offset: 0 })
      indexedFiles.value = result.items.filter(f => !f.isFolder)
      hasMoreIndexed.value = result.totalCount > pageSize
      indexedPage.value = 1
    } catch (err) {
      console.error('Failed to load indexed files:', err)
    } finally {
      isLoadingIndexed.value = false
    }
  } else {
    if (unindexedFiles.value.length > 0) return
    isLoadingUnindexed.value = true
    try {
      const result = await fetchDriveUnindexedFiles({ take: pageSize, offset: 0 })
      unindexedFiles.value = result.items.filter(f => !f.isFolder)
      hasMoreUnindexed.value = result.totalCount > pageSize
      unindexedPage.value = 1
    } catch (err) {
      console.error('Failed to load unindexed files:', err)
    } finally {
      isLoadingUnindexed.value = false
    }
  }
}

async function loadMoreIndexed() {
  if (isLoadingMoreIndexed.value) return
  isLoadingMoreIndexed.value = true
  try {
    const result = await fetchDriveRootChildren({ take: pageSize, offset: indexedPage.value * pageSize })
    indexedFiles.value = [...indexedFiles.value, ...result.items.filter(f => !f.isFolder)]
    hasMoreIndexed.value = indexedFiles.value.length < result.totalCount
    indexedPage.value++
  } catch (err) {
    console.error('Failed to load more files:', err)
  } finally {
    isLoadingMoreIndexed.value = false
  }
}

async function loadMoreUnindexed() {
  if (isLoadingMoreUnindexed.value) return
  isLoadingMoreUnindexed.value = true
  try {
    const result = await fetchDriveUnindexedFiles({ take: pageSize, offset: unindexedPage.value * pageSize })
    unindexedFiles.value = [...unindexedFiles.value, ...result.items.filter(f => !f.isFolder)]
    hasMoreUnindexed.value = unindexedFiles.value.length < result.totalCount
    unindexedPage.value++
  } catch (err) {
    console.error('Failed to load more files:', err)
  } finally {
    isLoadingMoreUnindexed.value = false
  }
}

function selectExistingFile(file: SnCloudFile) {
  emit('select', props.allowMultiple ? [file] : file)
  emit('update:open', false)
}

// Cleanup on unmount
onUnmounted(() => {
  selectedFiles.value.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview) })
})
</script>
