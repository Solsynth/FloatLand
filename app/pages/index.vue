<template>
  <NuxtLayout name="app">
    <div class="feed-layout">
      <!-- Main Content -->
      <div class="min-w-0">
        <!-- Feed shell: continuous list like Flutter explore -->
        <div class="feed-stream">
          <!-- Inline Compose -->
          <section
            v-if="isAuthenticated"
            class="border-b border-base-300/80 px-4 py-2 sm:px-5"
          >
            <form
              class="flex items-start gap-3"
              @click="publisherPickerOpen = false; attachMenuOpen = false"
              @submit.prevent="submitInlinePost"
            >
              <div class="relative mt-0.5 shrink-0">
                <button
                  type="button"
                  class="avatar block h-9 w-9 rounded-full"
                  :title="t('compose.selectPublisher')"
                  @click.stop="publisherPickerOpen = !publisherPickerOpen"
                >
                  <div
                    class="h-9 w-9 overflow-hidden rounded-full ring-1 ring-base-300"
                  >
                    <img
                      v-if="publisherAvatar"
                      :src="publisherAvatar"
                      :alt="currentPublisher?.nick || userName"
                      class="block h-full w-full object-cover"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center bg-primary text-xs font-medium text-primary-content"
                    >
                      {{ publisherInitials }}
                    </div>
                  </div>
                </button>

                <div
                  v-if="publisherPickerOpen"
                  class="absolute left-0 top-11 z-30 w-56 overflow-hidden rounded-box bg-base-100 shadow-lg ring-1 ring-base-300"
                  @click.stop
                >
                  <button
                    v-for="publisher in publishers"
                    :key="publisher.id"
                    type="button"
                    class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-base-200"
                    :class="{
                      'bg-primary/10': currentPublisher?.id === publisher.id,
                    }"
                    @click="selectInlinePublisher(publisher)"
                  >
                    <div class="h-7 w-7 shrink-0 overflow-hidden rounded-full">
                      <img
                        v-if="publisher.picture?.id"
                        :src="getFileUrl(publisher.picture.id)"
                        :alt="publisher.nick || publisher.name"
                        class="h-full w-full object-cover"
                      />
                      <div
                        v-else
                        class="flex h-full w-full items-center justify-center bg-base-200 text-[10px] font-semibold"
                      >
                        {{ getPublisherInitials(publisher) }}
                      </div>
                    </div>
                    <span class="min-w-0 flex-1 truncate">
                      {{ publisher.nick || publisher.name }}
                    </span>
                    <span
                      v-if="currentPublisher?.id === publisher.id"
                      class="text-xs text-primary"
                    >
                      ✓
                    </span>
                  </button>
                  <p
                    v-if="publishers.length === 0"
                    class="px-3 py-3 text-xs text-base-content/50"
                  >
                    {{ t("compose.noPublishers") }}
                  </p>
                </div>
              </div>

              <div class="min-w-0 flex-1">
                <div
                  v-if="replyingTo"
                  class="mb-2 flex items-center gap-2 rounded-lg bg-base-200/60 px-2.5 py-1.5 text-xs"
                >
                  <span class="shrink-0 text-base-content/55">
                    {{ t("compose.replyingTo") }}
                  </span>
                  <span class="min-w-0 flex-1 truncate text-base-content/70">
                    {{ replyingTo.content }}
                  </span>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs btn-circle shrink-0"
                    :aria-label="t('compose.cancel')"
                    @click.stop="clearInlineReply"
                  >
                    <IconX class="h-3.5 w-3.5" />
                  </button>
                </div>

                <input
                  v-if="inlineComposeExpanded"
                  v-model="composeTitle"
                  type="text"
                  :placeholder="t('compose.titlePlaceholder')"
                  class="mb-1 w-full border-0 bg-transparent px-0 py-0.5 text-base font-medium outline-none placeholder:text-base-content/35 focus:ring-0"
                  :disabled="submitting"
                  @input="compose.markDirty"
                />

                <textarea
                  ref="contentRef"
                  v-model="composeContent"
                  :rows="inlineComposeExpanded ? 3 : 1"
                  class="w-full resize-none overflow-hidden border-0 bg-transparent px-0 py-1 text-sm leading-relaxed outline-none placeholder:text-base-content/40 focus:ring-0"
                  :class="inlineComposeExpanded ? 'min-h-20' : 'h-9 min-h-9'"
                  :placeholder="t('home.composePlaceholder')"
                  :disabled="submitting"
                  @focus="inlineComposeExpanded = true"
                  @keydown="handleInlineKeyDown"
                  @input="handleInlineContentInput"
                />

                <ComposeAttachmentGrid
                  v-if="inlineComposeExpanded"
                  class="mt-2"
                  :attachments="attachments"
                  @remove="compose.removeAttachment"
                  @move="compose.moveAttachment"
                  @insert="insertInlineAttachment"
                />

                <div
                  v-if="inlineComposeExpanded"
                  class="mt-2 flex flex-wrap items-center gap-1 border-t border-base-300/70 pt-2"
                >
                  <div class="relative" @click.stop>
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm btn-circle"
                      :title="t('compose.attach')"
                      :disabled="!currentPublisher || submitting"
                      @click="attachMenuOpen = !attachMenuOpen"
                    >
                      <IconPaperclip class="h-4 w-4" />
                    </button>
                    <div
                      v-if="attachMenuOpen"
                      class="absolute bottom-10 left-0 z-30 w-44 overflow-hidden rounded-box bg-base-100 py-1 shadow-lg ring-1 ring-base-300"
                    >
                      <button
                        type="button"
                        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-base-200"
                        @click="pickLocalFiles('image/*')"
                      >
                        <IconImage class="h-4 w-4" />
                        {{ t("compose.addPhoto") }}
                      </button>
                      <button
                        type="button"
                        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-base-200"
                        @click="pickLocalFiles('video/*')"
                      >
                        <IconVideo class="h-4 w-4" />
                        {{ t("compose.addVideo") }}
                      </button>
                      <button
                        type="button"
                        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-base-200"
                        @click="pickLocalFiles('*/*')"
                      >
                        <IconFile class="h-4 w-4" />
                        {{ t("compose.uploadFile") }}
                      </button>
                      <button
                        type="button"
                        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-base-200"
                        @click="openCloudFilePicker"
                      >
                        <IconCloud class="h-4 w-4" />
                        {{ t("compose.linkCloudFile") }}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="btn btn-ghost btn-sm btn-circle"
                    :title="t('compose.insertBold')"
                    :disabled="!currentPublisher || submitting"
                    @click="wrapInlineSelection('**', '**')"
                  >
                    <IconBold class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm btn-circle"
                    :title="t('compose.insertItalic')"
                    :disabled="!currentPublisher || submitting"
                    @click="wrapInlineSelection('_', '_')"
                  >
                    <IconItalic class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm btn-circle"
                    :title="t('compose.insertLink')"
                    :disabled="!currentPublisher || submitting"
                    @click="insertInlineLink"
                  >
                    <IconLink class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm btn-circle"
                    :title="t('compose.insertMention')"
                    :disabled="!currentPublisher || submitting"
                    @click="insertInlineAtCursor('@')"
                  >
                    <IconAtSign class="h-4 w-4" />
                  </button>

                  <select
                    v-model="visibility"
                    class="select select-ghost select-xs ml-1 w-auto max-w-28 text-xs"
                    :title="t('compose.visibility')"
                    :disabled="submitting"
                    @change="compose.markDirty"
                  >
                    <option :value="0">{{ t("compose.public") }}</option>
                    <option :value="1">{{ t("compose.friends") }}</option>
                    <option :value="2">{{ t("compose.unlisted") }}</option>
                    <option :value="3">{{ t("compose.private") }}</option>
                  </select>

                  <span class="ml-auto text-[11px] text-base-content/35">
                    {{ composeContent.length }}
                  </span>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    :disabled="submitting"
                    @click="cancelInlineCompose"
                  >
                    {{ t("compose.cancel") }}
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary btn-sm gap-1.5"
                    :disabled="!canSubmit"
                  >
                    <IconLoader
                      v-if="submitting"
                      class="h-4 w-4 animate-spin"
                    />
                    <IconSend v-else class="h-4 w-4" />
                    {{ submitting ? t("compose.posting") : t("compose.post") }}
                  </button>
                </div>

                <p
                  v-if="inlineComposeError"
                  class="mt-2 text-xs text-error"
                >
                  {{ inlineComposeError }}
                </p>
              </div>
            </form>
            <input
              ref="localFileInput"
              type="file"
              class="hidden"
              :accept="localFileAccept"
              multiple
              @change="onLocalFilesPicked"
            />
          </section>
          <CloudFileDrawer
            v-model:open="filePickerOpen"
            :allow-multiple="true"
            :crop-aspect-ratio="null"
            usage="post.attachment"
            @select="handleCloudFilesSelected"
          />

          <!-- Featured -->
          <ClientOnly>
            <FeaturedPostsCarousel
              class="border-b border-base-300/80"
              @boost="handleBoost"
              @share="handleShare"
              @reply="handleReply"
            />
          </ClientOnly>

          <!-- Loading -->
          <div
            v-if="
              (status === 'pending' || status === 'idle') &&
              timelineEvents.length === 0
            "
            class="flex justify-center py-16"
          >
            <ConfuseSpinner :message="t('home.loadingPosts')" />
          </div>

          <!-- Error -->
          <div
            v-else-if="error"
            class="flex flex-col items-center gap-3 px-4 py-12 text-center"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-error/10 text-error"
            >
              <IconAlertCircle class="h-5 w-5" />
            </div>
            <p class="max-w-sm text-sm text-base-content/70">
              {{ t("home.loadFailed", { error: String(error) }) }}
            </p>
            <button class="btn btn-sm btn-ghost" @click="refreshTimeline">
              {{ t("common.retry") }}
            </button>
          </div>

          <!-- Empty -->
          <div
            v-else-if="status !== 'pending' && timelineEvents.length === 0"
            class="flex flex-col items-center gap-2 px-4 py-14 text-center"
          >
            <p class="text-sm font-medium text-base-content/75">
              {{ t("home.emptyTitle") }}
            </p>
            <p class="max-w-xs text-xs leading-relaxed text-base-content/45">
              {{ t("home.emptyDesc") }}
            </p>
            <button
              class="btn btn-sm btn-ghost mt-1"
              @click="refreshTimeline"
            >
              {{ t("common.refresh") }}
            </button>
          </div>

          <!-- Events (divided list) -->
          <div
            v-if="timelineEvents.length > 0"
            class="divide-y divide-base-300/80"
          >
            <TimelineEventRenderer
              v-for="event in timelineEvents"
              :key="event.id"
              :event="event"
              @boost="handleBoost"
              @share="handleShare"
              @reply="handleReply"
            />
          </div>

          <!-- Footer / infinite scroll -->
          <div
            ref="loadMoreSentinel"
            class="feed-footer"
          >
            <div
              v-if="fetchingMore"
              class="flex items-center gap-2 text-xs text-base-content/45"
            >
              <span class="loading loading-spinner loading-xs" />
              <span>{{ t("common.loading") }}</span>
            </div>
            <button
              v-else-if="hasMore && timelineEvents.length > 0"
              type="button"
              class="btn btn-ghost btn-sm text-base-content/55"
              :disabled="fetchingMore"
              @click="loadMore"
            >
              {{ t("common.loadMore") }}
            </button>
            <p
              v-else-if="!hasMore && timelineEvents.length > 0"
              class="text-xs text-base-content/35"
            >
              {{ t("common.noMore") }}
            </p>
          </div>
        </div>
      </div>

      <!-- Explore Sidebar (20rem rail) -->
      <aside class="feed-sidebar">
        <ExploreSidebar />
      </aside>
    </div>


  </NuxtLayout>
