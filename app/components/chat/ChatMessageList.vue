<template>
  <div ref="scrollContainer" class="h-full overflow-y-auto scrollbar-thin">
    <!-- Older history -->
    <div class="px-4 pt-3 text-center">
      <button
        v-if="olderStatus === 'idle'"
        type="button"
        class="btn btn-ghost btn-xs"
        @click="loadOlderClick"
      >
        {{ t("chat.loadOlder") }}
      </button>
      <span v-else-if="olderStatus === 'loading'" class="loading loading-spinner loading-xs text-base-content/40" />
      <span v-else-if="olderStatus === 'done'" class="text-[11px] text-base-content/30">
        {{ t("chat.historyStart") }}
      </span>
    </div>

    <div class="px-3 py-2 sm:px-4">
      <template v-if="messageStatus === 'loading' && messages.length === 0">
        <div v-for="index in 5" :key="index" class="flex gap-3 py-2" :class="index % 2 ? 'justify-end' : ''">
          <div class="skeleton h-12 w-2/3 rounded-box" />
        </div>
      </template>

      <template v-else-if="messageStatus === 'error' && messages.length === 0">
        <div class="py-10 text-center">
          <p class="text-sm text-base-content/50">{{ t("chat.messagesLoadFailed") }}</p>
          <button type="button" class="btn btn-ghost btn-sm mt-3" @click="loadNewest(roomId)">
            {{ t("chat.retry") }}
          </button>
        </div>
      </template>

      <template v-else>
        <!-- The store keeps threads newest-first (paging-friendly); the view
             renders them oldest-first so the newest message sits at the
             bottom, pinned by the scroll-to-bottom behavior. -->
        <template v-for="(message, index) in threadNewestLast" :key="message.id">
          <div
            v-if="showDateSeparator(message, index)"
            class="my-5 flex items-center gap-3"
          >
            <span class="h-px flex-1 bg-base-300/70" />
            <span class="text-[11px] font-medium text-base-content/40">
              {{ dateLabel(message.createdAt ?? "") }}
            </span>
            <span class="h-px flex-1 bg-base-300/70" />
          </div>
          <ChatMessageBubble
            :id="`chat-message-${message.id}`"
            :message="message"
            :room="room"
            :show-sender="showSender(message, index)"
            :replying-to="resolveReply(message)"
            @reply="emit('reply', $event)"
            @thread="emit('thread', $event)"
            @edit="emit('edit', $event)"
            @delete="emit('delete', $event)"
            @react="emit('react', $event)"
            @pin="emit('pin', $event)"
          />
        </template>

        <!-- Typing indicator -->
        <div v-if="typingUsers.length" class="flex items-center gap-2 py-2 pl-1">
          <div class="avatar avatar-placeholder">
            <div class="w-7 rounded-full bg-base-300" />
          </div>
          <div class="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-base-300 bg-base-100 px-3 py-2">
            <span v-for="dot in 3" :key="dot" class="h-1.5 w-1.5 animate-bounce rounded-full bg-base-content/40" :style="{ animationDelay: `${dot * 0.15}s` }" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SnChatRoom, SnChatMessage } from "~/types/chat";
import { isSameDay, formatChatDate } from "~/utils/datetime";

const props = defineProps<{
  room: SnChatRoom;
  roomId: string;
}>();

const emit = defineEmits<{
  reply: [message: SnChatMessage];
  thread: [message: SnChatMessage];
  edit: [message: SnChatMessage];
  delete: [message: SnChatMessage];
  react: [message: SnChatMessage];
  pin: [message: SnChatMessage];
}>();

const { t } = useI18n();
const { state, messagesFor, typingFor, loadNewest, loadOlder, findMessage } = useChat();
const { user } = useAuth();

const scrollContainer = ref<HTMLElement | null>(null);
let stickToBottom = true;

const messages = computed(() => messagesFor(props.roomId));
/** Chronological order for rendering (oldest at top, newest at bottom). */
const threadNewestLast = computed(() => messages.value.slice().reverse());
const messageStatus = computed(() => state.messageStatus[props.roomId] ?? "idle");
const olderStatus = computed(() => state.olderStatus[props.roomId] ?? "idle");
const typingUsers = computed(() => typingFor(props.roomId));

/** Load an older page, keeping the scroll position anchored to the visible row. */
async function loadOlderClick(): Promise<void> {
  const el = scrollContainer.value
  const previousHeight = el?.scrollHeight ?? 0
  await loadOlder(props.roomId)
  if (el) {
    nextTick(() => {
      el.scrollTop += el.scrollHeight - previousHeight
    })
  }
}

const selfId = computed(() => user.value?.id ?? "");

function showSender(message: SnChatMessage, index: number): boolean {
  if (props.room.type === 1) return false
  if (message.senderId === selfId.value) return false
  if (message.deletedAt) return false
  // `index` is in render order (oldest first); the previous row is above.
  const previous = threadNewestLast.value[index + 1]
  if (!previous) return true
  if (previous.senderId !== message.senderId) return true
  const gap = new Date(message.createdAt ?? "").getTime() - new Date(previous.createdAt ?? "").getTime()
  return gap > 3 * 60 * 1000
}

function dateLabel(dateStr: string): string {
  return formatChatDate(dateStr)
}

function showDateSeparator(message: SnChatMessage, index: number): boolean {
  const previous = threadNewestLast.value[index + 1]
  if (!previous) return true
  return !isSameDay(message.createdAt ?? "", previous.createdAt ?? "")
}

function resolveReply(message: SnChatMessage): SnChatMessage | null {
  if (!message.repliedMessageId) return null
  return findMessage(props.roomId, message.repliedMessageId)
}

function onScroll(): void {
  const el = scrollContainer.value
  if (!el) return
  stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
}

function scrollToBottom(behavior: ScrollBehavior = "auto"): void {
  const el = scrollContainer.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior })
}

let lastMessageCount = 0

watch(messages, () => {
  nextTick(() => {
    const grew = messages.value.length > lastMessageCount
    const newest = messages.value[0]
    // Pending own messages and live peer rows push the thread; follow when
    // pinned to bottom (or when the newest row is our own optimistic send).
    const isOwn = newest?.status === "pending"
    if (grew && (stickToBottom || isOwn)) scrollToBottom()
    lastMessageCount = messages.value.length
  })
})

watch(
  () => props.roomId,
  () => {
    lastMessageCount = 0
    stickToBottom = true
    nextTick(() => scrollToBottom())
  },
)

onMounted(() => {
  const el = scrollContainer.value
  if (!el) return
  el.addEventListener("scroll", onScroll, { passive: true })
})

onBeforeUnmount(() => {
  const el = scrollContainer.value
  el?.removeEventListener("scroll", onScroll)
})
</script>
