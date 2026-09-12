<template>
  <NuxtLayout name="pet">
    <!-- Pet layout's main is full-bleed below its 65px appbar (min-h-16 + 1px border). -->
    <div class="flex h-full flex-col overflow-hidden">
      <!-- Pet topbar -->
      <div class="flex shrink-0 items-center gap-1.5 border-b border-base-300 px-4 py-2.5 sm:px-6">
        <div class="flex min-w-0 flex-1 items-center gap-2.5">
          <span class="relative flex h-2 w-2 shrink-0" aria-hidden="true">
            <span
              v-if="busy"
              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"
            />
            <span
              class="relative inline-flex h-2 w-2 rounded-full"
              :class="busy ? 'bg-primary' : 'bg-success'"
            />
          </span>
          <select
            v-if="agents.length > 0 && bubbles.length === 0"
            v-model="selectedAgentId"
            class="select select-ghost select-sm max-w-full text-sm font-medium"
            :aria-label="t('chat.pickAgent')"
          >
            <option v-for="agent in agents" :key="agent.id" :value="agent.id">
              {{ agent.name || t("chat.unnamedAgent") }}
            </option>
          </select>
          <h1 v-else class="truncate text-sm font-semibold sm:text-base">
            {{ currentAgentName || t("chat.conversation") }}
          </h1>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-circle btn-sm"
          :class="{ 'text-primary': showConversations }"
          :disabled="busy"
          :aria-label="t('chat.conversations')"
          :title="t('chat.conversations')"
          @click="toggleConversationsPanel"
        >
          <IconMessagesSquare class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-circle btn-sm"
          :disabled="busy"
          :aria-label="t('chat.newConversation')"
          :title="t('chat.newConversation')"
          @click="newConversation"
        >
          <IconSquarePen class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-circle btn-sm"
          :aria-label="t('ai.title')"
          :title="t('ai.title')"
          @click="consoleOpen = true"
        >
          <IconSettings class="h-4 w-4" />
        </button>
      </div>

      <!-- Two-column body: current conversation | conversation list -->
      <div class="flex min-h-0 flex-1">
      <!-- Left: current conversation -->
      <div class="flex min-w-0 flex-1 flex-col">
      <!-- Error banner -->
      <div
        v-if="error"
        class="mx-4 mb-2 flex items-center gap-2 rounded-box border border-error/20 bg-error/10 px-3 py-2 text-xs text-error sm:mx-6"
      >
        <IconAlertCircle class="h-4 w-4 shrink-0" />
        <span class="min-w-0 flex-1 break-words">{{ error }}</span>
        <button type="button" class="btn btn-ghost btn-xs btn-circle" :aria-label="t('common.close')" @click="error = null">
          <IconX class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Messages -->
      <div
        ref="messageListRef"
        class="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6"
        @click="handleMarkdownClick"
      >
        <div class="mx-auto max-w-3xl space-y-1 py-4">
          <template v-if="bubbles.length > 0">
            <template v-for="(bubble, index) in bubbles" :key="`${bubble.kind}-${index}`">
              <!-- User -->
              <div v-if="bubble.kind === 'user'" class="msg-row flex justify-end py-1">
                <div class="max-w-[78%] rounded-2xl bg-base-content px-4 py-2.5 text-sm leading-relaxed text-base-100">
                  <div v-if="bubble.attachmentIds.length || bubble.attachmentPreviews.length" class="mb-2 flex flex-wrap gap-1.5">
                    <img
                      v-for="(src, i) in userAttachmentSrcs(bubble)"
                      :key="i"
                      :src="src"
                      alt=""
                      class="h-20 w-20 rounded-lg object-cover"
                    />
                  </div>
                  <p v-if="bubble.text" class="whitespace-pre-wrap break-words">{{ bubble.text }}</p>
                </div>
              </div>

              <!-- Assistant: response sits directly on the background, no bubble -->
              <div
                v-else-if="bubble.kind === 'assistant'"
                class="msg-row py-1"
                :class="{ 'opacity-90': bubble.streaming }"
              >
                <div
                  class="prose prose-sm max-w-none break-words prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:bg-base-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-primary prose-pre:bg-base-200 prose-pre:overflow-x-auto prose-pre:text-sm prose-headings:mb-2 prose-headings:mt-4 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-blockquote:border-primary/30"
                  v-html="renderMarkdown(bubble.text)"
                />
                <span
                  v-if="bubble.streaming"
                  class="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-primary align-text-bottom"
                  aria-hidden="true"
                />
              </div>

              <!-- Thinking trace -->
              <div v-else-if="bubble.kind === 'thinking'" class="msg-row flex justify-start py-0.5 pl-1">
                <button
                  type="button"
                  class="max-w-[85%] rounded-lg px-2 py-1.5 text-left font-mono text-xs leading-relaxed text-base-content/50 transition-colors hover:bg-base-100"
                  @click="toggleTrace(bubble)"
                >
                  <div class="flex items-center gap-1.5">
                    <IconChevronRight
                      class="h-3 w-3 shrink-0 transition-transform duration-200 motion-reduce:transition-none"
                      :class="{ 'rotate-90': !bubble.collapsed }"
                    />
                    <span class="font-semibold">{{ bubble.streaming ? t("chat.thinking") : t("chat.thought") }}</span>
                    <span v-if="bubble.collapsed && thinkingSnippet(bubble)" class="truncate">{{ thinkingSnippet(bubble) }}</span>
                  </div>
                  <div
                    class="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
                    :class="bubble.collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'"
                  >
                    <div class="min-h-0 overflow-hidden">
                      <div class="mt-1 whitespace-pre-wrap break-words pl-3 text-[11px] text-base-content/50">
                        {{ bubble.text }}
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <!-- Tool trace -->
              <div v-else class="msg-row flex justify-start py-0.5 pl-1">
                <button
                  type="button"
                  class="max-w-[85%] rounded-lg px-2 py-1.5 text-left font-mono text-xs leading-relaxed transition-colors hover:bg-base-100"
                  @click="toggleTrace(bubble)"
                >
                  <div class="flex items-center gap-1.5">
                    <IconChevronRight
                      class="h-3 w-3 shrink-0 text-base-content/40 transition-transform duration-200 motion-reduce:transition-none"
                      :class="{ 'rotate-90': !bubble.collapsed }"
                    />
                    <span v-if="bubble.toolRunning" class="animate-pulse text-primary">▍</span>
                    <span v-else-if="bubble.toolResult === 'unknown tool'" class="font-bold text-error">!</span>
                    <span class="font-semibold text-base-content/80">{{ bubble.text }}</span>
                    <span v-if="bubble.collapsed && toolSummary(bubble)" class="truncate text-base-content/40">{{ toolSummary(bubble) }}</span>
                  </div>
                  <div
                    class="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
                    :class="bubble.collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'"
                  >
                    <div class="min-h-0 overflow-hidden">
                      <div class="mt-1.5 space-y-1.5 pl-3">
                        <div v-if="bubble.args && Object.keys(bubble.args).length > 0">
                          <div class="text-[10px] uppercase tracking-wide text-base-content/40">{{ t("chat.toolArguments") }}</div>
                          <pre class="whitespace-pre-wrap break-all rounded bg-base-200/60 px-2 py-1 text-[11px] text-base-content/70">{{ formatArgs(bubble.args) }}</pre>
                        </div>
                        <div v-if="bubble.toolResult">
                          <div class="text-[10px] uppercase tracking-wide text-base-content/40">{{ t("chat.toolResult") }}</div>
                          <pre class="whitespace-pre-wrap break-all rounded bg-base-200/60 px-2 py-1 text-[11px] text-base-content/70">{{ toolResultLabel(bubble.toolResult) }}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </template>
          </template>

          <!-- Empty state -->
          <div v-else class="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <IconSparkles class="h-8 w-8 text-primary/60" />
            <p class="max-w-sm text-sm text-base-content/50">
              {{ t("chat.startHint", { name: currentAgentName || t("chat.conversation") }) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Input footer -->
      <div class="px-4 pb-4 pt-1 sm:px-6">
        <div class="mx-auto max-w-3xl">
          <!-- Pending attachments -->
          <div v-if="pendingAttachments.length" class="mb-2 flex gap-2 overflow-x-auto pb-1">
            <div v-for="(attachment, index) in pendingAttachments" :key="attachment.objectUrl" class="relative shrink-0">
              <img :src="attachment.objectUrl" :alt="attachment.name" class="h-14 w-14 rounded-box object-cover" />
              <button
                type="button"
                class="btn btn-circle btn-xs absolute -right-1.5 -top-1.5 bg-base-100 shadow"
                :aria-label="t('common.remove')"
                @click="removePending(index)"
              >
                <IconX class="h-3 w-3" />
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-circle btn-sm shrink-0"
              :disabled="busy || uploading"
              :aria-label="t('chat.attachImages')"
              :title="t('chat.attachImages')"
              @click="pickAttachments"
            >
              <IconPaperclip class="h-5 w-5" />
            </button>
            <input ref="fileInputRef" type="file" accept="image/*" multiple class="hidden" @change="onFilesSelected" />
            <input
              v-model="input"
              type="text"
              class="input input-bordered h-11 flex-1 rounded-full bg-base-100 text-sm shadow-sm"
              :placeholder="t('chat.messagePlaceholder')"
              :disabled="uploading"
              @keydown.enter="send"
            />
            <button
              type="button"
              class="btn btn-primary btn-circle btn-sm h-11 w-11 shrink-0"
              :disabled="(!input.trim() && pendingAttachments.length === 0) || uploading"
              :aria-label="busy ? t('chat.stop') : t('chat.send')"
              :title="busy ? t('chat.stop') : t('chat.send')"
              @click="busy ? stop() : send()"
            >
              <IconStopCircle v-if="busy" class="h-5 w-5" />
              <IconSend v-else class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      </div>

      <!-- Right: conversation list (collapsible on desktop) -->
      <div
        class="hidden shrink-0 grid-rows-[1fr] overflow-hidden transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none lg:grid"
        :class="showConversations ? 'grid-cols-[18rem] xl:grid-cols-[20rem]' : 'grid-cols-[0fr]'"
      >
        <div class="h-full min-w-0 overflow-hidden">
          <aside class="flex h-full w-72 shrink-0 flex-col border-l border-base-300 bg-base-100 xl:w-80">
            <div class="shrink-0 border-b border-base-300 px-4 py-3">
              <h2 class="text-sm font-semibold tracking-tight">{{ t("chat.conversations") }}</h2>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto p-2">
              <ConversationList
                :conversations="conversations"
                :loading="conversationsLoading"
                :active-id="conversationId"
                @select="openConversation"
              />
            </div>
          </aside>
        </div>
      </div>
      </div>
    </div>

    <!-- AI Console (gear) -->
    <dialog class="modal" :class="{ 'modal-open': consoleOpen }">
      <div class="modal-box max-h-[88vh] w-full max-w-5xl p-0">
        <div class="sticky top-0 z-10 flex justify-end border-b border-base-300 bg-base-100/95 p-2 backdrop-blur">
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-circle"
            :aria-label="t('common.close')"
            @click="consoleOpen = false"
          >
            <IconX class="h-4 w-4" />
          </button>
        </div>
        <AiConsolePanel />
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="consoleOpen = false">close</button>
      </form>
    </dialog>

    <!-- Mobile conversations list -->
    <dialog class="modal" :class="{ 'modal-open': showConversationsMobile }">
      <div class="modal-box max-h-[75vh] overflow-y-auto">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-lg font-bold">{{ t("chat.conversations") }}</h3>
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-circle"
            :aria-label="t('common.close')"
            @click="showConversationsMobile = false"
          >
            <IconX class="h-4 w-4" />
          </button>
        </div>
        <button type="button" class="btn btn-primary btn-sm mb-3 w-full gap-2" @click="newConversationFromMobile">
          <IconPlus class="h-4 w-4" />
          {{ t("chat.newConversation") }}
        </button>
        <ConversationList
          :conversations="conversations"
          :loading="conversationsLoading"
          :active-id="conversationId"
          @select="openConversation"
        />
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showConversationsMobile = false">close</button>
      </form>
    </dialog>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { renderMarkdown } from "~/utils/markdown";
import { getFileUrl } from "~/utils/files";
import { uploadDriveFile } from "~/utils/api";
import {
  createPersonalityConversation,
  fetchPersonalityAgents,
  fetchPersonalityConversationMessages,
  fetchPersonalityConversations,
  runPersonalityConversation,
} from "~/utils/personality";
import type {
  PersonalityAgent,
  PersonalityConversation,
  PersonalityConversationMessage,
} from "~/utils/personality";

definePageMeta({ middleware: "auth" });

const { t } = useI18n();
const toast = useNuxtApp().$toast;

// ── Bubble model (mirrors the SynthPet conversation page) ──────────────────

type BubbleKind = "user" | "assistant" | "thinking" | "tool";

interface Bubble {
  kind: BubbleKind;
  text: string;
  streaming?: boolean;
  /** Identifies assistant bubbles created by the active stream turn. */
  streamId?: symbol;
  /** Drive file ids persisted with the message (server history). */
  attachmentIds: string[];
  /** Object URLs for attachments picked in this session. */
  attachmentPreviews: string[];
  /** Server tool-call id, used to update a running row with its result. */
  toolCallId?: string | null;
  /** Tool invocation arguments, shown when a tool row is expanded. */
  args?: Record<string, unknown>;
  /** Resolved tool result (`running` while pending, `interrupted` on abort). */
  toolResult?: string | null;
  toolRunning?: boolean;
  /** Detail well hidden; a folded trace reads as one log line. */
  collapsed?: boolean;
  /** The user explicitly toggled this section; auto-fold leaves it alone. */
  touched?: boolean;
}

interface PendingAttachment {
  file: File;
  name: string;
  objectUrl: string;
}

const bubbles = ref<Bubble[]>([]);
const agents = ref<PersonalityAgent[]>([]);
const selectedAgentId = ref<string | null>(null);
const conversationId = ref<string | null>(null);
const busy = ref(false);
const uploading = ref(false);
const error = ref<string | null>(null);
const input = ref("");
const pendingAttachments = ref<PendingAttachment[]>([]);
const conversations = ref<PersonalityConversation[]>([]);
const conversationsLoading = ref(false);
const consoleOpen = ref(false);
const showConversations = ref(true);
const showConversationsMobile = ref(false);
const messageListRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
let abortController: AbortController | null = null;
let activeStreamId: symbol | null = null;

const currentAgentName = computed(() => {
  const agent = agents.value.find((a) => a.id === selectedAgentId.value);
  return agent ? (agent.name || t("chat.unnamedAgent")) : "";
});

// ── Lifecycle ──────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([loadAgents(), loadConversations()]);
});

