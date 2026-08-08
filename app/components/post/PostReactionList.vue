<template>
  <div
    v-if="reactions.length > 0 || showAddButton"
    class="flex items-center gap-1.5 flex-wrap"
  >
    <!-- Add reaction button (client-only to avoid Teleport to body SSR issues) -->
    <ClientOnly>
      <PopoverRoot v-if="showAddButton" v-model:open="showReactionPicker">
        <PopoverTrigger
          class="btn btn-ghost btn-xs h-7 gap-1 px-2"
          aria-label="Add reaction"
        >
          <IconSmilePlus class="h-3.5 w-3.5" />
          <span class="text-xs">React</span>
        </PopoverTrigger>

        <PopoverPortal>
          <PopoverContent
            class="reaction-popover-content z-50 rounded-box border border-base-300/70 bg-base-100 p-3 shadow-lg"
            :side-offset="8"
            side="top"
            align="start"
            :collision-padding="16"
          >
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="reaction in availableReactions"
                :key="reaction.symbol"
                type="button"
                class="flex flex-col items-center gap-2 rounded-box p-3 transition-colors hover:bg-base-200"
                :class="{ 'bg-primary/10': isReactionSelected(reaction.symbol) }"
                :aria-label="reaction.label"
                :aria-pressed="isReactionSelected(reaction.symbol)"
                @click.stop="addReaction(reaction.symbol)"
              >
                <img
                  :src="`/images/stickers/${reaction.symbol}.webp`"
                  :alt="reaction.label"
                  class="h-10 w-10 object-contain"
                />
                <span class="text-xs font-medium text-base-content/70">
                  {{ reaction.label }}
                </span>
              </button>
            </div>
            <PopoverArrow class="fill-base-100" />
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </ClientOnly>

    <!-- Reaction chips -->
    <button
      v-for="reaction in displayReactions"
      :key="reaction.symbol"
      type="button"
      class="inline-flex h-7 items-center gap-1 rounded-box px-2 text-xs font-medium transition-colors"
      :class="
        reaction.userReacted
          ? 'bg-primary/15 text-primary'
          : 'bg-base-200 text-base-content/70 hover:bg-base-300'
      "
      @click.stop="toggleReaction(reaction)"
    >
      <img
        v-if="hasSticker(reaction.symbol)"
        :src="getStickerUrl(reaction.symbol)"
        :alt="getReactionLabel(reaction.symbol)"
        class="w-5 h-5 object-contain"
      />
      <span v-else class="text-base">{{
        getReactionEmoji(reaction.symbol)
      }}</span>
      <span>{{ reaction.count }}</span>
    </button>

    <!-- More reactions indicator -->
    <button
      v-if="reactions.length > maxVisible"
      type="button"
      class="inline-flex h-7 items-center rounded-box bg-base-200 px-2 text-xs font-medium text-base-content/70 hover:bg-base-300"
      @click.stop="showAll = !showAll"
    >
      +{{ reactions.length - maxVisible }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { IconSmilePlus } from "#components";
import { camelToSnakeStr } from "~/utils/case";
import {
  PopoverArrow,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from "reka-ui";

interface Reaction {
  symbol: string;
  attitude: number;
  count: number;
  userReacted?: boolean;
}

interface Props {
  reactions: Reaction[];
  postId: string;
  showAddButton?: boolean;
  maxVisible?: number;
}

const props = withDefaults(defineProps<Props>(), {
  showAddButton: true,
  maxVisible: 5,
});

const emit = defineEmits<{
  react: [symbol: string, attitude: number];
  remove: [symbol: string];
}>();

const showReactionPicker = ref(false);
const showAll = ref(false);

const availableReactions = [
  { symbol: "thumb_up", emoji: "👍", label: "Like" },
  { symbol: "heart", emoji: "❤️", label: "Love" },
  { symbol: "clap", emoji: "👏", label: "Clap" },
  { symbol: "party", emoji: "🎉", label: "Party" },
  { symbol: "laugh", emoji: "😂", label: "Laugh" },
  { symbol: "cry", emoji: "😢", label: "Cry" },
  { symbol: "angry", emoji: "😠", label: "Angry" },
  { symbol: "confuse", emoji: "😕", label: "Confused" },
  { symbol: "pray", emoji: "🙏", label: "Pray" },
];

const stickerSymbols = new Set([
  "thumb_up",
  "heart",
  "clap",
  "party",
  "laugh",
  "cry",
  "angry",
  "confuse",
  "pray",
  "thumb_down",
  "thinking",
  "speechless",
  "hello",
  "eat",
  "onegai",
  "sleepy",
  "sorry",
]);

const displayReactions = computed(() => {
  if (showAll.value) return props.reactions;
  return props.reactions.slice(0, props.maxVisible);
});

function normalizeSymbol(symbol: string): string {
  return camelToSnakeStr(symbol).toLowerCase();
}

function hasSticker(symbol: string): boolean {
  return stickerSymbols.has(normalizeSymbol(symbol));
}

function getStickerUrl(symbol: string): string {
  return `/images/stickers/${normalizeSymbol(symbol)}.webp`;
}

function getReactionLabel(symbol: string): string {
  const normalized = normalizeSymbol(symbol);
  const reaction = availableReactions.find((r) => r.symbol === normalized);
  return reaction?.label || symbol;
}

function getReactionEmoji(symbol: string): string {
  const normalized = normalizeSymbol(symbol);
  const reaction = availableReactions.find((r) => r.symbol === normalized);
  return reaction?.emoji || "❓";
}

function toggleReaction(reaction: Reaction) {
  if (reaction.userReacted) {
    emit("remove", reaction.symbol);
  } else {
    emit("react", reaction.symbol, reaction.attitude || 0);
  }
}

function isReactionSelected(symbol: string): boolean {
  return props.reactions.some(
    (reaction) => reaction.symbol === symbol && reaction.userReacted,
  );
}

function addReaction(symbol: string) {
  if (isReactionSelected(symbol)) {
    emit("remove", symbol);
  } else {
    emit("react", symbol, 0);
  }
  showReactionPicker.value = false;
}

</script>

<style scoped>
:global(.reaction-popover-content) {
  transform-origin: var(--reka-popover-content-transform-origin);
}

:global(.reaction-popover-content[data-state="open"]) {
  animation: reactionPopoverOpen 160ms ease-out;
}

:global(.reaction-popover-content[data-state="closed"]) {
  animation: reactionPopoverClose 100ms ease-in;
}

@keyframes reactionPopoverOpen {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes reactionPopoverClose {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.96) translateY(4px);
  }
}
</style>
