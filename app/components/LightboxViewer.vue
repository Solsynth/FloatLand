<template>
  <dialog
    ref="dialogEl"
    class="lightbox"
    :class="{ 'is-closing': closing }"
    :aria-label="t('lightbox.viewer')"
    @cancel.prevent="requestClose"
    @animationend="handleAnimationEnd"
  >
    <!--
      The stage is the whole viewport: the chrome floats over it, so the media
      gets every pixel and clicks on the empty space around it close the viewer.
    -->
    <div
      ref="stageEl"
      class="lightbox-stage"
      @click.self="closeFromStage"
      @touchstart.passive="markTouchStart"
      @touchend="markTouchEnd"
    >
      <span
        v-if="current?.kind === 'image' && !failed && loadedSrc !== current.url"
        class="loading loading-spinner loading-lg lightbox-spinner"
        aria-hidden="true"
      />

      <!--
        Keyed on the source, so a swap mounts a fresh element and its fade-in
        replays instead of the browser reusing the previous slide's paint.
      -->
      <img
        v-if="current?.kind === 'image' && !failed"
        :key="current.url"
        class="lightbox-image"
        :class="{ 'is-loaded': loadedSrc === current.url, 'is-zoomed': zoomed }"
        :src="current.url"
        :alt="current.name"
        draggable="false"
        decoding="async"
        @click="zoomed = !zoomed"
        @load="markLoaded"
        @error="markFailed"
      />

      <video
        v-else-if="current?.kind === 'video' && !failed"
        :key="current.url"
        class="lightbox-video"
        :src="current.url"
        controls
        autoplay
        playsinline
        @error="markFailed"
      />

      <div
        v-else-if="current?.kind === 'audio' && !failed"
        class="lightbox-audio"
      >
        <IconHeadphones class="h-10 w-10" aria-hidden="true" />
        <p class="lightbox-audio-name">{{ current.name }}</p>
        <audio :src="current.url" controls autoplay class="w-full" />
      </div>

      <div v-else-if="current?.kind === 'file' && !failed" class="lightbox-file">
        <IconFile class="h-10 w-10" aria-hidden="true" />
        <p class="lightbox-audio-name">{{ current.name }}</p>
      </div>

      <p v-else-if="failed" class="lightbox-failed">
        {{ t('lightbox.loadFailed') }}
        <a
          v-if="current"
          :href="current.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('lightbox.openInNewTab') }}
        </a>
      </p>
    </div>

    <div class="lightbox-bar">
      <span class="lightbox-count" aria-live="polite">
        <template v-if="count > 1">{{ index + 1 }} / {{ count }}</template>
      </span>

      <div class="lightbox-actions">
        <a
          v-if="current?.url"
          class="btn btn-circle btn-sm lightbox-btn"
          :href="current.url"
          :download="current.name"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="t('lightbox.download')"
        >
          <IconDownload class="h-4 w-4" aria-hidden="true" />
        </a>

        <button
          v-if="current?.kind === 'image' && !failed"
          type="button"
          class="btn btn-circle btn-sm lightbox-btn"
          :aria-label="zoomed ? t('lightbox.zoomOut') : t('lightbox.zoomIn')"
          @click="zoomed = !zoomed"
        >
          <IconZoomOut v-if="zoomed" class="h-4 w-4" aria-hidden="true" />
          <IconZoomIn v-else class="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="btn btn-circle btn-sm lightbox-btn"
          :aria-label="t('common.close')"
          @click="requestClose"
        >
          <IconX class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <button
      v-if="count > 1"
      type="button"
      class="btn btn-circle lightbox-step lightbox-step-prev"
      :aria-label="t('common.previous')"
      :disabled="index === 0"
      @click="go(-1)"
    >
      <IconChevronLeft class="h-5 w-5" aria-hidden="true" />
    </button>

    <button
      v-if="count > 1"
      type="button"
      class="btn btn-circle lightbox-step lightbox-step-next"
      :aria-label="t('common.next')"
      :disabled="index === count - 1"
      @click="go(1)"
    >
      <IconChevronRight class="h-5 w-5" aria-hidden="true" />
    </button>

    <!--
      The caption repeats the attachment's own name, so it is hidden from
      assistive tech rather than read out twice.
    -->
    <p v-if="current?.name" class="lightbox-caption" aria-hidden="true">
      {{ current.name }}
    </p>
  </dialog>
