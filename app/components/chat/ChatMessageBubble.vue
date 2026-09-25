<template>
  <div
    class="group relative flex gap-2"
    :class="padClass"
  >
    <!-- Avatar gutter (standalone use; the list renders its own sticky stack) -->
    <div v-if="avatarGutter && !isDm && !isSystem" class="w-8 shrink-0">
      <div v-if="showSender" class="avatar">
        <div class="h-8 w-8 rounded-full">
          <FileImage
            v-if="senderAvatarId"
            :file="{ id: senderAvatarId }"
            :alt="senderName"
            class="h-full w-full rounded-full object-cover"
          />
          <div v-else class="flex h-full w-full items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
            {{ senderInitials }}
          </div>
        </div>
      </div>
    </div>

    <!-- Content column -->
    <div class="min-w-0 flex-1">
      <!-- System notice (member joined/left, E2EE, call events, …) -->
      <div v-if="isSystem" class="flex justify-center px-2 py-1">
        <div class="flex max-w-full items-center gap-1.5 rounded-full bg-base-200/60 px-3 py-1 text-[11px] text-base-content/45">
          <component :is="systemIcon" class="h-3.5 w-3.5 shrink-0" />
          <span class="min-w-0 truncate">{{ message.content || t("chat.systemEvent") }}</span>
        </div>
      </div>

      <!-- Upload / streaming placeholder (own row, pending) -->
      <div v-else-if="isPlaceholder" class="flex items-end gap-1.5" :class="isOwnRightSide ? 'justify-end' : ''">
        <div class="w-fit max-w-[42rem] rounded-2xl bg-primary/15 px-2.5 py-1.5">
          <p v-if="placeholderContent" class="whitespace-pre-wrap break-words text-sm leading-relaxed text-base-content/60">
            {{ placeholderContent }}
          </p>
          <div class="mt-1 flex items-center gap-1.5 text-[10px] text-base-content/45">
            <span class="loading loading-spinner loading-xs" />
            <span>{{ placeholderLabel }}</span>
            <span v-if="placeholderProgress !== null" class="tabular-nums">{{ placeholderProgress }}%</span>
          </div>
        </div>
      </div>

      <!-- Normal message -->
      <template v-else>
        <!-- Sender header (first of a group) -->
        <div v-if="showSender && !isDm" class="mb-1 flex items-baseline gap-2">
          <span class="truncate text-sm font-semibold text-base-content/70">
            {{ senderName }}
          </span>
          <span class="shrink-0 text-[10px] font-medium text-base-content/40 tabular-nums">
            {{ fullTimeLabel }}
          </span>
        </div>

        <!-- Deleted (no bubble) -->
        <p v-if="message.deletedAt" class="py-0.5 text-xs italic text-base-content/40">
          {{ t("chat.messageDeleted") }}
        </p>

        <!-- Bubble + indicators -->
        <template v-else>
        <div class="flex items-end gap-1.5" :class="isOwnRightSide ? 'justify-end' : ''">
          <div
            class="w-fit max-w-[42rem] rounded-2xl px-2.5 py-1.5"
            :class="bubbleClass"
          >
            <!-- Reply quote -->
            <button
              v-if="replyingTo"
              type="button"
              class="mb-1.5 flex max-w-full items-center gap-2 rounded-lg border-l-2 border-primary/50 bg-base-100/50 px-2 py-1 text-left"
              @click="scrollToMessage(replyingTo.id)"
            >
              <span class="min-w-0 flex-1 truncate text-xs">
                <span class="font-semibold text-primary">{{ replyAuthorLabel }}</span>
                <span class="text-base-content/60"> — </span>
                <span class="inline-flex min-w-0 items-center gap-1 text-base-content/60">
                  <IconPaperclip v-if="replyPreviewIsAttachment" class="h-3 w-3 shrink-0" />
                  <span class="truncate">{{ replyPreview }}</span>
                </span>
              </span>
            </button>

            <!-- Sticker -->
            <FileImage
              v-if="stickerImageId"
              :file="{ id: stickerImageId }"
              :alt="t('chat.sticker')"
              class="block h-24 w-24 rounded-md object-contain"
            />

            <!-- Voice -->
            <div v-else-if="isVoice" class="flex max-w-72 items-center gap-2 rounded-md border border-base-300/70 bg-base-100/50 px-2.5 py-1.5">
              <button type="button" class="btn btn-circle btn-xs btn-primary" @click="toggleVoice">
                <IconPlay v-if="!voicePlaying" class="h-3 w-3" />
                <IconPause v-else class="h-3 w-3" />
              </button>
              <div class="h-1 flex-1 rounded-full bg-base-300" />
              <span class="text-[10px] text-base-content/50 tabular-nums">{{ voiceDurationLabel }}</span>
            </div>

            <!-- Attachments -->
            <div v-else-if="message.attachments?.length" class="space-y-1.5">
              <div v-if="imageAttachments.length" class="flex max-w-md flex-wrap gap-1.5">
                <a
                  v-for="attachment in imageAttachments"
                  :key="attachment.id"
                  :href="fileUrl(attachment.id)"
                  target="_blank"
                  rel="noopener"
                  class="block overflow-hidden rounded-lg"
                >
                  <FileImage :file="{ id: attachment.id }" :alt="attachment.name || t('chat.attachment')" class="h-32 w-32 rounded-lg object-cover transition-transform hover:scale-105" />
                </a>
              </div>
              <a
                v-for="attachment in fileAttachments"
                :key="attachment.id"
                :href="fileUrl(attachment.id)"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 rounded-md border border-base-300/70 bg-base-100/50 px-2.5 py-1.5 text-xs hover:bg-base-200/60"
              >
                <IconFileText class="h-4 w-4 shrink-0" />
                <span class="max-w-56 truncate">{{ attachment.name || t("chat.attachment") }}</span>
              </a>
            </div>

            <!-- Text (skipped when a sticker image resolved — the content
                 is the `:prefix+slug:` placeholder itself) -->
            <p
              v-if="message.content && !stickerImageId"
              class="whitespace-pre-wrap break-words text-sm leading-relaxed"
              :class="isPending ? 'opacity-60' : ''"
            >
              {{ message.content }}
            </p>

            <!-- Reactions (inside the bubble) -->
            <div v-if="reactionSymbols.length" class="mt-1 flex flex-wrap gap-1">
              <button
                v-for="symbol in reactionSymbols"
                :key="symbol"
                type="button"
                class="badge gap-1 border-none px-2 text-[11px] transition-colors"
                :class="madeReactions[symbol] ? 'badge-primary' : 'badge-ghost bg-base-100/60 hover:bg-base-300/60'"
                @click="toggleReaction(symbol)"
              >
                <span>{{ symbol }}</span>
                <span class="font-bold">{{ reactionCounts[symbol] }}</span>
              </button>
            </div>
          </div>

          <!-- Indicators (pending / edited) -->
          <div class="flex shrink-0 flex-col items-start gap-1 text-[10px] text-base-content/40">
            <span v-if="isPending" class="flex items-center gap-1 whitespace-nowrap">
              <span class="loading loading-spinner loading-xs" />
              {{ t("chat.sending") }}
            </span>
            <span v-else-if="message.editedAt" class="italic whitespace-nowrap">{{ t("chat.edited") }}</span>
          </div>
        </div>
        </template>
      </template>
    </div>

    <!-- Hover actions -->
    <div
      v-if="!message.deletedAt && !isSystem && !isPlaceholder"
      class="absolute -top-2.5 right-3 z-20 hidden items-center gap-0.5 rounded-md border border-base-300 bg-base-100 p-0.5 shadow-md group-hover:flex"
      @click.stop
    >
      <button type="button" class="btn btn-ghost btn-circle btn-xs" :title="t('chat.react')" @click="reactionPickerOpen = true">
        <IconSmile class="h-3.5 w-3.5" />
      </button>
      <button type="button" class="btn btn-ghost btn-circle btn-xs" :title="t('chat.reply')" @click="emit('reply', message)">
        <IconReply class="h-3.5 w-3.5" />
      </button>
      <button v-if="threadRepliesCount > 0" type="button" class="btn btn-ghost btn-circle btn-xs" :title="t('chat.thread')" @click="emit('thread', message)">
        <IconMessageSquare class="h-3.5 w-3.5" />
        <span class="text-[10px] font-bold">{{ threadRepliesCount }}</span>
      </button>
      <button v-if="isOwn" type="button" class="btn btn-ghost btn-circle btn-xs" :title="t('chat.edit')" @click="emit('edit', message)">
        <IconPencil class="h-3.5 w-3.5" />
      </button>
      <button v-if="isOwn" type="button" class="btn btn-ghost btn-circle btn-xs hover:!bg-error/10 hover:!text-error" :title="t('chat.delete')" @click="emit('delete', message)">
        <IconTrash2 class="h-3.5 w-3.5" />
      </button>
      <button type="button" class="btn btn-ghost btn-circle btn-xs" :title="t('chat.pin')" @click="emit('pin', message)">
        <IconPin class="h-3.5 w-3.5" />
      </button>
    </div>

    <!-- Reaction picker popover -->
    <ChatReactionPicker
      v-model:open="reactionPickerOpen"
      :room-id="room.id"
      :message="message"
      align="right"
      class="-top-12"
      @click.stop
      @pick="toggleReaction"
    />
  </div>
