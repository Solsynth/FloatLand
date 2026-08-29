<template>
  <NuxtLayout name="mail">
    <div class="flex h-full flex-col">
      <div class="flex-1 overflow-y-auto px-4 pb-6 lg:px-6">
        <div
          v-if="loading && !email"
          class="flex justify-center py-16"
        >
          <ConfuseSpinner :message="t('mail.loading')" />
        </div>

        <div
          v-else-if="notFound"
          class="flex flex-col items-center gap-3 py-16 text-center"
        >
          <IconAlertCircle class="h-8 w-8 text-error" />
          <p class="text-sm text-error">{{ t("mail.notFound") }}</p>
          <button class="btn btn-ghost btn-sm" @click="navigateTo('/mail/inbox')">
            {{ t("mail.backToInbox") }}
          </button>
        </div>

        <div v-else-if="email" class="mx-auto max-w-3xl space-y-4 py-4">
          <!-- Header card -->
          <article class="card bg-base-100 shadow-sm">
            <div class="card-body p-5">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <h1 class="text-xl font-bold break-words">
                  {{ email.subject || t("mail.noSubject") }}
                </h1>
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    class="btn btn-ghost btn-sm btn-circle"
                    :title="email.isStarred ? t('mail.unstar') : t('mail.star')"
                    @click="toggleStar"
                  >
                    <IconStar
                      class="h-4 w-4"
                      :class="email.isStarred ? 'fill-current text-warning' : 'text-base-content/30'"
                    />
                  </button>
                  <button
                    class="btn btn-ghost btn-sm btn-circle"
                    :title="email.isRead ? t('mail.markUnread') : t('mail.markRead')"
                    @click="toggleRead"
                  >
                    <IconMailOpen v-if="email.isRead" class="h-4 w-4" />
                    <IconMail v-else class="h-4 w-4" />
                  </button>
                  <div class="dropdown dropdown-end">
                    <button
                      class="btn btn-ghost btn-sm btn-circle"
                      :title="t('common.more')"
                    >
                      <IconMoreVertical class="h-4 w-4" />
                    </button>
                    <ul
                      tabindex="0"
                      class="dropdown-content menu z-50 w-48 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
                    >
                      <li>
                        <button @click="moveTo('archive')">
                          {{ t("mail.archive") }}
                        </button>
                      </li>
                      <li>
                        <button @click="toggleSpam">
                          {{ isSpam ? t("mail.notSpam") : t("mail.spam") }}
                        </button>
                      </li>
                      <li>
                        <button @click="labelsMenuOpen = !labelsMenuOpen">
                          {{ t("mail.labels") }}
                        </button>
                      </li>
                      <li>
                        <button class="text-error" @click="trash">
                          {{ t("mail.trash") }}
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Labels -->
              <div v-if="email.labels?.length" class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-for="label in email.labels"
                  :key="label.id"
                  class="badge badge-ghost badge-sm gap-1"
                >
                  <span
                    class="h-2 w-2 rounded-full"
                    :style="{ backgroundColor: label.color || '#888' }"
                  />
                  {{ label.name }}
                </span>
              </div>

              <!-- Sender identity -->
              <div class="mt-4 flex items-start gap-3">
                <div class="avatar avatar-placeholder">
                  <div class="w-10 rounded-full bg-primary/10 text-primary">
                    <span class="text-sm font-bold">{{ initials }}</span>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold">
                    {{ email.fromName || email.fromAddress || "?" }}
                  </p>
                  <p class="truncate text-xs text-base-content/50">
                    &lt;{{ email.fromAddress }}&gt;
                  </p>
                  <div class="mt-2 space-y-0.5 text-xs text-base-content/60">
                    <p v-if="toLabel">
                      <span class="text-base-content/40">{{ t("mail.to") }}:</span>
                      {{ toLabel }}
                    </p>
                    <p v-if="ccLabel">
                      <span class="text-base-content/40">{{ t("mail.cc") }}:</span>
                      {{ ccLabel }}
                    </p>
                    <p>
                      <span class="text-base-content/40">{{ t("mail.date") }}:</span>
                      {{ formatFullDate(email.createdAt) }}
                    </p>
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    class="btn btn-ghost btn-sm gap-1"
                    :title="t('mail.reply')"
                    @click="openCompose('reply')"
                  >
                    <IconReply class="h-4 w-4" />
                    <span class="hidden sm:inline">{{ t("mail.reply") }}</span>
                  </button>
                  <button
                    class="btn btn-ghost btn-sm btn-circle"
                    :title="t('mail.replyAll')"
                    @click="openCompose('replyAll')"
                  >
                    <IconReplyAll class="h-4 w-4" />
                  </button>
                  <button
                    class="btn btn-ghost btn-sm btn-circle"
                    :title="t('mail.forward')"
                    @click="openCompose('forward')"
                  >
                    <IconForward class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <!-- Delivery status -->
              <div
                v-if="email.deliveryStatus === 'failed'"
                class="mt-3 flex items-center gap-2 rounded-box bg-error/10 px-3 py-2 text-sm text-error"
              >
                <IconAlertCircle class="h-4 w-4 shrink-0" />
                <span class="min-w-0 flex-1 break-words">
                  {{ email.deliveryError || t("mail.deliveryFailed") }}
                </span>
                <button class="btn btn-ghost btn-xs shrink-0" @click="resend">
                  {{ t("mail.resend") }}
                </button>
              </div>
              <p
                v-else-if="email.deliveryStatus === 'pending'"
                class="mt-2 text-xs text-base-content/50"
              >
                {{ t("mail.deliveryPending") }}
              </p>
            </div>
          </article>

          <!-- Auth warnings -->
          <article
            v-if="authWarnings.length"
            class="card border border-warning/30 bg-warning/10 shadow-sm"
          >
            <div class="card-body p-4">
              <h2 class="flex items-center gap-2 text-sm font-semibold text-warning">
                <IconAlertTriangle class="h-4 w-4" />
                {{ t("mail.authWarningTitle") }}
              </h2>
              <ul class="mt-1 list-disc space-y-1 pl-5 text-sm text-base-content/70">
                <li v-for="warning in authWarnings" :key="warning">
                  {{ warning }}
                </li>
              </ul>
            </div>
          </article>

          <!-- Body -->
          <article class="card bg-base-100 shadow-sm">
            <div class="card-body p-5">
              <div
                v-if="isHtml"
                class="prose prose-sm max-w-none break-words prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                v-html="safeBody"
              />
              <div
                v-else
                class="whitespace-pre-wrap break-words text-sm leading-relaxed"
              >
                {{ email.body }}
              </div>
            </div>
          </article>

          <!-- Attachments -->
          <article v-if="email.attachments?.length" class="card bg-base-100 shadow-sm">
            <div class="card-body p-5">
              <h2 class="card-title text-base">{{ t("mail.attachments") }}</h2>
              <AttachmentGrid
                v-if="mediaAttachments.length"
                :attachments="mediaAttachments"
                :max-height="400"
                class="mt-3"
              />
              <ul class="mt-3 space-y-1.5">
                <li
                  v-for="attachment in nonMediaAttachments"
                  :key="attachment.id"
                >
                  <a
                    :href="downloadUrl(attachment)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 rounded-box border border-base-300 px-3 py-2 text-sm transition-colors hover:bg-base-200/70"
                  >
                    <IconPaperclip class="h-4 w-4 shrink-0 text-base-content/40" />
                    <span class="min-w-0 flex-1 truncate font-medium">
                      {{ attachment.filename || attachment.file?.name }}
                    </span>
                    <span class="shrink-0 text-xs text-base-content/40">
                      {{ formatBytes(attachment.size) }}
                    </span>
                    <IconDownload class="h-4 w-4 shrink-0 text-base-content/40" />
                  </a>
                </li>
              </ul>
            </div>
          </article>

          <!-- Conversation -->
          <article
            v-if="thread.length > 1"
            class="card bg-base-100 shadow-sm"
          >
            <div class="card-body p-5">
              <h2 class="card-title text-base">
                {{ t("mail.threadMessages") }}
                ({{ thread.length }})
              </h2>
              <div class="mt-3 space-y-3">
                <button
                  v-for="message in thread"
                  :key="message.id"
                  type="button"
                  class="w-full rounded-box border border-base-300 px-3 py-2.5 text-left transition-colors hover:bg-base-200/70"
                  :class="message.id === email.id ? 'border-primary/40 bg-primary/5' : ''"
                  @click="openThreadMessage(message)"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="truncate text-sm font-medium">
                      {{ message.fromName || message.fromAddress }}
                    </span>
                    <span class="shrink-0 text-xs text-base-content/40">
                      {{ formatRelativeTime(message.createdAt) }}
                    </span>
                  </div>
                  <p class="mt-1 line-clamp-2 text-xs text-base-content/50">
                    {{ stripHtmlTags(message.body || "") }}
                  </p>
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>

      <!-- Labels menu -->
      <div v-if="labelsMenuOpen" class="fixed inset-0 z-50" @click="labelsMenuOpen = false">
        <div
          class="absolute left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
          @click.stop
        >
          <p class="px-3 py-1.5 text-xs font-semibold text-base-content/50">
            {{ t("mail.labels") }}
          </p>
          <button
            v-for="label in mail.state.labels"
            :key="label.id"
            type="button"
            class="flex w-full items-center gap-2 rounded-box px-3 py-2 text-left text-sm hover:bg-base-200"
            @click="toggleLabel(label.id)"
          >
            <span
              class="h-3 w-3 rounded-full"
              :style="{ backgroundColor: label.color || '#888' }"
            />
            <span class="flex-1">{{ label.name }}</span>
            <IconCheck
              v-if="hasLabel(label.id)"
              class="h-4 w-4 text-primary"
            />
          </button>
        </div>
      </div>

      <!-- Compose -->
      <MailComposeDialog
        :open="composeOpen"
        :prefill="composePrefill"
        @close="composeOpen = false"
        @sent="handleComposeSent"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconStar,
  IconMail,
  IconMailOpen,
  IconMoreVertical,
  IconReply,
  IconReplyAll,
  IconForward,
  IconPaperclip,
  IconDownload,
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
} from "#components";
import { formatRelativeTime } from "~/utils/datetime";
import { getFileUrl } from "~/utils/files";
import { sanitizeHtml, stripHtmlTags } from "~/utils/sanitize";
import type { FileAttachment } from "~/types/post";
import type { PostalEmail } from "~/types/mail";
import {
  fetchEmail,
  fetchThread,
  markEmailRead,
  starEmail,
  moveEmail,
  deleteEmail,
  reportSpam,
  resendEmail,
  setEmailLabel,
} from "~/utils/api";

