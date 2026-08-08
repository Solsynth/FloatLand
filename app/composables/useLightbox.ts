import type { FileAttachment } from '~/types/post';

interface LightboxState {
  isOpen: boolean;
  attachments: FileAttachment[];
  currentIndex: number;
}

const state = reactive<LightboxState>({
  isOpen: false,
  attachments: [],
  currentIndex: 0,
});

export function useLightbox() {
  function open(attachments: FileAttachment[], index: number = 0) {
    state.attachments = attachments;
    state.currentIndex = Math.max(0, Math.min(index, attachments.length - 1));
    state.isOpen = attachments.length > 0;
  }

  function close() {
    state.isOpen = false;
  }

  function setCurrentIndex(index: number) {
    if (index >= 0 && index < state.attachments.length) {
      state.currentIndex = index;
    }
  }

  return {
    state: readonly(state),
    open,
    close,
    setCurrentIndex,
  };
}