async function loadAgents() {
  try {
    agents.value = await fetchPersonalityAgents();
    const first = agents.value[0];
    if (first) {
      selectedAgentId.value = first.id;
    }
  } catch (e) {
    error.value = messageOf(e);
  }
}

async function loadConversations() {
  if (conversationsLoading.value) return;
  conversationsLoading.value = true;
  try {
    conversations.value = await fetchPersonalityConversations(50, 0);
  } catch (e) {
    toast.error(t("chat.loadFailed", { error: messageOf(e) }));
  } finally {
    conversationsLoading.value = false;
  }
}

onUnmounted(() => {
  for (const attachment of pendingAttachments.value) {
    URL.revokeObjectURL(attachment.objectUrl);
  }
  for (const bubble of bubbles.value) {
    for (const preview of bubble.attachmentPreviews) {
      URL.revokeObjectURL(preview);
    }
  }
});

// ── Streaming event handling (port of the SynthPet event switch) ───────────

function onReasoningChunk(delta: string) {
  const last = bubbles.value[bubbles.value.length - 1];
  if (last && last.kind === "assistant") return;
  if (last && last.kind === "thinking") {
    last.text += delta;
  } else {
    bubbles.value.push(emptyBubble("thinking", delta, { streaming: true }));
  }
  scrollToEnd();
}

