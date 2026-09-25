<template>
  <dialog class="modal" :class="{ 'modal-open': open }" @close="$emit('update:open', false)">
    <div class="modal-box max-w-lg">
      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        type="button"
        :title="t('chat.close')"
        @click="$emit('update:open', false)"
      >
        <IconX class="h-4 w-4" />
      </button>

      <h2 class="text-lg font-bold">{{ t("chat.searchTitle") }}</h2>

      <input
        v-model="query"
        type="search"
        class="input input-bordered mt-3 w-full"
        :placeholder="t('chat.searchPlaceholder')"
        autofocus
        @input="runSearchDebounced"
      />

      <div v-if="busy" class="flex justify-center py-10">
        <span class="loading loading-spinner loading-sm" />
      </div>

      <template v-else-if="query">
        <!-- Rooms -->
        <section v-if="roomResults.length" class="mt-4">
          <h3 class="px-1 text-xs font-bold uppercase tracking-wide text-base-content/40">
            {{ t("chat.searchRooms") }}
          </h3>
          <div class="mt-1 space-y-0.5">
            <button
              v-for="room in roomResults"
              :key="room.id"
              type="button"
              class="flex w-full items-center gap-2 rounded-box px-3 py-2 text-left text-sm transition-colors hover:bg-base-200"
              @click="openRoom(room.id)"
            >
              <IconMessagesSquare class="h-4 w-4 shrink-0 text-base-content/40" />
              <span class="truncate">{{ roomTitle(room) || t("chat.unnamedRoom") }}</span>
            </button>
          </div>
        </section>

        <!-- Messages -->
        <section v-if="messageGroups.length" class="mt-4">
          <h3 class="px-1 text-xs font-bold uppercase tracking-wide text-base-content/40">
            {{ t("chat.searchMessages") }}
          </h3>
          <div class="mt-1 max-h-80 space-y-2 overflow-y-auto">
            <div v-for="group in messageGroups" :key="group.room.id" class="rounded-box border border-base-300 p-2">
              <p class="px-2 text-xs font-semibold text-base-content/60">
                {{ roomTitle(group.room) || t("chat.unnamedRoom") }}
              </p>
              <button
                v-for="message in group.messages.slice(0, 5)"
                :key="message.id"
                type="button"
                class="mt-0.5 flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-base-200"
                @click="openRoom(group.room.id)"
              >
                <span class="mt-0.5 shrink-0 text-[10px] text-base-content/40">{{ messageTime(message) }}</span>
                <span class="min-w-0 flex-1 truncate text-xs text-base-content/70">
                  <span class="inline-flex min-w-0 items-center gap-1">
                    <IconPaperclip v-if="messageHasAttachment(message)" class="h-3 w-3 shrink-0" />
                    <span class="truncate">{{ messagePreview(message) }}</span>
                  </span>
                </span>
              </button>
            </div>
          </div>
        </section>

        <p v-if="!busy && !roomResults.length && !messageGroups.length" class="py-8 text-center text-sm text-base-content/50">
          {{ t("chat.searchEmpty") }}
        </p>
      </template>

      <p v-else class="py-8 text-center text-sm text-base-content/50">
        {{ t("chat.searchHint") }}
      </p>
    </div>
    <div class="modal-backdrop" @click="$emit('update:open', false)" />
  </dialog>
</template>

<script setup lang="ts">
import { IconX, IconMessagesSquare, IconPaperclip } from "#components";
import { searchChatRooms, searchChatMessages } from "~/utils/api";
import { voiceUrlOf } from "~/composables/useChat";
import { formatTime } from "~/utils/datetime";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [value: boolean] }>();

const { t } = useI18n();
const { roomTitle } = useChat();

const query = ref("");
const busy = ref(false);
const roomResults = ref<Awaited<ReturnType<typeof searchChatRooms>>>([]);
const messageGroups = ref<Awaited<ReturnType<typeof searchChatMessages>>["groups"]>([]);

let timer: ReturnType<typeof setTimeout> | null = null

function runSearchDebounced(): void {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => void runSearch(), 400)
}

async function runSearch(): Promise<void> {
  const q = query.value.trim()
  if (!q) {
    roomResults.value = []
    messageGroups.value = []
    return
  }
  busy.value = true
  try {
    const [rooms, messages] = await Promise.all([
      searchChatRooms(q, 10).catch(() => []),
      searchChatMessages(q, 10, 0).catch(() => ({ groups: [], total: 0 })),
    ])
    roomResults.value = rooms
    messageGroups.value = messages.groups
  } catch {
    roomResults.value = []
    messageGroups.value = []
  } finally {
    busy.value = false
  }
}

function messagePreview(message: Awaited<ReturnType<typeof searchChatMessages>>["groups"][number]["messages"][number]): string {
  if (message.deletedAt) return t("chat.messageDeleted")
  if (voiceUrlOf(message)) return t("chat.voiceMessage")
  if (message.attachments?.length) return message.attachments[0]?.name ?? t("chat.attachment")
  return message.content || t("chat.message")
}

function messageHasAttachment(message: Awaited<ReturnType<typeof searchChatMessages>>["groups"][number]["messages"][number]): boolean {
  return Boolean(message.attachments?.length)
}

function messageTime(message: Awaited<ReturnType<typeof searchChatMessages>>["groups"][number]["messages"][number]): string {
  return formatTime(message.createdAt)
}

function openRoom(roomId: string): void {
  emit("update:open", false)
  navigateTo(`/chat/${roomId}`)
}
</script>
