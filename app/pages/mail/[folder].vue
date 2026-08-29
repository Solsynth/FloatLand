<template>
  <NuxtLayout name="mail">
    <div class="flex h-full overflow-hidden">
      <!-- Left: Email List -->
      <div
        class="flex flex-col h-full border-r border-base-300 shrink-0"
        :class="hasSelected ? 'w-[380px]' : 'w-full'"
      >
        <!-- Header -->
        <div class="shrink-0 border-b border-base-300">
          <div class="flex items-center gap-2 px-4 py-3 sm:px-6">
            <h1 class="text-lg font-semibold">{{ t(`mail.folders.${folder}`) }}</h1>
            <span v-if="total > 0" class="text-sm text-base-content/50">{{ total }}</span>
          </div>
          <div class="flex items-center gap-2 px-4 pb-3 sm:px-6">
            <div class="relative flex-1">
              <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
              <input
                v-model="searchQuery"
                type="search"
                class="input input-sm input-bordered pl-9 w-full"
                :placeholder="t('mail.searchPlaceholder')"
                @input="handleSearch"
              />
            </div>
            <button class="btn btn-ghost btn-sm btn-circle shrink-0" :title="t('common.refresh')" @click="load(true)">
              <IconRefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
            </button>
          </div>
          <div class="flex items-center gap-1 px-4 pb-3 sm:px-6">
            <button class="btn btn-ghost btn-xs" :class="{ 'btn-active bg-primary/10 text-primary': filterRead === 'all' }" @click="setFilter('all')">
              {{ t("mail.filterAll") }}
            </button>
            <button class="btn btn-ghost btn-xs" :class="{ 'btn-active bg-primary/10 text-primary': filterRead === 'unread' }" @click="setFilter('unread')">
              {{ t("mail.filterUnread") }}
            </button>
            <button class="btn btn-ghost btn-xs" :class="{ 'btn-active bg-primary/10 text-primary': filterRead === 'starred' }" @click="setFilter('starred')">
              {{ t("mail.filterStarred") }}
            </button>
          </div>
        </div>

        <!-- Email list -->
        <div class="flex-1 min-h-0 overflow-y-auto px-2 pb-4 sm:px-3">
          <div v-if="loading && emails.length === 0" class="flex justify-center py-16">
            <ConfuseSpinner :message="t('mail.loading')" />
          </div>
          <div v-else-if="error" class="flex flex-col items-center gap-3 py-16 text-center">
            <IconAlertCircle class="h-8 w-8 text-error" />
            <p class="text-sm text-error">{{ error }}</p>
            <button class="btn btn-ghost btn-sm" @click="load(true)">{{ t("mail.retry") }}</button>
          </div>
          <div v-else-if="emails.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
            <IconMailOpen class="mb-3 h-12 w-12 text-base-content/30" />
            <p class="text-sm text-base-content/50">{{ t("mail.noEmails") }}</p>
          </div>
          <div v-else>
            <!-- Select all -->
            <div class="flex items-center gap-2 px-2 py-1.5">
              <button class="btn btn-ghost btn-xs btn-circle" :title="allSelected ? t('mail.deselectAll') : t('mail.selectAll')" @click="toggleSelectAll">
                <IconMinus v-if="someSelected" class="h-4 w-4 text-primary" />
                <IconSquareCheck v-else-if="allSelected" class="h-4 w-4 text-primary" />
                <IconSquare v-else class="h-4 w-4 text-base-content/40" />
              </button>
              <span v-if="selectionMode" class="text-xs text-base-content/50">{{ selectedIds.size }} {{ t("mail.selected") }}</span>
            </div>
            <!-- Grouped rows -->
            <div class="rounded-box border border-base-300 overflow-hidden">
              <div
                v-for="email in emails"
                :key="email.id"
                class="group flex cursor-pointer items-center gap-2 px-2.5 py-1.5 transition-colors border-b border-base-300 last:border-b-0 hover:bg-base-200/60"
                :class="[
                  selectedIds.has(email.id) ? 'bg-primary/5' : '',
                  email.id === selectedId ? 'border-l-2 border-l-primary' : '',
                ]"
                @click="openEmail(email)"
              >
                <button class="btn btn-ghost btn-xs btn-circle shrink-0" @click.stop="toggleSelect(email)">
                  <IconSquareCheck v-if="selectedIds.has(email.id)" class="h-4 w-4 text-primary" />
                  <IconSquare v-else class="h-4 w-4 text-base-content/30" />
                </button>
                <button class="btn btn-ghost btn-xs btn-circle shrink-0" @click.stop="toggleStar(email)">
                  <IconStar class="h-4 w-4" :class="email.isStarred ? 'fill-current text-warning' : 'text-base-content/30'" />
                </button>
                <div class="w-20 shrink-0 truncate text-sm font-medium">
                  <span :class="email.isRead ? 'text-base-content/60' : 'font-bold'">{{ senderLabel(email) }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span v-if="!email.isRead" class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span class="truncate text-sm" :class="email.isRead ? 'text-base-content/70' : 'font-bold'">{{ email.subject || t("mail.noSubject") }}</span>
                    <IconPaperclip v-if="email.attachments?.length" class="h-3 w-3 shrink-0 text-base-content/40" />
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <span class="whitespace-nowrap text-xs text-base-content/40">{{ formatRelativeTime(email.createdAt) }}</span>
                  <div class="dropdown dropdown-end">
                    <button class="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100" @click.stop>
                      <IconMoreVertical class="h-3.5 w-3.5" />
                    </button>
                    <ul tabindex="0" class="dropdown-content menu z-50 w-44 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
                      <li><button @click="toggleRead(email)">{{ email.isRead ? t("mail.markUnread") : t("mail.markRead") }}</button></li>
                      <li><button @click="moveToFolder(email, 'archive')">{{ t("mail.archive") }}</button></li>
                      <li><button @click="moveToFolder(email, 'spam')">{{ t("mail.spam") }}</button></li>
                      <li><button class="text-error" @click="trash(email)">{{ t("mail.trash") }}</button></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <!-- Load more -->
            <div v-if="hasMore" class="flex justify-center pt-3">
              <button class="btn btn-ghost btn-sm" :disabled="loading" @click="load(false)">
                <IconLoader v-if="loading" class="w-4 h-4 animate-spin" />
                <template v-else>{{ t("mail.loadMore") }}</template>
              </button>
            </div>
          </div>
        </div>

        <!-- Batch action bar -->
        <Transition enter-active-class="transition ease-out duration-200" enter-from-class="translate-y-full opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="transition ease-in duration-150" leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-full opacity-0">
          <div v-if="selectionMode" class="shrink-0 flex items-center gap-1 border-t border-base-300 bg-base-100 px-4 py-2 shadow-lg sm:gap-2">
            <button class="btn btn-ghost btn-xs gap-1" :disabled="batchActionLoading" @click="batchMarkRead(true)">
              <IconMailOpen class="h-3.5 w-3.5" /> {{ t("mail.markRead") }}
            </button>
            <button class="btn btn-ghost btn-xs gap-1" :disabled="batchActionLoading" @click="batchMarkRead(false)">
              <IconMail class="h-3.5 w-3.5" /> {{ t("mail.markUnread") }}
            </button>
            <button class="btn btn-ghost btn-xs gap-1" :disabled="batchActionLoading" @click="batchMove('archive')">
              <IconArchive class="h-3.5 w-3.5" /> {{ t("mail.archive") }}
            </button>
            <button class="btn btn-ghost btn-xs gap-1" :disabled="batchActionLoading" @click="batchMove('spam')">
              <IconAlertTriangle class="h-3.5 w-3.5" /> {{ t("mail.spam") }}
            </button>
            <button class="btn btn-ghost btn-xs gap-1" :disabled="batchActionLoading" @click="batchDelete">
              <IconTrash class="h-3.5 w-3.5" /> {{ t("mail.trash") }}
            </button>
            <div class="flex-1" />
            <button class="btn btn-ghost btn-xs" :disabled="batchActionLoading" @click="clearSelection">{{ t("common.cancel") }}</button>
          </div>
        </Transition>
      </div>

      <!-- Right: Email Reader (desktop) -->
      <div v-if="hasSelected" class="hidden lg:flex flex-col flex-1 min-w-0 min-h-0">
        <MailReader :key="selectedId" :email-id="selectedId" />
      </div>

      <!-- Mobile: full-width reader overlay -->
      <div v-if="hasSelected" class="lg:hidden fixed inset-0 z-50 bg-base-200">
        <MailReader :key="selectedId" :email-id="selectedId" />
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconSearch,
  IconRefreshCw,
  IconStar,
  IconPaperclip,
  IconMoreVertical,
  IconLoader,
  IconAlertCircle,
  IconMailOpen,
  IconMail,
  IconArchive,
  IconAlertTriangle,
  IconTrash,
  IconSquareCheck,
  IconSquare,
  IconMinus,
} from "#components";
import { formatRelativeTime } from "~/utils/datetime";
import { stripHtmlTags } from "~/utils/sanitize";
import type { PostalEmail } from "~/types/mail";
import {
  fetchEmails,
  deleteEmail,
  moveEmail,
  markEmailRead,
  starEmail,
} from "~/utils/api";
import MailReader from "~/components/mail/MailReader.vue";