function onMessageChunk(delta: string) {
  finalizeThinking();
  const last = bubbles.value[bubbles.value.length - 1];
  if (last && last.kind === "assistant" && last.streamId === activeStreamId) {
    last.text += delta;
  } else {
    bubbles.value.push(
      emptyBubble("assistant", delta, {
        streaming: true,
        streamId: activeStreamId ?? undefined,
      }),
    );
  }
  splitStreamingBubble();
  scrollToEnd();
}

function onToolInvoked(
  id: string,
  name: string,
  args: Record<string, unknown>,
  result: string,
) {
  if (result === "running") {
    bubbles.value.push(
      emptyBubble("tool", name, { toolCallId: id, args, toolRunning: true }),
    );
    return;
  }
  const index = lastIndexWhere(
    bubbles.value,
    (b) => b.toolCallId != null && b.toolCallId === id,
  );
  if (index >= 0) {
    // The predicate matched, so an item exists at this index.
    const bubble = bubbles.value[index]!;
    bubble.toolRunning = false;
    bubble.toolResult = result;
    bubble.args = args;
    // Settled machinery folds away unless the user pinned it open.
    if (!bubble.touched) bubble.collapsed = true;
  } else {
    bubbles.value.push(
      emptyBubble("tool", name, { toolCallId: id, args, toolResult: result }),
    );
  }
}

