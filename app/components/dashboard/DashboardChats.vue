<template>
  <div class="dash-card p-5">
    <h3 class="dash-card__title">
      <IconMessagesSquare class="h-4 w-4 text-base-content/45" />
      {{ t("dashboard.chats.title") }}
    </h3>

    <div v-if="loading" class="flex justify-center py-6">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <div v-else-if="error" class="flex flex-col items-center gap-1 py-6 text-center">
      <IconMessagesSquare class="h-6 w-6 text-base-content/30" />
      <p class="text-xs text-base-content/50">{{ t("dashboard.chats.failed") }}</p>
    </div>

    <div v-else-if="rooms.length === 0" class="flex flex-col items-center gap-1 py-6 text-center">
      <IconMessagesSquare class="h-6 w-6 text-base-content/30" />
      <p class="text-xs text-base-content/50">{{ t("dashboard.chats.empty") }}</p>
    </div>

    <div v-else class="mt-2 -mx-2 flex flex-col">
      <component
        :is="href(room) ? NuxtLink : 'div'"
        v-for="room in rooms"
        :key="room.id"
        :to="href(room)"
        class="flex items-center gap-3 rounded-box px-2 py-2 transition-colors hover:bg-base-200/70"
      >
        <span class="relative shrink-0">
          <img
            v-if="avatarUrl(room)"
            :src="avatarUrl(room)"
            alt=""
            class="h-9 w-9 rounded-full bg-base-200 object-cover"
          >
          <span
            v-else
            class="flex h-9 w-9 items-center justify-center rounded-full bg-base-200 text-xs font-bold text-base-content/40"
          >
            {{ initial(room) }}
          </span>
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium text-base-content/85">
            {{ roomName(room) }}
          </span>
          <span v-if="roomSubtitle(room)" class="block truncate text-xs text-base-content/45">
            {{ roomSubtitle(room) }}
          </span>
        </span>
      </component>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NuxtLink, IconMessagesSquare } from "#components";
import type { SnChatRoom } from "~/types/chat";
import { fetchChatRooms } from "~/utils/api";
import { getFileUrl } from "~/utils/files";

const ROOM_TYPE_DM = 1;

const { t } = useI18n();
const auth = useAuth();
const { isAuthenticated, user } = auth;

const loading = ref(false);
const error = ref(false);
const rooms = ref<SnChatRoom[]>([]);

function roomName(room: SnChatRoom): string {
  if (room.name) return room.name;
  if (room.type === ROOM_TYPE_DM) {
    const peer = room.members?.find((m) => m.account.id !== user.value?.id);
    return peer?.nick || peer?.account.nick || peer?.account.name || t("chat.directMessage");
  }
  return t("chat.unnamedRoom");
}

function roomSubtitle(room: SnChatRoom): string {
  if (room.type !== ROOM_TYPE_DM) return room.realm?.name ?? "";
  return "";
}

// Chat rooms open by room id in the web chat.
function href(room: SnChatRoom): string | null {
  if (room.id) return `/chat/${room.id}`;
  return null;
}

function avatarUrl(room: SnChatRoom): string {
  return getFileUrl(room.picture?.id ?? room.realm?.picture?.id) ?? "";
}

function initial(room: SnChatRoom): string {
  const name = room.name || room.realm?.name || (room.type === ROOM_TYPE_DM ? "DM" : "?");
  return name.charAt(0).toUpperCase();
}

async function load() {
  if (!isAuthenticated.value) return;
  loading.value = true;
  error.value = false;
  try {
    const all = await fetchChatRooms(20);
    rooms.value = [...all]
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
      .slice(0, 5);
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
});
</script>
