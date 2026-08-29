<template>
  <NuxtLayout name="mail">
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between gap-3 px-6 py-4 shrink-0">
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-semibold">
            {{ t(`mail.folders.${folder}`) }}
          </h1>
          <span
            v-if="total > 0"
            class="text-sm text-base-content/50"
          >
            {{ total }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Search -->
          <div class="relative hidden sm:block">
            <IconSearch
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40"
            />
            <input
              v-model="searchQuery"
              type="search"
              class="input input-sm input-bordered pl-9 w-48 lg:w-64"
              :placeholder="t('mail.searchPlaceholder')"
              @input="handleSearch"
            />
          </div>

          <!-- Filters -->
          <div class="btn-group hidden sm:flex">
            <button
              class="btn btn-ghost btn-sm"
              :class="{ 'btn-active bg-primary/10 text-primary': filterRead === 'all' }"
              @click="setFilter('all')"
            >
              {{ t("mail.filterAll") }}
            </button>
            <button
              class="btn btn-ghost btn-sm"
              :class="{ 'btn-active bg-primary/10 text-primary': filterRead === 'unread' }"
              @click="setFilter('unread')"
            >
              {{ t("mail.filterUnread") }}
            </button>
            <button
              class="btn btn-ghost btn-sm"
              :class="{ 'btn-active bg-primary/10 text-primary': filterRead === 'starred' }"
              @click="setFilter('starred')"
            >
              {{ t("mail.filterStarred") }}
            </button>
          </div>

          <button
            class="btn btn-ghost btn-sm btn-circle"
            :title="t('common.refresh')"
            @click="load(true)"
          >
            <IconRefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="min-w-0 flex-1 overflow-y-auto px-4 pb-6 lg:px-6">
        <div v-if="loading && emails.length === 0" class="flex justify-center py-16">
          <ConfuseSpinner :message="t('mail.loading')" />
        </div>

        <div
          v-else-if="error"
          class="flex flex-col items-center gap-3 py-16 text-center"
        >
          <IconAlertCircle class="h-8 w-8 text-error" />
          <p class="text-sm text-error">{{ error }}</p>
          <button class="btn btn-ghost btn-sm" @click="load(true)">
            {{ t("mail.retry") }}
          </button>
        </div>

        <div
          v-else-if="emails.length === 0"
          class="flex flex-col items-center justify-center py-20 text-center"
        >
          <IconMailOpen class="mb-3 h-12 w-12 text-base-content/30" />
          <p class="text-sm text-base-content/50">{{ t("mail.noEmails") }}</p>
          <p class="mt-1 text-xs text-base-content/40">{{ t("mail.emptyHint") }}</p>
        </div>

        <div v-else class="space-y-1.5">
          <div
            v-for="email in emails"
            :key="email.id"
            class="group flex cursor-pointer items-start gap-3 rounded-box border border-base-300 bg-base-100 px-3 py-2.5 transition-colors hover:border-base-content/20 hover:bg-base-200/60"
            @click="openEmail(email)"
          >
            <!-- Star -->
            <button
              class="btn btn-ghost btn-xs btn-circle shrink-0"
              :title="email.isStarred ? t('mail.unstar') : t('mail.star')"
              @click.stop="toggleStar(email)"
            >
              <IconStar
                class="h-4 w-4"
                :class="email.isStarred ? 'fill-current text-warning' : 'text-base-content/30'"
              />
            </button>

            <!-- Sender -->
            <div class="w-40 shrink-0 truncate text-sm font-medium lg:w-52">
              <span :class="email.isRead ? 'text-base-content/60' : 'font-bold'">
                {{ senderLabel(email) }}
              </span>
            </div>

            <!-- Subject + snippet -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span
                  v-if="!email.isRead"
                  class="h-2 w-2 shrink-0 rounded-full bg-primary"
                />
                <span
                  class="truncate text-sm"
                  :class="email.isRead ? 'text-base-content/70' : 'font-bold'"
                >
                  {{ email.subject || t("mail.noSubject") }}
                </span>
                <IconPaperclip
                  v-if="email.attachments?.length"
                  class="h-3.5 w-3.5 shrink-0 text-base-content/40"
                />
                <span
                  v-if="email.deliveryStatus === 'failed'"
                  class="badge badge-error badge-xs shrink-0"
                >
                  {{ t("mail.deliveryFailed") }}
                </span>
                <span
                  v-if="email.isDraft"
                  class="badge badge-ghost badge-xs shrink-0"
                >
                  {{ t("mail.draftsShort") }}
                </span>
              </div>
              <p class="mt-0.5 truncate text-xs text-base-content/50">
                {{ snippet(email) }}
              </p>
            </div>

            <!-- Labels + time -->
            <div class="flex shrink-0 items-center gap-2">
              <div v-if="email.labels?.length" class="hidden items-center gap-1 md:flex">
                <span
                  v-for="label in email.labels"
                  :key="label.id"
                  class="h-2 w-2 rounded-full"
                  :style="{ backgroundColor: label.color || '#888' }"
                  :title="label.name"
                />
              </div>
              <span class="whitespace-nowrap text-xs text-base-content/40">
                {{ formatRelativeTime(email.createdAt) }}
              </span>
              <div class="dropdown dropdown-end">
                <button
                  class="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100"
                  :title="t('common.more')"
                  @click.stop
                >
                  <IconMoreVertical class="h-4 w-4" />
                </button>
                <ul
                  tabindex="0"
                  class="dropdown-content menu z-50 w-44 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
                >
                  <li>
                    <button @click="toggleRead(email)">
                      {{ email.isRead ? t("mail.markUnread") : t("mail.markRead") }}
                    </button>
                  </li>
                  <li>
                    <button @click="moveToFolder(email, 'archive')">
                      {{ t("mail.archive") }}
                    </button>
                  </li>
                  <li>
                    <button @click="moveToFolder(email, 'spam')">
                      {{ t("mail.spam") }}
                    </button>
                  </li>
                  <li>
                    <button @click="trash(email)">
                      {{ t("mail.trash") }}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Load more -->
          <div v-if="hasMore" class="flex justify-center pt-3">
            <button
              class="btn btn-ghost btn-sm"
              :disabled="loading"
              @click="load(false)"
            >
              <IconLoader v-if="loading" class="w-4 h-4 animate-spin" />
              <template v-else>{{ t("mail.loadMore") }}</template>
            </button>
          </div>
        </div>
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

definePageMeta({ middleware: "auth" });

const FOLDERS = ["inbox", "sent", "drafts", "spam", "trash", "archive"] as const;

const { t } = useI18n();
const { $toast } = useNuxtApp();
const route = useRoute();
const mail = useMail();

const rawFolder = computed(() => route.params.folder as string);

const folder = computed(() =>
  (FOLDERS as readonly string[]).includes(rawFolder.value) ? rawFolder.value : "inbox",
);

if (!(FOLDERS as readonly string[]).includes(rawFolder.value)) {
  navigateTo("/mail/inbox", { replace: true });
}

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

function snippet(email: PostalEmail) {
  const text = stripHtmlTags(email.body || "");
  return text.slice(0, 120) || (email.contentType === "text/html" ? "HTML" : "");
}

function openEmail(email: PostalEmail) {
  navigateTo(`/mail/email/${email.id}`);
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
  () => {
    load(true);
  },
);

onMounted(() => {
  load(true);
});
</script>