definePageMeta({ middleware: "auth" });

const { t } = useI18n();
const { $toast } = useNuxtApp();
const route = useRoute();
const mail = useMail();

const email = ref<PostalEmail | null>(null);
const thread = ref<PostalEmail[]>([]);
const loading = ref(true);
const notFound = ref(false);
const labelsMenuOpen = ref(false);
const composeOpen = ref(false);
const composePrefill = ref<{ mode: string; email: PostalEmail } | null>(null);

const id = computed(() => route.params.id as string);

useSolarSeo({
  title: computed(() => email.value?.subject || t("mail.title")),
  description: computed(() => t("mail.title")),
});

const isHtml = computed(() => email.value?.contentType === "text/html");
const safeBody = computed(() => sanitizeHtml(email.value?.body || ""));

const authWarnings = computed(() => email.value?.authentication?.warnings ?? []);

const isSpam = computed(() => email.value?.folder === "spam");

const initials = computed(() =>
  (email.value?.fromName || email.value?.fromAddress || "?")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?",
);

const toLabel = computed(() =>
  email.value?.recipients
    ?.filter((recipient) => recipient.kind === "to")
    .map(recipientLabel)
    .join(", ") || "",
);

const ccLabel = computed(() =>
  email.value?.recipients
    ?.filter((recipient) => recipient.kind === "cc")
    .map(recipientLabel)
    .join(", ") || "",
);

