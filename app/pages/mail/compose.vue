<template>
  <div class="flex h-full flex-col bg-base-100">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 border-b border-base-300 px-3 py-2 sm:px-5">
      <div class="hidden min-w-0 items-center gap-2 lg:flex">
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle shrink-0"
          :title="t('mail.close')"
          @click="goBack"
        >
          <IconX class="h-5 w-5" />
        </button>
        <h3 class="truncate text-base font-semibold">{{ composeTitle }}</h3>
      </div>

      <div class="flex w-full shrink-0 items-center justify-end gap-1.5 lg:w-auto">
        <button
          type="button"
          class="btn btn-ghost btn-sm gap-1"
          :disabled="sending"
          @click="saveDraft"
        >
          <IconSave class="h-4 w-4" />
          <span class="hidden sm:inline">{{ t("mail.saveDraft") }}</span>
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm gap-1.5 px-3"
          :disabled="!canSend || sending"
          @click="send"
        >
          <IconLoader v-if="sending" class="h-4 w-4 animate-spin" />
          <IconSend v-else class="h-4 w-4" />
          <span class="hidden sm:inline">{{ t("mail.send") }}</span>
        </button>
      </div>
    </div>

    <!-- Form -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      <div class="mx-auto max-w-2xl space-y-3 p-4 sm:p-6">
        <p v-if="loadingPrefill" class="text-sm text-base-content/50">{{ t("mail.loading") }}</p>
        <p v-if="error" class="text-sm text-error">{{ error }}</p>

        <!-- From -->
        <div class="flex items-center gap-2 text-sm">
          <span class="w-16 shrink-0 text-base-content/50">{{ t("mail.from") }}</span>
          <select
            v-model="fromMailboxId"
            class="select select-bordered select-sm flex-1"
          >
            <option
              v-for="mailbox in mail.state.mailboxes"
              :key="mailbox.id"
              :value="mailbox.id"
            >
              {{ mailbox.name || mailbox.address }}
            </option>
          </select>
        </div>

        <!-- To -->
        <div class="flex items-center gap-2 text-sm">
          <label class="w-16 shrink-0 text-base-content/50" for="compose-to">{{ t("mail.to") }}</label>
          <input
            id="compose-to"
            v-model="to"
            type="text"
            class="input input-bordered input-sm flex-1"
            :placeholder="t('mail.recipientsPlaceholder')"
          />
        </div>

        <!-- Add Cc / Bcc (hidden by default) -->
        <div v-if="!showCc && !showBcc" class="flex items-center gap-3 pl-16">
          <button type="button" class="btn btn-ghost btn-xs text-base-content/50 hover:text-primary" @click="showCc = true">
            {{ t("mail.cc") }}
          </button>
          <button type="button" class="btn btn-ghost btn-xs text-base-content/50 hover:text-primary" @click="showBcc = true">
            {{ t("mail.bcc") }}
          </button>
        </div>

        <!-- Cc -->
        <div v-if="showCc" class="flex items-center gap-2 text-sm">
          <label class="w-16 shrink-0 text-base-content/50" for="compose-cc">{{ t("mail.cc") }}</label>
          <input
            id="compose-cc"
            v-model="cc"
            type="text"
            class="input input-bordered input-sm flex-1"
            :placeholder="t('mail.recipientsPlaceholder')"
          />
          <button type="button" class="btn btn-ghost btn-xs btn-circle" title="Remove" @click="clearRecipient('cc')">
            <IconX class="h-3.5 w-3.5" />
          </button>
        </div>

        <!-- Bcc -->
        <div v-if="showBcc" class="flex items-center gap-2 text-sm">
          <label class="w-16 shrink-0 text-base-content/50" for="compose-bcc">{{ t("mail.bcc") }}</label>
          <input
            id="compose-bcc"
            v-model="bcc"
            type="text"
            class="input input-bordered input-sm flex-1"
            :placeholder="t('mail.recipientsPlaceholder')"
          />
          <button type="button" class="btn btn-ghost btn-xs btn-circle" title="Remove" @click="clearRecipient('bcc')">
            <IconX class="h-3.5 w-3.5" />
          </button>
        </div>

        <!-- Subject -->
        <div class="flex items-center gap-2 text-sm">
          <label class="w-16 shrink-0 text-base-content/50" for="compose-subject">{{ t("mail.subject") }}</label>
          <input
            id="compose-subject"
            v-model="subject"
            type="text"
            class="input input-bordered input-sm flex-1"
            :placeholder="t('mail.subjectPlaceholder')"
          />
        </div>

        <!-- Body (Tiptap, always HTML) -->
        <MailComposeEditor v-model="body" :placeholder="t('mail.bodyPlaceholder')" />

        <!-- Attachments -->
        <div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-sm gap-1"
              :disabled="uploading"
              @click="triggerFileInput"
            >
              <IconPaperclip class="h-4 w-4" />
              {{ t("mail.attach") }}
            </button>
            <input
              ref="fileInput"
              type="file"
              multiple
              class="hidden"
              @change="onFilesPicked"
            />
          </div>
          <ul v-if="pendingAttachments.length" class="mt-2 space-y-1.5">
            <li
              v-for="attachment in pendingAttachments"
              :key="attachment.id"
              class="flex items-center gap-2 rounded-box border border-base-300 px-3 py-2 text-sm"
            >
              <IconPaperclip class="h-4 w-4 shrink-0 text-base-content/40" />
              <span class="min-w-0 flex-1 truncate font-medium">
                {{ attachment.name }}
              </span>
              <span class="shrink-0 text-xs text-base-content/40">
                {{ formatBytes(attachment.size) }}
              </span>
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-circle"
                :title="t('mail.removeAttachment')"
                @click="removeAttachment(attachment.id)"
              >
                <IconX class="h-3.5 w-3.5" />
              </button>
            </li>
          </ul>
          <p
            v-if="uploading"
            class="mt-2 flex items-center gap-2 text-xs text-base-content/50"
          >
            <span class="loading loading-spinner loading-xs" />
            {{ t("mail.uploading") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconX,
  IconSave,
  IconSend,
  IconLoader,
  IconPaperclip,
} from "#components";
import type { PostalEmail } from "~/types/mail";
import { sendEmail, uploadDriveFile, fetchEmail } from "~/utils/api";

definePageMeta({ middleware: "auth" });

interface PendingAttachment {
  id: string;
  name: string;
  size: number;
}

const { t } = useI18n();
const route = useRoute();
const mail = useMail();
const { $toast } = useNuxtApp();

const mode = computed(() => (typeof route.query.mode === "string" ? route.query.mode : undefined));
const emailId = computed(() => (typeof route.query.email === "string" ? route.query.email : undefined));

const fromMailboxId = ref("");
const to = ref("");
const cc = ref("");
const bcc = ref("");
const subject = ref("");
const body = ref("");
const pendingAttachments = ref<PendingAttachment[]>([]);
const replyToId = ref<string | null>(null);
const threadId = ref<string | null>(null);
const sending = ref(false);
const uploading = ref(false);
const loadingPrefill = ref(false);
const error = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const showCc = ref(false);
const showBcc = ref(false);

const composeTitle = computed(() => {
  const m = mode.value;
  if (m === "reply") return t("mail.reply");
  if (m === "replyAll") return t("mail.replyAll");
  if (m === "forward") return t("mail.forward");
  return t("mail.compose");
});

const backTarget = computed(() =>
  mode.value === "editDraft" ? "/mail/drafts" : "/mail/inbox",
);

const canSend = computed(() => {
  const recipients = parseRecipients(to.value);
  const mailboxId = fromMailboxId.value || mail.state.selectedMailboxId;
  return Boolean(mailboxId && recipients.length > 0) && !uploading.value;
});

function parseRecipients(raw: string) {
  return raw
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((address) => ({ address }));
}

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function reset() {
  fromMailboxId.value = mail.state.selectedMailboxId ?? "";
  to.value = "";
  cc.value = "";
  bcc.value = "";
  subject.value = "";
  body.value = "";
  pendingAttachments.value = [];
  replyToId.value = null;
  threadId.value = null;
  error.value = null;
  sending.value = false;
  showCc.value = false;
  showBcc.value = false;
}

function clearRecipient(field: "cc" | "bcc") {
  if (field === "cc") {
    cc.value = "";
    showCc.value = false;
  } else {
    bcc.value = "";
    showBcc.value = false;
  }
}

function applyPrefill(email: PostalEmail) {
  const m = mode.value;
  if (!m) return;
  fromMailboxId.value = email.mailboxId || mail.state.selectedMailboxId || "";

  if (m === "reply") {
    to.value = email.fromAddress;
    subject.value = prefixSubject("Re:", email.subject);
    replyToId.value = email.id;
    threadId.value = email.threadId ?? null;
    body.value = quoteBody(email);
  } else if (m === "replyAll") {
    to.value = email.fromAddress;
    const others = (email.recipients ?? [])
      .filter(
        (recipient) =>
          recipient.kind === "to" || recipient.kind === "cc",
      )
      .map((recipient) => recipient.address)
      .filter((address) => address !== ownAddress());
    cc.value = [...new Set(others)].join(", ");
    if (cc.value) showCc.value = true;
    subject.value = prefixSubject("Re:", email.subject);
    replyToId.value = email.id;
    threadId.value = email.threadId ?? null;
    body.value = quoteBody(email);
  } else if (m === "forward") {
    subject.value = prefixSubject("Fwd:", email.subject);
    body.value = quoteBody(email);
    pendingAttachments.value = (email.attachments ?? [])
      .map((attachment) => ({
        id: attachment.file?.id || attachment.id,
        name: attachment.filename || attachment.file?.name || "attachment",
        size: attachment.size,
      }))
      .filter((attachment) => attachment.id);
  } else if (m === "editDraft") {
    to.value = (email.recipients ?? [])
      .filter((recipient) => recipient.kind === "to")
      .map((recipient) => recipient.address)
      .join(", ");
    cc.value = (email.recipients ?? [])
      .filter((recipient) => recipient.kind === "cc")
      .map((recipient) => recipient.address)
      .join(", ");
    if (cc.value) showCc.value = true;
    bcc.value = (email.recipients ?? [])
      .filter((recipient) => recipient.kind === "bcc")
      .map((recipient) => recipient.address)
      .join(", ");
    if (bcc.value) showBcc.value = true;
    subject.value = email.subject;
    body.value = email.body;
    replyToId.value = null;
    threadId.value = email.threadId ?? null;
    pendingAttachments.value = (email.attachments ?? [])
      .map((attachment) => ({
        id: attachment.file?.id || attachment.id,
        name: attachment.filename || attachment.file?.name || "attachment",
        size: attachment.size,
      }))
      .filter((attachment) => attachment.id);
  }
}

async function loadPrefill() {
  if (!emailId.value || !mode.value) {
    reset();
    return;
  }
  loadingPrefill.value = true;
  error.value = null;
  try {
    const email = await fetchEmail(emailId.value);
    reset();
    applyPrefill(email);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("mail.loadError");
  } finally {
    loadingPrefill.value = false;
  }
}

function ownAddress() {
  const mailbox = mail.state.mailboxes.find(
    (item) => item.id === fromMailboxId.value,
  );
  return mailbox?.address ?? "";
}

function prefixSubject(prefix: string, current: string) {
  if (!current) return prefix + " ";
  const lower = current.toLowerCase();
  const check = prefix.toLowerCase().replace(":", "");
  return lower.startsWith(check) ? current : `${prefix} ${current}`;
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function quoteBody(email: PostalEmail) {
  const text = escapeHtml(email.body || "").replace(/\n/g, "<br>");
  return `<p></p><blockquote>${text}</blockquote>`;
}

function triggerFileInput() {
  fileInput.value?.click();
}

async function onFilesPicked(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  input.value = "";
  if (!files.length) return;

  uploading.value = true;
  try {
    for (const file of files) {
      const uploaded = await uploadDriveFile(file, { usage: "email_attachment" });
      pendingAttachments.value.push({
        id: uploaded.id,
        name: uploaded.name || file.name,
        size: uploaded.size,
      });
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("mail.sendFailed");
  } finally {
    uploading.value = false;
  }
}

function removeAttachment(id: string) {
  pendingAttachments.value = pendingAttachments.value.filter(
    (attachment) => attachment.id !== id,
  );
}

async function submit(isDraft: boolean) {
  const mailboxId = fromMailboxId.value || mail.state.selectedMailboxId;
  if (!mailboxId) {
    error.value = t("mail.noMailboxes");
    return;
  }
  if (!isDraft && parseRecipients(to.value).length === 0) {
    error.value = t("mail.recipientsRequired");
    return;
  }
  sending.value = true;
  error.value = null;
  try {
    await sendEmail({
      mailboxId,
      to: parseRecipients(to.value),
      cc: parseRecipients(cc.value),
      bcc: parseRecipients(bcc.value),
      subject: subject.value.trim(),
      body: body.value,
      contentType: "text/html",
      attachmentIds: pendingAttachments.value.map((attachment) => attachment.id),
      isDraft,
      replyToId: replyToId.value ?? undefined,
      threadId: threadId.value ?? undefined,
    });
    $toast.success(isDraft ? t("mail.draftSaved") : t("mail.sentToast"));
    await navigateTo(isDraft ? "/mail/drafts" : "/mail/sent");
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("mail.sendFailed");
  } finally {
    sending.value = false;
  }
}

function send() {
  submit(false);
}

function saveDraft() {
  submit(true);
}

function goBack() {
  navigateTo(backTarget.value);
}

useSolarSeo({
  title: computed(() => `${t("mail.title")} · ${composeTitle.value}`),
  description: computed(() => t("mail.title")),
});

onMounted(() => {
  mail.init();
  loadPrefill();
});

watch([mode, emailId], () => loadPrefill());

// If mailboxes finish loading after the initial prefill, populate the From select.
watch(
  () => mail.state.selectedMailboxId,
  (id) => {
    if (id && !fromMailboxId.value) fromMailboxId.value = id;
  },
);
</script>
