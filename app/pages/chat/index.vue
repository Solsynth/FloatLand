<template>
  <NuxtLayout name="app">
    <!-- Beta Alert Banner -->
    <div class="alert alert-warning mb-3 text-sm">
      <IconAlertTriangle class="h-5 w-5 shrink-0" />
      <div>
        <span class="font-semibold">{{ t('chat.betaTitle') }}</span>
        <span>{{ t('chat.betaDescription') }}</span>
        <a
          href="https://web.solian.app"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-primary font-medium ml-1"
        >
          web.solian.app
        </a>
      </div>
    </div>

    <div class="flex h-[calc(100vh-8rem)] overflow-hidden rounded-box bg-base-100 lg:h-[calc(100vh-2rem)]">
      <!-- Left: Chat Rooms List -->
      <div
        class="flex w-full flex-col bg-base-200/70 lg:w-80 xl:w-96"
        :class="{ 'hidden lg:flex': selectedRoomId }"
      >
        <!-- Rooms Header -->
        <div class="flex items-center justify-between px-4 py-3">
          <h2 class="text-lg font-bold">{{ t('chat.title') }}</h2>
          <button
            class="btn btn-ghost btn-sm"
            :disabled="isRoomsLoading"
            @click="handleRefresh"
          >
            <IconRefreshCw
              class="h-4 w-4"
              :class="{ 'animate-spin': isRoomsLoading }"
            />
          </button>
        </div>

        <!-- Unread summary -->
        <div
          v-if="unreadCount > 0"
          class="mx-3 mb-2 flex items-center justify-between rounded-box bg-primary/10 px-3 py-2"
        >
          <span class="text-xs text-primary">
            {{ t('chat.unreadRooms', { count: unreadCount }) }}
          </span>
          <button
            class="btn btn-ghost btn-xs text-xs text-primary"
            @click="handleMarkAllRead"
          >
            {{ t('chat.markAllRead') }}
          </button>
        </div>

        <!-- Rooms List -->
        <div class="flex-1 overflow-y-auto">
          <!-- Loading -->
          <div
            v-if="isRoomsLoading && sortedRooms.length === 0"
            class="flex items-center justify-center py-12"
          >
            <span class="loading loading-spinner loading-md text-primary" />
          </div>

          <!-- Empty -->
          <div
            v-else-if="sortedRooms.length === 0"
            class="flex flex-col items-center justify-center px-4 py-12 text-center"
          >
            <IconMessageSquareOff class="mb-3 h-10 w-10 text-base-content/30" />
            <p class="text-sm text-base-content/50">
              {{ t('chat.noRooms') }}
            </p>
          </div>

          <!-- Room items -->
          <div v-else>
            <ChatRoomItem
              v-for="room in sortedRooms"
              :key="room.id"
              :room="room"
              :summary="summaries[room.id]"
              :active="room.id === selectedRoomId"
              @click="selectRoom(room.id)"
            />
          </div>
        </div>
      </div>

      <!-- Right: Chat Detail -->
      <div
        class="flex flex-1 flex-col"
        :class="{ 'hidden lg:flex': !selectedRoomId }"
      >
        <!-- No room selected -->
        <div
          v-if="!selectedRoomId"
          class="flex flex-1 flex-col items-center justify-center text-center"
        >
          <IconMessageSquare class="mb-4 h-16 w-16 text-base-content/20" />
          <h3 class="text-lg font-semibold text-base-content/40">
            {{ t('chat.selectRoom') }}
          </h3>
          <p class="mt-1 text-sm text-base-content/30">
            {{ t('chat.selectRoomHint') }}
          </p>
        </div>

        <!-- Room selected -->
        <template v-else>
          <!-- Chat Header -->
          <div class="flex items-center gap-3 px-4 py-3">
            <!-- Back button (mobile only) -->
            <button
              class="btn btn-ghost btn-circle btn-sm lg:hidden"
              @click="deselectRoom"
            >
              <IconArrowLeft class="h-5 w-5" />
            </button>

            <!-- Room info -->
            <div class="min-w-0 flex-1">
              <h2 class="truncate text-base font-bold">
                {{ roomName }}
              </h2>
              <p
                v-if="roomDescription"
                class="truncate text-xs text-base-content/50"
              >
                {{ roomDescription }}
              </p>
            </div>

            <!-- Room actions -->
            <div class="flex items-center gap-1">
              <button
                class="btn btn-ghost btn-circle btn-sm"
                :title="t('chat.members')"
              >
                <IconUsers class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Messages -->
          <ChatMessageList
            :messages="messages"
            :is-loading="isLoading"
            :is-loading-more="false"
            :has-more="hasMore"
            :typing-indicators="typingIndicators"
            :current-user-id="currentUserId"
            @load-more="handleLoadMore"
            @reply="handleReply"
            @forward="handleForward"
            @edit="handleEdit"
            @delete="handleDelete"
          />

          <!-- Input -->
          <ChatInput
            ref="chatInputRef"
            :reply-to="replyTo"
            :forward-to="forwardTo"
            :edit-to="editTo"
            :attachments="pendingAttachments"
            @send="handleSend"
            @typing="handleTyping"
            @cancel-action="clearActionState"
            @pick-attachment="openFilePicker"
            @remove-attachment="removeAttachment"
          />
        </template>
      </div>
    </div>

    <!-- Cloud File Picker Drawer -->
    <CloudFileDrawer
      v-model:open="isFilePickerOpen"
      :allow-multiple="true"
      usage="chat.attachment"
      @select="handleFileSelected"
    />
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconRefreshCw,
  IconMessageSquareOff,
  IconMessageSquare,
  IconArrowLeft,
  IconUsers,
  IconAlertTriangle,
} from '#components'
import type { SnChatMessage } from '~/types/chat'
import type { SnCloudFile } from '~/types/drive'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { isAuthenticated, user } = useAuth()
const { confirm: confirmAlert } = useAlert()
const {
  rooms,
  summaries,
  unreadCount,
  isRoomsLoading,
  getMessages,
  isMessagesLoading,
  hasMoreMessages,
  getTypingIndicators,
  loadRooms,
  loadMessages,
  sendMessage,
  enterRoom,
  leaveRoom,
  sendTypingStatus,
} = useChat()

