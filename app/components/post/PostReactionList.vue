<template>
  <div
    v-if="reactions.length > 0 || showAddButton"
    class="flex items-center gap-1.5 flex-wrap"
  >
    <!-- Add reaction button (client-only to avoid Teleport to body SSR issues) -->
    <ClientOnly>
      <PopoverRoot v-if="showAddButton" v-model:open="showReactionPicker">
        <PopoverTrigger class="btn btn-ghost btn-xs gap-1 h-7 px-2">
          <IconSmilePlus class="h-3.5 w-3.5" />
          <span class="text-xs">React</span>
        </PopoverTrigger>

        <PopoverPortal>
          <PopoverContent
            class="bg-base-100 rounded-box shadow-sm p-3 z-50"
            :side-offset="8"
            align="center"
            :collision-padding="16"
          >
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="emoji in availableReactions"
                :key="emoji.symbol"
                class="flex flex-col items-center gap-2 p-3 rounded-box hover:bg-base-200 transition-colors"
                @click.stop="addReaction(emoji.symbol)"
              >
                <img
                  :src="`/images/stickers/${emoji.symbol}.webp`"
                  :alt="emoji.label"
                  class="w-10 h-10 object-contain"
                />
                <span class="text-xs font-medium text-base-content/70">
                  {{ emoji.label }}
                </span>
              </button>
            </div>
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </ClientOnly>

    <!-- Reaction chips -->
    <button
      v-for="reaction in displayReactions"
      :key="reaction.symbol"
      class="inline-flex items-center gap-1 h-7 px-2 rounded-box text-xs font-medium transition-colors"
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
      class="inline-flex items-center h-7 px-2 rounded-box text-xs font-medium bg-base-200 text-base-content/70 hover:bg-base-300"
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

function addReaction(symbol: string) {
  emit("react", symbol, 0);
  showReactionPicker.value = false;
}
</script>