</template>

<script setup lang="ts">
import type { ComposeAttachment } from "~/composables/useCompose";
import type { SnCloudFile } from "~/types/drive";
import type {
  FileAttachment,
  Post,
  Publisher,
  SnTimelineEvent,
} from "~/types/post";
import { API_BASE_URL, fetchJson, fetchTimeline } from "~/utils/api";
import { getFileUrl } from "~/utils/files";
import { getValidToken } from "~/utils/token";
import {
  IconAlertCircle,
  IconAtSign,
  IconBold,
  IconCloud,
  IconFile,
  IconImage,
  IconItalic,
  IconLink,
  IconLoader,
  IconPaperclip,
  IconSend,
  IconVideo,
  IconX,
} from "#components";
import { useIntersectionObserver } from "@vueuse/core";

const { t } = useI18n();

const seoTitle = computed(() => t("home.seoTitle"));
const seoDescription = computed(() => t("home.seoDescription"));

defineOgImage("UniOgImage", {
  title: seoTitle,
  description: seoDescription,
});

useSolarSeo({
  title: t("home.seoTitle"),
  description: t("home.seoDescription"),
  url: "https://solian.app",
  breadcrumbs: [{ name: "Home", item: "https://solian.app" }],
});

const auth = useAuth();
const { isAuthenticated, user } = auth;

