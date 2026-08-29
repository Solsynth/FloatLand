<template>
  <div class="flex h-full flex-col">
    <div class="flex-1 overflow-y-auto">
      <!-- Loading skeleton -->
      <div v-if="loading && !email" class="py-4">
        <div class="px-5 pb-4 border-b border-base-300">
          <div class="h-7 w-3/4 animate-pulse rounded bg-base-200 mb-4" />
          <div class="flex items-start gap-3">
            <div class="h-10 w-10 animate-pulse rounded-full bg-base-200" />
            <div class="flex-1 space-y-2">
              <div class="h-4 w-32 animate-pulse rounded bg-base-200" />
              <div class="h-3 w-48 animate-pulse rounded bg-base-200" />
              <div class="h-3 w-24 animate-pulse rounded bg-base-200" />
            </div>
          </div>
        </div>
        <div class="px-5 py-4 space-y-3">
          <div class="h-4 w-full animate-pulse rounded bg-base-200" />
          <div class="h-4 w-5/6 animate-pulse rounded bg-base-200" />
          <div class="h-4 w-4/6 animate-pulse rounded bg-base-200" />
          <div class="h-4 w-full animate-pulse rounded bg-base-200" />
          <div class="h-4 w-2/3 animate-pulse rounded bg-base-200" />
        </div>
      </div>

      <div v-else-if="notFound" class="flex flex-col items-center gap-3 py-16 text-center">
        <IconAlertCircle class="h-8 w-8 text-error" />
        <p class="text-sm text-error">{{ t("mail.notFound") }}</p>
        <button class="btn btn-ghost btn-sm" @click="navigateTo('/mail/inbox')">
          {{ t("mail.backToInbox") }}
        </button>
      </div>

      <div v-else-if="email" class="flex flex-col min-h-full">
        <!-- Header -->
        <div class="border-b border-base-300 px-5 py-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <h1 class="text-xl font-bold break-words">
              {{ email.subject || t("mail.noSubject") }}
            </h1>
            <div class="flex shrink-0 items-center gap-1">
              <button class="btn btn-ghost btn-sm btn-circle" :title="email.isStarred ? t('mail.unstar') : t('mail.star')" @click="toggleStar">
                <IconStar class="h-4 w-4" :class="email.isStarred ? 'fill-current text-warning' : 'text-base-content/30'" />
              </button>
              <button class="btn btn-ghost btn-sm btn-circle" :title="email.isRead ? t('mail.markUnread') : t('mail.markRead')" @click="toggleRead">
                <IconMailOpen v-if="email.isRead" class="h-4 w-4" />
                <IconMail v-else class="h-4 w-4" />
              </button>
              <div class="dropdown dropdown-end">
                <button class="btn btn-ghost btn-sm btn-circle" :title="t('common.more')">
                  <IconMoreVertical class="h-4 w-4" />
                </button>
                <ul tabindex="0" class="dropdown-content menu z-50 w-48 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
                  <li><button @click="moveTo('archive')">{{ t("mail.archive") }}</button></li>
                  <li><button @click="toggleSpam">{{ isSpam ? t("mail.notSpam") : t("mail.spam") }}</button></li>
                  <li><button @click="labelsMenuOpen = !labelsMenuOpen">{{ t("mail.labels") }}</button></li>
                  <li><button class="text-error" @click="trash">{{ t("mail.trash") }}</button></li>
                </ul>
              </div>
            </div>
          </div>
          <!-- Labels -->
          <div v-if="email.labels?.length" class="mt-2 flex flex-wrap gap-1.5">
            <span v-for="label in email.labels" :key="label.id" class="badge badge-ghost badge-sm gap-1">
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: label.color || '#888' }" />
              {{ label.name }}
            </span>
          </div>
          <!-- Sender -->
          <div class="mt-4 flex items-start gap-3">
            <div class="avatar avatar-placeholder">
              <div class="w-10 rounded-full bg-primary/10 text-primary">
                <span class="text-sm font-bold">{{ initials }}</span>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold">{{ email.fromName || email.fromAddress || "?" }}</p>
              <p class="truncate text-xs text-base-content/50 cursor-pointer hover:text-primary" :title="t('mail.copyEmail')" @click="copyAddress(email.fromAddress)">
                &lt;{{ email.fromAddress }}&gt;
              </p>
              <div class="mt-2 space-y-0.5 text-xs text-base-content/60">
                <p v-if="toLabel"><span class="text-base-content/40">{{ t("mail.to") }}:</span> {{ toLabel }}</p>
                <p v-if="ccLabel"><span class="text-base-content/40">{{ t("mail.cc") }}:</span> {{ ccLabel }}</p>
                <p><span class="text-base-content/40">{{ t("mail.date") }}:</span> {{ formatFullDate(email.createdAt) }}</p>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <button class="btn btn-ghost btn-sm gap-1" :title="t('mail.reply')" @click="openCompose('reply')">
                <IconReply class="h-4 w-4" />
                <span class="hidden sm:inline">{{ t("mail.reply") }}</span>
              </button>
              <button class="btn btn-ghost btn-sm btn-circle" :title="t('mail.replyAll')" @click="openCompose('replyAll')">
                <IconReplyAll class="h-4 w-4" />
              </button>
              <button class="btn btn-ghost btn-sm btn-circle" :title="t('mail.forward')" @click="openCompose('forward')">
                <IconForward class="h-4 w-4" />
              </button>
            </div>
          </div>
          <!-- Delivery status -->
          <div v-if="email.deliveryStatus === 'failed'" class="mt-3 flex items-center gap-2 rounded-box bg-error/10 px-3 py-2 text-sm text-error">
            <IconAlertCircle class="h-4 w-4 shrink-0" />
            <span class="min-w-0 flex-1 break-words">{{ email.deliveryError || t("mail.deliveryFailed") }}</span>
            <button class="btn btn-ghost btn-xs shrink-0" @click="resend">{{ t("mail.resend") }}</button>
          </div>
          <p v-else-if="email.deliveryStatus === 'pending'" class="mt-2 text-xs text-base-content/50">
            {{ t("mail.deliveryPending") }}
          </p>
        </div>

        <!-- Auth warnings -->
        <article v-if="authWarnings.length" class="border border-warning/30 bg-warning/10 px-5 py-4">
          <h2 class="flex items-center gap-2 text-sm font-semibold text-warning">
            <IconAlertTriangle class="h-4 w-4" />
            {{ t("mail.authWarningTitle") }}
          </h2>
          <ul class="mt-1 list-disc space-y-1 pl-5 text-sm text-base-content/70">
            <li v-for="warning in authWarnings" :key="warning">{{ warning }}</li>
          </ul>
        </article>

        <!-- Body -->
        <div class="flex-1 min-h-0 px-5 py-4">
          <iframe
            v-if="isHtml"
            ref="emailFrameRef"
            :srcdoc="safeBody"
            referrerpolicy="no-referrer"
            class="email-frame w-full flex-1 border-0 min-h-[500px]"
            @load="onFrameLoad"
          />
          <div v-else class="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {{ email.body }}
          </div>
        </div>

        <div v-if="mediaAttachments.length || nonMediaAttachments.length" class="px-5 py-3 border-t border-base-300">
          <AttachmentGrid
            v-if="mediaAttachments.length"
            :attachments="mediaAttachments"
            :max-height="400"
          />
          <div v-if="nonMediaAttachments.length" class="flex flex-wrap gap-2">
            <a
              v-for="attachment in nonMediaAttachments"
              :key="attachment.id"
              :href="downloadUrl(attachment)"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-sm text-base-content/70 hover:text-primary transition-colors"
            >
              <IconPaperclip class="h-3.5 w-3.5 shrink-0" />
              <span class="truncate max-w-[200px]">{{ attachment.filename || attachment.file?.name }}</span>
            </a>
          </div>
        </div>
        <!-- Conversation -->
        <article v-if="thread.length > 1" class="card bg-base-100 shadow-sm mx-5 my-4">
          <div class="card-body p-5">
            <h2 class="card-title text-base">{{ t("mail.threadMessages") }} ({{ thread.length }})</h2>
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
                  <span class="truncate text-sm font-medium">{{ message.fromName || message.fromAddress }}</span>
                  <span class="shrink-0 text-xs text-base-content/40">{{ formatRelativeTime(message.createdAt) }}</span>
                </div>
                <p class="mt-1 line-clamp-2 text-xs text-base-content/50">{{ stripHtmlTags(message.body || "") }}</p>
              </button>
            </div>
          </div>
        </article>

        <!-- Keyboard shortcuts hint -->
        <div class="flex items-center justify-center gap-4 pb-2 text-xs text-base-content/30">
          <span>{{ t("mail.shortcutsHint") }}</span>
        </div>
      </div>
    </div>

    <!-- Labels menu -->
    <div v-if="labelsMenuOpen" class="fixed inset-0 z-50" @click="labelsMenuOpen = false">
      <div class="absolute left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg" @click.stop>
        <p class="px-3 py-1.5 text-xs font-semibold text-base-content/50">{{ t("mail.labels") }}</p>
        <button
          v-for="label in mail.state.labels"
          :key="label.id"
          type="button"
          class="flex w-full items-center gap-2 rounded-box px-3 py-2 text-left text-sm hover:bg-base-200"
          @click="toggleLabel(label.id)"
        >
          <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: label.color || '#888' }" />
          <span class="flex-1">{{ label.name }}</span>
          <IconCheck v-if="hasLabel(label.id)" class="h-4 w-4 text-primary" />
        </button>
      </div>
    </div>

    <!-- Compose -->
    <MailComposeDialog :open="composeOpen" :prefill="composePrefill" @close="composeOpen = false" @sent="handleComposeSent" />
  </div>
