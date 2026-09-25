<script setup lang="ts">
import { IconMessagesSquare, IconPlus, IconAlertCircle } from "#components";

definePageMeta({ middleware: "auth" });

const { t } = useI18n();
const { init, state, sortedRooms } = useChat();

const newOpen = ref(false);

const recentRooms = computed(() => sortedRooms.value.slice(0, 5));
const hasNoRooms = computed(
  () => state.roomStatus === "ready" && state.rooms.length === 0,
);
const failedToLoad = computed(
  () => state.roomStatus === "error" && state.rooms.length === 0,
);

onMounted(() => {
  void init()
});
</script>

<template>
  <NuxtLayout name="chat">
    <div class="h-full">
      <!-- Mobile: the room list lives here (the sidebar is desktop-only) -->
      <div class="h-full lg:hidden">
        <ChatSidebar />
      </div>

      <!-- Desktop: Discord-style welcome pane -->
      <div class="hidden h-full flex-col items-center justify-center gap-5 bg-base-100 px-8 lg:flex">
        <div class="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <IconMessagesSquare class="h-12 w-12 text-primary/70" />
        </div>

        <!-- Loading -->
        <template v-if="state.roomStatus === 'loading'">
          <div class="text-center">
            <h2 class="text-xl font-bold">{{ t("chat.loadingRooms") }}</h2>
            <p class="mx-auto mt-1.5 max-w-sm text-sm text-base-content/50">
              {{ t("chat.loadingRoomsHint") }}
            </p>
          </div>
          <span class="loading loading-spinner loading-lg text-primary" />
        </template>

        <!-- Load failed -->
        <template v-else-if="failedToLoad">
          <div class="text-center">
            <IconAlertCircle class="mx-auto h-8 w-8 text-error/60" />
            <h2 class="mt-2 text-xl font-bold">{{ t("chat.loadFailedShort") }}</h2>
            <p v-if="state.error" class="mx-auto mt-1.5 max-w-sm break-words text-sm text-base-content/50">
              {{ state.error }}
            </p>
          </div>
          <button type="button" class="btn btn-primary" @click="init">
            {{ t("chat.retry") }}
          </button>
        </template>

        <!-- Genuinely empty -->
        <template v-else-if="hasNoRooms">
          <div class="text-center">
            <h2 class="text-xl font-bold">{{ t("chat.emptyRooms") }}</h2>
            <p class="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-base-content/50">
              {{ t("chat.emptyRoomsHint") }}
            </p>
          </div>
          <button type="button" class="btn btn-primary" @click="newOpen = true">
            <IconPlus class="h-4 w-4" />
            {{ t("chat.newChat") }}
          </button>
        </template>

        <!-- Rooms exist: pick one, with a recent-chats shortcut -->
        <template v-else>
          <div class="text-center">
            <h2 class="text-xl font-bold">{{ t("chat.pickRoom") }}</h2>
            <p class="mx-auto mt-1.5 max-w-sm text-sm text-base-content/50">
              {{ t("chat.pickRoomHint") }}
            </p>
          </div>
          <div v-if="recentRooms.length" class="w-full max-w-sm">
            <p class="px-1 text-xs font-bold uppercase tracking-wide text-base-content/40">
              {{ t("chat.recentChats") }}
            </p>
            <div class="mt-1.5 space-y-0.5">
              <ChatRoomRow
                v-for="room in recentRooms"
                :key="room.id"
                :room="room"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <ChatNewDialog v-model:open="newOpen" />
  </NuxtLayout>
</template>