const PAGE_SIZE = 20;
const MAX_RETRY_ATTEMPTS = 1;
const RETRY_ADJUSTMENT_MS = 10_000;

const timelineEvents = useState<SnTimelineEvent[]>("home-timeline", () => []);
const cursor = ref<string | null>(null);
const timelineMode = ref("personalized");
const hasMore = ref(true);
const fetchingMore = ref(false);
const loadMoreSentinel = ref<HTMLElement | null>(null);

const userName = computed(() => user.value?.nick || user.value?.name || "");
const userAvatar = computed(() => getFileUrl(user.value?.profile?.picture?.id));
const userInitials = computed(() => {
  const name = user.value?.name || "?";
  return name.slice(0, 2).toUpperCase();
});

const compose = useCompose();
const {
  title: composeTitle,
  content: composeContent,
  attachments,
  currentPublisher,
  publishers,
  submitting,
  canSubmit,
  visibility,
  language,
  tags,
  categories,
  replyingTo,
} = compose;
const inlineComposeExpanded = ref(false);
const inlineComposeError = ref("");
const publisherPickerOpen = ref(false);
const attachMenuOpen = ref(false);
const filePickerOpen = ref(false);
const localFileAccept = ref("*/*");
const contentRef = ref<HTMLTextAreaElement | null>(null);
const localFileInput = ref<HTMLInputElement | null>(null);
const publisherAvatar = computed(
  () => getFileUrl(currentPublisher.value?.picture?.id) || userAvatar.value,
);
const publisherInitials = computed(() =>
  getPublisherInitials(currentPublisher.value?.nick || userName.value || "?"),
);
onMounted(() => {
  if (isAuthenticated.value && publishers.value.length === 0) {
    void loadComposePublishers();
  }
});