function recipientLabel(recipient: { name: string; address: string }) {
  return recipient.name ? `${recipient.name} <${recipient.address}>` : recipient.address;
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleString();
}

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const mediaAttachments = computed<FileAttachment[]>(() =>
  (email.value?.attachments ?? [])
    .filter((attachment) => attachment.file)
    .map((attachment) => ({
      id: attachment.file!.id,
      name: attachment.filename || attachment.file!.name,
      url: attachment.file!.url ?? undefined,
      mimeType: attachment.file!.mimeType,
      hasCompression: !!attachment.file!.hasCompression,
      hasThumbnail: false,
      fileMeta: (attachment.file!.fileMeta ?? {}) as Record<string, unknown>,
    })),
);

const nonMediaAttachments = computed(() =>
  (email.value?.attachments ?? []).filter((attachment) => !attachment.file),
);

function downloadUrl(attachment: { file?: { id: string; url?: string } | null }) {
  if (attachment.file?.url) return attachment.file.url;
  if (attachment.file?.id) return getFileUrl(attachment.file.id) ?? "#";
  return "#";
}

function hasLabel(labelId: string) {
  return email.value?.labels?.some((label) => label.id === labelId) ?? false;
}

async function toggleLabel(labelId: string) {
  const emailId = email.value?.id;
  if (!emailId) return;
  const assigned = !hasLabel(labelId);
  try {
    await setEmailLabel(emailId, labelId, assigned);
    await load();
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.sendFailed"));
  }
}

