<template>
  <aside class="flex h-full flex-col bg-base-100">
    <!-- Compose -->
    <div class="px-3 pt-4 pb-2">
      <button
        class="btn btn-primary btn-sm w-full gap-2"
        type="button"
        @click="$emit('compose')"
      >
        <IconPenSquare class="h-4 w-4" />
        <span class="flex-1 text-left">{{ t("mail.compose") }}</span>
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-none">
      <!-- Mailbox selector -->
      <div class="space-y-0.5">
        <p class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-base-content/30">
          {{ t("mail.mailbox") }}
        </p>
        <select
          v-if="state.mailboxes.length"
          class="select select-bordered select-sm w-full"
          :value="state.selectedMailboxId ?? ''"
          @change="onMailboxChange"
        >
          <option
            v-for="mailbox in state.mailboxes"
            :key="mailbox.id"
            :value="mailbox.id"
          >
            {{ mailbox.name || mailbox.address }}
          </option>
        </select>
        <p
          v-else-if="!state.loading"
          class="px-3 text-xs text-base-content/50"
        >
          {{ t("mail.noMailboxes") }}
        </p>
      </div>

      <!-- Folders -->
      <div class="space-y-0.5">
        <p class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-base-content/30">
          {{ t("mail.foldersTitle") }}
        </p>
        <NuxtLink
          v-for="folder in folders"
          :key="folder.id"
          :to="`/mail/${folder.id}`"
          class="group flex items-center gap-3 rounded-box px-3 py-2.5 text-sm font-medium transition-colors"
          :class="isActive(folder.id)
            ? 'bg-primary/10 text-primary shadow-sm'
            : 'text-base-content/70 hover:bg-base-200/80 hover:text-base-content'"
        >
          <component
            :is="folder.icon"
            class="w-5 h-5 shrink-0 transition-all"
            :class="isActive(folder.id) ? 'text-primary' : 'text-base-content/40 group-hover:text-base-content/70'"
          />
          <span class="flex-1">{{ folder.label }}</span>
          <span
            v-if="folder.id === 'inbox' && inboxUnread > 0"
            class="badge badge-error badge-sm text-error-content"
          >
            {{ inboxUnread > 99 ? "99+" : inboxUnread }}
          </span>
        </NuxtLink>
      </div>

      <!-- Labels -->
      <div class="space-y-0.5">
        <div class="flex items-center justify-between px-3 mb-2">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-base-content/30">
            {{ t("mail.labels") }}
          </p>
          <button
            class="btn btn-ghost btn-xs btn-circle"
            :title="t('mail.createLabel')"
            @click="labelsOpen = true"
          >
            <IconPlus class="w-3.5 h-3.5" />
          </button>
        </div>
        <NuxtLink
          v-for="label in state.labels"
          :key="label.id"
          :to="`/mail/inbox?label=${label.id}`"
          class="group flex items-center gap-3 rounded-box px-3 py-2 text-sm font-medium transition-colors"
          :class="isLabelActive(label.id)
            ? 'bg-primary/10 text-primary shadow-sm'
            : 'text-base-content/70 hover:bg-base-200/80 hover:text-base-content'"
        >
          <span
            class="h-3 w-3 shrink-0 rounded-full"
            :style="{ backgroundColor: label.color || '#888' }"
          />
          <span class="truncate">{{ label.name }}</span>
        </NuxtLink>
        <p
          v-if="!state.labels.length"
          class="px-3 text-xs text-base-content/40"
        >
          {{ t("mail.noLabels") }}
        </p>
      </div>

      <!-- Blocklist -->
      <div class="space-y-0.5">
        <button
          type="button"
          class="group flex w-full items-center gap-3 rounded-box px-3 py-2.5 text-sm font-medium transition-colors text-base-content/70 hover:bg-base-200/80 hover:text-base-content"
          @click="$emit('open-blocklist')"
        >
          <IconShieldBan
            class="w-5 h-5 shrink-0 text-base-content/40 group-hover:text-base-content/70"
          />
          <span>{{ t("mail.blockedSenders") }}</span>
        </button>
      </div>
    </nav>

    <!-- Labels dialog -->
    <MailLabelDialog
      :open="labelsOpen"
      @close="labelsOpen = false"
    />

    <!-- User Profile -->
    <div class="px-3 pb-4 pt-2">
      <div v-if="isAuthenticated && user" class="dropdown dropdown-end dropdown-top w-full">
        <button
          class="flex w-full items-center gap-3 rounded-box px-3 py-2.5 transition-colors hover:bg-base-200/80"
        >
          <div v-if="avatarUrl" class="avatar">
            <div class="w-8 rounded-full">
              <FileImage :file="avatarUrl" :alt="displayName || 'User'" />
            </div>
          </div>
          <div v-else class="avatar avatar-placeholder">
            <div class="w-8 rounded-full bg-primary/10 text-primary">
              <span class="text-xs font-bold">{{ fallbackInitials }}</span>
            </div>
          </div>
          <div class="min-w-0 flex-1 text-left">
            <div class="truncate text-sm font-semibold">{{ displayName }}</div>
            <div class="truncate text-[11px] text-base-content/40">@{{ username }}</div>
          </div>
          <IconChevronUp class="w-3.5 h-3.5 shrink-0 text-base-content/30" />
        </button>
        <ul class="dropdown-content menu mb-2 w-full min-w-[200px] rounded-box bg-base-200 p-2 shadow-sm">
          <li>
            <NuxtLink to="/accounts/me" class="flex items-center gap-3">
              <IconUser class="w-4 h-4" />
              {{ t("nav.account") }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/accounts/me/settings" class="flex items-center gap-3">
              <IconSettings class="w-4 h-4" />
              {{ t("nav.settings") }}
            </NuxtLink>
          </li>
          <li>
            <button @click="handleLogout" class="flex items-center gap-3 text-error">
              <IconLogOut class="w-4 h-4" />
              {{ t("nav.logout") }}
            </button>
          </li>
        </ul>
      </div>
      <NuxtLink
        v-else
        to="/auth/login"
        class="flex items-center gap-3 rounded-box px-3 py-2.5 transition-colors hover:bg-base-200/80"
      >
        <div class="avatar avatar-placeholder">
          <div class="w-8 rounded-full bg-base-300 text-base-content/60">
            <IconLogIn class="w-4 h-4" />
          </div>
        </div>
        <div class="text-left">
          <div class="text-sm font-semibold">{{ t("nav.signIn") }}</div>
          <div class="text-[11px] text-base-content/40">{{ t("nav.joinCommunity") }}</div>
        </div>
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  IconPenSquare,
  IconInbox,
  IconSend,
  IconFileText,
  IconAlertTriangle,
  IconTrash2,
  IconArchive,
  IconShieldBan,
  IconPlus,
  IconChevronUp,
  IconLogOut,
  IconLogIn,
  IconUser,
  IconSettings,
} from "#components";