async function loadComposePublishers() {
  try {
    const response = await fetchJson<Publisher[]>(
      "/sphere/publishers?mine=true&take=100",
    );
    if (response?.length) {
      compose.setPublishers(response);
    }
  } catch (error) {
    console.error("Failed to load compose publishers:", error);
  }
}
function selectInlinePublisher(publisher: Publisher) {
  compose.setCurrentPublisher(publisher);
  publisherPickerOpen.value = false;
}

function clearInlineReply() {
  replyingTo.value = undefined;
  compose.markDirty();
}

function pickLocalFiles(accept: string) {
  attachMenuOpen.value = false;
  localFileAccept.value = accept;
  if (!localFileInput.value) return;
  localFileInput.value.accept = accept;
  localFileInput.value.value = "";
  localFileInput.value.click();
}

function onLocalFilesPicked(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    compose.addAttachments(input.files);
    inlineComposeExpanded.value = true;
  }
  input.value = "";
}

function openCloudFilePicker() {
  attachMenuOpen.value = false;
  filePickerOpen.value = true;
}

function handleCloudFilesSelected(
  files: SnCloudFile | SnCloudFile[] | null,
) {
  if (!files) return;
  const fileArray = Array.isArray(files) ? files : [files];

  for (const cloudFile of fileArray) {
    const file = new File(
      [new Blob([], { type: cloudFile.mimeType })],
      cloudFile.name,
      { type: cloudFile.mimeType },
    );
    const attachmentId = compose.addAttachment(file);
    compose.setAttachmentUploaded(
      attachmentId,
      cloudFile as unknown as FileAttachment,
    );
  }

  inlineComposeExpanded.value = true;
}

