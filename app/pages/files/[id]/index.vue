<template>
  <div
    v-if="isLoading"
    class="min-h-screen flex items-center justify-center bg-base-100"
  >
    <div class="loading loading-spinner loading-lg text-primary" />
  </div>

  <div
    v-else-if="error"
    class="min-h-screen flex items-center justify-center bg-base-100"
  >
    <div class="text-center">
      <IconAlertCircle class="w-12 h-12 text-error mx-auto mb-4" />
      <p class="text-lg font-semibold">{{ t("drive.errorLoadingFile") }}</p>
      <p class="text-sm text-base-content/50 mt-1">{{ error }}</p>
      <button class="btn btn-primary btn-sm mt-4" @click="handleBack">
        {{ t("common.back") }}
      </button>
    </div>
  </div>

  <template v-else-if="file">
    <!-- Fullscreen Mode -->
    <div
      v-if="isFullscreen"
      class="fixed inset-0 z-50 flex flex-col bg-black/95"
    >
      <div
        class="flex items-center justify-between px-4 py-3"
      >
        <button
          class="btn btn-circle btn-sm text-white btn-ghost"
          @click="toggleFullscreen"
        >
          <IconX class="h-5 w-5" />
        </button>
        <div class="flex gap-1">
          <button
            class="btn btn-circle btn-sm text-white btn-ghost"
            @click="zoomOut"
          >
            <IconZoomOut class="h-5 w-5" />
          </button>
          <button
            class="btn btn-circle btn-sm text-white btn-ghost"
            @click="zoomIn"
          >
            <IconZoomIn class="h-5 w-5" />
          </button>
          <button
            class="btn btn-circle btn-sm text-white btn-ghost"
            @click="resetTransform"
          >
            <IconRotateCcw class="h-5 w-5" />
          </button>
          <button
            class="btn btn-circle btn-sm text-white btn-ghost"
            @click="handleDownload"
          >
            <IconDownload class="h-5 w-5" />
          </button>
        </div>
      </div>
      <div
        class="flex flex-1 items-center justify-center overflow-hidden"
        @wheel.prevent="handleWheel"
        @mousedown.stop="handleMouseDown"
        @mousemove.stop="handleMouseMove"
        @mouseup.stop="handleMouseUp"
        @mouseleave.stop="handleMouseUp"
      >
        <img
          v-if="isImage"
          :src="fileUrl"
          :alt="file.name"
          class="max-h-full max-w-full object-contain select-none"
          :style="imageStyle"
          draggable="false"
        />
        <video
          v-else-if="isVideo"
          :src="fileUrl"
          controls
          autoplay
          class="max-h-full max-w-full"
        />
      </div>
      <div
        v-if="isImage"
        class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-white text-sm"
      >
        {{ Math.round(scale * 100) }}%
      </div>
    </div>

    <!-- Normal Mode -->
    <div class="min-h-screen bg-base-100">
      <!-- Top bar -->
      <div
        class="sticky top-0 z-10 bg-base-100"
      >
        <div
          class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3"
        >
          <div class="flex items-center gap-3">
            <button class="btn btn-circle btn-ghost btn-sm" @click="handleBack">
              <IconArrowLeft class="h-5 w-5" />
            </button>
            <div class="min-w-0">
              <h1
                class="text-sm font-semibold truncate max-w-[200px] sm:max-w-[400px]"
              >
                {{ file.name || t("drive.unnamedFile") }}
              </h1>
              <p class="text-xs text-base-content/50">{{ file.mimeType }}</p>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <!-- Edit button for Office files -->
            <button
              v-if="isOffice"
              class="btn btn-circle btn-ghost btn-sm"
              :title="t('drive.editDocument')"
              @click="navigateTo(`/drive/files/${fileId}/edit`)"
            >
              <IconPencil class="h-5 w-5" />
            </button>

            <!-- Fullscreen button for images -->
            <button
              v-if="isImage"
              class="btn btn-circle btn-ghost btn-sm"
              @click="toggleFullscreen"
            >
              <IconMaximize2 class="h-5 w-5" />
            </button>

            <!-- Preview in iframe button for supported types -->
            <button
              v-if="isIframePreviewable && !showIframe"
              class="btn btn-circle btn-ghost btn-sm"
              title="Preview in viewer"
              @click="showIframe = true"
            >
              <IconEye class="h-5 w-5" />
            </button>

            <button
              class="btn btn-circle btn-ghost btn-sm"
              @click="handleShare"
            >
              <IconShare2 class="h-5 w-5" />
            </button>
            <button
              class="btn btn-circle btn-ghost btn-sm"
              @click="handleDownload"
            >
              <IconDownload class="h-5 w-5" />
            </button>
            <button
              class="btn btn-circle btn-ghost btn-sm"
              @click="showInfo = !showInfo"
            >
              <IconInfo class="h-5 w-5" />
            </button>
            <a
              :href="originalUrl"
              target="_blank"
              class="btn btn-circle btn-ghost btn-sm"
              title="Open original"
            >
              <IconExternalLink class="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      <!-- Content area -->
      <div class="relative">
        <!-- Iframe Preview (full size, outside constrained containers) -->
        <div
          v-if="showIframe && isIframePreviewable"
          class="w-full"
          style="height: calc(100vh - 65px)"
        >
          <iframe
            :src="fileUrl"
            class="w-full h-full border-0"
            :title="file.name"
          />
        </div>

        <!-- Other content types -->
        <div v-else class="max-w-5xl mx-auto">
          <!-- Main content -->
          <div>
            <div
              class="flex min-h-[calc(100vh-65px)] items-center justify-center overflow-auto p-4"
            >
              <!-- Image -->
              <div
                v-if="isImage"
                class="relative group cursor-pointer"
                @click="toggleFullscreen"
              >
                <img
                  :src="fileUrl"
                  :alt="file.name"
                  class="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg"
                >
                  <div
                    class="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-3"
                  >
                    <IconMaximize2 class="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <!-- Video -->
              <video
                v-else-if="isVideo"
                :src="fileUrl"
                controls
                class="max-w-full max-h-[80vh] rounded-lg"
              />
              <!-- Audio -->
              <div v-else-if="isAudio" class="w-full max-w-md">
                <div
                  class="flex flex-col items-center gap-4 rounded-box bg-base-200 p-8"
                >
                  <div
                    class="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <IconMusic class="w-12 h-12 text-primary" />
                  </div>
                  <p class="text-sm font-medium text-center">{{ file.name }}</p>
                  <audio :src="fileUrl" controls class="w-full" />
                </div>
              </div>
              <!-- Text -->
              <div v-else-if="isText" class="w-full max-w-3xl">
                <div class="rounded-box bg-base-200 p-6">
                  <pre
                    class="text-sm whitespace-pre-wrap break-words font-mono"
                    >{{ textContent }}</pre
                  >
                </div>
              </div>
              <!-- Office (Collabora Editor) -->
              <div v-else-if="isOffice" class="text-center py-20">
                <div
                  class="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
                >
                  <IconFileText class="w-12 h-12 text-primary" />
                </div>
                <p class="text-lg font-semibold">{{ file.name }}</p>
                <p class="text-sm text-base-content/50 mt-1">
                  {{ file.mimeType }}
                </p>
                <div class="flex items-center justify-center gap-2 mt-4">
                  <button
                    class="btn btn-primary btn-sm"
                    @click="navigateTo(`/drive/files/${fileId}/edit`)"
                  >
                    <IconPencil class="w-4 h-4" />
                    {{ t("drive.editDocument") }}
                  </button>
                  <button
                    class="btn btn-outline btn-sm"
                    @click="handleDownload"
                  >
                    <IconDownload class="w-4 h-4" />
                    {{ t("drive.download") }}
                  </button>
                </div>
              </div>
              <!-- Generic -->
              <div v-else class="text-center py-20">
                <div
                  class="w-24 h-24 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4"
                >
                  <IconFile class="w-12 h-12 text-base-content/30" />
                </div>
                <p class="text-lg font-semibold">{{ file.name }}</p>
                <p class="text-sm text-base-content/50 mt-1">
                  {{ file.mimeType }}
                </p>
                <button
                  v-if="isIframePreviewable"
                  class="btn btn-primary btn-sm mt-4 me-3"
                  @click="showIframe = true"
                >
                  <IconEye class="w-4 h-4" />
                  {{ t("drive.previewInViewer") }}
                </button>
                <button
                  class="btn btn-outline btn-sm mt-4"
                  @click="handleDownload"
                >
                  <IconDownload class="w-4 h-4" />
                  {{ t("drive.download") }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Info sidebar (desktop) - overlays on the right -->
        <Transition name="slide">
          <div
            v-if="showInfo"
            class="fixed top-[57px] right-0 bottom-0 z-30 hidden w-80 overflow-y-auto bg-base-100 lg:block"
          >
            <div class="p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="font-semibold">{{ t("drive.fileInfo") }}</h2>
                <button
                  class="btn btn-ghost btn-xs btn-circle"
                  @click="showInfo = false"
                >
                  <IconX class="w-4 h-4" />
                </button>
              </div>

              <!-- File preview thumbnail -->
              <div
                v-if="isImage"
                class="mb-4 rounded-lg overflow-hidden bg-base-200"
              >
                <img
                  :src="thumbnailUrl || fileUrl"
                  class="w-full h-auto"
                  alt=""
                />
              </div>

              <!-- File details -->
              <div class="space-y-3">
                <div class="stat bg-base-200 rounded-lg p-3">
                  <div class="stat-title text-xs">
                    {{ t("drive.fileName") }}
                  </div>
                  <div class="stat-value text-sm break-all">
                    {{ file.name }}
                  </div>
                </div>

                <div class="stat bg-base-200 rounded-lg p-3">
                  <div class="stat-title text-xs">
                    {{ t("drive.fileType") }}
                  </div>
                  <div class="stat-value text-sm">{{ file.mimeType }}</div>
                </div>

                <div class="stat bg-base-200 rounded-lg p-3">
                  <div class="stat-title text-xs">
                    {{ t("drive.fileSize") }}
                  </div>
                  <div class="stat-value text-sm">
                    {{ formatBytes(file.size) }}
                  </div>
                </div>

                <div
                  v-if="file.fileMeta?.width && file.fileMeta?.height"
                  class="stat bg-base-200 rounded-lg p-3"
                >
                  <div class="stat-title text-xs">
                    {{ t("drive.dimensions") }}
                  </div>
                  <div class="stat-value text-sm">
                    {{ file.fileMeta.width }} × {{ file.fileMeta.height }}
                  </div>
                </div>

                <div class="stat bg-base-200 rounded-lg p-3">
                  <div class="stat-title text-xs">
                    {{ t("drive.createdAt") }}
                  </div>
                  <div class="stat-value text-sm">
                    {{ formatDate(file.createdAt) }}
                  </div>
                </div>

                <div class="stat bg-base-200 rounded-lg p-3">
                  <div class="stat-title text-xs">
                    {{ t("drive.updatedAt") }}
                  </div>
                  <div class="stat-value text-sm">
                    {{ formatDate(file.updatedAt) }}
                  </div>
                </div>

                <div v-if="file.usage" class="stat bg-base-200 rounded-lg p-3">
                  <div class="stat-title text-xs">{{ t("drive.usage") }}</div>
                  <div class="stat-value text-sm">{{ file.usage }}</div>
                </div>

                <div
                  v-if="file.applicationType"
                  class="stat bg-base-200 rounded-lg p-3"
                >
                  <div class="stat-title text-xs">
                    {{ t("drive.applicationType") }}
                  </div>
                  <div class="stat-value text-sm">
                    {{ file.applicationType }}
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-4 space-y-2">
                <button
                  class="btn btn-primary btn-sm w-full"
                  @click="handleDownload"
                >
                  <IconDownload class="w-4 h-4" />
                  {{ t("drive.download") }}
                </button>
                <button
                  class="btn btn-outline btn-sm w-full"
                  @click="handleShare"
                >
                  <IconShare2 class="w-4 h-4" />
                  {{ t("drive.share") }}
                </button>
                <a
                  :href="originalUrl"
                  target="_blank"
                  class="btn btn-ghost btn-sm w-full"
                >
                  <IconExternalLink class="w-4 h-4" />
                  {{ t("drive.openOriginal") }}
                </a>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Info modal (mobile) -->
    <div v-if="showInfo" class="fixed inset-0 z-50 flex items-end lg:hidden">
      <div class="absolute inset-0 bg-black/50" @click="showInfo = false" />
      <div
        class="relative w-full max-h-[80vh] overflow-y-auto bg-base-100 rounded-t-2xl p-4"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold">{{ t("drive.fileInfo") }}</h2>
          <button
            class="btn btn-ghost btn-xs btn-circle"
            @click="showInfo = false"
          >
            <IconX class="w-4 h-4" />
          </button>
        </div>

        <!-- File preview thumbnail -->
        <div v-if="isImage" class="mb-4 rounded-lg overflow-hidden bg-base-200">
          <img :src="thumbnailUrl || fileUrl" class="w-full h-auto" alt="" />
        </div>

        <!-- File details -->
        <div class="space-y-3">
          <div class="stat bg-base-200 rounded-lg p-3">
            <div class="stat-title text-xs">{{ t("drive.fileName") }}</div>
            <div class="stat-value text-sm break-all">{{ file.name }}</div>
          </div>

          <div class="stat bg-base-200 rounded-lg p-3">
            <div class="stat-title text-xs">{{ t("drive.fileType") }}</div>
            <div class="stat-value text-sm">{{ file.mimeType }}</div>
          </div>

          <div class="stat bg-base-200 rounded-lg p-3">
            <div class="stat-title text-xs">{{ t("drive.fileSize") }}</div>
            <div class="stat-value text-sm">{{ formatBytes(file.size) }}</div>
          </div>

          <div
            v-if="file.fileMeta?.width && file.fileMeta?.height"
            class="stat bg-base-200 rounded-lg p-3"
          >
            <div class="stat-title text-xs">{{ t("drive.dimensions") }}</div>
            <div class="stat-value text-sm">
              {{ file.fileMeta.width }} × {{ file.fileMeta.height }}
            </div>
          </div>

          <div class="stat bg-base-200 rounded-lg p-3">
            <div class="stat-title text-xs">{{ t("drive.createdAt") }}</div>
            <div class="stat-value text-sm">
              {{ formatDate(file.createdAt) }}
            </div>
          </div>

          <div class="stat bg-base-200 rounded-lg p-3">
            <div class="stat-title text-xs">{{ t("drive.updatedAt") }}</div>
            <div class="stat-value text-sm">
              {{ formatDate(file.updatedAt) }}
            </div>
          </div>

          <div v-if="file.usage" class="stat bg-base-200 rounded-lg p-3">
            <div class="stat-title text-xs">{{ t("drive.usage") }}</div>
            <div class="stat-value text-sm">{{ file.usage }}</div>
          </div>

          <div
            v-if="file.applicationType"
            class="stat bg-base-200 rounded-lg p-3"
          >
            <div class="stat-title text-xs">
              {{ t("drive.applicationType") }}
            </div>
            <div class="stat-value text-sm">{{ file.applicationType }}</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-4 space-y-2">
          <button class="btn btn-primary btn-sm w-full" @click="handleDownload">
            <IconDownload class="w-4 h-4" />
            {{ t("drive.download") }}
          </button>
          <button class="btn btn-outline btn-sm w-full" @click="handleShare">
            <IconShare2 class="w-4 h-4" />
            {{ t("drive.share") }}
          </button>
          <a
            :href="originalUrl"
            target="_blank"
            class="btn btn-ghost btn-sm w-full"
          >
            <IconExternalLink class="w-4 h-4" />
            {{ t("drive.openOriginal") }}
          </a>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import type { SnCloudFile } from "~/types/drive";
import { getFileUrl } from "~/utils/files";
import {
  isImageFile,
  isVideoFile,
  isAudioFile,
  detectMimeTypeFromExtension,
} from "~/utils/fileType";
import type { FileAttachment } from "~/types/post";
import { fetchDriveFileInfo, isOfficeFile } from "~/utils/api";

definePageMeta({
  layout: false,
});

const route = useRoute();
const { t } = useI18n();
const fileId = computed(() => route.params.id as string);

defineOgImage('UniOgImage', { title: 'File', description: 'View file on Solar Network.' })

useSolarSeo({
  title: "File",
  description: "View file on Solar Network.",
});

// State
const file = ref<SnCloudFile | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showInfo = ref(false);
const showIframe = ref(false);

// Fetch file info
onMounted(async () => {
  try {
    file.value = await fetchDriveFileInfo(fileId.value);
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Failed to load file";
  } finally {
    isLoading.value = false;
  }
});

// Computed
const config = useRuntimeConfig();
const fileUrl = computed(() => `${config.public.fileBaseUrl}/${fileId.value}`);
const originalUrl = computed(
  () => `${config.public.fileBaseUrl}/${fileId.value}?original=true`,
);
const thumbnailUrl = computed(() => {
  if (!file.value || !file.value.hasThumbnail) return null;
  return getFileUrl(fileId.value, "thumbnail");
});

// Construct FileAttachment for type checking
const attachment = computed<FileAttachment>(() => ({
  id: fileId.value,
  name: file.value?.name || fileId.value,
  url: fileUrl.value,
  mimeType:
    file.value?.mimeType ||
    detectMimeTypeFromExtension(fileId.value) ||
    "application/octet-stream",
  hasCompression: false,
  hasThumbnail: false,
  fileMeta: file.value?.fileMeta || {},
}));

const isImage = computed(() =>
  file.value ? isImageFile(attachment.value) : false,
);
const isVideo = computed(() =>
  file.value ? isVideoFile(attachment.value) : false,
);
const isAudio = computed(() =>
  file.value ? isAudioFile(attachment.value) : false,
);
const isText = computed(
  () => file.value?.mimeType?.startsWith("text/") || false,
);
const isOffice = computed(() =>
  file.value ? isOfficeFile(file.value.mimeType) : false,
);

// Check if file can be previewed in iframe (PDF, HTML, etc. - not binary)
const isIframePreviewable = computed(() => {
  if (!file.value) return false;
  const mimeType = file.value.mimeType || "";
  const iframeTypes = ["application/pdf", "text/html", "application/xhtml+xml"];
  return iframeTypes.includes(mimeType);
});

const textContent = ref("");
watch(
  isText,
  async (val) => {
    if (val && file.value) {
      try {
        const response = await fetch(fileUrl.value);
        textContent.value = await response.text();
      } catch {
        textContent.value = "Failed to load text content";
      }
    }
  },
  { immediate: true },
);

// Zoom and pan state
const isFullscreen = ref(false);
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);

