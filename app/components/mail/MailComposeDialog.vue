<template>
  <ClientOnly>
    <DrawerRoot :open="isOpen" @update:open="handleDrawerClose">
      <DrawerPortal>
        <DrawerOverlay class="fixed inset-0 z-50 bg-black/40" />
        <DrawerContent
          class="fixed bottom-0 left-0 right-0 z-50 mx-auto flex h-[min(88vh,720px)] max-w-2xl flex-col overflow-hidden rounded-t-box bg-base-100 shadow-sm outline-none"
        >
          <!-- Drag handle -->
          <div class="flex justify-center bg-base-200/70 pb-1 pt-3">
            <div class="h-1 w-10 rounded-full bg-base-content/20" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between gap-2 bg-base-200/70 px-3 py-2 sm:px-4">
            <div class="flex min-w-0 items-center gap-2">
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle shrink-0"
                :title="t('mail.close')"
                @click="close"
              >
                <IconX class="h-5 w-5" />
              </button>
              <h3 class="truncate text-base font-semibold">{{ dialogTitle }}</h3>
            </div>

            <div class="flex shrink-0 items-center gap-1.5">
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
            <div class="space-y-3 p-4 sm:p-5">
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
                <span class="w-16 shrink-0 text-base-content/50">{{ t("mail.to") }}</span>
                <input
                  v-model="to"
                  type="text"
                  class="input input-bordered input-sm flex-1"
                  :placeholder="t('mail.recipientsPlaceholder')"
                />
              </div>

              <!-- Cc -->
              <div class="flex items-center gap-2 text-sm">
                <span class="w-16 shrink-0 text-base-content/50">{{ t("mail.cc") }}</span>
                <input
                  v-model="cc"
                  type="text"
                  class="input input-bordered input-sm flex-1"
                  :placeholder="t('mail.recipientsPlaceholder')"
                />
              </div>

              <!-- Bcc -->
              <div class="flex items-center gap-2 text-sm">
                <span class="w-16 shrink-0 text-base-content/50">{{ t("mail.bcc") }}</span>
                <input
                  v-model="bcc"
                  type="text"
                  class="input input-bordered input-sm flex-1"
                  :placeholder="t('mail.recipientsPlaceholder')"
                />
              </div>

              <!-- Subject -->
              <div class="flex items-center gap-2 text-sm">
                <span class="w-16 shrink-0 text-base-content/50">{{ t("mail.subject") }}</span>
                <input
                  v-model="subject"
                  type="text"
                  class="input input-bordered input-sm flex-1"
                  :placeholder="t('mail.subjectPlaceholder')"
                />
              </div>

              <!-- Content type toggle -->
              <div class="flex items-center gap-2 text-sm">
                <span class="w-16 shrink-0 text-base-content/50">{{ t("mail.body") }}</span>
                <div class="btn-group">
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs"
                    :class="{ 'btn-active bg-primary/10 text-primary': contentType === 'text/plain' }"
                    @click="contentType = 'text/plain'"
                  >
                    {{ t("mail.plainText") }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs"
                    :class="{ 'btn-active bg-primary/10 text-primary': contentType === 'text/html' }"
                    @click="contentType = 'text/html'"
                  >
                    {{ t("mail.html") }}
                  </button>
                </div>
              </div>

              <!-- Body -->
              <textarea
                v-model="body"
                rows="10"
                class="textarea textarea-bordered w-full resize-y leading-relaxed"
                :placeholder="t('mail.bodyPlaceholder')"
              />

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
        </DrawerContent>
      </DrawerPortal>
    </DrawerRoot>
    <template #fallback>
      <span />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import {
  IconX,
  IconSave,
  IconSend,
  IconLoader,
  IconPaperclip,
} from "#components";
import {
  DrawerRoot,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
} from "vaul-vue";
import type { PostalEmail } from "~/types/mail";
import { sendEmail, uploadDriveFile } from "~/utils/api";

interface PendingAttachment {
  id: string;
  name: string;
  size: number;
}

const props = defineProps<{
  open?: boolean;
  prefill?: { mode?: string; email?: PostalEmail } | null;
}>();

const emit = defineEmits<{
  close: [];
  sent: [];
}>();

const { t } = useI18n();
const mail = useMail();
const { $toast } = useNuxtApp();

const isOpen = computed(() => props.open ?? true);

const fromMailboxId = ref("");
const to = ref("");
const cc = ref("");
const bcc = ref("");
const subject = ref("");
const body = ref("");
const contentType = ref<"text/plain" | "text/html">("text/plain");
const pendingAttachments = ref<PendingAttachment[]>([]);
const replyToId = ref<string | null>(null);
const threadId = ref<string | null>(null);
const sending = ref(false);
const uploading = ref(false);
const error = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const dialogTitle = computed(() => {
  const mode = props.prefill?.mode;
  if (mode === "reply") return t("mail.reply");
  if (mode === "replyAll") return t("mail.replyAll");
  if (mode === "forward") return t("mail.forward");
  return t("mail.compose");
});

const canSend = computed(() => {
  const recipients = parseRecipients(to.value);
  const mailboxId = fromMailboxId.value || mail.state.selectedMailboxId;
  return Boolean(mailboxId && (recipients.length > 0 || !isOpen.value)) && !uploading.value;
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
  contentType.value = "text/plain";
  pendingAttachments.value = [];
  replyToId.value = null;
  threadId.value = null;
  error.value = null;
  sending.value = false;
}

function applyPrefill() {
  const prefill = props.prefill;
  if (!prefill || !prefill.email) return;
  const source = prefill.email;
  fromMailboxId.value = source.mailboxId || mail.state.selectedMailboxId || "";

  if (prefill.mode === "reply") {
    to.value = source.fromAddress;
    subject.value = prefixSubject("Re:", source.subject);
    replyToId.value = source.id;
    threadId.value = source.threadId ?? null;
    body.value = quoteBody(source);
  } else if (prefill.mode === "replyAll") {
    to.value = source.fromAddress;
    const others = (source.recipients ?? [])
      .filter(
        (recipient) =>
          recipient.kind === "to" || recipient.kind === "cc",
      )
      .map((recipient) => recipient.address)
      .filter((address) => address !== ownAddress());
    cc.value = [...new Set(others)].join(", ");
    subject.value = prefixSubject("Re:", source.subject);
    replyToId.value = source.id;
    threadId.value = source.threadId ?? null;
    body.value = quoteBody(source);
  } else if (prefill.mode === "forward") {
    subject.value = prefixSubject("Fwd:", source.subject);
    body.value = quoteBody(source);
    pendingAttachments.value = (source.attachments ?? [])
      .map((attachment) => ({
        id: attachment.file?.id || attachment.id,
        name: attachment.filename || attachment.file?.name || "attachment",
        size: attachment.size,
      }))
      .filter((attachment) => attachment.id);
  } else if (prefill.mode === "editDraft") {
    to.value = (source.recipients ?? [])
      .filter((recipient) => recipient.kind === "to")
      .map((recipient) => recipient.address)
      .join(", ");
    cc.value = (source.recipients ?? [])
      .filter((recipient) => recipient.kind === "cc")
      .map((recipient) => recipient.address)
      .join(", ");
    bcc.value = (source.recipients ?? [])
      .filter((recipient) => recipient.kind === "bcc")
      .map((recipient) => recipient.address)
      .join(", ");
    subject.value = source.subject;
    body.value = source.body;
    contentType.value = source.contentType === "text/html" ? "text/html" : "text/plain";
    replyToId.value = null;
    threadId.value = source.threadId ?? null;
    pendingAttachments.value = (source.attachments ?? [])
      .map((attachment) => ({
        id: attachment.file?.id || attachment.id,
        name: attachment.filename || attachment.file?.name || "attachment",
        size: attachment.size,
      }))
      .filter((attachment) => attachment.id);
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

function quoteBody(source: PostalEmail) {
  const lines = (source.body || "").split("\n");
  const quoted = lines.map((line) => `> ${line}`).join("\n");
  return `\n\n${quoted}\n`;
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
      contentType: contentType.value,
      attachmentIds: pendingAttachments.value.map((attachment) => attachment.id),
      isDraft,
      replyToId: replyToId.value ?? undefined,
      threadId: threadId.value ?? undefined,
    });
    $toast.success(isDraft ? t("mail.draftSaved") : t("mail.sentToast"));
    emit("sent");
    reset();
    emit("close");
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

function close() {
  emit("close");
}

function handleDrawerClose(open: boolean) {
  if (!open) close();
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      reset();
      applyPrefill();
    }
  },
);

watch(
  () => props.prefill,
  () => {
    if (props.open) {
      reset();
      applyPrefill();
    }
  },
);
</script>
