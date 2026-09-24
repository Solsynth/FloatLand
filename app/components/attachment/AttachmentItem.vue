<template>
  <div class="relative overflow-hidden" :class="{ 'cursor-pointer': props.clickable, 'rounded-none': props.flush, 'rounded-box': !props.flush, 'bg-transparent': props.transparent, 'bg-base-300': !props.transparent }" @click="handleClick">
    <!-- Image -->
    <template v-if="isImage">
      <FileImage
        v-if="fileUrl"
        :file="attachment"
        :alt="attachment.name"
        :class="fitClass"
        loading="lazy"
        decoding="async"
      />
      <div v-else class="p-8 flex flex-col items-center justify-center">
        <IconFileImage class="w-12 h-12 text-base-content/30 mb-2" />
        <span class="text-sm text-base-content/50">{{ attachment.name }}</span>
      </div>
    </template>

    <!-- Video -->
    <template v-else-if="isVideo">
      <div class="relative w-full h-full group">
        <video
          v-if="fileUrl"
          :src="fileUrl"
          :class="fitClass"
          preload="metadata"
          playsinline
        />
        <!-- Play button overlay -->
        <div class="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
          <div class="flex flex-col items-center gap-2">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-black/50">
              <IconPlay class="w-7 h-7 text-white ml-0.5" />
            </div>
            <span class="max-w-[200px] truncate rounded-box bg-black/40 px-2 py-0.5 text-xs font-medium text-white/80">
              {{ attachment.name }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- Audio -->
    <template v-else-if="isAudio">
      <div class="p-6 flex flex-col items-center justify-center h-full">
        <IconHeadphones class="w-12 h-12 text-base-content/30 mb-2" />
        <span class="text-sm text-base-content/50 text-center line-clamp-2">{{ attachment.name }}</span>
      </div>
    </template>

    <!-- Generic File -->
    <template v-else>
      <div class="p-6 flex flex-col items-center justify-center h-full">
        <IconFile class="w-12 h-12 text-base-content/30 mb-2" />
        <span class="text-sm text-base-content/50 text-center line-clamp-2">{{ attachment.name }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { FileAttachment } from '~/types/post';
import { getFileUrl } from '~/utils/files';
import { isImageFile, isVideoFile, isAudioFile } from '~/utils/fileType';

const props = withDefaults(defineProps<{
  attachment: FileAttachment;
  clickable?: boolean;
  /** Full-bleed presentation: no corner rounding (flush with card edges). */
  flush?: boolean;
  /** Image/video fit inside the box (object-contain letterboxes + centers). */
  fit?: 'cover' | 'contain';
  /** Transparent background (used as a foreground layer over a backdrop). */
  transparent?: boolean;
}>(), {
  clickable: true,
  flush: false,
  fit: 'cover',
  transparent: false,
});

const emit = defineEmits<{
  click: [];
}>();

const { open: openLightbox } = useLightbox();

const fileUrl = computed(() => {
  return props.attachment.url || getFileUrl(props.attachment.id) || '';
});

const isImage = computed(() => isImageFile(props.attachment));
const isVideo = computed(() => isVideoFile(props.attachment));
const isAudio = computed(() => isAudioFile(props.attachment));

const fitClass = computed(() =>
  props.fit === 'contain'
    ? 'w-full h-full object-contain'
    : 'w-full h-full object-cover',
);

function handleClick() {
  if (!props.clickable) {
    emit('click');
    return;
  }

  if (isImage.value || isVideo.value || isAudio.value) {
    openLightbox([props.attachment]);
  } else if (fileUrl.value) {
    window.open(fileUrl.value, '_blank', 'noopener,noreferrer');
  }
}
</script>