definePageMeta({ middleware: "auth" });

const FOLDERS = ["inbox", "sent", "drafts", "spam", "trash", "archive"] as const;

const { t } = useI18n();
const { $toast } = useNuxtApp();
const route = useRoute();
const mail = useMail();
const { selectedEmailId, select, clear } = useMailSelected();

const rawFolder = computed(() => route.params.folder as string);

const folder = computed(() =>
  (FOLDERS as readonly string[]).includes(rawFolder.value) ? rawFolder.value : "inbox",
);

if (!(FOLDERS as readonly string[]).includes(rawFolder.value)) {
  navigateTo("/mail/inbox", { replace: true });
}

const selectedId = computed(() => route.query.id as string || "");
const hasSelected = computed(() => !!selectedId.value);

const emails = ref<PostalEmail[]>([]);
const total = ref(0);
const hasMore = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref("");
const filterRead = ref<"all" | "unread" | "starred">("all");
const activeLabelId = computed(() =>
  typeof route.query.label === "string" ? route.query.label : undefined,
);
let searchDebounce: ReturnType<typeof setTimeout> | null = null;

watch(selectedId, (id) => {
  if (id) select(id);
  else clear();
}, { immediate: true });

// ── Batch selection ───────────────────────────────────────────────────────
const selectedIds = ref<Set<string>>(new Set());
const selectionMode = computed(() => selectedIds.value.size > 0);
const allSelected = computed(
  () => emails.value.length > 0 && emails.value.every((e) => selectedIds.value.has(e.id)),
);
const someSelected = computed(
  () => selectedIds.value.size > 0 && !allSelected.value,
);
const batchActionLoading = ref(false);

