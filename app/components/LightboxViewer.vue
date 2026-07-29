<template>
  <Teleport to="body">
    <div
      v-if="state.isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85"
      @click.self="close"
    >
      <!-- Close button -->
      <button
        class="absolute right-4 top-4 z-10 btn btn-sm btn-circle bg-white/10 border-none text-white hover:bg-white/20"
        @click="close"
      >
        <IconX class="w-5 h-5" />
      </button>

      <!-- Full-screen image viewer -->
      <div class="relative flex items-center justify-center w-screen h-screen select-none">
        <img
          v-if="currentAttachment"
          :src="getFileUrl(currentAttachment.id)"
          :alt="currentAttachment.name"
          class="w-full h-full object-contain"
          draggable="false"
          @click.stop
        >

        <!-- Navigation -->
        <button
          v-if="state.currentIndex > 0"
          class="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle bg-white/10 border-none text-white hover:bg-white/40 transition-all"
          @click.stop="prev"
        >
          <IconChevronLeft class="w-6 h-6" />
        </button>
        <button
          v-if="state.currentIndex < state.attachments.length - 1"
          class="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle bg-white/10 border-none text-white hover:bg-white/40 transition-all"
          @click.stop="next"
        >
          <IconChevronRight class="w-6 h-6" />
        </button>

        <!-- Counter -->
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-box bg-black/60 px-4 py-1.5 text-sm font-medium text-white/90">
          {{ state.currentIndex + 1 }} / {{ state.attachments.length }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { getFileUrl } from '~/utils/files';
import {
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from '#components';

const { state, close, next, prev } = useLightbox();

const currentAttachment = computed(() => {
  return state.attachments[state.currentIndex];
});

// Handle keyboard navigation
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (!state.isOpen) return;

    switch (e.key) {
      case 'ArrowLeft':
        prev();
        break;
      case 'ArrowRight':
        next();
        break;
      case 'Escape':
        close();
        break;
    }
  };

  document.addEventListener('keydown', handleKeydown);
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
  });
});
</script>
