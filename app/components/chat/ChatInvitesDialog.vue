<template>
  <dialog class="modal" :class="{ 'modal-open': open }" @close="$emit('update:open', false)">
    <div class="modal-box max-w-md">
      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        type="button"
        :title="t('chat.close')"
        @click="$emit('update:open', false)"
      >
        <IconX class="h-4 w-4" />
      </button>

      <h2 class="text-lg font-bold">{{ t("chat.invitesTitle") }}</h2>

      <div v-if="!invites.length" class="py-8 text-center text-sm text-base-content/50">
        {{ t("chat.noInvites") }}
      </div>

      <div v-else class="mt-3 space-y-2">
        <div
          v-for="invite in invites"
          :key="invite.id"
          class="flex items-center gap-3 rounded-box border border-base-300 px-3 py-2.5"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold">{{ inviteTitle(invite) }}</p>
            <p class="truncate text-xs text-base-content/50">
              {{ t("chat.invitedBy") }} {{ inviterName(invite) }}
            </p>
          </div>
          <button type="button" class="btn btn-primary btn-sm" :disabled="busyId === invite.chatRoomId" @click="accept(invite.chatRoomId)">
            {{ t("chat.accept") }}
          </button>
          <button type="button" class="btn btn-ghost btn-sm" :disabled="busyId === invite.chatRoomId" @click="decline(invite.chatRoomId)">
            {{ t("chat.decline") }}
          </button>
        </div>
      </div>
    </div>
    <div class="modal-backdrop" @click="$emit('update:open', false)" />
  </dialog>
</template>

<script setup lang="ts">
import { IconX } from "#components";
import type { SnChatMember } from "~/types/chat";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [value: boolean] }>();

const { t } = useI18n();
const { state, acceptInvite, declineInvite, roomTitle } = useChat();

const busyId = ref<string | null>(null);

const invites = computed(() => state.invites);

function inviteTitle(invite: SnChatMember): string {
  const room = state.rooms.find((candidate) => candidate.id === invite.chatRoomId)
  if (room) return roomTitle(room) || t("chat.unnamedRoom")
  return invite.chatRoomId.slice(0, 8)
}

function inviterName(invite: SnChatMember): string {
  return invite.account?.nick || invite.account?.name || "?"
}

async function accept(roomId: string): Promise<void> {
  busyId.value = roomId
  await acceptInvite(roomId)
  busyId.value = null
}

async function decline(roomId: string): Promise<void> {
  busyId.value = roomId
  await declineInvite(roomId)
  busyId.value = null
}
</script>
