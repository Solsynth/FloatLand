<template>
  <div
    v-if="open"
    class="absolute bottom-full left-0 right-0 z-30 mb-2 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-lg"
  >
    <div v-if="status === 'loading'" class="flex justify-center py-6">
      <span class="loading loading-spinner loading-sm" />
    </div>
    <div v-else-if="status === 'error' || !packs.length" class="py-6 text-center text-xs text-base-content/50">
      {{ t("chat.noStickers") }}
    </div>
    <template v-else>
      <!-- Pack tabs -->
      <div class="mb-2 flex gap-1 overflow-x-auto scrollbar-none">
        <button
          v-for="(pack, index) in packs"
          :key="pack.id"
          type="button"
          class="btn btn-sm border-none px-3 text-xs"
          :class="activeIndex === index ? 'btn-primary' : 'btn-ghost'"
          @click="activeIndex = index"
        >
          {{ pack.name }}
        </button>
      </div>
      <!-- Sticker grid -->
      <div class="grid max-h-56 grid-cols-6 gap-1.5 overflow-y-auto">
        <template v-if="activePack">
          <button
            v-for="sticker in activePack.stickers"
            :key="sticker.id"
            type="button"
            class="flex items-center justify-center rounded-lg p-1 transition-colors hover:bg-base-200"
            @click="onPick(activePack, sticker)"
          >
            <img
              v-if="sticker.image?.id"
              :src="getFileUrl(sticker.image.id) ?? ''"
              :alt="sticker.name || sticker.slug"
              class="h-10 w-10 object-contain"
              loading="lazy"
            />
            <span v-else class="text-lg">{{ sticker.slug[0]?.toUpperCase() }}</span>
          </button>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ChatStickerPack, ChatSticker } from "~/utils/api";
import { getFileUrl } from "~/utils/files";

const props = defineProps<{
  open: boolean;
  roomId: string;
}>();

const emit = defineEmits<{ pick: [pack: ChatStickerPack, sticker: ChatSticker] }>();

const { t } = useI18n();
const { state, loadStickerPacks, sendSticker } = useChat();

const activeIndex = ref(0);

const packs = computed(() => state.stickerPacks);
const status = computed(() => state.stickerStatus);
const activePack = computed(() => packs.value[activeIndex.value] ?? null);

watch(
  () => props.open,
  (open) => {
    if (open) void loadStickerPacks()
  },
  { immediate: true },
)

function onPick(pack: ChatStickerPack, sticker: ChatSticker): void {
  void sendSticker(props.roomId, pack, sticker)
  emit("pick", pack, sticker)
}
</script>