function onMessageCompleted(text: string) {
  finalizeThinking();
  // Deltas are already rendered. Replace every bubble from this turn with
  // the authoritative persisted text, including segments split mid-stream.
  const streamId = activeStreamId;
  if (streamId) {
    bubbles.value = bubbles.value.filter(
      (bubble) => bubble.streamId !== streamId,
    );
  }
  for (const part of text.split(/\n\s*\n/)) {
    const trimmed = part.trim();
    if (trimmed) {
      bubbles.value.push(emptyBubble("assistant", trimmed));
    }
  }
  scrollToEnd();
}

/** The reply has started or the turn ended; reasoning is over. Fold the
 *  trace unless the user pinned it open. */
function finalizeThinking() {
  for (const bubble of bubbles.value) {
    if (bubble.kind === "thinking" && bubble.streaming) {
      bubble.streaming = false;
      if (!bubble.touched) bubble.collapsed = true;
    }
  }
}

function finalizeStreamingAssistant() {
  for (const bubble of bubbles.value) {
    if (bubble.kind === "assistant" && bubble.streaming) {
      bubble.streaming = false;
    }
  }
}

/** A turn ended while a tool row still showed `running` (abort or error);
 *  log it as interrupted rather than leaving it spinning forever. */
function settleRunningTools() {
  for (const bubble of bubbles.value) {
    if (bubble.kind === "tool" && bubble.toolRunning) {
      bubble.toolRunning = false;
      bubble.toolResult ??= "interrupted";
      if (!bubble.touched) bubble.collapsed = true;
    }
  }
}

