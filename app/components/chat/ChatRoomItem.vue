<template>
  <button
    class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-base-200"
    :class="{
      'bg-primary/10': active,
      'bg-primary/5': !active && (summary?.unreadCount ?? 0) > 0,
    }"
    @click="$emit('click')"
  >
    <!-- Room avatar -->
    <div class="relative shrink-0">
      <!-- DM: Show member avatar -->
      <div v-if="isDirect" class="avatar">
        <div v-if="dmAvatarUrl" class="w-10 rounded-full">
          <FileImage :src="dmAvatarUrl" :alt="dmName" />
        </div>
        <div v-else class="w-10 rounded-full bg-primary text-primary-content">
          <span class="flex h-full w-full items-center justify-center text-xs font-bold">
            {{ dmInitials }}
          </span>
        </div>
      </div>
      <!-- Group: Show room initial -->
      <div v-else class="avatar avatar-placeholder">
        <div
          class="w-10 rounded-full"
          :class="
            (summary?.unreadCount ?? 0) > 0
              ? 'bg-primary text-primary-content'
              : 'bg-base-300 text-base-content'
          "
        >
          <span class="text-xs font-bold">
            {{ roomInitials }}
          </span>
        </div>
      </div>
      <!-- Online indicator for DMs -->
      <span
        v-if="isDirect && isOnline"
        class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-base-100 bg-success"
      />
    </div>

    <!-- Room info -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center justify-between gap-2">
        <h3
          class="truncate text-sm"
          :class="(summary?.unreadCount ?? 0) > 0 ? 'font-bold' : 'font-medium'"
        >
          {{ displayName }}
        </h3>
        <div class="flex items-center gap-1">
          <!-- Encrypted icon -->
          <IconLock
            v-if="room.encryptionMode && room.encryptionMode !== 0"
            class="h-3 w-3 text-primary"
          />
          <span
            v-if="lastMessageTime"
            class="shrink-0 text-[11px] text-base-content/40"
          >
            {{ lastMessageTime }}
          </span>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2">
        <p class="truncate text-xs text-base-content/60">
          <span v-if="lastMessageSender" class="font-medium">
            {{ lastMessageSender }}:
          </span>
          {{ lastMessagePreview }}
        </p>
        <span
          v-if="(summary?.unreadCount ?? 0) > 0"
          class="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-content"
        >
          {{ (summary?.unreadCount ?? 0) > 99 ? '99+' : summary?.unreadCount }}
        </span>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { IconLock } from '#components'
import type { SnChatRoom, SnChatSummary, SnChatMember } from '~/types/chat'
import { formatRelativeTime } from '~/utils/datetime'
import { getFileUrl } from '~/utils/files'

const props = defineProps<{
  room: SnChatRoom
  summary?: SnChatSummary
  active?: boolean
}>()

defineEmits<{
  click: []
}>()

const { t } = useI18n()
const { user } = useAuth()

// Room type constants (from Flutter app)
const ROOM_TYPE_DM = 1

const isDirect = computed(() => props.room.type === ROOM_TYPE_DM)

// Get the other member in a DM (not the current user)
const dmMember = computed<SnChatMember | null>(() => {
  if (!isDirect.value || !props.room.members) return null
  return props.room.members.find((m) => m.accountId !== user.value?.id) || props.room.members[0] || null
})

// DM avatar URL
const dmAvatarUrl = computed(() => {
  const pictureId = dmMember.value?.account?.profile?.picture?.id
  return pictureId ? getFileUrl(pictureId) : null
})

// DM name
const dmName = computed(() => {
  if (!dmMember.value) return t('chat.directMessage')
  return dmMember.value.nick || dmMember.value.account?.nick || dmMember.value.account?.name || t('chat.directMessage')
})

// DM initials
const dmInitials = computed(() => {
  const name = dmName.value
  return name.slice(0, 2).toUpperCase()
})

// Display name
const displayName = computed(() => {
  if (isDirect.value) {
    return dmName.value
  }
  return props.room.name || t('chat.unnamedRoom')
})

// Room initials for group chats
const roomInitials = computed(() => {
  const name = props.room.name || '?'
  return name.slice(0, 2).toUpperCase()
})

// Online status (would need real presence data)
const isOnline = computed(() => {
  // TODO: Implement real online status from presence data
  return false
})

// Last message time
const lastMessageTime = computed(() => {
  const msg = props.summary?.lastMessage
  if (!msg) return ''
  return formatRelativeTime(msg.createdAt)
})

// Last message sender (for group chats)
const lastMessageSender = computed(() => {
  const msg = props.summary?.lastMessage
  if (!msg || !msg.sender) return null
  
  // For DMs, don't show sender name
  if (isDirect.value) return null
  
  return msg.sender?.account?.nick || msg.sender?.account?.name || null
})

// Last message preview
const lastMessagePreview = computed(() => {
  const msg = props.summary?.lastMessage
  if (!msg) return t('chat.noMessages')

  if (msg.deletedAt) return t('chat.messageDeleted')

  // Handle different message types
  const type = msg.type
  if (type === 'image') return '📷 ' + t('chat.imageMessage')
  if (type === 'file') return '📎 ' + t('chat.fileMessage')
  if (type === 'voice') return '🎤 ' + t('chat.voiceMessage')
  if (type === 'video') return '🎬 ' + t('chat.videoMessage')
  if (type === 'sticker') return '😄 ' + t('chat.stickerMessage')
  if (type === 'system') return '⚙️ ' + (msg.content || t('chat.systemMessage'))

  const content = msg.content || ''
  return content.length > 60 ? content.slice(0, 60) + '...' : content
})
</script>
