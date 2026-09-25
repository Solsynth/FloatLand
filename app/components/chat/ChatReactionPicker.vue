<template>
  <div
    v-if="open"
    class="absolute z-30 rounded-2xl border border-base-300 bg-base-100 p-1.5 shadow-lg"
    :class="align === 'right' ? 'right-0' : 'left-0'"
  >
    <div class="grid grid-cols-8 gap-0.5">
      <button
        v-for="emoji in QUICK_EMOJIS"
        :key="emoji"
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-base-200"
        :class="made[emoji] ? 'bg-primary/15' : ''"
        @click="emit('pick', emoji)"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SnChatMessage } from "~/types/chat";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏"];

const props = withDefaults(
  defineProps<{
    open: boolean;
    roomId: string;
    message: SnChatMessage;
    align?: "left" | "right";
  }>(),
  { align: "left" },
);

const emit = defineEmits<{ pick: [symbol: string] }>();

const made = computed(() => props.message.reactionsMade ?? {});
</script>