function toggleSelect(email: PostalEmail) {
  const next = new Set(selectedIds.value);
  if (next.has(email.id)) next.delete(email.id);
  else next.add(email.id);
  selectedIds.value = next;
}

function toggleSelectAll() {
  if (allSelected.value) selectedIds.value = new Set();
  else selectedIds.value = new Set(emails.value.map((e) => e.id));
}

function clearSelection() {
  selectedIds.value = new Set();
}

async function batchMarkRead(read: boolean) {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  batchActionLoading.value = true;
  try {
    await Promise.all(ids.map((id) => markEmailRead(id, read)));
    for (const e of emails.value) {
      if (selectedIds.value.has(e.id)) e.isRead = read;
    }
    if (selectedId.value && ids.includes(selectedId.value)) {
      clear();
      navigateTo(`/mail/${folder.value}`, { replace: true });
    }
    clearSelection();
    mail.refreshUnread();
    $toast.success(t("mail.batchUpdated"));
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.loadError"));
  } finally {
    batchActionLoading.value = false;
  }
}

async function batchMove(target: string) {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  batchActionLoading.value = true;
  try {
    await Promise.all(ids.map((id) => moveEmail(id, target)));
    emails.value = emails.value.filter((e) => !selectedIds.value.has(e.id));
    total.value = Math.max(0, total.value - ids.length);
    if (selectedId.value && ids.includes(selectedId.value)) {
      clear();
      navigateTo(`/mail/${folder.value}`, { replace: true });
    }
    clearSelection();
    mail.refreshUnread();
    $toast.success(t("mail.batchMoved"));
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.loadError"));
  } finally {
    batchActionLoading.value = false;
  }
}