</template>

<script setup lang="ts">
import { IconStar, IconMail, IconMailOpen, IconMoreVertical, IconReply, IconReplyAll, IconForward, IconPaperclip, IconDownload, IconAlertCircle, IconAlertTriangle, IconCheck } from "#components";
import { formatRelativeTime } from "~/utils/datetime";
import { getFileUrl } from "~/utils/files";
import { sanitizeEmailHtml, stripHtmlTags } from "~/utils/sanitize";
import type { FileAttachment } from "~/types/post";
import type { PostalEmail } from "~/types/mail";
import { fetchEmail, fetchThread, markEmailRead, starEmail, moveEmail, deleteEmail, reportSpam, resendEmail, setEmailLabel } from "~/utils/api";

const props = defineProps<{
  emailId: string;
}>();

const { t } = useI18n();
const { $toast } = useNuxtApp();
const mail = useMail();

const email = ref<PostalEmail | null>(null);
const thread = ref<PostalEmail[]>([]);
const loading = ref(true);
const notFound = ref(false);
const labelsMenuOpen = ref(false);
const composeOpen = ref(false);
const composePrefill = ref<{ mode: string; email: PostalEmail } | null>(null);
const emailFrameRef = ref<HTMLIFrameElement | null>(null);

const id = computed(() => props.emailId);

