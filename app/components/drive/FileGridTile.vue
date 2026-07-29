<template>
  <div
    class="rounded-box bg-base-100 overflow-hidden transition-colors cursor-pointer hover:bg-base-200 group"
    :class="{ 'bg-primary/5': isSelected }"
    @click="handleClick"
    @contextmenu.prevent="$emit('contextmenu', $event)"
  >
    <!-- Preview area -->
    <div
      class="relative bg-base-200 flex items-center justify-center overflow-hidden"
      :style="previewStyle"
    >
      <!-- Selection checkbox overlay -->
      <div
        v-if="isSelectionMode"
        class="absolute top-2 left-2 z-10"
        @click.stop
      >
        <input
          type="checkbox"
          class="checkbox checkbox-sm checkbox-primary"
          :checked="isSelected"
          @change="$emit('toggleSelect')"
        >
      </div>

      <!-- Image preview -->
      <img
        v-if="isImage && thumbnailUrl"
        :src="thumbnailUrl"
        :width="file.fileMeta?.width"
        :height="file.fileMeta?.height"
        class="w-full h-full object-cover"
        alt=""
      >
      <!-- Video preview -->
      <div v-else-if="isVideo" class="relative w-full h-full">
        <div class="w-full h-full bg-base-300 flex items-center justify-center">
          <IconFileVideo class="w-10 h-10 text-base-content/30" />
        </div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div
            class="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
          >
            <IconPlay class="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
      <!-- Folder -->
      <div v-else-if="file.isFolder" class="flex flex-col items-center gap-2">
        <IconFolder class="w-12 h-12 text-primary" />
        <span class="text-xs text-base-content/50"
          >{{ file.childrenCount }} {{ t("drive.items") }}</span
        >
      </div>
      <!-- Audio -->
      <div v-else-if="isAudio" class="flex flex-col items-center gap-2">
        <IconFileAudio class="w-12 h-12 text-primary" />
      </div>
      <!-- Text -->
      <div v-else-if="isText" class="flex flex-col items-center gap-2">
        <IconFileText class="w-12 h-12 text-primary" />
      </div>
      <!-- Generic file -->
      <div v-else class="flex flex-col items-center gap-2">
        <IconFile class="w-12 h-12 text-base-content/30" />
      </div>

      <!-- Hover actions overlay -->
      <div
        class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
      >
        <button
          v-if="!file.isFolder"
          class="btn btn-circle btn-sm bg-white/90 hover:bg-white border-none text-black"
          :title="t('drive.download')"
          @click.stop="$emit('download')"
        >
          <IconDownload class="w-4 h-4 text-base-content" />
        </button>
        <DropdownMenuRoot>
          <DropdownMenuTrigger as-child @click.stop>
            <button
              class="btn btn-circle btn-sm bg-white/90 hover:bg-white border-none text-black"
            >
              <IconMoreHorizontal class="w-4 h-4 text-base-content" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              class="min-w-[180px] bg-base-100 rounded-box p-1 shadow-sm z-50"
              :side-offset="5"
              align="end"
            >
              <DropdownMenuItem
                v-if="file.isFolder"
                class="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-base-200 outline-none"
                @select="$emit('open')"
              >
                <IconFolderOpen class="w-4 h-4" />
                {{ t("drive.open") }}
              </DropdownMenuItem>
              <DropdownMenuItem
                class="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-base-200 outline-none"
                @select="$emit('rename')"
              >
                <IconPencil class="w-4 h-4" />
                {{ t("drive.rename") }}
              </DropdownMenuItem>
              <DropdownMenuItem
                v-if="!file.isFolder"
                class="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-base-200 outline-none"
                @select="$emit('download')"
              >
                <IconDownload class="w-4 h-4" />
                {{ t("drive.download") }}
              </DropdownMenuItem>
              <DropdownMenuItem
                class="mt-1 flex items-center gap-2 px-2 py-1.5 text-sm rounded-box cursor-pointer hover:bg-error/10 text-error outline-none"
                @select="$emit('delete')"
              >
                <IconTrash class="w-4 h-4" />
                {{ t("drive.delete") }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
      </div>
    </div>

    <!-- File name -->
    <div class="px-3 py-2">
      <div class="text-xs font-medium truncate">
        {{ file.name || t("drive.untitled") }}
      </div>
      <div class="text-[10px] text-base-content/50 mt-0.5">
        {{ file.isFolder ? t("drive.folder") : formatBytes(file.size) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SnCloudFile } from "~/types/drive";
import { getFileUrl } from "~/utils/files";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "reka-ui";

const { t } = useI18n();

const props = defineProps<{
  file: SnCloudFile;
  isSelectionMode?: boolean;
  isSelected?: boolean;
}>();

const emit = defineEmits<{
  open: [];
  download: [];
  rename: [];
  delete: [];
  toggleSelect: [];
  contextmenu: [event: MouseEvent];
}>();

const isImage = computed(() => props.file.mimeType.startsWith("image/"));
const isVideo = computed(() => props.file.mimeType.startsWith("video/"));
const isAudio = computed(() => props.file.mimeType.startsWith("audio/"));
const isText = computed(() => props.file.mimeType.startsWith("text/"));

const aspectRatio = computed(() => {
  const meta = props.file.fileMeta;
  if (meta && typeof meta.width === 'number' && typeof meta.height === 'number' && meta.height > 0) {
    return meta.width / meta.height;
  }
  return null;
});

const previewStyle = computed(() => {
  if (aspectRatio.value) {
    return { aspectRatio: String(aspectRatio.value) };
  }
  // Default square for folders / files without dimensions
  return { aspectRatio: '1' };
});

const thumbnailUrl = computed(() => {
  if (props.file.hasThumbnail) return getFileUrl(props.file.id, "thumbnail");
  else if (isImage.value) return getFileUrl(props.file.id);
  return null;
});

function handleClick() {
  if (props.isSelectionMode) {
    emit("toggleSelect");
  } else if (props.file.isFolder) {
    emit("open");
  } else {
    navigateTo(`/files/${props.file.id}`);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
</script>