const { t } = useI18n();
const route = useRoute();
const { state, selectMailbox } = useMail();
const { isAuthenticated, user, displayName: authDisplayName, logout } = useAuth();

const labelsOpen = ref(false);

defineEmits<{
  compose: [];
  openBlocklist: [];
}>();

const folders = computed(() => [
  { id: "inbox", label: t("mail.folders.inbox"), icon: IconInbox },
  { id: "sent", label: t("mail.folders.sent"), icon: IconSend },
  { id: "drafts", label: t("mail.folders.drafts"), icon: IconFileText },
  { id: "spam", label: t("mail.folders.spam"), icon: IconAlertTriangle },
  { id: "trash", label: t("mail.folders.trash"), icon: IconTrash2 },
  { id: "archive", label: t("mail.folders.archive"), icon: IconArchive },
]);

const selectedMailboxId = computed(() => state.selectedMailboxId);

const inboxUnread = computed(() =>
  selectedMailboxId.value ? (state.unreadByMailbox[selectedMailboxId.value] ?? 0) : 0,
);

const displayName = computed(() => authDisplayName.value || user.value?.nick || user.value?.name || "");
const username = computed(() => user.value?.name || "");
const avatarUrl = computed(() => user.value?.profile?.picture ?? null);
const fallbackInitials = computed(() => (username.value || "?").slice(0, 2).toUpperCase());

function isActive(folder: string) {
  return route.path === `/mail/${folder}`;
}

function isLabelActive(labelId: string) {
  return route.query.label === labelId;
}

function onMailboxChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value) selectMailbox(value);
}

function handleLogout() {
  logout();
  navigateTo("/");
}
</script>
