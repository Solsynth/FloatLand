<script setup lang="ts">
import { IconAlertCircle, IconSearchX } from "#components";
import type { SnChatMessage } from "~/types/chat";

definePageMeta({ middleware: "auth" });

const { t } = useI18n();
const route = useRoute();
const {
  state,
  setActiveRoom,
  leaveActiveRoom,
  loadRoom,
  loadNewest,
  markRead,
  refreshOnline,
  loadPins,
  edit,
  deleteMessage,
} = useChat();

const roomId = computed(() => {
  const param = route.params.roomId
  return typeof param === "string" ? param : ""
});

const room = computed(() =>
  state.rooms.find((candidate) => candidate.id === roomId.value) ?? null,
);

// Room-scoped overlays + composer context.
const infoOpen = ref(false);
const searchOpen = ref(false);
const threadRoot = ref<SnChatMessage | null>(null);
const replyTo = ref<SnChatMessage | null>(null);
const editingMessage = ref<SnChatMessage | null>(null);
const notFound = ref(false);

watch(
  roomId,
  async (id) => {
    if (!id) return
    notFound.value = false
    replyTo.value = null
    editingMessage.value = null
    threadRoot.value = null
    setActiveRoom(id)
    // Client-only: the fetches call apiFetch (useRequestHeaders), which has no
    // request context during the SSR immediate watch.
    if (import.meta.server) return
    await loadRoom(id)
    await loadNewest(id)
    void refreshOnline(id)
    void loadPins(id)
  },
  { immediate: true },
)

// Read receipt once the thread settles (or when live rows land).
watch(
  () => state.messageStatus[roomId.value],
  (status) => {
    if (status === "ready") markRead(roomId.value)
  },
)

watch(
  room,
  (value) => {
    if (value === null && state.messageStatus[roomId.value] === "ready") {
      notFound.value = true
    }
  },
)

onBeforeUnmount(() => {
  if (roomId.value) leaveActiveRoom()
})

function onSaveEdit(content: string): void {
  const target = editingMessage.value
  if (!target) return
  void edit(roomId.value, target.id, content)
  editingMessage.value = null
}

function onDelete(message: SnChatMessage): void {
  const confirmed = window.confirm(t("chat.deleteConfirm"))
  if (!confirmed) return
  void deleteMessage(roomId.value, message.id)
}

const threadOpen = computed({
  get: () => threadRoot.value !== null,
  set: (value) => {
    if (!value) threadRoot.value = null
  },
})
</script>

<template>
  <NuxtLayout name="chat">
    <div class="flex h-full flex-col">
      <!-- Not found -->
      <div v-if="notFound" class="flex flex-1 flex-col items-center justify-center gap-3 px-4">
        <IconSearchX class="h-9 w-9 text-base-content/40" />
        <h2 class="text-lg font-bold">{{ t("chat.roomNotFoundTitle") }}</h2>
        <NuxtLink to="/chat" class="btn btn-primary btn-sm">
          {{ t("chat.backToRooms") }}
        </NuxtLink>
      </div>

      <template v-else-if="room">
        <!-- Header -->
        <ChatRoomHeader
          :room="room"
          @toggle-info="infoOpen = !infoOpen"
          @toggle-pinned="infoOpen = true"
          @toggle-search="searchOpen = true"
        />

        <!-- Messages -->
        <div class="min-h-0 flex-1">
          <ChatMessageList
            :room="room"
            :room-id="room.id"
            @reply="replyTo = $event"
            @thread="threadRoot = $event"
            @edit="editingMessage = $event"
            @delete="onDelete"
          />
        </div>

        <!-- Composer -->
        <ChatComposer
          :room-id="room.id"
          :reply-to="replyTo"
          :editing="editingMessage"
          @save-edit="onSaveEdit"
          @clear-reply="replyTo = null"
          @clear-edit="editingMessage = null"
        />

        <!-- Overlays -->
        <ChatInfoDrawer v-model:open="infoOpen" :room="room" />
        <ChatSearchDialog v-model:open="searchOpen" />
        <ChatThreadPanel
          v-model:open="threadOpen"
          :room-id="room.id"
          :room="room"
          :root-message="threadRoot"
        />
      </template>

      <div v-else class="flex flex-1 items-center justify-center">
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>
    </div>
  </NuxtLayout>
</template>