definePageMeta({
  ssr: false,
})

useHead({
  title: t('chat.title'),
})

// Refs
const chatInputRef = ref<InstanceType<typeof ChatInput> | null>(null)

// Action state for reply/forward/edit
const replyTo = ref<SnChatMessage | null>(null)
const forwardTo = ref<SnChatMessage | null>(null)
const editTo = ref<SnChatMessage | null>(null)

// Attachment state
const pendingAttachments = ref<SnCloudFile[]>([])
const isFilePickerOpen = ref(false)

// Selected room from query param: /chat?room=roomId
const selectedRoomId = computed(() => {
  const room = route.query.room
  return (typeof room === 'string' ? room : null) || null
})

// Sort rooms by last message time (newest first - descending)
const sortedRooms = computed(() => {
  const list = Array.isArray(rooms.value) ? rooms.value : []
  return [...list].sort((a, b) => {
    const aTime = summaries.value?.[a.id]?.lastMessage?.createdAt || a.createdAt
    const bTime = summaries.value?.[b.id]?.lastMessage?.createdAt || b.createdAt
    // Descending order: b - a (newest first)
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })
})

// Current room details
const currentRoom = computed(() => {
  const list = Array.isArray(rooms.value) ? rooms.value : []
  return list.find((r) => r.id === selectedRoomId.value)
})

const roomName = computed(() => {
  if (!currentRoom.value) return t('chat.loading')
  // For DMs without name, show member names
  if (currentRoom.value.type === 1 && !currentRoom.value.name) {
    return t('chat.directMessage')
  }
  return currentRoom.value.name || t('chat.unnamedRoom')
})

const roomDescription = computed(() => currentRoom.value?.description)

// Message state for selected room
const messages = computed(
  () => getMessages(selectedRoomId.value || '').value,
)
const isLoading = computed(
  () => isMessagesLoading(selectedRoomId.value || '').value,
)
const hasMore = computed(
  () => hasMoreMessages(selectedRoomId.value || '').value,
)
const typingIndicators = computed(
  () => getTypingIndicators(selectedRoomId.value || '').value,
)
const currentUserId = computed(() => user.value?.id)

// Navigation - use query params
function selectRoom(roomId: string) {
  router.push({ path: '/chat', query: { room: roomId } })
}

function deselectRoom() {
  router.push({ path: '/chat' })
}

// Room subscription management
watch(
  selectedRoomId,
  async (newId, oldId) => {
    if (oldId) leaveRoom(oldId)
    if (newId) {
      enterRoom(newId)
      await loadMessages(newId)
    }
    // Clear action state when switching rooms
    clearActionState()
  },
  { immediate: true },
)

// Cleanup on unmount
onUnmounted(() => {
  if (selectedRoomId.value) {
    leaveRoom(selectedRoomId.value)
  }
})

// ── Action Handlers ─────────────────────────────────────────────────────

function clearActionState() {
  replyTo.value = null
  forwardTo.value = null
  editTo.value = null
  pendingAttachments.value = []
}

function handleReply(message: SnChatMessage) {
  clearActionState()
  replyTo.value = message
}

function handleForward(message: SnChatMessage) {
  clearActionState()
  forwardTo.value = message
}

function handleEdit(message: SnChatMessage) {
  clearActionState()
  editTo.value = message
}

async function handleDelete(message: SnChatMessage) {
  if (!selectedRoomId.value) return

  const confirmed = await confirmAlert(
    t('chat.actionDelete'),
    t('chat.confirmDeleteMessage'),
    { variant: 'danger' },
  )

  if (!confirmed) return

  try {
    await deleteChatMessage(selectedRoomId.value, message.id)
  } catch (err) {
    console.error('Failed to delete message:', err)
  }
}

// ── Attachment Handlers ─────────────────────────────────────────────────

function openFilePicker() {
  isFilePickerOpen.value = true
}

function handleFileSelected(files: SnCloudFile | SnCloudFile[] | null) {
  if (!files) return
  const fileArray = Array.isArray(files) ? files : [files]
  pendingAttachments.value = [...pendingAttachments.value, ...fileArray]
}

function removeAttachment(index: number) {
  pendingAttachments.value.splice(index, 1)
}

// ── Actions ─────────────────────────────────────────────────────────────

async function handleRefresh() {
  await loadRooms()
}

async function handleMarkAllRead() {
  try {
    await markAllChatsRead()
    await loadRooms()
  } catch (err) {
    console.error('Failed to mark all chats read:', err)
  }
}

async function handleLoadMore() {
  if (selectedRoomId.value) {
    await loadMessages(selectedRoomId.value, true)
  }
}

async function handleSend(
  content: string,
  options: { repliedMessageId?: string; forwardedMessageId?: string },
) {
  if (!selectedRoomId.value) return

  try {
    await sendMessage(selectedRoomId.value, content, {
      repliedMessageId: options.repliedMessageId,
      forwardedMessageId: options.forwardedMessageId,
    })

    // Clear action state after successful send
    clearActionState()
  } catch (err) {
    console.error('Failed to send message:', err)
  }
}

function handleTyping() {
  if (selectedRoomId.value) {
    sendTypingStatus(selectedRoomId.value)
  }
}
</script>