function toggleTrace(bubble: Bubble) {
  bubble.touched = true;
  bubble.collapsed = !bubble.collapsed;
}

/** The agent marks message boundaries with a blank line; while streaming,
 *  promote every completed segment into its own bubble. */
function splitStreamingBubble() {
  const last = bubbles.value[bubbles.value.length - 1];
  if (!last || last.kind !== "assistant" || !last.streaming) return;
  const parts = last.text.split(/\n\s*\n/);
  if (parts.length < 2) return;
  last.text = parts.pop()!.trim();
  for (const part of parts) {
    if (part.trim()) {
      bubbles.value.push(
        emptyBubble("assistant", part.trim(), {
          streaming: true,
          streamId: activeStreamId ?? undefined,
        }),
      );
    }
  }
}

/** Replays a persisted message into bubbles, exactly like the live log. */
function bubblesFromMessage(message: PersonalityConversationMessage): Bubble[] {
  switch (message.role) {
    case "assistant": {
      const out: Bubble[] = [];
      if (message.reasoningContent && message.reasoningContent.trim()) {
        out.push(
          emptyBubble("thinking", message.reasoningContent, { collapsed: true }),
        );
      }
      for (const call of message.toolCalls) {
        out.push(
          emptyBubble("tool", call.name, {
            toolCallId: call.id,
            args: decodeToolArguments(call.arguments),
            toolResult: "earlier turn",
            collapsed: true,
          }),
        );
      }
      for (const part of message.content.split(/\n\s*\n/)) {
        if (part.trim()) {
          out.push(emptyBubble("assistant", part.trim()));
        }
      }
      return out;
    }
    case "tool":
    case "system":
      // Tool results belong to the call above; skip orphaned rows.
      return [];
    case "user":
      return message.content
        .split(/\n\s*\n/)
        .filter((part) => part.trim())
        .map((part) =>
          emptyBubble("user", part.trim(), {
            attachmentIds: message.attachmentIds,
          }),
        );
  }
}

