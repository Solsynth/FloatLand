<template>
  <ContextMenuRoot>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>

    <ContextMenuPortal>
      <ContextMenuContent
        class="z-[100] min-w-[180px] rounded-box bg-base-100 p-1.5 shadow-sm"
        :side-offset="5"
      >
        <!-- Reply -->
        <ContextMenuItem
          v-if="!isOwn"
          class="flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-base-200 data-[highlighted]:bg-base-200"
          @select="handleAction('reply')"
        >
          <IconReply class="h-4 w-4 text-base-content/70" />
          <span>{{ t('chat.actionReply') }}</span>
        </ContextMenuItem>

        <!-- Forward -->
        <ContextMenuItem
          class="flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-base-200 data-[highlighted]:bg-base-200"
          @select="handleAction('forward')"
        >
          <IconForward class="h-4 w-4 text-base-content/70" />
          <span>{{ t('chat.actionForward') }}</span>
        </ContextMenuItem>

        <!-- Copy Text -->
        <ContextMenuItem
          v-if="message.content"
          class="flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-base-200 data-[highlighted]:bg-base-200"
          @select="handleAction('copy')"
        >
          <IconCopy class="h-4 w-4 text-base-content/70" />
          <span>{{ t('chat.actionCopy') }}</span>
        </ContextMenuItem>

        <!-- Pin/Unpin -->
        <ContextMenuItem
          v-if="canPin"
          class="flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-base-200 data-[highlighted]:bg-base-200"
          @select="handleAction('pin')"
        >
          <IconPin class="h-4 w-4 text-base-content/70" />
          <span>{{ t('chat.actionPin') }}</span>
        </ContextMenuItem>

        <!-- Edit (only own messages) -->
        <ContextMenuItem
          v-if="isOwn && canEdit"
          class="flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-base-200 data-[highlighted]:bg-base-200"
          @select="handleAction('edit')"
        >
          <IconEdit class="h-4 w-4 text-base-content/70" />
          <span>{{ t('chat.actionEdit') }}</span>
        </ContextMenuItem>

        <!-- Delete (only own messages) -->
        <ContextMenuItem
          v-if="isOwn"
          class="mt-1 flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-error/10 data-[highlighted]:bg-error/10 text-error"
          @select="handleAction('delete')"
        >
          <IconTrash class="h-4 w-4" />
          <span>{{ t('chat.actionDelete') }}</span>
        </ContextMenuItem>

        <!-- Report (only others' messages) -->
        <ContextMenuItem
          v-if="!isOwn"
          class="flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-warning/10 data-[highlighted]:bg-warning/10 text-warning"
          @select="handleAction('report')"
        >
          <IconFlag class="h-4 w-4" />
          <span>{{ t('chat.actionReport') }}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>

<script setup lang="ts">
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuTrigger,
} from 'reka-ui'
import {
  IconReply,
  IconForward,
  IconCopy,
  IconPin,
  IconEdit,
  IconTrash,
  IconFlag,
} from '#components'
import type { SnChatMessage } from '~/types/chat'

const props = defineProps<{
  message: SnChatMessage
  isOwn: boolean
}>()

const emit = defineEmits<{
  action: [action: string]
}>()

const { t } = useI18n()

// Can edit if message is own and less than 1 hour old
const canEdit = computed(() => {
  if (!props.isOwn) return false
  const createdAt = new Date(props.message.createdAt)
  const now = new Date()
  const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
  return hoursDiff < 1
})

// Can pin (placeholder - would need room permissions)
const canPin = computed(() => {
  return true
})

function handleAction(action: string) {
  // Copy text to clipboard
  if (action === 'copy' && props.message.content) {
    navigator.clipboard.writeText(props.message.content)
    return
  }

  emit('action', action)
}
</script>