async function batchDelete() {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  if (!(await useAlert().confirm(t("common.confirm"), t("mail.batchDeleteConfirm", { count: ids.length })))) return;
  batchActionLoading.value = true;
  try {
    await Promise.all(ids.map((id) => deleteEmail(id)));
    emails.value = emails.value.filter((e) => !selectedIds.value.has(e.id));
    total.value = Math.max(0, total.value - ids.length);
    if (selectedId.value && ids.includes(selectedId.value)) {
      clear();
      navigateTo(`/mail/${folder.value}`, { replace: true });
    }
    clearSelection();
    mail.refreshUnread();
    $toast.success(t("mail.batchDeleted"));
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.loadError"));
  } finally {
    batchActionLoading.value = false;
  }
}

async function batchStar(starred: boolean) {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  batchActionLoading.value = true;
  try {
    await Promise.all(ids.map((id) => starEmail(id, starred)));
    for (const e of emails.value) {
      if (selectedIds.value.has(e.id)) e.isStarred = starred;
    }
    clearSelection();
    $toast.success(t("mail.batchUpdated"));
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.sendFailed"));
  } finally {
    batchActionLoading.value = false;
  }
}

useSolarSeo({
  title: computed(() => `${t("mail.title")} · ${t(`mail.folders.${folder.value}`)}`),
  description: computed(() => t("mail.title")),
});

async function load(reset = true) {
  loading.value = true;
  error.value = null;
  try {
    const result = await fetchEmails({
      mailboxId: mail.state.selectedMailboxId ?? undefined,
      folder: folder.value,
      offset: reset ? 0 : emails.value.length,
      take: 50,
      q: searchQuery.value.trim() || undefined,
      isRead: filterRead.value === "unread" ? false : undefined,
      isStarred: filterRead.value === "starred" ? true : undefined,
      labelId: activeLabelId.value,
    });
    emails.value = reset ? result.items : [...emails.value, ...result.items];
    total.value = result.total;
    hasMore.value = result.hasMore;
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("mail.loadError");
  } finally {
    loading.value = false;
  }
}

function senderLabel(email: PostalEmail) {
  return email.fromName || email.fromAddress || "?";
}

function openEmail(email: PostalEmail) {
  if (window.innerWidth >= 1024) {
    navigateTo({ query: { ...route.query, id: email.id } }, { replace: true });
    select(email.id);
  } else {
    navigateTo(`/mail/email/${email.id}`);
  }
}

async function toggleStar(email: PostalEmail) {
  try {
    await starEmail(email.id, !email.isStarred);
    email.isStarred = !email.isStarred;
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.sendFailed"));
  }
}

async function toggleRead(email: PostalEmail) {
  try {
    await markEmailRead(email.id, !email.isRead);
    email.isRead = !email.isRead;
    mail.refreshUnread();
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.sendFailed"));
  }
}

async function moveToFolder(email: PostalEmail, target: string) {
  try {
    await moveEmail(email.id, target);
    emails.value = emails.value.filter((item) => item.id !== email.id);
    total.value = Math.max(0, total.value - 1);
    if (selectedId.value === email.id) {
      clear();
      navigateTo(`/mail/${folder.value}`, { replace: true });
    }
    mail.refreshUnread();
    $toast.success(t("mail.movedToast"));
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.loadError"));
  }
}

async function trash(email: PostalEmail) {
  if (!(await useAlert().confirm(t("common.confirm"), t("mail.deleteConfirm")))) return;
  try {
    await deleteEmail(email.id);
    emails.value = emails.value.filter((item) => item.id !== email.id);
    total.value = Math.max(0, total.value - 1);
    if (selectedId.value === email.id) {
      clear();
      navigateTo(`/mail/${folder.value}`, { replace: true });
    }
    mail.refreshUnread();
    $toast.success(t("mail.deletedToast"));
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.loadError"));
  }
}

function handleSearch() {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => load(true), 300);
}

function setFilter(filter: "all" | "unread" | "starred") {
  if (filterRead.value === filter) return;
  filterRead.value = filter;
  load(true);
}

watch(
  [() => mail.state.selectedMailboxId, folder, activeLabelId, () => mail.state.changedAt],
  () => load(true),
);

onMounted(() => load(true));
</script>