function wrapInlineSelection(before: string, after: string) {
  const textarea = contentRef.value;
  if (!textarea || !currentPublisher.value) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = composeContent.value.slice(start, end) || "text";
  composeContent.value =
    composeContent.value.slice(0, start) +
    before +
    selected +
    after +
    composeContent.value.slice(end);
  compose.markDirty();

  nextTick(() => {
    textarea.focus();
    textarea.setSelectionRange(
      start + before.length,
      start + before.length + selected.length,
    );
  });
}

function insertInlineLink() {
  const textarea = contentRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = composeContent.value.slice(start, end) || "link";
  const markdown = `[${selected}](https://)`;
  composeContent.value =
    composeContent.value.slice(0, start) +
    markdown +
    composeContent.value.slice(end);
  compose.markDirty();

  nextTick(() => {
    textarea.focus();
    const urlStart = start + selected.length + 3;
    textarea.setSelectionRange(urlStart, urlStart + "https://".length);
  });
}

function insertInlineAtCursor(text: string) {
  const textarea = contentRef.value;
  if (!textarea) {
    composeContent.value += text;
    compose.markDirty();
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  composeContent.value =
    composeContent.value.slice(0, start) +
    text +
    composeContent.value.slice(end);
  compose.markDirty();

  nextTick(() => {
    textarea.focus();
    const position = start + text.length;
    textarea.setSelectionRange(position, position);
  });
}

function insertInlineAttachment(id: string) {
  const attachment = attachments.value.find((item) => item.id === id);
  if (!attachment) return;

  const fileName = attachment.cloudFile?.name || attachment.file.name;
  const fileId = attachment.cloudFile?.id || "PENDING";
  insertInlineAtCursor(`![${fileName}](solian://files/${fileId})`);
}

function handleInlineContentInput() {
  compose.markDirty();
  const textarea = contentRef.value;
  if (!textarea || !inlineComposeExpanded.value) return;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
}

function handleInlineKeyDown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    if (canSubmit.value) void submitInlinePost();
  }
}