// ── Actions ────────────────────────────────────────────────────────────────

async function send() {
  const text = input.value.trim();
  if ((!text && pendingAttachments.value.length === 0) || busy.value) return;

  const pending = [...pendingAttachments.value];
  const streamId = Symbol("personality-stream");
  activeStreamId = streamId;
  bubbles.value.push(
    emptyBubble("user", text, {
      attachmentPreviews: pending.map((a) => a.objectUrl),
    }),
  );
  error.value = null;
  input.value = "";
  pendingAttachments.value = [];
  uploading.value = true;
  scrollToEnd();

  try {
    let currentId = conversationId.value;
    if (!currentId) {
      const agentId = selectedAgentId.value;
      if (!agentId) throw new Error(t("chat.noAgent"));
      currentId = await createPersonalityConversation(agentId);
      conversationId.value = currentId;
    }

    const attachmentIds: string[] = [];
    for (const attachment of pending) {
      const uploaded = await uploadDriveFile(attachment.file);
      attachmentIds.push(uploaded.id);
    }
    for (const attachment of pending) {
      URL.revokeObjectURL(attachment.objectUrl);
    }
    // Attach the persisted ids to the user bubble; drop the local previews.
    const userBubble = bubbles.value[bubbles.value.length - 1];
    if (userBubble && userBubble.kind === "user") {
      userBubble.attachmentIds = attachmentIds;
      userBubble.attachmentPreviews = [];
    }

    busy.value = true;
    abortController = new AbortController();
    await runPersonalityConversation({
      conversationId: currentId,
      message: text,
      attachmentIds,
      signal: abortController.signal,
      onReasoning: onReasoningChunk,
      onChunk: onMessageChunk,
      onToolCall: (id, name, args) => onToolInvoked(id, name, args, "running"),
      onToolResult: (id, name, args, result) =>
        onToolInvoked(id, name, args, result),
      onCompleted: onMessageCompleted,
    });
  } catch (e) {
    if (isAbortError(e)) {
      finalizeThinking();
      settleRunningTools();
    } else {
      error.value = messageOf(e);
    }
  } finally {
    busy.value = false;
    uploading.value = false;
    abortController = null;
    finalizeThinking();
    finalizeStreamingAssistant();
    settleRunningTools();
    activeStreamId = null;
  }
}

function stop() {
  abortController?.abort();
}

function pickAttachments() {
  fileInputRef.value?.click();
}

function onFilesSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files ?? []);
  target.value = "";
  for (const file of files) {
    pendingAttachments.value.push({
      file,
      name: file.name,
      objectUrl: URL.createObjectURL(file),
    });
  }
}

function removePending(index: number) {
  const attachment = pendingAttachments.value[index];
  if (!attachment) return;
  URL.revokeObjectURL(attachment.objectUrl);
  pendingAttachments.value.splice(index, 1);
}

function newConversation() {
  if (busy.value) return;
  conversationId.value = null;
  bubbles.value = [];
  error.value = null;
}

/** Desktop toggles the sidebar; mobile opens the slide-over. */
function toggleConversationsPanel() {
  if (window.matchMedia("(min-width: 1024px)").matches) {
    showConversations.value = !showConversations.value;
  } else {
    showConversationsMobile.value = true;
  }
}

function newConversationFromMobile() {
  showConversationsMobile.value = false;
  newConversation();
}

async function openConversation(id: string) {
  showConversationsMobile.value = false;
  if (busy.value) return;
  try {
    const messages = await fetchPersonalityConversationMessages(id, 200, 0);
    conversationId.value = id;
    bubbles.value = messages.flatMap(bubblesFromMessage);
    error.value = null;
    scrollToEnd();
  } catch (e) {
    error.value = messageOf(e);
  }
}

// ── Render helpers ─────────────────────────────────────────────────────────

function userAttachmentSrcs(bubble: Bubble): string[] {
  const previews = bubble.attachmentPreviews.filter(Boolean);
  const ids = bubble.attachmentIds
    .map((id) => getFileUrl(id))
    .filter((url): url is string => url !== null);
  return [...previews, ...ids];
}

function thinkingSnippet(bubble: Bubble): string {
  return bubble.text.trim().split("\n")[0] ?? "";
}

function toolSummary(bubble: Bubble): string {
  if (!bubble.toolResult) return "";
  const label = toolResultLabel(bubble.toolResult);
  if (label !== bubble.toolResult) return label;
  return bubble.toolResult.replace(/\s+/g, " ").trim();
}

function toolResultLabel(result: string): string {
  switch (result) {
    case "interrupted":
      return t("chat.interrupted");
    case "unknown tool":
      return t("chat.unknownTool");
    case "earlier turn":
      return t("chat.earlierTurn");
    default:
      return result;
  }
}

function formatArgs(args: Record<string, unknown>): string {
  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return String(args);
  }
}

function decodeToolArguments(raw: string): Record<string, unknown> | undefined {
  if (!raw.trim()) return undefined;
  try {
    const decoded: unknown = JSON.parse(raw);
    if (decoded && typeof decoded === "object" && !Array.isArray(decoded)) {
      // JSON.parse produced a plain object; record-shaped by construction.
      return decoded as Record<string, unknown>;
    }
  } catch {
    // Malformed tool arguments; keep the trace visible without failing.
  }
  return undefined;
}

function handleMarkdownClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const link = target.closest("a") as HTMLAnchorElement | null;
  if (!link?.href) return;
  event.preventDefault();
  window.open(link.href, "_blank", "noopener,noreferrer");
}

// ── Small helpers ──────────────────────────────────────────────────────────

function emptyBubble(
  kind: BubbleKind,
  text: string,
  extra: Partial<Bubble> = {},
): Bubble {
  return {
    kind,
    text,
    attachmentIds: [],
    attachmentPreviews: [],
    ...extra,
  };
}

function lastIndexWhere<T>(items: T[], predicate: (item: T) => boolean): number {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (item !== undefined && predicate(item)) return i;
  }
  return -1;
}

function isAbortError(e: unknown): boolean {
  return e instanceof Error && e.name === "AbortError";
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function scrollToEnd() {
  nextTick(() => {
    const el = messageListRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
}
</script>

<style scoped>
/* New rows (messages, tool calls, thought traces) ease in as they arrive. */
.msg-row {
  animation: msg-in 0.25s ease-out;
}

@keyframes msg-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .msg-row {
    animation: none;
  }
}
</style>