</template>

<script setup lang="ts">
import { IconPlay, IconPause, IconFileText, IconPaperclip, IconSmile, IconReply, IconMessageSquare, IconPencil, IconTrash2, IconPin, IconUsers, IconLock, IconAlertCircle, IconInfo } from "#components";
import type { Component } from "vue";
import type { SnChatRoom, SnChatMessage } from "~/types/chat";
import { getFileUrl } from "~/utils/files";
import { formatTime } from "~/utils/datetime";

const props = withDefaults(defineProps<{
  message: SnChatMessage;
  room: SnChatRoom;
  showSender?: boolean;
  /** A same-sender bubble sits directly above (connect the top corner). */
  connectsAbove?: boolean;
  /** A same-sender bubble sits directly below (connect the bottom corner). */
  connectsBelow?: boolean;
  /** Render the internal avatar gutter (standalone use, e.g. thread panel). */
  avatarGutter?: boolean;
  replyingTo?: SnChatMessage | null;
}>(), {
  avatarGutter: true,
});

const emit = defineEmits<{
  reply: [message: SnChatMessage];
  thread: [message: SnChatMessage];
  edit: [message: SnChatMessage];
  delete: [message: SnChatMessage];
  react: [message: SnChatMessage];
  pin: [message: SnChatMessage];
}>();

