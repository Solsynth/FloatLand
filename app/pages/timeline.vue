<template>
  <NuxtLayout name="app">
    <div class="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div class="min-w-0">
        <!--
          The feed header is the only chrome above the list: which shelf you are
          reading, and how it is ordered. Both are chip rows so they weigh the
          same as a tag, and neither competes with the posts below.
        -->
        <div class="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="tab in timelineFilterTabs"
              :key="tab.value ?? 'explore'"
              type="button"
              class="chip"
              :class="timelineFilter === tab.value ? 'chip-active' : ''"
              :aria-pressed="timelineFilter === tab.value"
              @click="changeTimelineFilter(tab.value)"
            >
              <component :is="tab.icon" class="size-3 shrink-0" aria-hidden="true" />
              {{ tab.label }}
            </button>
          </div>

          <div v-if="timelineFilter === null" class="flex items-center gap-2">
            <IconSlidersHorizontal class="size-3.5 shrink-0 text-faint" aria-hidden="true" />
            <label class="eyebrow" for="ranking-mode">{{ t("home.rankingMode") }}</label>
            <select
              id="ranking-mode"
              :value="timelineMode"
              class="select select-xs w-auto border-line bg-transparent text-2xs text-dim"
              @change="changeTimelineMode"
            >
              <option v-for="mode in timelineModes" :key="mode.value" :value="mode.value">
                {{ mode.label }}
              </option>
            </select>
          </div>
        </div>

        <ConsolePanel flush>
          <LoadingSkeleton
            v-if="(status === 'pending' || status === 'idle') && timelineEvents.length === 0"
            variant="feed"
            :rows="5"
          />

          <div v-else-if="error" class="px-6 py-10 text-center">
            <p class="note note-error mx-auto max-w-md">
              {{ t("home.loadFailed", { error: String(error) }) }}
            </p>
            <button class="btn btn-quiet btn-xs mt-3" @click="refreshTimeline">
              {{ t("common.retry") }}
            </button>
          </div>

          <div v-else-if="timelineEvents.length === 0" class="px-6 py-14 text-center">
            <p class="text-sm font-semibold text-base-content">{{ t("home.emptyTitle") }}</p>
            <p class="voice mx-auto mt-1.5 max-w-xs text-[13px]">{{ t("home.emptyDesc") }}</p>
            <button class="btn btn-quiet btn-xs mt-4" @click="refreshTimeline">
              {{ t("common.refresh") }}
            </button>
          </div>

          <div v-else>
            <TimelineEventRenderer
              v-for="event in timelineEvents"
              :key="event.id"
              :event="event"
              @boost="handleBoost"
              @share="handleShare"
              @reply="handleReply"
            />
          </div>

          <div
            ref="loadMoreSentinel"
            class="flex flex-col items-center justify-center gap-2 border-t border-line-soft px-6 py-5"
          >
            <div v-if="fetchingMore" class="flex items-center gap-2 text-2xs text-faint">
              <span class="dot animate-pulse bg-primary" aria-hidden="true" />
              {{ t("common.loading") }}
            </div>
            <button
              v-else-if="hasMore && timelineEvents.length > 0"
              type="button"
              class="btn btn-quiet btn-xs"
              :disabled="fetchingMore"
              @click="loadMore"
            >
              {{ t("common.loadMore") }}
            </button>
            <p v-else-if="timelineEvents.length > 0" class="mono-id">
              {{ t("common.noMore") }}
            </p>
          </div>
        </ConsolePanel>
      </div>

      <!--
        The rail holds what a reader reaches *for* while scrolling: a way to
        look something up, a way to post, and the shelves that are not the one
        already open.
      -->
      <aside class="hidden min-w-0 lg:block">
        <div class="sticky top-20 flex flex-col gap-4">
          <NuxtLink to="/search" class="block">
            <TextField
              :model-value="''"
              :placeholder="t('common.search')"
              :aria-label="t('common.search')"
              suffix-icon="IconSearch"
              bare
              readonly
              class="pointer-events-none"
            />
          </NuxtLink>

          <section v-if="isAuthenticated" class="plate p-4">
            <form class="flex items-start gap-2.5" @submit.prevent="submitInlinePost">
              <button
                type="button"
                class="shrink-0"
                :title="t('compose.selectPublisher')"
                :aria-label="t('compose.selectPublisher')"
                @click="publisherModalOpen = true"
              >
                <UserAvatar
                  :picture-id="currentPublisher?.picture?.id ?? userAvatar?.id"
                  :name="currentPublisher?.nick || userName"
                  size="md"
                />
              </button>

              <div class="min-w-0 flex-1">
                <div
                  v-if="replyingTo"
                  class="mb-2 flex items-center gap-2 rounded-chip border border-line bg-base-200/60 px-2.5 py-1.5 text-2xs"
                >
                  <span class="shrink-0 text-faint">{{ t("compose.replyingTo") }}</span>
                  <span class="min-w-0 flex-1 truncate text-dim">{{ replyingTo.content }}</span>
                  <button
                    type="button"
                    class="shrink-0 text-faint transition-colors hover:text-base-content"
                    :aria-label="t('compose.cancel')"
                    @click="clearInlineReply"
                  >
                    <IconX class="size-3.5" aria-hidden="true" />
                  </button>
                </div>

                <input
                  v-if="inlineComposeExpanded"
                  v-model="composeTitle"
                  type="text"
                  :placeholder="t('compose.titlePlaceholder')"
                  class="mb-1 w-full border-0 bg-transparent px-0 py-0.5 text-sm font-semibold text-base-content outline-none placeholder:text-faint"
                  :disabled="submitting"
                  @input="compose.markDirty"
                >

                <textarea
                  ref="contentRef"
                  v-model="composeContent"
                  :rows="inlineComposeExpanded ? 3 : 1"
                  class="w-full resize-none overflow-hidden border-0 bg-transparent px-0 py-1 text-[13px] leading-relaxed text-base-content outline-none placeholder:text-faint"
                  :class="inlineComposeExpanded ? 'min-h-20' : 'h-7 min-h-7'"
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

                <div v-if="inlineComposeExpanded" class="mt-2 flex flex-wrap items-center gap-1">
                  <div class="relative">
                    <button
                      type="button"
                      class="btn btn-quiet btn-xs px-1.5"
                      :title="t('compose.attach')"
                      :disabled="!currentPublisher || submitting"
                      @click="attachMenuOpen = !attachMenuOpen"
                    >
                      <IconPaperclip class="size-3.5" aria-hidden="true" />
                    </button>
                    <div
                      v-if="attachMenuOpen"
                      class="absolute bottom-8 left-0 z-30 w-44 rounded-card border border-line bg-base-200 py-1"
                    >
                      <button
                        v-for="item in attachOptions"
                        :key="item.key"
                        type="button"
                        class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-2xs text-dim transition-colors hover:bg-base-300 hover:text-base-content"
                        @click="item.run()"
                      >
                        <component :is="item.icon" class="size-3.5 shrink-0" aria-hidden="true" />
                        {{ t(item.labelKey) }}
                      </button>
                    </div>
                  </div>

                  <select
                    v-model="visibility"
                    class="select select-xs ml-1 w-auto max-w-28 border-line bg-transparent text-2xs text-dim"
                    :title="t('compose.visibility')"
                    :disabled="submitting"
                    @change="compose.markDirty"
                  >
                    <option :value="0">{{ t("compose.public") }}</option>
                    <option :value="1">{{ t("compose.friends") }}</option>
                    <option :value="2">{{ t("compose.unlisted") }}</option>
                    <option :value="3">{{ t("compose.private") }}</option>
                  </select>

                  <span class="mono-id ml-auto">{{ composeContent.length }}</span>

                  <button
                    type="button"
                    class="btn btn-quiet btn-xs"
                    :disabled="submitting"
                    @click="cancelInlineCompose"
                  >
                    {{ t("compose.cancel") }}
                  </button>
                  <button type="submit" class="btn btn-primary btn-xs" :disabled="!canSubmit">
                    {{ submitting ? t("compose.posting") : t("compose.post") }}
                  </button>
                </div>

                <p v-if="inlineComposeError" class="note note-error mt-2">{{ inlineComposeError }}</p>
              </div>
            </form>

            <input
              ref="localFileInput"
              type="file"
              class="hidden"
              :accept="localFileAccept"
              multiple
              @change="onLocalFilesPicked"
            >
          </section>

          <ExploreDiscovery />
        </div>
      </aside>

      <CloudFileDrawer
        v-model:open="filePickerOpen"
        :allow-multiple="true"
        :crop-aspect-ratio="null"
        usage="post.attachment"
        @select="handleCloudFilesSelected"
      />

      <ClientOnly>
        <PublisherSelectorModal
          v-model:open="publisherModalOpen"
          :publishers="publishers"
          :current-publisher-id="currentPublisher?.id ?? null"
          @select="selectInlinePublisher"
        />
      </ClientOnly>
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
import { fetchJson, fetchTimeline } from "~/utils/api";
import { getInitials } from "~/utils/identity";
import {
  IconCloud,
  IconCompass,
  IconFile,
  IconImage,
  IconPaperclip,
  IconRss,
  IconSlidersHorizontal,
  IconUsers,
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
  url: "https://solian.app/timeline",
  breadcrumbs: [{ name: "Timeline", item: "https://solian.app/timeline" }],
});

