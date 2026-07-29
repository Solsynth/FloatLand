<template>
  <div
    v-if="quotedMessage || isLoading"
    class="mb-1 cursor-pointer overflow-hidden rounded-lg border-l-2"
    :class="borderClasses"
    @click="handleClick"
  >
    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs"
      :class="loadingClasses"
    >
      <IconLoader class="h-3.5 w-3.5 animate-spin" />
      <span>{{ t('chat.loadingMessage') }}</span>
    </div>

    <!-- Quote content -->
    <div
      v-else-if="quotedMessage"
      class="px-2.5 py-1.5"
      :class="contentClasses"
    >
      <!-- Header: Reply/Forward icon + sender name -->
      <div class="mb-0.5 flex items-center gap-1.5">
        <component
          :is="isReply ? IconReply : IconForward"
          class="h-3.5 w-3.5 shrink-0 opacity-70"
        />
        <span class="truncate text-xs font-semibold opacity-80">
          {{ headerText }}
        </span>
      </div>

      <!-- Message content preview -->
      <div
        v-if="quotedMessage.content"
        class="line-clamp-2 text-xs opacity-70"
        v-html="renderedQuoteContent"
      />

      <!-- Attachments indicator -->
      <div
        v-if="quotedMessage.attachments?.length"
        class="mt-0.5 flex items-center gap-1 text-xs opacity-50"
      >
        <IconPaperclip class="h-3 w-3" />
        <span>
          {{ quotedMessage.attachments.length }}
          {{ quotedMessage.attachments.length === 1 ? 'attachment' : 'attachments' }}
        </span>
      </div>

      <!-- Deleted message -->
      <div
        v-if="quotedMessage.deletedAt"
        class="flex items-center gap-1 text-xs italic opacity-50"
      >
        <IconTrash class="h-3 w-3" />
        <span>{{ t('chat.messageDeleted') }}</span>
      </div>
    </div>

    <!-- Not found state -->
    <div
      v-else-if="!isLoading && fetchError"
      class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs opacity-50"
      :class="loadingClasses"
    >
      <IconHelpCircle class="h-3.5 w-3.5" />
      <span>{{ isReply ? t('chat.replyNotFound') : t('chat.forwardNotFound') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconReply,
  IconForward,
  IconLoader,
  IconPaperclip,
  IconTrash,
  IconHelpCircle,
} from '#components'
import type { SnChatMessage } from '~/types/chat'
import { renderMarkdown } from '~/utils/markdown'

const props = defineProps<{
  message: SnChatMessage
  isReply?: boolean
}>()

const emit = defineEmits<{
  jump: [messageId: string]
}>()

const { t } = useI18n()
const { user } = useAuth()

const isLoading = ref(false)
const fetchError = ref(false)
const quotedMessage = ref<SnChatMessage | null>(null)

// Get the quoted message ID
const quotedMessageId = computed(() => {
  return props.isReply
    ? props.message.repliedMessageId
    : props.message.forwardedMessageId
})

// Fetch the quoted message
async function fetchQuotedMessage() {
  const id = quotedMessageId.value
  if (!id) return

  isLoading.value = true
  fetchError.value = false

  try {
    // Try to get from the chat composable's message cache first
    const chat = useChat()
    const cached = chat.getMessages(props.message.chatRoomId).value
    const found = cached.find((m) => m.id === id)
    
    if (found) {
      quotedMessage.value = found
    } else {
      // Fetch from API
      const response = await apiFetch(
        `/messager/chat/${props.message.chatRoomId}/messages/${id}`,
      )
      quotedMessage.value = await safeJsonParse<SnChatMessage>(response)
    }
  } catch (err) {
    console.error('Failed to fetch quoted message:', err)
    fetchError.value = true
  } finally {
    isLoading.value = false
  }
}

// Header text
const headerText = computed(() => {
  if (!quotedMessage.value) return ''
  
  const senderName = quotedMessage.value.sender?.account?.nick 
    || quotedMessage.value.sender?.account?.name 
    || 'Unknown'
  
  if (props.isReply) {
    return `${t('chat.repliedTo')} ${senderName}`
  }
  return `${t('chat.forwardedFrom')} ${senderName}`
})

// Render quoted message content
const renderedQuoteContent = computed(() => {
  if (!quotedMessage.value?.content) return ''
  return renderMarkdown(quotedMessage.value.content)
})

// Styling classes
const borderClasses = computed(() => {
  if (props.isReply) {
    return 'border-primary/40'
  }
  return 'border-primary/40'
})

const contentClasses = computed(() => {
  if (props.isReply) {
    return 'bg-primary/10'
  }
  return 'bg-primary/10'
})

const loadingClasses = computed(() => {
  if (props.isReply) {
    return 'bg-primary/5 text-primary/70'
  }
  return 'bg-primary/5 text-primary/70'
})

// Click handler - jump to quoted message
function handleClick() {
  const id = quotedMessageId.value
  if (id) {
    emit('jump', id)
  }
}

// Fetch on mount
onMounted(() => {
  if (quotedMessageId.value) {
    fetchQuotedMessage()
  }
})

// Refetch if quoted message ID changes
watch(quotedMessageId, (newId) => {
  if (newId) {
    fetchQuotedMessage()
  } else {
    quotedMessage.value = null
  }
})
</script>