const { t } = useI18n();
const { user } = useAuth();
const { state, voiceUrlOf, voiceDurationOf, react, resolveStickerImage } = useChat();

const reactionPickerOpen = ref(false);
const voicePlaying = ref(false);

const selfId = computed(() => user.value?.id ?? "");
const isOwn = computed(() => props.message.senderId === selfId.value);
const isPending = computed(() => props.message.status === "pending");
const isDm = computed(() => props.room.type === 1);

// DMs use the classic messenger layout: own bubbles on the right (and their
// connecting corners on that side), everyone else on the left. Group chats
// follow the Solian bubble style: all bubbles left-aligned with an avatar
// gutter, so connecting corners are always on the avatar side.
const isOwnRightSide = computed(() => isOwn.value && isDm.value);

// ── System + placeholder messages ───────────────────────────────────────
// System events (member joined/left, E2EE, call events, …) carry
// `type: "system.*"` with a `system` sender; they render as a centered
// muted notice, never as a user bubble. Upload/streaming placeholders
// (`type: "placeholder"`) render as a pending own row with progress.
const isSystem = computed(() =>
  props.message.senderId === "system" || props.message.type.startsWith("system."),
);

const isPlaceholder = computed(() => props.message.type === "placeholder");

const placeholderContent = computed(() =>
  props.message.meta?.placeholderContent?.toString() ?? "",
);

const placeholderKind = computed(() =>
  props.message.meta?.placeholderKind?.toString() ?? "",
);

const placeholderProgress = computed(() => {
  const value = Number(props.message.meta?.placeholderProgress)
  return Number.isFinite(value) && value >= 0 && value <= 100 ? Math.round(value) : null
});

const placeholderLabel = computed(() =>
  placeholderKind.value === "streaming"
    ? t("chat.streaming")
    : t("chat.uploading"),
);

const systemIcon = computed<Component>(() => {
  const type = props.message.type
  if (type.startsWith("system.e2ee")) return IconLock
  if (type.startsWith("system.chat")) return IconPencil
  if (type.startsWith("system.member")) return IconUsers
  if (type.startsWith("system.call")) return IconAlertCircle
  return IconInfo
});