const auth = useAuth();
const { isAuthenticated, user } = auth;

const PAGE_SIZE = 20;

const timelineEvents = useState<SnTimelineEvent[]>("home-timeline", () => []);
const cursor = ref<string | null>(null);
const timelineMode = ref("personalized");
const timelineFilter = ref<string | null>(null);
const hasMore = ref(true);
const fetchingMore = ref(false);
const loadMoreSentinel = ref<HTMLElement | null>(null);

// Ranking modes and feed filters, matching the Solian explore screen
// (explore.dart: _RankingToolbar / filter tabs).
const timelineModes = computed(() => [
  { value: "personalized", label: t("home.modePersonalized") },
  { value: "top", label: t("home.modeTop") },
  { value: "latest", label: t("home.modeLatest") },
]);

const timelineFilterTabs = computed(() => [
  { value: null, label: t("home.filterExplore"), icon: IconCompass },
  { value: "subscriptions", label: t("home.filterSubscriptions"), icon: IconRss },
  { value: "friends", label: t("home.filterFriends"), icon: IconUsers },
]);

function changeTimelineMode(event: Event) {
  timelineMode.value = (event.target as HTMLSelectElement).value;
  cursor.value = null;
  hasMore.value = true;
  void refreshAsyncData();
}

function changeTimelineFilter(filter: string | null) {
  timelineFilter.value = filter;
  cursor.value = null;
  hasMore.value = true;
  void refreshAsyncData();
}

