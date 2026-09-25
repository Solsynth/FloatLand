<template>
  <Transition name="drawer-fade">
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-black/40"
      @click="$emit('update:open', false)"
    />
  </Transition>
  <Transition name="drawer-slide">
    <aside
      v-if="open"
      class="fixed top-16 right-0 bottom-0 z-50 flex w-80 flex-col border-l border-base-300 bg-base-100 shadow-sm"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-base-300 px-4 py-3">
        <h2 class="text-base font-bold">{{ t("chat.infoTitle") }}</h2>
        <button type="button" class="btn btn-ghost btn-circle btn-sm" @click="$emit('update:open', false)">
          <IconX class="h-4 w-4" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <!-- Room summary -->
        <div class="flex items-center gap-3">
          <div class="avatar">
            <div class="w-14 rounded-full">
              <FileImage v-if="avatarId" :file="{ id: avatarId }" :alt="title" class="h-full w-full object-cover" />
              <div v-else class="flex h-full w-full items-center justify-center rounded-full bg-primary/15 text-base font-bold text-primary">
                {{ initials }}
              </div>
            </div>
          </div>
          <div class="min-w-0">
            <h3 class="truncate text-sm font-bold">{{ title }}</h3>
            <p v-if="room.description" class="mt-0.5 line-clamp-2 text-xs text-base-content/50">
              {{ room.description }}
            </p>
          </div>
        </div>

        <!-- Notify level -->
        <div class="mt-5">
          <p class="text-xs font-bold uppercase tracking-wide text-base-content/40">
            {{ t("chat.notifyLevel") }}
          </p>
          <select v-model="notifyLevel" class="select select-bordered select-sm mt-2 w-full" @change="saveNotify">
            <option :value="0">{{ t("chat.notifyAll") }}</option>
            <option :value="1">{{ t("chat.notifyMentions") }}</option>
            <option :value="2">{{ t("chat.notifySilent") }}</option>
          </select>
        </div>

        <!-- Pinned messages -->
        <div class="mt-5">
          <p class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-base-content/40">
            <IconPin class="h-3.5 w-3.5" />
            {{ t("chat.pinnedTitle") }}
          </p>
          <div v-if="pinned.length === 0" class="mt-2 text-xs text-base-content/40">
            {{ t("chat.noPinned") }}
          </div>
          <div v-else class="mt-2 space-y-1.5">
            <div v-for="pin in pinned" :key="pin.id" class="group flex items-start gap-2 rounded-box border border-base-300 px-2.5 py-2">
              <div class="min-w-0 flex-1">
                <p class="flex items-center gap-1 text-xs font-medium text-base-content/80">
                  <IconPaperclip v-if="pinHasAttachment(pin)" class="h-3 w-3 shrink-0" />
                  <span class="truncate">{{ pinPreview(pin) }}</span>
                </p>
                <p class="text-[10px] text-base-content/40">
                  {{ pinTime(pin) }}
                </p>
              </div>
              <button
                type="button"
                class="btn btn-ghost btn-circle btn-xs opacity-0 transition-opacity group-hover:opacity-100"
                :title="t('chat.unpin')"
                @click="unpin(pin)"
              >
                <IconPinOff class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Members -->
        <div class="mt-5">
          <p class="text-xs font-bold uppercase tracking-wide text-base-content/40">
            {{ t("chat.members") }} ({{ members.length }})
          </p>
          <div v-if="membersLoading" class="flex justify-center py-4">
            <span class="loading loading-spinner loading-xs" />
          </div>
          <div v-else class="mt-2 space-y-1">
            <div
              v-for="member in members"
              :key="member.id"
              class="flex items-center gap-2.5 rounded-box px-2 py-1.5 hover:bg-base-200"
            >
              <div class="avatar">
                <div class="w-8 rounded-full">
                  <FileImage v-if="member.account?.profile?.picture" :file="member.account?.profile?.picture" :alt="memberName(member)" class="h-full w-full object-cover" />
                  <div v-else class="flex h-full w-full items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                    {{ memberName(member).slice(0, 2).toUpperCase() }}
                  </div>
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ memberName(member) }}</p>
                <p class="truncate text-[10px] text-base-content/40">
                  {{ memberMeta(member) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Invite member (groups) -->
        <div v-if="isGroup" class="mt-5">
          <p class="text-xs font-bold uppercase tracking-wide text-base-content/40">
            {{ t("chat.inviteMember") }}
          </p>
          <div class="mt-2 flex gap-2">
            <input
              v-model="inviteQuery"
              type="search"
              class="input input-bordered input-sm flex-1"
              :placeholder="t('chat.searchAccountsPlaceholder')"
              @input="searchInviteAccountsDebounced"
            />
            <button
              v-if="inviteTarget"
              type="button"
              class="btn btn-primary btn-sm"
              @click="inviteMember"
            >
              {{ t("chat.invite") }}
            </button>
          </div>
          <div v-if="inviteResults.length" class="mt-1.5 space-y-0.5">
            <button
              v-for="account in inviteResults"
              :key="account.id"
              type="button"
              class="flex w-full items-center gap-2 rounded-box px-2 py-1.5 text-left text-sm transition-colors hover:bg-base-200"
              @click="inviteTarget = account"
            >
              <span class="min-w-0 flex-1 truncate">{{ account.nick || account.name }}</span>
              <span class="text-[10px] text-base-content/40">@{{ account.name }}</span>
            </button>
          </div>
        </div>

        <!-- Leave -->
        <button
          type="button"
          class="btn btn-outline btn-error btn-sm mt-6 w-full"
          @click="leave"
        >
          <IconLogOut class="h-4 w-4" />
          {{ t("chat.leaveRoom") }}
        </button>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { IconX, IconPin, IconPinOff, IconLogOut, IconPaperclip } from "#components";
import type { SnChatRoom, SnChatMember, SnChatMessagePin } from "~/types/chat";
import { fetchChatMembers, updateChatNotifyLevel, createChatInvite, leaveChatRoom, searchAccounts } from "~/utils/api";
import { voiceUrlOf } from "~/composables/useChat";
import { formatRelativeTime } from "~/utils/datetime";

const props = defineProps<{
  open: boolean;
  room: SnChatRoom;
}>();

const emit = defineEmits<{ "update:open": [value: boolean] }>();

const { t } = useI18n();
const { roomTitle: resolveTitle, directPeer, state, loadPins, unpinMessage } = useChat();
const { user } = useAuth();

const members = ref<SnChatMember[]>([]);
const membersLoading = ref(false);
const notifyLevel = ref(0);
const inviteQuery = ref("");
const inviteResults = ref<Awaited<ReturnType<typeof searchAccounts>>>([]);
const inviteTarget = ref<(typeof inviteResults.value)[number] | null>(null);

const isGroup = computed(() => props.room.type !== 1);
const title = computed(() => resolveTitle(props.room) || t("chat.unnamedRoom"));
const avatarId = computed(() => {
  if (props.room.type === 1) {
    return directPeer(props.room)?.account?.profile?.picture?.id ?? null
  }
  return props.room.picture?.id ?? props.room.realm?.picture?.id ?? null
});
const initials = computed(() => (title.value || "?").slice(0, 2).toUpperCase());
const pinned = computed(() => state.pinned[props.room.id] ?? []);

let inviteSearchTimer: ReturnType<typeof setTimeout> | null = null

function memberName(member: SnChatMember): string {
  return member.nick || member.account?.nick || member.account?.name || "?"
}

function memberMeta(member: SnChatMember): string {
  if (member.accountId === user.value?.id) return t("chat.youLabel")
  const lastRead = state.lastReadBy[props.room.id]?.[member.accountId]
  if (lastRead) return `${t("chat.readAt")} ${formatRelativeTime(lastRead)}`
  return ""
}

function pinHasAttachment(pin: SnChatMessagePin): boolean {
  return Boolean(pin.message?.attachments?.length)
}

function pinPreview(pin: SnChatMessagePin): string {
  const message = pin.message
  if (!message) return t("chat.message")
  if (message.deletedAt) return t("chat.messageDeleted")
  if (voiceUrlOf(message)) return t("chat.voiceMessage")
  if (message.attachments?.length) return message.attachments[0]?.name ?? t("chat.attachment")
  return message.content || t("chat.message")
}

function pinTime(pin: SnChatMessagePin): string {
  return formatRelativeTime(pin.createdAt ?? "")
}

async function loadMembers(): Promise<void> {
  membersLoading.value = true
  try {
    const page = await fetchChatMembers(props.room.id, 100, 0)
    members.value = page.items
  } catch {
    members.value = props.room.members ?? []
  } finally {
    membersLoading.value = false
  }
}

async function saveNotify(): Promise<void> {
  try {
    await updateChatNotifyLevel(props.room.id, notifyLevel.value)
  } catch {
    // Best-effort.
  }
}

async function unpin(pin: SnChatMessagePin): Promise<void> {
  await unpinMessage(props.room.id, pin.id)
}

function searchInviteAccountsDebounced(): void {
  if (inviteSearchTimer) clearTimeout(inviteSearchTimer)
  inviteSearchTimer = setTimeout(() => void searchInviteAccounts(), 350)
}

async function searchInviteAccounts(): Promise<void> {
  const q = inviteQuery.value.trim()
  if (!q) {
    inviteResults.value = []
    return
  }
  try {
    inviteResults.value = await searchAccounts(q, 5)
  } catch {
    inviteResults.value = []
  }
}

async function inviteMember(): Promise<void> {
  if (!inviteTarget.value) return
  try {
    await createChatInvite(props.room.id, inviteTarget.value.id, 0)
    inviteQuery.value = ""
    inviteResults.value = []
    inviteTarget.value = null
  } catch {
    // Best-effort; the error surface lives in the sidebar.
  }
}

async function leave(): Promise<void> {
  try {
    await leaveChatRoom(props.room.id)
    state.rooms = state.rooms.filter((room) => room.id !== props.room.id)
    emit("update:open", false)
    navigateTo("/chat")
  } catch {
    // Best-effort.
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
    void loadPins(props.room.id)
    void loadMembers()
    notifyLevel.value = props.room.members?.find((member) => member.accountId === user.value?.id)?.notify ?? 0
  },
  { immediate: true },
)
</script>