</template>

<script setup lang="ts">
import { useSwipe } from '@vueuse/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconFile,
  IconHeadphones,
  IconX,
  IconZoomIn,
  IconZoomOut,
} from '#components';
import type { FileAttachment } from '~/types/post';
import { isAudioFile, isImageFile, isVideoFile } from '~/utils/fileType';
import { getFileUrl } from '~/utils/files';

type MediaKind = 'image' | 'video' | 'audio' | 'file';

const { t } = useI18n();
// The viewer is mounted per open (`v-if` in the layout), so the shared state is
// the source of truth for what is shown and navigation just moves its index.
const { state, close, setCurrentIndex } = useLightbox();

const dialogEl = ref<HTMLDialogElement | null>(null);
const stageEl = ref<HTMLElement | null>(null);

const zoomed = ref(false);
const failed = ref(false);
/** Playing the exit animation; the dialog is still mounted until it ends. */
const closing = ref(false);
let closeTimer = 0;
/** The source that has finished loading; the spinner and fade-in key off it. */
const loadedSrc = ref('');

const count = computed(() => state.attachments.length);
const index = computed(() => state.currentIndex);

function urlOf(attachment: FileAttachment): string {
  return attachment.url || getFileUrl(attachment.id) || '';
}

function kindOf(attachment: FileAttachment): MediaKind {
  if (isImageFile(attachment)) return 'image';
  if (isVideoFile(attachment)) return 'video';
  if (isAudioFile(attachment)) return 'audio';
  return 'file';
}

const current = computed(() => {
  const attachment = state.attachments[state.currentIndex];
  if (!attachment) return null;
  return {
    kind: kindOf(attachment),
    url: urlOf(attachment),
    name: attachment.name,
  };
});

function reset() {
  zoomed.value = false;
  failed.value = false;
  loadedSrc.value = '';
}

function go(step: number) {
  const next = index.value + step;
  if (next < 0 || next >= count.value) return;
  setCurrentIndex(next);
  reset();
  preloadNeighbours();
}

function preloadNeighbours() {
  for (const offset of [1, -1]) {
    const neighbour = state.attachments[index.value + offset];
    if (!neighbour || !isImageFile(neighbour)) continue;
    const preload = new Image();
    preload.src = urlOf(neighbour);
  }
}

/*
  Both handlers compare the event's own `src` attribute against the mounted
  slide: a replaced element can still report its load after Vue has swapped it
  for the next one, which would mark the wrong media as ready.
*/
function markLoaded(event: Event) {
  const source = current.value?.url;
  const target = event.target as HTMLImageElement | null;
  if (!source || target?.getAttribute('src') !== source) return;
  loadedSrc.value = source;
  failed.value = false;
}

function markFailed(event: Event) {
  const source = current.value?.url;
  const target = event.target as HTMLImageElement | null;
  if (!source || target?.getAttribute('src') !== source) return;
  failed.value = true;
}

/*
  Shuts the viewer, spending the closing animation first. Esc arrives here too
  — `cancel` is prevented on the dialog — so every exit looks the same.
*/
function requestClose() {
  if (closing.value) return;

  // No animation to wait for: the stylesheet skips it under the same query.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finishClose();
    return;
  }

  closing.value = true;
  // Backstop for an animation that never runs — a hidden tab, a dialog the
  // compositor never painted.
  closeTimer = window.setTimeout(finishClose, 400);
}

function finishClose() {
  window.clearTimeout(closeTimer);
  closing.value = false;
  // Unmounting the viewer is the close: the layout's `v-if` drops it.
  close();
}

function handleAnimationEnd(event: AnimationEvent) {
  // The media fades out alongside the dialog; only the dialog's own end counts.
  if (event.target !== dialogEl.value) return;
  if (closing.value) finishClose();
}

