<template>
  <aside class="flex h-full flex-col">
    <!-- Header actions -->
    <div class="flex items-center justify-between gap-2 px-3 pt-3 pb-1.5">
      <h2 class="text-sm font-bold uppercase tracking-wide text-base-content/50">
        {{ t("chat.title") }}
      </h2>
      <div class="flex items-center gap-0.5">
        <button
          type="button"
          class="btn btn-ghost btn-circle btn-sm"
          :title="t('chat.newChat')"
          @click="newOpen = true"
        >
          <IconPlus class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-circle btn-sm"
          :title="t('chat.markAllRead')"
          @click="readAll"
        >
          <IconCheckCheck class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Discord-style search box above the list -->
    <div class="px-3 pb-1.5">
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-md border border-base-300 bg-base-100 px-2.5 py-1.5 text-left text-xs text-base-content/40 transition-colors hover:border-base-content/20"
        @click="searchOpen = true"
      >
        <IconSearch class="h-3.5 w-3.5 shrink-0" />
        <span class="flex-1 truncate">{{ t("chat.searchPlaceholder") }}</span>
      </button>
    </div>

    <!-- Filters (sliding-pill tab switch, timeline parity) -->
    <div class="px-3 pb-2" role="tablist" aria-label="Room filters">
      <div class="relative flex items-center rounded-xl bg-base-200/60 p-1">
        <span
          class="absolute bottom-1 top-1 rounded-lg bg-primary/15 transition-[left] duration-200 ease-out"
          :style="pillStyle"
        />
        <button
          v-for="option in filters"
          :key="option.value"
          type="button"
          role="tab"
          :aria-selected="state.filter === option.value"
          class="relative z-10 flex h-8 flex-1 items-center justify-center rounded-lg text-xs transition-colors"
          :class="
            state.filter === option.value
              ? 'font-bold text-primary'
              : 'font-medium text-base-content/55 hover:text-base-content'
          "
          @click="state.filter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Invites banner -->
    <button
      v-if="inviteCount > 0"
      type="button"
      class="mx-3 mt-1.5 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-left text-xs font-medium text-primary transition-colors hover:bg-primary/20"
      @click="invitesOpen = true"
    >
      <IconBellRing class="h-3.5 w-3.5 shrink-0" />
      <span class="min-w-0 flex-1 truncate">
        {{ t("chat.pendingInvites", { count: inviteCount }) }}
      </span>
      <IconChevronRight class="h-3 w-3 shrink-0" />
    </button>

    <!-- Room list -->
    <div class="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
      <div v-if="state.roomStatus === 'loading'" class="space-y-1">
        <div v-for="index in 8" :key="index" class="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
          <div class="skeleton h-10 w-10 shrink-0 rounded-full" />
          <div class="min-w-0 flex-1 space-y-1.5">
            <div class="skeleton h-3 w-2/3" />
            <div class="skeleton h-2.5 w-1/3" />
          </div>
        </div>
      </div>

      <div v-else-if="!isAuthenticated" class="px-3 py-10 text-center">
        <IconLock class="mx-auto h-7 w-7 text-base-content/30" />
        <p class="mt-2 text-sm text-base-content/50">{{ t("chat.signInToSee") }}</p>
        <NuxtLink to="/auth/login" class="btn btn-primary btn-sm mt-3">
          {{ t("nav.signIn") }}
        </NuxtLink>
      </div>

      <div v-else-if="state.roomStatus === 'error' && !visibleRooms.length" class="px-3 py-10 text-center">
        <IconAlertCircle class="mx-auto h-7 w-7 text-error/60" />
        <p class="mt-2 text-sm text-base-content/60">{{ t("chat.loadFailedShort") }}</p>
        <p v-if="state.error" class="mt-1 px-2 text-xs break-words text-base-content/40">
          {{ state.error }}
        </p>
        <button type="button" class="btn btn-ghost btn-sm mt-3" @click="loadRooms">
          {{ t("chat.retry") }}
        </button>
      </div>

      <div v-else-if="visibleRooms.length === 0" class="px-3 py-10 text-center">
        <IconMessagesSquare class="mx-auto h-7 w-7 text-base-content/30" />
        <p class="mt-2 text-sm text-base-content/50">{{ t("chat.emptyRooms") }}</p>
        <button type="button" class="btn btn-primary btn-sm mt-3" @click="newOpen = true">
          {{ t("chat.newChat") }}
        </button>
      </div>

      <div v-else class="space-y-1">
        <ChatRoomRow
          v-for="room in visibleRooms"
          :key="room.id"
          :room="room"
          :active="room.id === activeRoomId"
          @click="emit('navigated')"
        />
      </div>
    </div>

    <!-- Dialogs -->
    <ChatNewDialog v-model:open="newOpen" />
    <ChatInvitesDialog v-model:open="invitesOpen" />
    <ChatSearchDialog v-model:open="searchOpen" />
  </aside>
</template>

<script setup lang="ts">
import {
  IconSearch,
  IconPlus,
  IconCheckCheck,
  IconBellRing,
  IconChevronRight,
  IconMessagesSquare,
  IconLock,
  IconAlertCircle,
} from "#components";

const emit = defineEmits<{ navigated: [] }>();

const { t } = useI18n();
const { state, visibleRooms, inviteCount, loadRooms, readAll, init } = useChat();
const { isAuthenticated } = useAuth();

const newOpen = ref(false);
const invitesOpen = ref(false);
const searchOpen = ref(false);

const filters = computed(() => [
  { value: "all", label: t("chat.filterAll") },
  { value: "direct", label: t("chat.filterDirect") },
  { value: "group", label: t("chat.filterGroups") },
] as const);

// Sliding highlight position (mirrors timeline.vue's segmented filter).
const pillStyle = computed(() => {
  const idx = state.filter === "direct" ? 1 : state.filter === "group" ? 2 : 0;
  return {
    width: "calc((100% - 0.5rem) / 3)",
    left: `calc(0.25rem + ${idx} * (100% - 0.5rem) / 3)`,
  };
});

const activeRoomId = computed(() => state.activeRoomId);

onMounted(() => {
  void init()
});
</script>
