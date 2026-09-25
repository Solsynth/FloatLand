<template>
  <div class="shrink-0 px-3 pb-3 pt-1 sm:px-5 sm:pb-4">
    <!-- Floating composer card -->
    <div class="rounded-2xl border border-base-300 bg-base-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
      <!-- Reply / edit context bar -->
      <div
        v-if="replyTo || editing"
        class="mx-2 mt-2 flex items-center gap-2 rounded-lg bg-base-200/60 px-3 py-1.5"
      >
        <IconReply v-if="replyTo" class="h-3.5 w-3.5 shrink-0 text-primary" />
        <IconPencil v-else class="h-3.5 w-3.5 shrink-0 text-primary" />
        <span class="min-w-0 flex-1 truncate text-xs text-base-content/60">
          <template v-if="editing">{{ t("chat.editingMessage") }}</template>
          <template v-else>
            <span class="font-medium text-primary">{{ t("chat.replyingTo") }}</span>
            {{ replyPreview }}
          </template>
        </span>
        <button type="button" class="btn btn-ghost btn-circle btn-xs" @click="clearContext">
          <IconX class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Picked attachments -->
      <div v-if="pickedFiles.length" class="flex flex-wrap gap-2 px-2 pt-2">
        <div v-for="(file, index) in pickedFiles" :key="`${file.name}-${index}`" class="relative">
          <img v-if="isImageFile(file)" :src="objectUrl(file)" alt="" class="h-14 w-14 rounded-lg border border-base-300 object-cover" />
          <div v-else class="flex h-14 w-14 items-center justify-center rounded-lg border border-base-300 bg-base-200/60">
            <IconFileText class="h-6 w-6 text-base-content/50" />
            <span class="absolute inset-x-1 bottom-1 truncate text-center text-[9px] text-base-content/60">{{ file.name }}</span>
          </div>
          <button type="button" class="btn btn-circle btn-xs absolute -right-1.5 -top-1.5" @click="removePicked(index)">
            <IconX class="h-3 w-3" />
          </button>
        </div>
      </div>

      <!-- Input row -->
      <textarea
        ref="textareaRef"
        v-model="draft"
        rows="1"
        class="textarea max-h-40 min-h-10 w-full resize-none border-none bg-transparent px-3.5 pt-2.5 pb-1 text-sm leading-5 focus:outline-none"
        :placeholder="t('chat.inputPlaceholder')"
        @input="onInput"
        @keydown.enter.exact.prevent="submit"
      />
      <div class="flex items-center gap-0.5 px-1.5 pb-1.5">
        <button type="button" class="btn btn-ghost btn-circle btn-sm" :title="t('chat.attach')" @click="fileInput?.click()">
          <IconPaperclip class="h-4.5 w-4.5" />
        </button>
        <button type="button" class="btn btn-ghost btn-circle btn-sm" :title="t('chat.stickers')" @click="stickerOpen = !stickerOpen">
          <IconSticker class="h-4.5 w-4.5" />
        </button>

        <div class="flex-1" />

        <button
          v-if="recording"
          type="button"
          class="btn btn-circle btn-sm border-none bg-error text-error-content"
          :title="t('chat.stopRecording')"
          @click="stopRecording"
        >
          <IconSquare class="h-3.5 w-3.5" />
        </button>
        <button
          v-else
          type="button"
          class="btn btn-ghost btn-circle btn-sm"
          :title="t('chat.recordVoice')"
          @click="startRecording"
        >
          <IconMic class="h-4.5 w-4.5" />
        </button>

        <button
          type="button"
          class="btn btn-primary btn-circle btn-sm"
          :title="t('chat.send')"
          :disabled="!canSend"
          @click="submit"
        >
          <IconSend class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Recording indicator -->
    <div v-if="recording" class="mx-2 mt-1.5 flex items-center gap-2 text-xs text-error">
      <span class="relative flex h-2 w-2">
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
        <span class="relative inline-flex h-2 w-2 rounded-full bg-error" />
      </span>
      <span class="tabular-nums">{{ recordingLabel }}</span>
    </div>

    <div v-if="sendError" class="mx-2 mt-1.5 text-xs text-error">
      {{ t(sendError) }}
    </div>

    <!-- Sticker picker -->
    <ChatStickerPicker v-model:open="stickerOpen" :room-id="roomId" @pick="stickerOpen = false" />

    <input ref="fileInput" type="file" multiple class="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" @change="onFilesPicked" />
  </div>