const userAvatar = computed(() => user.value?.profile?.picture ?? null);
const userName = computed(() => user.value?.nick || user.value?.name || "");

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
const publisherModalOpen = ref(false);
const attachMenuOpen = ref(false);
const filePickerOpen = ref(false);
const localFileAccept = ref("*/*");
const contentRef = ref<HTMLTextAreaElement | null>(null);
const localFileInput = ref<HTMLInputElement | null>(null);

const publisherInitials = computed(() =>
  getInitials(currentPublisher.value?.nick || userName.value || "?"),
);

// The attach menu is one list, so the buttons and the options that call them
// cannot drift apart as the set of sources changes.
const attachOptions = [
  { key: "photo", icon: IconImage, labelKey: "compose.addPhoto", run: () => pickLocalFiles("image/*") },
  { key: "video", icon: IconVideo, labelKey: "compose.addVideo", run: () => pickLocalFiles("video/*") },
  { key: "file", icon: IconFile, labelKey: "compose.uploadFile", run: () => pickLocalFiles("*/*") },
  { key: "cloud", icon: IconCloud, labelKey: "compose.linkCloudFile", run: openCloudFilePicker },
];

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

    compose.updateAttachmentProgress(attachment.id, 0);
    // Same-origin proxy upload; the browser sends the `sid` cookie.
    const response = await fetch(`/cgi/drive/files/upload/direct`, {
      method: "POST",
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
      mode: timelineMode.value,
      filter: timelineFilter.value ?? undefined,
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
      cursor.value = nextCursorFrom(data.items);
      timelineMode.value = data.mode;
      hasMore.value = cursor.value !== null;
    }
  },
  { immediate: true },
);