const isHtml = computed(() => email.value?.contentType === "text/html");
const safeBody = computed(() => sanitizeEmailHtml(email.value?.body || ""));

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

async function copyAddress(address: string) {
  try {
    await navigator.clipboard.writeText(address);
    $toast.success(t("mail.emailCopied"));
  } catch {}
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

async function load(emailId?: string) {
  const targetId = emailId || id.value;
  if (!targetId) return;
  loading.value = true;
  notFound.value = false;
  try {
    const data = await fetchEmail(targetId);
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
      markEmailRead(data.id, true).catch(() => {});
      mail.refreshUnread();
    }
  } catch {
    notFound.value = true;
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

function onFrameLoad() {
  const iframe = emailFrameRef.value;
  if (!iframe?.contentDocument) return;
  const doc = iframe.contentDocument;
  const style = doc.createElement("style");
  style.textContent = `body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;line-height:1.6;word-wrap:break-word;overflow-wrap:break-word;}img{max-width:100%;height:auto;}table{max-width:100%;border-collapse:collapse;}a{color:#3b82f6;}`;
  doc.head.appendChild(style);
  const width = iframe.parentElement?.offsetWidth ?? 800;
  doc.documentElement.style.width = `${width}px`;
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

function onKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
  if (composeOpen.value || labelsMenuOpen.value) return;

  switch (e.key) {
    case "j": {
      if (!email.value || thread.value.length <= 1) return;
      const idx = thread.value.findIndex((m) => m.id === email.value!.id);
      if (idx < thread.value.length - 1) openThreadMessage(thread.value[idx + 1]);
      break;
    }
    case "k": {
      if (!email.value || thread.value.length <= 1) return;
      const idx = thread.value.findIndex((m) => m.id === email.value!.id);
      if (idx > 0) openThreadMessage(thread.value[idx - 1]);
      break;
    }
    case "r":
      e.preventDefault();
      openCompose("reply");
      break;
    case "a":
      if (e.metaKey || e.ctrlKey) return;
      openCompose("replyAll");
      break;
    case "f":
      openCompose("forward");
      break;
    case "s":
      e.preventDefault();
      toggleStar();
      break;
    case "e":
      e.preventDefault();
      moveTo("archive");
      break;
    case "#":
      moveTo("trash");
      break;
    case "Escape":
      if (labelsMenuOpen.value) {
        labelsMenuOpen.value = false;
      } else {
        const folder = email.value?.folder || "inbox";
        navigateTo(`/mail/${folder}`);
      }
      break;
  }
}

onMounted(() => {
  if (id.value) load(id.value);
  document.addEventListener("keydown", onKeyDown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeyDown);
  mail.state.readerSubject = "";
  mail.state.readerFolder = "";
});
</script>

<style scoped>
.email-frame {
  min-height: 500px;
  background: transparent;
}
</style>