</template>

<script setup lang="ts">
import { IconReply, IconPencil, IconX, IconFileText, IconPaperclip, IconSticker, IconMic, IconSquare, IconSend } from "#components";
import type { SnChatMessage } from "~/types/chat";

const props = defineProps<{
  roomId: string;
  editing?: SnChatMessage | null;
  replyTo?: SnChatMessage | null;
  threadId?: string | null;
}>();

const emit = defineEmits<{
  "save-edit": [content: string];
  "clear-reply": [];
  "clear-edit": [];
}>();

const { t } = useI18n();
const { state, send, sendVoice, sendTyping } = useChat();

const draft = ref(state.drafts[props.roomId] ?? "");
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const pickedFiles = ref<File[]>([]);
const stickerOpen = ref(false);
const sendError = computed(() => state.sendError);

watch(() => props.roomId, () => {
  draft.value = state.drafts[props.roomId] ?? ""
  pickedFiles.value = []
  stickerOpen.value = false
})

watch(draft, (value) => {
  state.drafts[props.roomId] = value
})

function onInput(): void {
  sendTyping(props.roomId)
  const el = textareaRef.value
  if (!el) return
  el.style.height = "auto"
  el.style.height = `${Math.min(el.scrollHeight, 10 * 20)}px`
}

function onFilesPicked(event: Event): void {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length) pickedFiles.value = [...pickedFiles.value, ...files]
  input.value = ""
}

function removePicked(index: number): void {
  pickedFiles.value.splice(index, 1)
}

function objectUrl(file: File): string {
  return URL.createObjectURL(file)
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}

function clearContext(): void {
  if (props.editing) emit("clear-edit")
  else emit("clear-reply")
}

const replyPreview = computed(() => {
  const target = props.replyTo
  if (!target) return ""
  if (target.deletedAt) return t("chat.messageDeleted")
  return target.content || t("chat.message")
})

const canSend = computed(() => {
  if (props.editing) return draft.value.trim().length > 0
  return draft.value.trim().length > 0 || pickedFiles.value.length > 0
})

async function submit(): Promise<void> {
  if (props.editing) {
    const content = draft.value.trim()
    if (!content) return
    emit("save-edit", content)
    return
  }
  const content = draft.value.trim()
  const files = pickedFiles.value
  if (!content && !files.length) return
  const ok = await send(props.roomId, {
    content,
    attachments: files,
    replyToId: props.replyTo?.id ?? null,
    threadId: props.threadId ?? null,
  })
  if (ok) {
    pickedFiles.value = []
    emit("clear-reply")
  }
  draft.value = ""
  nextTick(() => textareaRef.value?.focus())
}

// ── Voice recording ──────────────────────────────────────────────────────
let recorder: MediaRecorder | null = null
let chunks: Blob[] = []
let recordingStartedAt = 0
let recordingTimer: ReturnType<typeof setInterval> | null = null
const recording = ref(false)
const recordingSeconds = ref(0)

const recordingLabel = computed(() => {
  const minutes = Math.floor(recordingSeconds.value / 60)
  const seconds = recordingSeconds.value % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
})

async function startRecording(): Promise<void> {
  if (recording.value) return
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = ["audio/ogg;codecs=opus", "audio/webm;codecs=opus", "audio/webm"].find(
      (candidate) => MediaRecorder.isTypeSupported(candidate),
    )
    recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    chunks = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())
      const durationMs = Date.now() - recordingStartedAt
      const blob = new Blob(chunks, { type: recorder?.mimeType || "audio/webm" })
      chunks = []
      void sendVoice(props.roomId, blob, durationMs)
    }
    recordingStartedAt = Date.now()
    recordingSeconds.value = 0
    recorder.start()
    recording.value = true
    recordingTimer = setInterval(() => {
      recordingSeconds.value += 1
    }, 1000)
  } catch (err) {
    console.error("[Chat] Microphone unavailable:", err)
  }
}

function stopRecording(): void {
  if (!recorder || !recording.value) return
  if (recordingTimer) clearInterval(recordingTimer)
  recordingTimer = null
  recording.value = false
  recorder.stop()
  recorder = null
}
</script>