/*
  A touch that dragged across the stage can still be followed by a synthesised
  click at the point it ended, which would read as a click on the empty space
  and shut the viewer mid-gesture. The vertical axis counts too: zoomed, that
  drag is panning the media.
*/
let touchOrigin: { x: number; y: number } | null = null;
let suppressClickUntil = 0;

function markTouchStart(event: TouchEvent) {
  const touch = event.touches[0];
  touchOrigin = touch ? { x: touch.clientX, y: touch.clientY } : null;
}

function markTouchEnd(event: TouchEvent) {
  const touch = event.changedTouches[0];
  if (
    touchOrigin &&
    touch &&
    Math.max(
      Math.abs(touch.clientX - touchOrigin.x),
      Math.abs(touch.clientY - touchOrigin.y),
    ) > 8
  ) {
    suppressClickUntil = Date.now() + 350;
  }
  touchOrigin = null;
}

function closeFromStage() {
  if (Date.now() < suppressClickUntil) return;
  requestClose();
}

/*
  The page scrolls behind the modal dialog, so it is frozen for as long as the
  viewer is up — on both elements, since either can be the scroller.
*/
let scrollLocked = false;
let previousOverflow: [string, string] = ['', ''];

function lockScroll(locked: boolean) {
  if (locked === scrollLocked) return;
  scrollLocked = locked;

  if (locked) {
    previousOverflow = [
      document.documentElement.style.overflow,
      document.body.style.overflow,
    ];
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return;
  }

  [document.documentElement.style.overflow, document.body.style.overflow] =
    previousOverflow;
}

function handleKeydown(event: KeyboardEvent) {
  if (!dialogEl.value?.open) return;
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    go(1);
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    go(-1);
  }
}

/*
  Zoomed, the stage pans by scrolling, and a horizontal drag would read as a
  swipe as well. `useSwipe` is disabled there rather than the stage being
  un-scrollable. (@vueuse reports the gesture once, on touch end, through
  `onSwipeEnd` — it has no directional `onSwipeLeft`/`onSwipeRight` options.)
*/
useSwipe(stageEl, {
  onSwipeEnd: (_event, direction) => {
    if (zoomed.value) return;
    if (direction === 'left') go(1);
    else if (direction === 'right') go(-1);
  },
});

/*
  Keyed on the source rather than the index: two entries can share a file, and
  a swap that lands on the same one must not blank a photo that is already up.
  The index alone would also leave a stale failure on a new attachment.
*/
watch(() => current.value?.url, () => reset());

onMounted(() => {
  const dialog = dialogEl.value;
  if (dialog && !dialog.open) dialog.showModal();
  lockScroll(true);
  reset();
  preloadNeighbours();
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.clearTimeout(closeTimer);
  window.removeEventListener('keydown', handleKeydown);
  lockScroll(false);
});
</script>

<style scoped>
/*
  The viewer is the top layer's own scrim: frosted from the current theme's
  surface rather than flat black, so the media sits on the same material as the
  rest of the site in either palette.
*/
.lightbox {
  position: fixed;
  inset: 0;
  width: auto;
  height: auto;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background-color: color-mix(in srgb, var(--color-base-100) 78%, transparent);
  backdrop-filter: blur(18px) saturate(1.1);
  color: var(--color-base-content);
  overflow: hidden;
  overscroll-behavior: contain;
}

.lightbox::backdrop {
  background-color: transparent;
}

/* A `display` of ours would otherwise outrank the UA's `dialog:not([open])`. */
.lightbox:not([open]) {
  display: none;
}

