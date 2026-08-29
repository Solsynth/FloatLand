<template>
  <div
    class="group flex gap-2.5 px-4"
    :class="[
      isOwn ? 'flex-row-reverse' : 'flex-row',
      isFirstInGroup ? 'mt-3' : 'mt-0.5',
    ]"
  >
    <!-- Avatar space (only for first message in group from others) -->
    <div
      v-if="!isOwn && showAvatar"
      class="relative w-8 shrink-0"
    >
      <div
        v-if="isFirstInGroup"
        class="sticky top-16"
      >
        <div v-if="senderAvatarUrl" class="avatar">
          <div class="w-8 rounded-full">
            <FileImage :src="senderAvatarUrl" :alt="senderName" />
          </div>
        </div>
        <div v-else class="avatar avatar-placeholder">
          <div class="w-8 rounded-full bg-base-300 text-base-content">
            <span class="text-[10px] font-medium">
              {{ senderInitials }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <!-- Spacer for grouped messages (no avatar) -->
    <div
      v-else-if="!isOwn && !showAvatar"
      class="w-8 shrink-0"
    />

    <!-- Message content -->
    <MessageContextMenu
      :message="message"
      :is-own="isOwn"
      @action="handleAction"
    >
      <div
        class="flex flex-col min-w-0"
        :class="[
          isOwn ? 'items-end' : 'items-start',
          hasAttachments ? 'max-w-[85%]' : 'max-w-[75%]',
        ]"
      >
      <!-- Sender name (only for first message in group) -->
      <div
        v-if="!isOwn && isFirstInGroup && senderAccount"
        class="mb-0.5 px-1"
      >
        <AccountName
          :account="senderAccount"
          size="sm"
          hide-verification-mark
        />
      </div>

      <!-- Reply quote -->
      <MessageQuote
        v-if="message.repliedMessageId"
        :message="message"
        :is-reply="true"
        @jump="(id) => emit('jump', id)"
      />

      <!-- Forward quote -->
      <MessageQuote
        v-if="message.forwardedMessageId"
        :message="message"
        :is-reply="false"
        @jump="(id) => emit('jump', id)"
      />

      <!-- Attachments (above content bubble) -->
      <div
        v-if="hasAttachments"
        class="mb-1 overflow-hidden rounded-box"
        :class="isOwn ? 'ml-auto' : 'mr-auto'"
        style="max-width: 400px; min-width: 200px;"
      >
        <AttachmentGrid
          :attachments="fileAttachments"
          :max-height="400"
        />
      </div>

      <!-- Content bubble -->
      <div
        v-if="message.content || message.deletedAt"
        class="rounded-box px-3 py-1.5 text-sm"
        :class="bubbleClasses"
      >
        <!-- Deleted message -->
        <p
          v-if="message.deletedAt"
          class="italic opacity-60"
        >
          {{ t('chat.messageDeleted') }}
        </p>

        <!-- Markdown content -->
        <div
          v-else-if="message.content"
          class="prose prose-sm max-w-none break-words prose-p:my-0.5 prose-headings:mb-1 prose-headings:mt-1 prose-a:text-primary prose-a:no-underline prose-code:text-primary prose-code:bg-base-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-base-200 prose-pre:text-sm"
          :class="isOwn ? 'prose-invert' : ''"
          v-html="renderedContent"
        />

        <!-- Edited indicator -->
        <span
          v-if="message.editedAt && !message.deletedAt"
          class="ml-1 text-[10px] opacity-50"
        >
          ({{ t('chat.edited') }})
        </span>
      </div>

      <!-- Timestamp (only for last message in group) -->
      <p
        v-if="isLastInGroup"
        class="mt-0.5 px-1 text-[10px] text-base-content/30"
        :class="isOwn ? 'text-right' : 'text-left'"
      >
        {{ formattedTime }}
      </p>
      </div>
    </MessageContextMenu>
  </div>
</template>

<script setup lang="ts">
import type { SnChatMessage, SnCloudFileReference } from '~/types/chat'
import type { FileAttachment } from '~/types/post'
import { formatTime } from '~/utils/datetime'
import { renderMarkdown } from '~/utils/markdown'
import { getFileUrl } from '~/utils/files'

const props = defineProps<{
  message: SnChatMessage
  isOwn: boolean
  senderName?: string
  showAvatar?: boolean
  isFirstInGroup?: boolean
  isLastInGroup?: boolean
}>()

const emit = defineEmits<{
  jump: [messageId: string]
  reply: [message: SnChatMessage]
  forward: [message: SnChatMessage]
  edit: [message: SnChatMessage]
  delete: [message: SnChatMessage]
}>()

const { t } = useI18n()

// Handle context menu actions
function handleAction(action: string) {
  switch (action) {
    case 'reply':
      emit('reply', props.message)
      break
    case 'forward':
      emit('forward', props.message)
      break
    case 'edit':
      emit('edit', props.message)
      break
    case 'delete':
      emit('delete', props.message)
      break
  }
}

// Sender account object for AccountName component
const senderAccount = computed(() => {
  return props.message.sender?.account || null
})

// Sender avatar
const senderAvatarUrl = computed(() => {
  const pictureId = props.message.sender?.account?.profile?.picture?.id
  return pictureId ? getFileUrl(pictureId) : null
})

const senderInitials = computed(() => {
  const name = props.senderName || '?'
  return name.slice(0, 2).toUpperCase()
})

// Check if message has attachments
const hasAttachments = computed(() => {
  return props.message.attachments && props.message.attachments.length > 0
})

// Convert chat attachments to FileAttachment format for AttachmentGrid
const fileAttachments = computed<FileAttachment[]>(() => {
  if (!props.message.attachments) return []
  
  return props.message.attachments.map((ref: SnCloudFileReference) => ({
    id: ref.id,
    name: ref.name || 'attachment',
    url: ref.storageUrl || ref.url,
    mimeType: ref.mimeType || 'application/octet-stream',
    hasCompression: ref.hasCompression ?? false,
    hasThumbnail: true,
    fileMeta: {
      width: ref.width,
      height: ref.height,
      ratio: (ref.width && ref.height && ref.height > 0) ? ref.width / ref.height : undefined,
      blurhash: ref.blur,
      size: ref.size,
      ...(ref.fileMeta || {}),
    },
  }))
})

// Render markdown content
const renderedContent = computed(() => {
  const content = props.message.content || ''
  return renderMarkdown(content)
})

// Use datetime utility for proper local time conversion
const formattedTime = computed(() => formatTime(props.message.createdAt))

const bubbleClasses = computed(() => {
  if (props.message.deletedAt) {
    return 'bg-base-200/50 text-base-content/50'
  }
  if (props.isOwn) {
    // Own messages: rounded differently based on position in group
    const classes = ['bg-primary text-primary-content']
    if (props.isFirstInGroup && props.isLastInGroup) {
      classes.push('rounded-br-md')
    } else if (props.isFirstInGroup) {
      classes.push('rounded-br-md')
    } else if (props.isLastInGroup) {
      classes.push('rounded-tr-md rounded-br-md')
    } else {
      classes.push('rounded-tr-md rounded-br-md')
    }
    return classes
  }
  // Others' messages
  const classes = ['bg-base-200 text-base-content']
  if (props.isFirstInGroup && props.isLastInGroup) {
    classes.push('rounded-bl-md')
  } else if (props.isFirstInGroup) {
    classes.push('rounded-bl-md')
  } else if (props.isLastInGroup) {
    classes.push('rounded-tl-md rounded-bl-md')
  } else {
    classes.push('rounded-tl-md rounded-bl-md')
  }
  return classes
})
</script>