/** Group members sit close together; the group's outer edges keep the gap. */
const padClass = computed(() => [
  props.connectsAbove ? "pt-px" : "pt-1.5",
  props.connectsBelow ? "pb-px" : "pb-1.5",
].join(" "));

/** Messenger bubble: rounded-2xl, corner squared where the group connects. */
const bubbleClass = computed(() => {
  const classes = [isOwn.value ? "bg-primary/15" : "bg-base-200"]
  if (props.connectsAbove) {
    classes.push(isOwnRightSide.value ? "rounded-tr-none" : "rounded-tl-none")
  }
  if (props.connectsBelow) {
    classes.push(isOwnRightSide.value ? "rounded-br-none" : "rounded-bl-none")
  }
  return classes.join(" ")
});

const senderName = computed(() => {
  const member = props.message.sender
  if (!member) return ""
  return member.nick || member.account?.nick || member.account?.name || ""
});

const senderInitials = computed(() => (senderName.value || "?").slice(0, 2).toUpperCase());

const senderAvatarId = computed(() => {
  return props.message.sender?.account?.profile?.picture?.id ?? null
});

const fullTimeLabel = computed(() => formatTime(props.message.createdAt ?? ""));

const isVoice = computed(() => props.message.type === "voice" || Boolean(voiceUrlOf(props.message)));
const voiceDurationLabel = computed(() => {
  const ms = voiceDurationOf(props.message)
  if (!ms) return ""
  const seconds = Math.max(1, Math.round(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
});

const imageAttachments = computed(() =>
  (props.message.attachments ?? []).filter((attachment) => isImageAttachment(attachment)),
);

const fileAttachments = computed(() =>
  (props.message.attachments ?? []).filter((attachment) => !isImageAttachment(attachment)),
);

function isImageAttachment(attachment: { id: string; name?: string; mimeType?: string }): boolean {
  if (attachment.mimeType) return attachment.mimeType.startsWith("image/")
  const name = attachment.name ?? ""
  return /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i.test(name)
}

function fileUrl(fileId: string): string {
  return getFileUrl(fileId) ?? "#"
}

const reactionCounts = computed(() => props.message.reactionsCount ?? {});
const madeReactions = computed(() => props.message.reactionsMade ?? {});
const reactionSymbols = computed(() => Object.keys(reactionCounts.value).sort());

const threadRepliesCount = computed(() => props.message.threadRepliesCount ?? 0);

const replyAuthorLabel = computed(() => {
  const target = props.replyingTo
  if (!target) return ""
  const member = target.sender
  return member?.nick || member?.account?.nick || member?.account?.name || t("chat.unknownSender")
});

const replyPreviewIsAttachment = computed(() =>
  Boolean(props.replyingTo?.attachments?.length),
);

const replyPreview = computed(() => {
  const target = props.replyingTo
  if (!target) return ""
  if (target.deletedAt) return t("chat.messageDeleted")
  if (voiceUrlOf(target)) return t("chat.voiceMessage")
  if (target.attachments?.length) return target.attachments[0]?.name ?? t("chat.attachment")
  return target.content || t("chat.message")
});

async function toggleReaction(symbol: string): Promise<void> {
  await react(props.room.id, props.message.id, symbol, 1)
}

function toggleVoice(): void {
  voicePlaying.value = !voicePlaying.value
}

function scrollToMessage(messageId: string): void {
  const el = document.getElementById(`chat-message-${messageId}`)
  el?.scrollIntoView({ behavior: "smooth", block: "center" })
}

// Sticker resolution: `:prefix+slug:` content with a memoized drive file id.
const stickerPlaceholder = computed(() => {
  const content = props.message.content ?? ""
  const match = /^:([a-zA-Z0-9_+-]+):$/.exec(content)
  return match ? match[1] : ""
});

const stickerImageId = ref("");

watch(stickerPlaceholder, async (placeholder) => {
  if (!placeholder) {
    stickerImageId.value = ""
    return
  }
  const cached = state.stickerImages[placeholder]
  if (cached) {
    stickerImageId.value = cached
    return
  }
  stickerImageId.value = await resolveStickerImage(placeholder)
}, { immediate: true })
</script>
