<template>
  <div v-if="attachments.length > 0" class="space-y-3">
    <!-- Attachment Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <div
        v-for="(attachment, index) in attachments"
        :key="attachment.id"
        class="relative group rounded-box overflow-hidden bg-base-200"
        :class="{ 'col-span-2 sm:col-span-2': isLargeAttachment(attachment) }"
      >
        <!-- Image Preview -->
        <template v-if="isImage(attachment)">
          <div class="aspect-video relative">
            <FileImage
              v-if="attachment.preview || attachment.cloudFile?.id"
              :file="attachment.cloudFile ?? undefined"
              :src="attachment.preview"
              class="w-full h-full object-cover"
              alt="Attachment preview"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <IconImage class="w-8 h-8 text-base-content/30" />
            </div>

            <!-- Progress Overlay -->
            <div
              v-if="attachment.progress !== undefined && attachment.progress < 100"
              class="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <div class="text-white text-sm font-medium">{{ Math.round(attachment.progress) }}%</div>
            </div>

            <!-- Hover Actions -->
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button v-if="index > 0" class="btn btn-circle btn-sm btn-ghost text-white" title="Move left" @click="$emit('move', index, 'up')">
                <IconArrowLeft class="w-4 h-4" />
              </button>
              <button class="btn btn-circle btn-sm btn-ghost text-white" title="Insert into content" @click="$emit('insert', attachment.id)">
                <IconText class="w-4 h-4" />
              </button>
              <button class="btn btn-circle btn-sm btn-ghost text-error" title="Remove" @click="$emit('remove', attachment.id)">
                <IconTrash2 class="w-4 h-4" />
              </button>
              <button v-if="index < attachments.length - 1" class="btn btn-circle btn-sm btn-ghost text-white" title="Move right" @click="$emit('move', index, 'down')">
                <IconArrowRight class="w-4 h-4" />
              </button>
            </div>

            <!-- File Info -->
            <div class="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
              <p class="text-white text-xs truncate">{{ getFileName(attachment) }}</p>
            </div>
          </div>
        </template>

        <!-- Video Preview -->
        <template v-else-if="isVideo(attachment)">
          <div class="aspect-video relative">
            <video
              v-if="attachment.preview"
              :src="attachment.preview"
              class="w-full h-full object-cover"
              preload="metadata"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <IconVideo class="w-8 h-8 text-base-content/30" />
            </div>

            <!-- Play Icon Overlay -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                <IconPlay class="w-6 h-6 text-white ml-0.5" />
              </div>
            </div>

            <!-- Progress Overlay -->
            <div
              v-if="attachment.progress !== undefined && attachment.progress < 100"
              class="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <div class="text-white text-sm font-medium">{{ Math.round(attachment.progress) }}%</div>
            </div>

            <!-- Hover Actions -->
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button v-if="index > 0" class="btn btn-circle btn-sm btn-ghost text-white" @click="$emit('move', index, 'up')">
                <IconArrowLeft class="w-4 h-4" />
              </button>
              <button class="btn btn-circle btn-sm btn-ghost text-white" @click="$emit('insert', attachment.id)">
                <IconText class="w-4 h-4" />
              </button>
              <button class="btn btn-circle btn-sm btn-ghost text-error" @click="$emit('remove', attachment.id)">
                <IconTrash2 class="w-4 h-4" />
              </button>
              <button v-if="index < attachments.length - 1" class="btn btn-circle btn-sm btn-ghost text-white" @click="$emit('move', index, 'down')">
                <IconArrowRight class="w-4 h-4" />
              </button>
            </div>

            <div class="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
              <p class="text-white text-xs truncate">{{ getFileName(attachment) }}</p>
            </div>
          </div>
        </template>

        <!-- Audio Preview -->
        <template v-else-if="isAudio(attachment)">
          <div class="aspect-video relative bg-base-200 flex flex-col items-center justify-center p-4">
            <IconMusic class="w-10 h-10 text-primary mb-2" />
            <p class="text-xs text-center text-base-content/70 truncate w-full">{{ getFileName(attachment) }}</p>
            <p class="text-xs text-base-content/50">{{ formatFileSize(attachment.file.size) }}</p>

            <!-- Progress -->
            <div
              v-if="attachment.progress !== undefined && attachment.progress < 100"
              class="absolute inset-0 bg-black/30 flex items-center justify-center"
            >
              <div class="text-white text-sm font-medium">{{ Math.round(attachment.progress) }}%</div>
            </div>

            <!-- Actions -->
            <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="btn btn-circle btn-xs btn-ghost text-error" @click="$emit('remove', attachment.id)">
                <IconX class="w-3 h-3" />
              </button>
            </div>
          </div>
        </template>

        <!-- File Preview -->
        <template v-else>
          <div class="aspect-video relative bg-base-300 flex flex-col items-center justify-center p-4">
            <IconFile class="w-10 h-10 text-base-content/40 mb-2" />
            <p class="text-xs text-center text-base-content/70 truncate w-full">{{ getFileName(attachment) }}</p>
            <p class="text-xs text-base-content/50">{{ formatFileSize(attachment.file.size) }}</p>

            <!-- Progress -->
            <div
              v-if="attachment.progress !== undefined && attachment.progress < 100"
              class="absolute inset-0 bg-black/30 flex items-center justify-center"
            >
              <div class="text-white text-sm font-medium">{{ Math.round(attachment.progress) }}%</div>
            </div>

            <!-- Actions -->
            <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="btn btn-circle btn-xs btn-ghost text-error" @click="$emit('remove', attachment.id)">
                <IconX class="w-3 h-3" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComposeAttachment } from "~/composables/useCompose";
import { getFileUrl } from "~/utils/files";
import {
  IconImage,
  IconVideo,
  IconMusic,
  IconFile,
  IconPlay,
  IconArrowLeft,
  IconArrowRight,
  IconTrash2,
  IconText,
  IconX,
} from "#components";

interface Props {
  attachments: ComposeAttachment[];
}

const props = defineProps<Props>();

defineEmits<{
  add: [files: FileList];
  remove: [id: string];
  move: [index: number, direction: "up" | "down"];
  insert: [id: string];
}>();

function isImage(attachment: ComposeAttachment): boolean {
  return (
    attachment.file.type.startsWith("image/") ||
    attachment.cloudFile?.mimeType?.startsWith("image/") ||
    false
  );
}

function isVideo(attachment: ComposeAttachment): boolean {
  return (
    attachment.file.type.startsWith("video/") ||
    attachment.cloudFile?.mimeType?.startsWith("video/") ||
    false
  );
}

function isAudio(attachment: ComposeAttachment): boolean {
  return (
    attachment.file.type.startsWith("audio/") ||
    attachment.cloudFile?.mimeType?.startsWith("audio/") ||
    false
  );
}

function isLargeAttachment(attachment: ComposeAttachment): boolean {
  const index = props.attachments.findIndex((a) => a.id === attachment.id);
  return index === 0 && (isImage(attachment) || isVideo(attachment));
}

function getPreviewUrl(attachment: ComposeAttachment): string | undefined {
  if (attachment.cloudFile?.id) return getFileUrl(attachment.cloudFile.id) ?? undefined;
  if (attachment.preview) return attachment.preview;
  return undefined;
}

function getFileName(attachment: ComposeAttachment): string {
  return attachment.cloudFile?.name || attachment.file.name || "Unnamed file";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
</script>
