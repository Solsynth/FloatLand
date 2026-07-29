<template>
  <div class="bg-base-100">
    <!-- Reply / Forward / Edit indicator bar -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="opacity-0 -translate-y-1 max-h-0"
      enter-to-class="opacity-100 translate-y-0 max-h-24"
      leave-from-class="opacity-100 translate-y-0 max-h-24"
      leave-to-class="opacity-0 -translate-y-1 max-h-0"
    >
      <div
        v-if="replyTo || forwardTo || editTo"
        class="mx-3 mb-2 flex items-center gap-2 rounded-box bg-base-200 px-3 py-2"
      >
        <!-- Action icon -->
        <component
          :is="actionIcon"
          class="h-4 w-4 shrink-0 text-primary"
        />

        <!-- Action label + preview -->
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold text-primary">
            {{ actionLabel }}
          </p>
          <p class="truncate text-xs text-base-content/50">
            {{ actionPreview }}
          </p>
        </div>

        <!-- Cancel button -->
        <button
          class="btn btn-ghost btn-xs btn-circle"
          @click="handleCancelAction"
        >
          <IconX class="h-3.5 w-3.5" />
        </button>
      </div>
    </Transition>

    <!-- Attachment preview strip -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-28"
      leave-from-class="opacity-100 max-h-28"
      leave-to-class="opacity-0 max-h-0"
    >
      <div
        v-if="attachments.length > 0"
        class="overflow-hidden"
      >
        <div class="flex gap-2 overflow-x-auto px-4 py-2">
          <div
            v-for="(file, index) in attachments"
            :key="file.id"
            class="relative h-20 w-20 shrink-0 overflow-hidden rounded-box bg-base-200"
          >
            <!-- Preview -->
            <img
              v-if="isImageFile(file)"
              :src="getPreviewUrl(file)"
              class="h-full w-full object-cover"
              :alt="file.name"
            />
            <div
              v-else
              class="flex h-full w-full flex-col items-center justify-center p-1"
            >
              <IconFile class="h-6 w-6 text-base-content/40" />
              <span class="mt-1 w-full truncate text-center text-[10px] text-base-content/50">
                {{ file.name }}
              </span>
            </div>

            <!-- Remove button -->
            <button
              class="btn btn-ghost btn-xs absolute right-0.5 top-0.5 h-5 w-5 min-h-0 rounded-full bg-base-100/80 p-0"
              @click="removeAttachment(index)"
            >
              <IconX class="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Input area -->
    <div class="flex items-end gap-2 px-4 py-3">
      <!-- Attachment button -->
      <button
        class="btn btn-ghost btn-circle btn-sm shrink-0"
        :title="t('chat.attachFile')"
        @click="$emit('pickAttachment')"
      >
        <IconPaperclip class="h-4 w-4" />
      </button>

      <!-- Text input -->
      <div class="relative flex-1">
        <textarea
          ref="inputRef"
          v-model="message"
          :placeholder="inputPlaceholder"
          class="textarea textarea-bordered w-full resize-none text-sm"
          :rows="1"
          @keydown="handleKeydown"
          @input="handleInput"
        />
      </div>

      <!-- Send button -->
      <button
        type="button"
        class="btn btn-circle btn-primary btn-sm shrink-0"
        :disabled="!canSend"
        @click="handleSend"
      >
        <IconSend class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconSend,
  IconX,
  IconPaperclip,
  IconFile,
  IconReply,
  IconForward,
  IconEdit,
} from '#components'
import type { SnChatMessage } from '~/types/chat'
import type { SnCloudFile } from '~/types/drive'

const props = defineProps<{
  replyTo?: SnChatMessage | null
  forwardTo?: SnChatMessage | null
  editTo?: SnChatMessage | null
  attachments?: SnCloudFile[]
}>()

const emit = defineEmits<{
  send: [content: string, options: { repliedMessageId?: string; forwardedMessageId?: string }]
  typing: []
  cancelAction: []
  pickAttachment: []
  removeAttachment: [index: number]
}>()

const { t } = useI18n()
const message = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)

// Computed
const attachments = computed(() => props.attachments ?? [])

const canSend = computed(() => {
  return message.value.trim().length > 0 || attachments.value.length > 0
})

const inputPlaceholder = computed(() => {
  if (props.replyTo) {
    const name = props.replyTo.sender?.account?.nick || props.replyTo.sender?.account?.name || ''
    return t('chat.replyingToUser', { name })
  }
  if (props.editTo) return t('chat.editingMessage')
  return t('chat.inputPlaceholder')
})

const actionIcon = computed(() => {
  if (props.replyTo) return IconReply
  if (props.forwardTo) return IconForward
  if (props.editTo) return IconEdit
  return null
})

const actionLabel = computed(() => {
  if (props.replyTo) {
    const name = props.replyTo.sender?.account?.nick || props.replyTo.sender?.account?.name || ''
    return t('chat.replyingToUser', { name })
  }
  if (props.forwardTo) return t('chat.forwarding')
  if (props.editTo) return t('chat.editing')
  return ''
})

const actionPreview = computed(() => {
  const msg = props.replyTo || props.forwardTo || props.editTo
  if (!msg) return ''
  if (msg.deletedAt) return t('chat.messageDeleted')
  if (msg.content) return msg.content.slice(0, 100)
  if (msg.attachments?.length) return t('chat.imageMessage')
  return ''
})

// Pre-fill message when editing
watch(
  () => props.editTo,
  (msg) => {
    if (msg?.content) {
      message.value = msg.content
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.style.height = 'auto'
          inputRef.value.style.height = `${Math.min(inputRef.value.scrollHeight, 120)}px`
          inputRef.value.focus()
        }
      })
    }
  },
)

// Focus input when reply/forward is set
watch(
  () => [props.replyTo, props.forwardTo],
  () => {
    if (props.replyTo || props.forwardTo) {
      nextTick(() => inputRef.value?.focus())
    }
  },
)

// Methods
function handleSend() {
  const content = message.value.trim()
  if (!content && attachments.value.length === 0) return

  emit('send', content, {
    repliedMessageId: props.replyTo?.id,
    forwardedMessageId: props.forwardTo?.id,
  })

  message.value = ''

  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.style.height = 'auto'
    }
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
  if (event.key === 'Escape') {
    handleCancelAction()
  }
}

function handleInput() {
  const el = inputRef.value
  if (el) {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }
  emit('typing')
}

function handleCancelAction() {
  message.value = ''
  emit('cancelAction')
}

function removeAttachment(index: number) {
  emit('removeAttachment', index)
}

function isImageFile(file: SnCloudFile): boolean {
  return file.mimeType?.startsWith('image/') ?? false
}

function getPreviewUrl(file: SnCloudFile): string {
  if (file.storageUrl) return file.storageUrl
  if (file.id) return `/api/drive/files/${file.id}/raw`
  return ''
}

// Expose methods for parent to control
function setText(text: string) {
  message.value = text
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.style.height = 'auto'
      inputRef.value.style.height = `${Math.min(inputRef.value.scrollHeight, 120)}px`
    }
  })
}

defineExpose({ setText })
</script>
