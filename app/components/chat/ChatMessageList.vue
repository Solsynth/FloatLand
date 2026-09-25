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

    <div class="px-3 py-2">
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
        <!-- DMs: no avatars, own bubbles on the right (classic messenger). -->
        <template v-if="room.type === 1">
          <template v-for="(message, index) in threadNewestLast" :key="message.id">
            <ChatMessageBubble
              :id="`chat-message-${message.id}`"
              :message="message"
              :room="room"
              :show-sender="false"
              :connects-above="connectsAbove(message, index)"
              :connects-below="connectsBelow(message, index)"
              :replying-to="resolveReply(message)"
              @reply="emit('reply', $event)"
              @thread="emit('thread', $event)"
              @edit="emit('edit', $event)"
              @delete="emit('delete', $event)"
              @react="emit('react', $event)"
              @pin="emit('pin', $event)"
            />
          </template>
        </template>

        <!-- Group chats: sticky-avatar stacks, Solian bubble style. -->
        <template v-else>
          <template v-for="group in groups" :key="group.messages[0].id">
            <!-- Avatar sits in its own grid column spanning the whole group,
                 pinned to the top of the list while the group scrolls past. -->
            <div class="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2">
              <div
                v-if="groupShowsSender(group)"
                class="sticky top-3 z-10 h-8 w-8 self-start"
              >
                <div class="avatar">
                  <div class="h-8 w-8 rounded-full">
                    <FileImage
                      v-if="groupAvatarId(group)"
                      :file="{ id: groupAvatarId(group) }"
                      :alt="groupSenderName(group)"
                      class="h-full w-full rounded-full object-cover"
                    />
                    <div v-else class="flex h-full w-full items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                      {{ groupInitials(group) }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else />

              <div class="min-w-0">
                <ChatMessageBubble
                  v-for="(message, messageIndex) in group.messages"
                  :id="`chat-message-${message.id}`"
                  :key="message.id"
                  :message="message"
                  :room="room"
                  :avatar-gutter="false"
                  :show-sender="messageIndex === 0 && groupShowsSender(group)"
                  :connects-above="messageIndex > 0"
                  :connects-below="messageIndex < group.messages.length - 1"
                  :replying-to="resolveReply(message)"
                  @reply="emit('reply', $event)"
                  @thread="emit('thread', $event)"
                  @edit="emit('edit', $event)"
                  @delete="emit('delete', $event)"
                  @react="emit('react', $event)"
                  @pin="emit('pin', $event)"
                />
              </div>
            </div>
          </template>
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
import { FileImage } from "#components";
import type { SnChatRoom, SnChatMessage } from "~/types/chat";

interface MessageGroup {
  messages: SnChatMessage[];
}

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
const threadNewestLast = computed(() =>
  messages.value.slice().reverse().filter(shouldShowMessage),
);
const messageStatus = computed(() => state.messageStatus[props.roomId] ?? "idle");
const olderStatus = computed(() => state.olderStatus[props.roomId] ?? "idle");
const typingUsers = computed(() => typingFor(props.roomId));

const selfId = computed(() => user.value?.id ?? "");

// ── Visibility filter (Solian parity) ───────────────────────────────────
// Some rows are not timeline content: `messages.*` envelopes exist only to
// sync/update other rows, and system.* types outside the user-facing set are
// internal markers. Placeholders are only meaningful while the sender's own
// upload/stream is in flight — expired rows and unknown kinds are dropped.

const DISPLAYABLE_SYSTEM_TYPES = new Set([
  "system.member.joined",
  "system.member.left",
  "system.chat.updated",
  "system.e2ee.enabled",
  "system.e2ee.rotate_required",
  "system.e2ee.history_unavailable",
  "system.call.member.joined",
  "system.call.member.left",
  "system.member.timed_out",
  "system.member.timeout_removed",
]);

function shouldShowMessage(message: SnChatMessage): boolean {
  const type = message.type
  if (type.startsWith("messages.")) return false
  if (type.startsWith("system.") && !DISPLAYABLE_SYSTEM_TYPES.has(type)) return false
  if (type !== "placeholder") return true

  // Upload/streaming placeholders belong to the sender only.
  if (message.senderId && message.senderId !== selfId.value) return false
  const kind = message.meta?.placeholderKind?.toString() ?? ""
  if (kind !== "streaming" && kind !== "uploading") return false
  const expiresAt = message.meta?.placeholderExpiresAt
  if (typeof expiresAt === "string" && expiresAt) {
    const at = new Date(expiresAt).getTime()
    if (Number.isFinite(at) && at <= Date.now()) return false
  }
  return true
}

// ── Grouping (Solian parity) ────────────────────────────────────────────
// A group is consecutive messages from the same sender within 3 minutes.
// Deleted messages and missing/invalid timestamps always break the group —
// that avoids silently merging rows that should stand apart.

function isDeleted(message: SnChatMessage): boolean {
  return Boolean(message.deletedAt)
}

function isSystemType(message: SnChatMessage): boolean {
  return message.senderId === "system" || message.type.startsWith("system.")
}

function inSameGroup(a: SnChatMessage, b: SnChatMessage | null): boolean {
  if (!b) return false
  if (isDeleted(a) || isDeleted(b)) return false
  if (isSystemType(a) || isSystemType(b)) return false
  if (a.type === "placeholder" || b.type === "placeholder") return false
  if (!a.senderId || a.senderId !== b.senderId) return false
  const at = new Date(a.createdAt ?? "").getTime()
  const bt = new Date(b.createdAt ?? "").getTime()
  if (!Number.isFinite(at) || !Number.isFinite(bt)) return false
  return Math.abs(at - bt) <= 3 * 60 * 1000
}

/** Runs of grouped messages, oldest first. */
const groups = computed<MessageGroup[]>(() => {
  const rows = threadNewestLast.value
  const result: MessageGroup[] = []
  for (let i = 0; i < rows.length; i++) {
    const message = rows[i]
    const previous = i > 0 ? rows[i - 1] : null
    if (!previous || !inSameGroup(previous, message)) {
      result.push({ messages: [message] })
    } else {
      result[result.length - 1].messages.push(message)
    }
  }
  return result
})

/** DM adjacency (no avatars, but bubbles still connect within a run).
 * `threadNewestLast` renders oldest-first, so the row visually above `index`
 * is `index - 1` and the one below is `index + 1`. */
function connectsAbove(message: SnChatMessage, index: number): boolean {
  return inSameGroup(message, threadNewestLast.value[index - 1] ?? null)
}

function connectsBelow(message: SnChatMessage, index: number): boolean {
  return inSameGroup(message, threadNewestLast.value[index + 1] ?? null)
}

/** Whether a group's oldest message carries the avatar + sender header. */
function groupShowsSender(group: MessageGroup): boolean {
  const first = group.messages[0]
  if (isDeleted(first)) return false
  if (isSystemType(first) || first.type === "placeholder") return false
  if (first.senderId === selfId.value) return false
  return true
}

function groupSenderName(group: MessageGroup): string {
  const member = group.messages[0].sender
  if (!member) return ""
  return member.nick || member.account?.nick || member.account?.name || ""
}

function groupInitials(group: MessageGroup): string {
  return (groupSenderName(group) || "?").slice(0, 2).toUpperCase()
}

function groupAvatarId(group: MessageGroup): string | null {
  return group.messages[0].sender?.account?.profile?.picture?.id ?? null
}

function resolveReply(message: SnChatMessage): SnChatMessage | null {
  if (!message.repliedMessageId) return null
  return findMessage(props.roomId, message.repliedMessageId)
}

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