@media (prefers-reduced-motion: no-preference) {
  .lightbox[open] {
    animation: lightbox-in 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  /*
    The exit is played on the still-open dialog and `close()` is called from its
    `animationend`, so the scrim, the chrome and the media all leave together
    instead of the top layer vanishing in one frame.
  */
  .lightbox.is-closing {
    animation: lightbox-out 180ms cubic-bezier(0.4, 0, 1, 1) forwards;
    /* Nothing in here is live any more. */
    pointer-events: none;
  }

  .lightbox.is-closing .lightbox-image,
  .lightbox.is-closing .lightbox-video {
    animation: lightbox-media-out 180ms cubic-bezier(0.4, 0, 1, 1) forwards;
  }
}

@keyframes lightbox-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes lightbox-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes lightbox-media-out {
  from {
    opacity: 1;
    scale: 1;
  }
  to {
    opacity: 0;
    scale: 0.97;
  }
}

.lightbox-stage {
  position: absolute;
  inset: 0;
  display: flex;
  /* Clears the bar and the caption, which float over the stage. */
  padding: 3.5rem 1rem 4rem;
  overflow: auto;
  overscroll-behavior: contain;
}

/*
  `margin: auto` rather than a centred flex container: centring an oversized
  item in a scroller puts its top-left corner out of reach.
*/
.lightbox-image,
.lightbox-video {
  display: block;
  margin: auto;
  max-width: 100%;
  max-height: 100%;
  /* The same radius the card gives it, so opening a picture only scales it. */
  border-radius: var(--radius-box);
  box-shadow: 0 24px 64px -12px rgb(0 0 0 / 0.45);
  opacity: 0;
}

.lightbox-image {
  cursor: zoom-in;
}

@media (prefers-reduced-motion: no-preference) {
  .lightbox-image {
    transition: opacity 240ms ease;
  }
}

.lightbox-image.is-loaded {
  opacity: 1;
}

.lightbox-video {
  opacity: 1;
  background-color: #000;
}

.lightbox-image.is-zoomed {
  max-width: none;
  max-height: none;
  border-radius: 0;
  cursor: zoom-out;
}

.lightbox-audio,
.lightbox-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin: auto;
  width: min(100%, 26rem);
  padding: 1.5rem;
  border: 1px solid color-mix(in srgb, var(--color-base-content) 12%, transparent);
  border-radius: var(--radius-box);
  background-color: color-mix(in srgb, var(--color-base-100) 75%, transparent);
  color: color-mix(in srgb, var(--color-base-content) 80%, transparent);
  text-align: center;
}

.lightbox-audio-name {
  font-size: 0.875rem;
  line-height: 1.5;
  text-wrap: pretty;
  color: color-mix(in srgb, var(--color-base-content) 75%, transparent);
}

.lightbox-spinner {
  position: absolute;
  inset: 0;
  margin: auto;
  /* Sits behind the media: it must not swallow the click that closes the viewer. */
  pointer-events: none;
}

.lightbox-failed {
  margin: auto;
  font-size: 0.875rem;
  text-align: center;
  color: color-mix(in srgb, var(--color-base-content) 60%, transparent);
}

.lightbox-failed a {
  color: var(--color-primary);
  text-decoration: underline;
}

.lightbox-bar {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-image: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--color-base-100) 85%, transparent),
    transparent
  );
  /* A fade, not a bar: clicks pass through it to the stage below. */
  pointer-events: none;
}

.lightbox-actions {
  display: flex;
  gap: 0.5rem;
  pointer-events: auto;
}

.lightbox-count {
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: color-mix(in srgb, var(--color-base-content) 70%, transparent);
}

.lightbox-btn,
.lightbox-step {
  border: 1px solid color-mix(in srgb, var(--color-base-content) 12%, transparent);
  background-color: color-mix(in srgb, var(--color-base-100) 70%, transparent);
  color: inherit;
  box-shadow: 0 4px 16px -6px rgb(0 0 0 / 0.4);
}

.lightbox-btn:hover,
.lightbox-step:hover {
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.lightbox-step {
  position: absolute;
  inset-block-start: 50%;
  translate: 0 -50%;
}

.lightbox-step:disabled {
  opacity: 0.25;
}

.lightbox-step-prev {
  inset-inline-start: 0.75rem;
}

.lightbox-step-next {
  inset-inline-end: 0.75rem;
}

.lightbox-caption {
  position: absolute;
  inset-block-end: 0;
  inset-inline: 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
  padding: 1.75rem 1.25rem 1rem;
  background-image: linear-gradient(
    to top,
    color-mix(in srgb, var(--color-base-100) 85%, transparent),
    transparent
  );
  font-size: 0.8125rem;
  line-height: 1.5;
  text-align: center;
  text-wrap: pretty;
  color: color-mix(in srgb, var(--color-base-content) 75%, transparent);
  pointer-events: none;
}
</style>
