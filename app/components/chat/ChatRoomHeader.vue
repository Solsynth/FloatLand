<template>
  <div class="flex h-12 shrink-0 items-center gap-2 border-b border-base-300 bg-base-100 px-3 sm:px-4">
    <!-- Mobile back -->
    <NuxtLink
      to="/chat"
      class="btn btn-circle btn-ghost btn-sm lg:hidden"
      :title="t('common.back')"
    >
      <IconArrowLeft class="h-5 w-5" />
    </NuxtLink>

    <!-- Title + meta -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <h1 class="truncate text-sm font-bold">{{ title }}</h1>
        <span
          v-if="onlineCount > 0"
          class="badge badge-success badge-sm gap-1 text-[10px]"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-success-content" />
          {{ onlineCount }}
        </span>
      </div>
      <p class="truncate text-xs text-base-content/50">
        <span v-if="typingUsers.length" class="italic text-primary">
          {{ typingLabel }}
        </span>
        <span v-else-if="subtitle">{{ subtitle }}</span>
      </p>
    </div>

    <!-- Actions -->
    <div class="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        class="btn btn-ghost btn-circle btn-sm relative"
        :title="t('chat.pinnedTitle')"
        @click="emit('toggle-pinned')"
      >
        <IconPin class="h-4 w-4" />
        <span v-if="pinnedCount > 0" class="badge badge-primary badge-xs absolute -right-0.5 -top-0.5">
          {{ pinnedCount }}
        </span>
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-circle btn-sm"
        :title="t('chat.searchTitle')"
        @click="emit('toggle-search')"
      >
        <IconSearch class="h-4 w-4" />
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-circle btn-sm"
        :title="t('chat.infoTitle')"
        @click="emit('toggle-info')"
      >
        <IconInfo class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconPin, IconSearch, IconInfo } from "#components";
import type { SnChatRoom } from "~/types/chat";
import { formatRelativeTime } from "~/utils/datetime";

const props = defineProps<{
  room: SnChatRoom;
}>();

const emit = defineEmits<{
  "toggle-info": [];
  "toggle-pinned": [];
  "toggle-search": [];
}>();

const { t } = useI18n();
const { roomTitle: resolveTitle, typingFor, state, directPeer } = useChat();

const title = computed(() => resolveTitle(props.room) || t("chat.unnamedRoom"));

const onlineCount = computed(() => state.online[props.room.id] ?? 0);

const typingUsers = computed(() => typingFor(props.room.id));

const typingLabel = computed(() => {
  const names = typingUsers.value.map((user) => user.name).filter(Boolean)
  if (names.length === 1) return t("chat.typingOne", { name: names[0] })
  return t("chat.typingMany")
});

const subtitle = computed(() => {
  if (props.room.type === 1) {
    const peer = directPeer(props.room)
    if (peer) {
      const lastRead = state.lastReadBy[props.room.id]?.[peer.accountId]
      if (lastRead) return t("chat.readAt", { time: formatRelativeTime(lastRead) })
    }
    return t("chat.directMessage")
  }
  const count = props.room.members?.length ?? 0
  if (count > 0) return t("chat.memberCount", { count })
  return ""
});

const pinnedCount = computed(() => state.pinned[props.room.id]?.length ?? 0);
</script>
