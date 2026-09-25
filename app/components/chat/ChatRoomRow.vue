<template>
  <NuxtLink
    :to="`/chat/${room.id}`"
    class="group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors"
    :class="active ? 'bg-base-300/80' : 'hover:bg-base-300/50'"
  >
    <!-- Active accent bar (Discord-style left rail on the active row) -->
    <span
      v-if="active"
      class="absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary"
    />

    <!-- Avatar -->
    <div class="relative shrink-0">
      <div class="avatar">
        <div :class="isGroup ? 'h-8 w-8 rounded-md' : 'h-8 w-8 rounded-full'">
          <FileImage v-if="avatarId" :file="{ id: avatarId }" :alt="title" :class="isGroup ? 'h-full w-full rounded-md object-cover' : 'h-full w-full rounded-full object-cover'" />
          <div
            v-else
            :class="['flex h-full w-full items-center justify-center bg-primary/20 text-xs font-bold text-primary-content', isGroup ? 'rounded-md' : 'rounded-full']"
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
        class="truncate text-xs"
        :class="unread > 0 ? 'font-medium text-base-content/80' : 'text-base-content/50'"
      >
        <span v-if="typingUsers.length" class="italic text-primary">
          {{ t("chat.typingEllipsis") }}
        </span>
        <span v-else-if="preview">{{ preview }}</span>
        <span v-else class="text-base-content/40">{{ t("chat.noMessagesYet") }}</span>
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

const preview = computed(() => {
  const message = lastMessage.value
  if (!message) return ""
  if (message.deletedAt) return t("chat.messageDeleted")
  if (message.type === "voice" || voiceUrlOf(message)) return t("chat.voiceMessage")
  if (message.attachments?.length) return `📎 ${message.attachments[0]?.name ?? t("chat.attachment")}`
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
