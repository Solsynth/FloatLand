<template>
  <ClientOnly>
    <LightGallery
      :settings="settings"
      :on-init="onInit"
      :on-after-close="onAfterClose"
      :on-after-slide="onAfterSlide"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import type { AfterSlideDetail, InitDetail } from 'lightgallery/lg-events';
import type { GalleryItem } from 'lightgallery/lg-utils';
import type { LightGallerySettings } from 'lightgallery/lg-settings';
import type { LightGallery as LightGalleryInstance } from 'lightgallery/lightgallery';
import LightGallery from 'lightgallery/vue';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgVideo from 'lightgallery/plugins/video';
import lgZoom from 'lightgallery/plugins/zoom';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-video.css';
import 'lightgallery/css/lg-zoom.css';
import type { FileAttachment } from '~/types/post';
import { isAudioFile, isImageFile, isVideoFile } from '~/utils/fileType';
import { getFileUrl } from '~/utils/files';

const { state, close, setCurrentIndex } = useLightbox();

const gallery = shallowRef<LightGalleryInstance | null>(null);
const settings = reactive<LightGallerySettings>({
  dynamic: true,
  dynamicEl: [],
  plugins: [lgThumbnail, lgVideo, lgZoom],
  thumbnail: true,
  zoom: true,
  controls: true,
  counter: true,
  download: true,
  hash: false,
  closable: true,
  escKey: true,
  hideBarsDelay: 3000,
  autoplayFirstVideo: true,
});

const mediaAttachments = computed(() =>
  state.attachments.filter(
    attachment =>
      isImageFile(attachment) ||
      isVideoFile(attachment) ||
      isAudioFile(attachment),
  ),
);

function getAttachmentUrl(attachment: FileAttachment): string {
  return attachment.url || getFileUrl(attachment.id) || '';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toGalleryItem(attachment: FileAttachment): GalleryItem {
  const url = getAttachmentUrl(attachment);
  const caption = escapeHtml(attachment.name);
  const baseItem: GalleryItem = {
    src: url,
    thumb: url,
    alt: attachment.name,
    title: attachment.name,
    subHtml: `<span>${caption}</span>`,
    downloadUrl: url || false,
    download: attachment.name,
  };

  if (!isVideoFile(attachment) && !isAudioFile(attachment)) {
    return baseItem;
  }

  return {
    ...baseItem,
    // LightGallery detects HTML5 video slides when src is empty and video is set.
    src: '',
    video: {
      source: [{ src: url, type: attachment.mimeType }],
      tracks: [],
      attributes: {
        controls: true,
        autoplay: true,
        playsinline: true,
      } as unknown as HTMLVideoElement,
    },
  };
}

function getGalleryItems(): GalleryItem[] {
  return mediaAttachments.value.map(toGalleryItem);
}

function openGallery() {
  const instance = gallery.value;
  if (!instance || !state.isOpen) return;

  const items = getGalleryItems();
  if (!items.length) {
    close();
    return;
  }

  const index = Math.min(state.currentIndex, items.length - 1);
  if (instance.lgOpened) {
    instance.updateSlides(items, index);
    return;
  }

  instance.refresh(items);
  instance.openGallery(index);
}

function onInit(detail: InitDetail) {
  gallery.value = detail.instance;
  if (state.isOpen) openGallery();
}

function onAfterSlide(detail: AfterSlideDetail) {
  setCurrentIndex(detail.index);
}

function onAfterClose() {
  close();
}

watch(
  () => state.isOpen,
  isOpen => {
    if (isOpen) nextTick(openGallery);
  },
);

watch(
  () => state.attachments,
  () => {
    if (state.isOpen) nextTick(openGallery);
  },
);
</script>