async function load() {
  loading.value = true;
  notFound.value = false;
  try {
    const data = await fetchEmail(id.value);
    // Dev-mode localhost 401s return the raw unauthorized body; don't render
    // a garbage stub as a real email.
    if (!data || !data.id || !data.accountId || data.error) {
      notFound.value = true;
      loading.value = false;
      return;
    }
    email.value = data;
    mail.state.readerSubject = data.subject || t("mail.noSubject");
    mail.state.readerFolder = data.folder || "inbox";
    if (data.threadId) {
      thread.value = await fetchThread(data.threadId).catch(() => []);
    } else {
      thread.value = [];
    }
    if (!data.isRead) {
      markEmailRead(data.id, true).catch(() => {
        // Best-effort; the server may already consider it read.
      });
      mail.refreshUnread();
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      notFound.value = true;
    } else {
      notFound.value = true;
    }
  } finally {
    loading.value = false;
  }
}

async function toggleStar() {
  const emailId = email.value?.id;
  if (!emailId || !email.value) return;
  try {
    await starEmail(emailId, !email.value.isStarred);
    email.value.isStarred = !email.value.isStarred;
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.sendFailed"));
  }
}

async function toggleRead() {
  const emailId = email.value?.id;
  if (!emailId || !email.value) return;
  try {
    await markEmailRead(emailId, !email.value.isRead);
    email.value.isRead = !email.value.isRead;
    mail.refreshUnread();
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.sendFailed"));
  }
}

async function moveTo(target: string) {
  const emailId = email.value?.id;
  if (!emailId) return;
  try {
    await moveEmail(emailId, target);
    $toast.success(t("mail.movedToast"));
    if (target === "archive" || target === "spam" || target === "trash") {
      navigateTo("/mail/inbox");
    } else {
      await load();
    }
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.loadError"));
  }
}

async function toggleSpam() {
  const emailId = email.value?.id;
  if (!emailId) return;
  try {
    await reportSpam(emailId, !isSpam.value);
    $toast.success(t("mail.movedToast"));
    navigateTo("/mail/inbox");
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.loadError"));
  }
}

async function trash() {
  const emailId = email.value?.id;
  if (!emailId) return;
  if (!(await useAlert().confirm(t("common.confirm"), t("mail.deleteConfirm")))) return;
  try {
    await deleteEmail(emailId);
    $toast.success(t("mail.deletedToast"));
    navigateTo("/mail/inbox");
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.loadError"));
  }
}

async function resend() {
  const emailId = email.value?.id;
  if (!emailId) return;
  try {
    await resendEmail(emailId);
    $toast.success(t("mail.sentToast"));
    await load();
  } catch (err) {
    $toast.error(err instanceof Error ? err.message : t("mail.sendFailed"));
  }
}

function openCompose(mode: "reply" | "replyAll" | "forward") {
  if (!email.value) return;
  composePrefill.value = { mode, email: email.value };
  composeOpen.value = true;
}

function openThreadMessage(message: PostalEmail) {
  if (message.id === email.value?.id) return;
  navigateTo(`/mail/email/${message.id}`);
}

function handleComposeSent() {
  composeOpen.value = false;
  composePrefill.value = null;
  load();
}

watch(
  () => route.params.id,
  () => load(),
);

onMounted(() => {
  load();
});

onUnmounted(() => {
  mail.state.readerSubject = "";
  mail.state.readerFolder = "";
});
</script>
