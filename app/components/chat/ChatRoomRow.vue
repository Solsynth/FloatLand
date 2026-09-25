<template>
  <NuxtLink
    :to="`/chat/${room.id}`"
    class="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors"
    :class="active ? 'bg-primary/10' : 'hover:bg-base-300/50'"
  >
    <!-- Avatar -->
    <div class="relative shrink-0">
      <div class="avatar">
        <div :class="isGroup ? 'h-10 w-10 rounded-lg' : 'h-10 w-10 rounded-full'">
          <FileImage v-if="avatarId" :file="{ id: avatarId }" :alt="title" :class="isGroup ? 'h-full w-full rounded-lg object-cover' : 'h-full w-full rounded-full object-cover'" />
          <div
            v-else
            :class="['flex h-full w-full items-center justify-center bg-primary/20 text-sm font-bold text-primary-content', isGroup ? 'rounded-lg' : 'rounded-full']"
          >
            {{ initials }}
          </div>
        </div>
      </div>
      <span
        v-if="isGroup && onlineCount > 0"
        class="absolute -right-1 -bottom-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border border-base-200 bg-success px-0.5 text-[8px] font-bold text-success-content"
      >
        {{ onlineCount }}
      </span>
    </div>

    <!-- Text -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1.5">
        <span
          class="truncate text-sm"
          :class="unread > 0 ? 'font-bold text-base-content' : 'font-medium text-base-content/90'"
        >
          {{ title }}
        </span>
        <!-- Unread dot (Discord-style) -->
        <span v-if="unread > 0" class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      </div>
      <p
        class="flex items-center gap-1 text-xs"
        :class="unread > 0 ? 'font-medium text-base-content/80' : 'text-base-content/50'"
      >
        <span v-if="typingUsers.length" class="truncate italic text-primary">
          {{ t("chat.typingEllipsis") }}
        </span>
        <template v-else-if="preview">
          <IconPaperclip v-if="previewIsAttachment" class="h-3 w-3 shrink-0" />
          <span class="truncate">{{ preview }}</span>
        </template>
        <span v-else class="truncate text-base-content/40">{{ t("chat.noMessagesYet") }}</span>
      </p>
    </div>

    <!-- Unread count -->
    <span
      v-if="unread > 0"
      class="badge badge-primary badge-sm shrink-0 text-[10px] font-bold"
    >
      {{ unread > 99 ? "99+" : unread }}
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { IconPaperclip } from "#components";
import type { SnChatRoom } from "~/types/chat";
import { formatRelativeTime } from "~/utils/datetime";

const props = defineProps<{
  room: SnChatRoom;
  active?: boolean;
}>();

const { t } = useI18n();
const { roomTitle: resolveTitle, typingFor, state, voiceUrlOf, directPeer } = useChat();

const isGroup = computed(() => props.room.type !== 1);

const title = computed(() => resolveTitle(props.room) || t("chat.unnamedRoom"));

const avatarId = computed(() => {
  if (props.room.type === 1) {
    return directPeer(props.room)?.account?.profile?.picture?.id ?? null
  }
  return props.room.picture?.id ?? props.room.realm?.picture?.id ?? null
});

const initials = computed(() => (title.value || "?").slice(0, 2).toUpperCase());

const summary = computed(() => state.summaries[props.room.id]);
const unread = computed(() => summary.value?.unreadCount ?? 0);
const onlineCount = computed(() => state.online[props.room.id] ?? 0);
const typingUsers = computed(() => typingFor(props.room.id));

const lastMessage = computed(() => summary.value?.lastMessage ?? null);

const senderName = computed(() => {
  const member = lastMessage.value?.sender
  if (!member) return ""
  return member.nick || member.account?.nick || member.account?.name || ""
});

const previewIsAttachment = computed(() =>
  Boolean(lastMessage.value?.attachments?.length),
);

const preview = computed(() => {
  const message = lastMessage.value
  if (!message) return ""
  if (message.deletedAt) return t("chat.messageDeleted")
  if (message.type === "voice" || voiceUrlOf(message)) return t("chat.voiceMessage")
  if (message.attachments?.length) return message.attachments[0]?.name ?? t("chat.attachment")
  if (message.content) {
    return senderName.value ? `${senderName.value}: ${message.content}` : message.content
  }
  return t("chat.message")
});

const timeLabel = computed(() => {
  const at = lastMessage.value?.createdAt ?? props.room.updatedAt ?? props.room.createdAt
  return formatRelativeTime(at)
});
</script>
