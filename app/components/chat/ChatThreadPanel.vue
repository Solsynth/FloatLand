<template>
  <Transition name="drawer-fade">
    <div
      v-if="open && rootMessage"
      class="fixed inset-0 z-40 bg-black/40"
      @click="$emit('update:open', false)"
    />
  </Transition>
  <Transition name="drawer-slide">
    <aside
      v-if="open && rootMessage"
      class="fixed top-16 right-0 bottom-0 z-50 flex w-96 flex-col border-l border-base-300 bg-base-100 shadow-sm"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-base-300 px-4 py-3">
        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-bold">{{ t("chat.threadTitle") }}</h2>
          <p class="truncate text-xs text-base-content/50">
            {{ rootPreview }}
          </p>
        </div>
        <button type="button" class="btn btn-ghost btn-circle btn-sm shrink-0" @click="$emit('update:open', false)">
          <IconX class="h-4 w-4" />
        </button>
      </div>

      <!-- Root message -->
      <div class="border-b border-base-300 px-4 py-3">
        <ChatMessageBubble :message="rootMessage" :room="room" :show-sender="true" />
      </div>

      <!-- Replies -->
      <div class="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin">
        <div v-if="loading" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-sm" />
        </div>
        <div v-else-if="replies.length === 0" class="py-8 text-center text-xs text-base-content/50">
          {{ t("chat.threadEmpty") }}
        </div>
        <div v-else class="space-y-1">
          <ChatMessageBubble
            v-for="node in replies"
            :key="node.message.id"
            :message="node.message"
            :room="room"
            :show-sender="true"
          />
        </div>
      </div>

      <!-- Thread composer -->
      <ChatComposer :room-id="roomId" :thread-id="rootMessage.id" />
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { IconX } from "#components";
import type { SnChatRoom, SnChatMessage } from "~/types/chat";
import { fetchChatMessageThread } from "~/utils/api";
import type { ThreadReplyNode } from "~/types/chat";

const props = defineProps<{
  open: boolean;
  roomId: string;
  room: SnChatRoom;
  rootMessage: SnChatMessage | null;
}>();

const emit = defineEmits<{ "update:open": [value: boolean] }>();

const { t } = useI18n();
const { state, voiceUrlOf } = useChat();

const loading = ref(false);
const replies = ref<ThreadReplyNode[]>([]);

const rootPreview = computed(() => {
  const message = props.rootMessage
  if (!message) return ""
  if (message.deletedAt) return t("chat.messageDeleted")
  if (voiceUrlOf(message)) return t("chat.voiceMessage")
  return message.content || t("chat.message")
});

async function loadThread(): Promise<void> {
  if (!props.rootMessage) return
  loading.value = true
  try {
    const data = await fetchChatMessageThread(props.roomId, props.rootMessage.id, 100, 0)
    const sorted = [...(data.replies ?? [])].sort((a, b) =>
      (a.message.createdAt ?? "").localeCompare(b.message.createdAt ?? ""),
    )
    replies.value = sorted
  } catch {
    replies.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) void loadThread()
  },
)

// A live reply to the thread lands in the room thread; refresh to show it.
watch(
  () => state.messages[props.roomId]?.length,
  () => {
    if (props.open) debounceLoad()
  },
)

let refreshTimer: ReturnType<typeof setTimeout> | null = null
function debounceLoad(): void {
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => void loadThread(), 800)
}
</script>