async function uploadInlineAttachments(): Promise<ComposeAttachment[]> {
  const results: ComposeAttachment[] = [];

  for (const attachment of attachments.value) {
    if (attachment.uploaded && attachment.cloudFile) {
      results.push(attachment);
      continue;
    }

    const formData = new FormData();
    formData.append("file", attachment.file, attachment.file.name);

    const token = await getValidToken(API_BASE_URL);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    compose.updateAttachmentProgress(attachment.id, 0);
    const response = await fetch(`${API_BASE_URL}/drive/files/upload/direct`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Attachment upload failed: ${response.status}`);
    }

    const data = await response.json();
    const fileData = (data.file ||
      data.file_info ||
      data.data?.file ||
      data.data?.id && data.data ||
      data.id && data) as FileAttachment | undefined;
    if (!fileData) throw new Error("Unexpected attachment response");

    compose.setAttachmentUploaded(attachment.id, fileData);
    const uploaded = attachments.value.find(
      (item) => item.id === attachment.id,
    );
    if (uploaded) results.push(uploaded);
  }

  return results;
}

function getPublisherInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

async function submitInlinePost() {
  if (!canSubmit.value || !currentPublisher.value) return;

  inlineComposeError.value = "";
  submitting.value = true;

  try {
    const uploadedAttachments = await uploadInlineAttachments();
    const payload: Record<string, unknown> = {
      title: composeTitle.value.trim() || undefined,
      content: composeContent.value.trim(),
      visibility: visibility.value,
      language: language.value,
      tags: tags.value,
      categories: categories.value.map((category) => category.slug),
      attachments: uploadedAttachments
        .map((attachment) => attachment.cloudFile?.id)
        .filter(Boolean),
      type: 0,
    };

    if (replyingTo.value) {
      payload.replied_post_id = replyingTo.value.id;
    }

    await fetchJson<Post>(
      `/sphere/posts?pub=${encodeURIComponent(currentPublisher.value.name)}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    compose.reset();
    inlineComposeExpanded.value = false;
    await refreshTimeline();
  } catch (error) {
    console.error("Failed to submit inline post:", error);
    inlineComposeError.value = t("compose.submitFailedMessage");
  } finally {
    submitting.value = false;
  }
}

function cancelInlineCompose() {
  compose.reset();
  inlineComposeExpanded.value = false;
  inlineComposeError.value = "";
}

const {
  data: initialData,
  status,
  error,
  refresh: refreshAsyncData,
} = await useAsyncData(
  "home-timeline-fetch",
  () =>
    fetchTimeline(PAGE_SIZE, {
      aggressive: true,
    }),
  {
    // The Explore feed is personalized and not required for the initial HTML.
    // Fetch it after hydration so the document response is not blocked by the
    // timeline API.
    server: false,
    default: () => ({ items: [], nextCursor: null, mode: "personalized" }),
  },
);

watch(
  initialData,
  (data) => {
    if (data?.items) {
      timelineEvents.value = data.items;
      cursor.value = data.nextCursor;
      timelineMode.value = data.mode;
      hasMore.value = data.nextCursor !== null;
    }
  },
  { immediate: true },
);

async function fetchTimelinePage(
  pageCursor: string | null,
  retryCount = 0,
): Promise<{
  items: SnTimelineEvent[];
  nextCursor: string | null;
  mode: string;
}> {
  const result = await fetchTimeline(PAGE_SIZE, {
    cursor: pageCursor,
    mode: timelineMode.value,
    aggressive: true,
  });

  const existing = new Set(timelineEvents.value.map((e) => e.id));
  const uniqueItems = (result?.items ?? []).filter((e) => !existing.has(e.id));
  const nextCursor = result?.nextCursor ?? null;

  if (result?.mode) {
    timelineMode.value = result.mode;
  }

  if (
    uniqueItems.length === 0 &&
    nextCursor &&
    retryCount < MAX_RETRY_ATTEMPTS
  ) {
    const prev = Date.parse(nextCursor);
    if (!Number.isNaN(prev)) {
      const adjusted = new Date(prev - RETRY_ADJUSTMENT_MS).toISOString();
      return fetchTimelinePage(adjusted, retryCount + 1);
    }
  }

  return {
    items: uniqueItems,
    nextCursor,
    mode: result?.mode ?? timelineMode.value,
  };
}

const sentinelVisible = ref(false);

function loadMoreIfSentinelVisible() {
  if (
    sentinelVisible.value &&
    hasMore.value &&
    !fetchingMore.value &&
    timelineEvents.value.length > 0 &&
    cursor.value
  ) {
    void loadMore();
  }
}

async function loadMore() {
  if (!hasMore.value || fetchingMore.value || !cursor.value) return;
  fetchingMore.value = true;

  try {
    const result = await fetchTimelinePage(cursor.value);

    if (result.items.length === 0) {
      hasMore.value = result.nextCursor !== null;
      cursor.value = result.nextCursor;
      if (!result.nextCursor) hasMore.value = false;
      return;
    }

    timelineEvents.value = [...timelineEvents.value, ...result.items];
    cursor.value = result.nextCursor;
    hasMore.value = result.nextCursor !== null;
  } catch (e) {
    console.error("Failed to load more timeline events:", e);
  } finally {
    fetchingMore.value = false;
    if (
      sentinelVisible.value &&
      hasMore.value &&
      cursor.value &&
      timelineEvents.value.length > 0
    ) {
      await nextTick();
      loadMore();
    }
  }
}

async function refreshTimeline() {
  cursor.value = null;
  hasMore.value = true;
  await refreshAsyncData();
}

useIntersectionObserver(
  loadMoreSentinel,
  ([{ isIntersecting }]) => {
    sentinelVisible.value = isIntersecting;
    loadMoreIfSentinelVisible();
  },
  { rootMargin: "240px" },
);

// The sentinel can be in view while the initial page is still loading. In
// that case IntersectionObserver does not fire again when the events render,
// so re-check once the list changes.
watch(
  [sentinelVisible, () => timelineEvents.value.length],
  loadMoreIfSentinelVisible,
  { flush: "post" },
);

function handleReply(post: Post) {
  compose.initializeFromState({
    content: "",
    replyingTo: post,
  });
  inlineComposeExpanded.value = true;
}
</script>