const imageStyle = computed(() => {
  const cursor =
    scale.value > 1 ? (isDragging.value ? "grabbing" : "grab") : "zoom-in";
  return `transform: translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value}); cursor: ${cursor};`;
});

// Actions
function handleBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    navigateTo("/drive");
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
  resetTransform();
}

async function handleShare() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: file.value?.name || fileId.value,
        url: window.location.href,
      });
    } catch {
      // User cancelled
    }
  } else {
    await navigator.clipboard.writeText(window.location.href);
  }
}

function handleDownload() {
  const link = document.createElement("a");
  link.href = originalUrl.value;
  link.download = file.value?.name || fileId.value;
  link.click();
}

function zoomIn() {
  scale.value = Math.min(scale.value + 0.25, 5);
}

function zoomOut() {
  scale.value = Math.max(scale.value - 0.25, 0.25);
}

function resetTransform() {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
}

function handleWheel(e: WheelEvent) {
  if (!isImage.value) return;
  e.preventDefault();
  if (e.deltaY < 0) {
    zoomIn();
  } else {
    zoomOut();
  }
}

function handleMouseDown(e: MouseEvent) {
  if (!isImage.value) return;
  if (scale.value > 1) {
    isDragging.value = true;
    startX.value = e.clientX;
    startY.value = e.clientY;
  }
}

function handleMouseMove(e: MouseEvent) {
  if (isDragging.value && scale.value > 1) {
    const deltaX = e.clientX - startX.value;
    const deltaY = e.clientY - startY.value;
    translateX.value += deltaX;
    translateY.value += deltaY;
    startX.value = e.clientX;
    startY.value = e.clientY;
  }
}

function handleMouseUp() {
  isDragging.value = false;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