/**
 * Cursor for the page after `items`: the oldest event `createdAt`.
 *
 * The timeline API's cursor is an exclusive `created_at` cut and pages come
 * back newest-first, so the minimum `createdAt` of a page continues the feed
 * with no skips and no duplicates. Deriving it locally keeps pagination
 * independent of the server-provided `nextCursor` (which is the same value,
 * so nothing is lost).
 *
 * The raw string is returned rather than a re-serialized date: API timestamps
 * carry microsecond precision, and `toISOString()` would floor them to
 * milliseconds, silently dropping events inside that sub-millisecond window.
 */
function nextCursorFrom(items: SnTimelineEvent[]): string | null {
  let oldestTime = Number.POSITIVE_INFINITY;
  let oldest = "";
  for (const item of items) {
    const timestamp = Date.parse(item.createdAt);
    // `<=` matters: microseconds are below `Date.parse` resolution, and on a
    // newest-first page the later entry of an equal-millisecond pair carries
    // the smaller (exact) timestamp, which is the safe cut.
    if (!Number.isNaN(timestamp) && timestamp <= oldestTime) {
      oldestTime = timestamp;
      oldest = item.createdAt;
    }
  }
  return oldest || null;
}

async function fetchTimelinePage(pageCursor: string | null): Promise<{
  items: SnTimelineEvent[];
  nextCursor: string | null;
}> {
  const result = await fetchTimeline(PAGE_SIZE, {
    cursor: pageCursor,
    mode: timelineMode.value,
    filter: timelineFilter.value ?? undefined,
    aggressive: true,
  });

  if (result?.mode) {
    timelineMode.value = result.mode;
  }

  const items = result?.items ?? [];
  const nextCursor = nextCursorFrom(items);

  // A cursor must move strictly backwards. If the API echoes the cursor back
  // (it ignored the cut), end the feed instead of letting the infinite-scroll
  // observer spin on an unchanging cursor. Compared as strings: `Date.parse`
  // only resolves to milliseconds, so timestamps a few microseconds apart
  // would falsely read as "no progress" and truncate the feed.
  if (nextCursor && nextCursor === pageCursor) {
    return { items: [], nextCursor: null };
  }

  // Transparently skip pages that contain no post events (presence/status/
  // discovery only) so they never advance or end pagination — same behavior
  // as the Solian timeline pod (posts_pod.dart:266-269).
  const hasPosts = items.some((e) => e.type.startsWith("posts.new"));
  if (!hasPosts && nextCursor) {
    return fetchTimelinePage(nextCursor);
  }

  const existing = new Set(timelineEvents.value.map((e) => e.id));
  const uniqueItems = items.filter((e) => !existing.has(e.id));

  return { items: uniqueItems, nextCursor };
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

    cursor.value = result.nextCursor;
    hasMore.value = result.nextCursor !== null;
    if (result.items.length > 0) {
      timelineEvents.value = [...timelineEvents.value, ...result.items];
    }
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
function handleBoost(_post: Post) {
  // PostCard performs the boost API call and keeps its own optimistic
  // count; nothing to do at the feed level (a full refetch would jump the
  // scroll position).
}

function handleShare(post: Post) {
  const url = `${window.location.origin}/posts/${post.id}`;
  if (navigator.share) {
    navigator.share({
      title: post.title || t("home.sharePostFallbackTitle"),
      text: post.content.slice(0, 100),
      url,
    });
  } else {
    navigator.clipboard.writeText(url);
  }
}
</script>
