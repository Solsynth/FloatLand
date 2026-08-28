<template>
  <article :class="rootClass">
    <div :class="bodyClass">
      <!-- Reference post (reply / forward) -->
      <div v-if="showReference && hasReference" class="mb-2">
        <button
          type="button"
          class="flex w-full items-center gap-1.5 text-left text-xs font-medium text-base-content/50 transition-colors hover:text-base-content/70"
          :aria-expanded="!referenceCollapsed"
          @click.stop="referenceCollapsed = !referenceCollapsed"
        >
          <IconReply v-if="referenceIsReply" class="h-3.5 w-3.5" />
          <IconForward v-else class="h-3.5 w-3.5" />
          <span>{{ referenceIsReply ? "Replied to" : "Forwarded" }}</span>
          <IconChevronDown
            class="ml-auto h-3.5 w-3.5 transition-transform"
            :class="{ 'rotate-180': referenceCollapsed }"
          />
        </button>

        <div
          v-if="!referenceCollapsed && referencePost"
          class="mt-2 grid grid-cols-[40px_1fr] gap-3"
        >
          <div class="flex flex-col items-center">
            <PublisherAvatar
              :publisher="referencePost.publisher"
              size="sm"
              linked
              @click.stop
            />
            <div class="mt-1 min-h-2 w-px flex-1 bg-base-300/80" />
          </div>

          <div class="min-w-0 cursor-pointer pb-2" @click.stop="navigateToReference">
            <div class="mb-1 flex min-h-7 items-center gap-2">
              <AccountName
                :account="referencePost.publisher.account || referencePost.publisher"
                :text-override="getDisplayName(referencePost.publisher)"
                size="sm"
                hide-verification-mark
              />
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div
              v-if="referencePost.content"
              class="prose prose-xs line-clamp-3 max-w-none break-words text-xs prose-a:text-primary prose-a:no-underline prose-headings:mb-1 prose-headings:mt-1 prose-p:my-0.5"
              v-html="renderedReferenceContent"
            />
            <div
              v-if="referencePost.isTruncated"
              class="mt-1 inline-flex items-center gap-1 text-xs italic text-base-content/50"
            >
              <IconEllipsis class="h-3 w-3" />
              <span>Post truncated</span>
            </div>
                      </div>
        </div>
        <div
          v-if="!referenceCollapsed && referencePost && referencePost.attachments.length > 0"
          class="mt-1 inline-flex items-center gap-1 text-xs text-base-content/50"
        >
          <IconPaperclip class="h-3 w-3" />
          <span>{{ referencePost.attachments.length }} attachment(s)</span>
        </div>
      </div>

      <!-- Header -->
      <div class="flex items-start gap-3">
        <PublisherAvatar :publisher="post.publisher" size="md" linked @click.stop />

        <div class="min-w-0 flex-1">
          <div class="flex min-w-0 items-center gap-1.5">
            <NuxtLink
              v-if="post.publisher"
              :to="`/publishers/${post.publisher.name}`"
              class="hover:underline"
              @click.stop
            >
              <AccountName
                :account="post.publisher.account || post.publisher"
                :text-override="getDisplayName(post.publisher)"
                size="sm"
              />
            </NuxtLink>
            <span v-else class="truncate text-sm font-semibold leading-tight">
              {{ getDisplayName(post.publisher) }}
            </span>

            <template v-if="post.realm">
              <IconChevronRight class="h-3 w-3 shrink-0 text-base-content/40" />
              <NuxtLink
                :to="`/realms/${post.realm.slug}`"
                class="flex items-center gap-1 truncate text-xs text-base-content/60 hover:underline"
                @click.stop
              >
                <span>{{ post.realm.name }}</span>
              </NuxtLink>
            </template>
          </div>

          <div class="flex items-center gap-2 text-xs text-base-content/40">
            <span>{{ formatDate(post.publishedAt, isDetail) }}</span>
            <span v-if="hasEdits" class="flex items-center gap-0.5">
              <IconPenLine class="h-3 w-3" />
              edited
            </span>
          </div>
        </div>

        <!-- Menu -->
        <div ref="menuWrapper" class="relative shrink-0">
          <button
            class="btn btn-circle btn-ghost btn-sm"
            aria-label="Post options"
            @click.stop="showMenu = !showMenu"
          >
            <IconMoreHorizontal class="h-5 w-5" />
          </button>
          <div
            v-if="showMenu"
            class="absolute top-full right-0 z-50 mt-1"
            role="menu"
            @click.stop
          >
            <ul class="menu w-48 rounded-box bg-base-100 shadow-lg">
              <li v-if="isAuthor">
                <button @click.stop="handleEdit">
                  <IconPencil class="h-4 w-4" /> Edit
                </button>
              </li>
              <li v-if="isAuthor">
                <button class="text-error" @click.stop="handleDelete">
                  <IconTrash class="h-4 w-4" /> Delete
                </button>
              </li>
              <li v-if="isAuthor"><div class="divider my-0" /></li>
              <li>
                <button @click.stop="handleReply">
                  <IconReply class="h-4 w-4" /> Reply
                </button>
              </li>
              <li>
                <button @click.stop="handleForward">
                  <IconForward class="h-4 w-4" /> Forward
                </button>
              </li>
              <li><div class="divider my-0" /></li>
              <li>
                <button @click.stop="handleCopyLink">
                  <IconLink class="h-4 w-4" /> Copy link
                </button>
              </li>
              <li>
                <button @click.stop="handleShare">
                  <IconShare class="h-4 w-4" /> Share
                </button>
              </li>
              <li><div class="divider my-0" /></li>
              <li>
                <button @click.stop="handleReport">
                  <IconFlag class="h-4 w-4" /> Report
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Article card (list view) -->
      <div
        v-if="isArticle && !isDetail"
        class="mt-2 overflow-hidden rounded-lg border border-base-300/70 bg-base-200/40"
      >
        <NuxtLink
          :to="`/posts/${post.id}`"
          class="block transition-colors hover:bg-base-200/50"
        >
          <div v-if="thumbnailUrl" class="aspect-video w-full overflow-hidden">
            <img
              :src="thumbnailUrl"
              :alt="post.title || 'Article thumbnail'"
              class="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div class="p-3">
            <div class="badge badge-primary badge-sm mb-2">Article</div>
            <h3 v-if="post.title" class="line-clamp-2 text-base font-bold">
              {{ post.title }}
            </h3>
            <p
              v-if="post.description"
              class="mt-1 line-clamp-2 text-sm text-base-content/70"
            >
              {{ post.description }}
            </p>
          </div>
        </NuxtLink>
      </div>

      <!-- Body -->
      <div v-if="!isArticle || isDetail" class="mt-2">
        <div v-if="isArticle && isDetail" class="mb-3">
          <div class="badge badge-primary badge-sm mb-2">Article</div>
          <h3 v-if="post.title" class="text-xl font-bold">
            {{ post.title }}
          </h3>
          <p v-if="post.description" class="mt-2 text-base text-base-content/70">
            {{ post.description }}
          </p>
        </div>
        <h3 v-else-if="post.title" class="mb-2 line-clamp-2 text-base font-bold">
          {{ post.title }}
        </h3>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          class="prose prose-sm max-w-none break-words prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:break-all prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:italic prose-code:bg-base-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-primary prose-headings:mb-2 prose-headings:mt-4 prose-ol:my-1.5 prose-p:my-1.5 prose-pre:bg-base-200 prose-pre:overflow-x-auto prose-pre:text-sm prose-ul:my-1.5"
          :class="{ 'prose-lg': isArticle && isDetail }"
          @click="handleMarkdownClick"
          v-html="renderedContent"
        />
      </div>

      <AttachmentGrid
        v-if="!isArticle && post.attachments.length > 0"
        :attachments="post.attachments"
      />

      <div v-if="post.tags.length > 0" class="mt-3 flex flex-wrap gap-1.5">
        <NuxtLink
          v-for="tag in displayTags"
          :key="tag.id"
          :to="`/tags/${tag.slug}`"
          class="badge badge-ghost badge-sm transition-colors hover:badge-primary"
          @click.stop
        >
          {{ tag.name ?? "#" + tag.slug }}
        </NuxtLink>
        <span
          v-if="!isDetail && post.tags.length > 3"
          class="badge badge-ghost badge-sm opacity-60"
        >
          +{{ post.tags.length - 3 }}
        </span>
      </div>

      <!-- Embeds -->
      <div v-if="embeds.length > 0" class="mt-3 space-y-2">
        <div v-for="(embed, idx) in embeds" :key="idx">
          <button
            v-if="getEmbedType(embed) === 'link'"
            type="button"
            class="w-full cursor-pointer overflow-hidden rounded-lg border border-base-300/70 bg-base-200/40 text-left transition-colors hover:bg-base-200/65"
            @click.stop="openExternal(getEmbedUrl(embed)!)"
          >
            <div
              v-if="getEmbedImage(embed)"
              class="aspect-video w-full overflow-hidden rounded-t-xl"
            >
              <img
                :src="resolveAssetUrl(getEmbedUrl(embed)!, getEmbedImage(embed)!)"
                :alt="getEmbedTitle(embed) || 'Link preview'"
                class="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div class="card-body gap-1 p-3">
              <div class="flex items-center gap-2 text-xs text-base-content/60">
                <img
                  v-if="getEmbedFavicon(embed)"
                  :src="resolveAssetUrl(getEmbedUrl(embed)!, getEmbedFavicon(embed)!)"
                  alt="Site icon"
                  class="h-4 w-4 rounded object-cover"
                  loading="lazy"
                />
                <IconLink v-else class="h-3.5 w-3.5" />
                <span class="truncate">
                  {{ getEmbedSiteName(embed) || getHost(getEmbedUrl(embed)!) }}
                </span>
                <IconExternalLink class="ml-auto h-3.5 w-3.5" />
              </div>
              <div v-if="getEmbedTitle(embed)" class="line-clamp-2 text-sm font-semibold">
                {{ getEmbedTitle(embed) }}
              </div>
              <div
                v-if="getEmbedDescription(embed)"
                class="line-clamp-2 text-xs text-base-content/75"
              >
                {{ getEmbedDescription(embed) }}
              </div>
            </div>
          </button>

          <div
            v-else-if="getEmbedType(embed) === 'poll'"
            class="rounded-lg border border-base-300/70 bg-base-200/40"
          >
            <div class="p-3">
              <div class="flex items-center gap-2 text-sm font-medium">
                <IconVote class="h-4 w-4" /> Poll
              </div>
              <div v-if="getEmbedTitle(embed)" class="text-sm text-base-content/80">
                {{ getEmbedTitle(embed) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Metadata -->
      <div
        v-if="metadataItems.length > 0"
        class="mt-2 flex flex-wrap items-center gap-2 text-xs text-base-content/50"
      >
        <span
          v-for="(item, idx) in metadataItems"
          :key="idx"
          class="inline-flex items-center gap-1"
        >
          <component :is="item.icon" class="h-3.5 w-3.5" />
          <span>{{ item.label }}</span>
        </span>
      </div>

      <PostReactionList
        :reactions="formattedReactions"
        :post-id="post.id"
        class="mt-2"
        @react="handleReact"
        @remove="handleRemoveReaction"
      />

      <PostReplyPreview
        v-if="!isDetail && post.repliesCount > 0"
        :post-id="post.id"
        :total-replies="post.repliesCount"
        class="mt-2"
        @reply="handleReply"
        @boost="handleBoost"
      />

      <!-- Actions -->
      <div
        class="mt-3 flex items-center justify-between"
        :class="isFeed ? 'pt-2' : 'border-t border-base-200 pt-3'"
      >
        <div class="flex items-center gap-0.5">
          <button
            class="btn btn-ghost btn-sm gap-1.5 !pl-0 text-base-content/60 hover:bg-primary/10 hover:text-primary"
            @click.stop="handleReply"
          >
            <IconMessageCircle class="h-4 w-4" />
            <span class="text-xs tabular-nums">{{ formatNumber(post.repliesCount) }}</span>
          </button>
          <button
            class="btn btn-ghost btn-sm gap-1.5 text-base-content/60 hover:bg-success/10 hover:text-success"
            :class="{ 'text-success': hasBoosted }"
            @click.stop="handleBoost"
          >
            <IconRepeat2 class="h-4 w-4" />
            <span class="text-xs tabular-nums">{{ formatNumber(post.boostCount) }}</span>
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Post } from "~/types/post";
import { getFileUrl } from "~/utils/files";
import { renderMarkdown } from "~/utils/markdown";
import { getDisplayName } from "~/utils/identity";
import {
  IconMessageCircle,
  IconRepeat2,
  IconMoreHorizontal,
  IconShare,
  IconFlag,
  IconPaperclip,
  IconPenLine,
  IconPencil,
  IconTrash,
  IconExternalLink,
  IconVote,
  IconUsers,
  IconEyeOff,
  IconLock,
} from "#components";

interface EmbedItem {
  type?: string;
  [key: string]: unknown;
}

interface Props {
  post: Post;
  isDetail?: boolean;
  showReference?: boolean;
  /** Nested card chrome (e.g. featured carousel) */
  embedded?: boolean;
  /**
   * `card` — standalone elevated card (default)
   * `feed` — flush row for continuous timelines (no outer chrome)
   */
  variant?: "card" | "feed";
}

const props = withDefaults(defineProps<Props>(), {
  isDetail: false,
  showReference: true,
  embedded: false,
  variant: "card",
});

const isFeed = computed(() => props.variant === "feed");

const rootClass = computed(() => {
  if (isFeed.value) return "feed-post";
  if (props.embedded) return "card bg-base-200 transition-shadow";
  return "card bg-base-100 shadow-sm transition-shadow hover:shadow-md";
});

const bodyClass = computed(() =>
  isFeed.value ? "px-4 py-3.5" : "card-body p-4",
);

const emit = defineEmits<{
  boost: [post: Post];
  share: [post: Post];
  reply: [post: Post];
  refresh: [];
}>();

const auth = useAuth();
const { user } = auth;
const { $toast } = useNuxtApp();

// Local optimistic reaction state
const localReactionsCount = ref<Record<string, number>>({
  ...props.post.reactionsCount,
});
const localReactionsMade = ref<Record<string, boolean>>({
  ...(props.post.reactionsMade || {}),
});

// Sync from props when they change (e.g. after parent refreshes)
watch(
  () => [props.post.reactionsCount, props.post.reactionsMade],
  () => {
    localReactionsCount.value = { ...props.post.reactionsCount };
    localReactionsMade.value = { ...(props.post.reactionsMade || {}) };
  },
);

// State
const showMenu = ref(false);
const referenceCollapsed = ref(false);
const hasBoosted = ref(false);
const menuWrapper = ref<HTMLElement | null>(null);

// Close the menu when clicking outside of it
function handleDocumentClick(e: MouseEvent) {
  if (showMenu.value && menuWrapper.value && !menuWrapper.value.contains(e.target as Node)) {
    showMenu.value = false;
  }
}

onMounted(() => document.addEventListener("click", handleDocumentClick));
onUnmounted(() => document.removeEventListener("click", handleDocumentClick));

// Check if current user is the author
const isAuthor = computed(() => {
  if (!user.value || !props.post.publisher) return false;
  return props.post.publisher.account?.id === user.value.id;
});

// Post type checks
const isArticle = computed(() => props.post.type === 1);

// Thumbnail for articles
const thumbnailUrl = computed(() => {
  const thumbnailId = props.post.meta?.thumbnail as string | undefined;
  if (!thumbnailId) return null;
  const attachment = props.post.attachments.find((a) => a.id === thumbnailId);
  return attachment ? getFileUrl(attachment.id) : null;
});

// Content
const displayContent = computed(() => {
  const content = props.post.content ?? "";
  return props.post.isTruncated ? `${content}...` : content;
});
const renderedContent = computed(() => renderMarkdown(displayContent.value));

// Handle markdown element clicks
const { open: openLightbox } = useLightbox();

// Open the shared lightbox viewer for a markdown-embedded image.
function openMarkdownImage(img: HTMLImageElement) {
  const fileId = img.dataset.fileId;
  const src = img.getAttribute("src") || "";
  openLightbox([
    {
      id: fileId || src,
      name: fileId || src,
      url: src,
      mimeType: "image/*",
      hasCompression: false,
      hasThumbnail: false,
      fileMeta: {},
    },
  ]);
}

const handleMarkdownClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;

  // Handle mention chip clicks
  if (target.closest(".mention-chip")) {
    e.preventDefault();
    const href = target.closest("a")?.getAttribute("href");
    if (href) {
      navigateTo(href);
    }
    return;
  }

  // Handle spoiler toggles
  if (target.classList.contains("spoiler")) {
    target.classList.toggle("revealed");
    return;
  }

  // Let links and buttons behave natively
  if (target.closest("a") || target.closest("button")) {
    return;
  }

  // Open markdown-embedded images in the lightbox
  if (target.tagName === "IMG") {
    e.preventDefault();
    openMarkdownImage(target as HTMLImageElement);
    return;
  }

  // Respect ongoing text selection — never navigate while selecting
  const selection = window.getSelection();
  if (selection && !selection.isCollapsed) {
    return;
  }

  // Click anywhere else on the body opens the post detail page
  if (!props.isDetail) {
    navigateTo(`/posts/${props.post.id}`);
  }
};

// Reference post
const referencePost = computed(
  () => props.post.repliedPost ?? props.post.forwardedPost,
);
const hasReference = computed(() => Boolean(referencePost.value));
const referenceIsReply = computed(() => Boolean(props.post.repliedPost));
const renderedReferenceContent = computed(() => {
  if (!referencePost.value) return "";
  const content = referencePost.value.content ?? "";
  const preview = referencePost.value.isTruncated ? `${content}...` : content;
  return renderMarkdown(preview);
});

const hasEdits = computed(() => props.post.editedAt != null);

// Reactions
const formattedReactions = computed(() => {
  return Object.entries(localReactionsCount.value).map(([symbol, count]) => ({
    symbol,
    attitude: 0,
    count,
    userReacted: localReactionsMade.value[symbol] || false,
  }));
});

// Tags
const displayTags = computed(() => {
  if (props.isDetail) return props.post.tags;
  return props.post.tags.slice(0, 3);
});

// Embeds
const embeds = computed(() => {
  const raw = props.post.meta?.embeds ?? props.post.metadata?.embeds;
  if (!Array.isArray(raw)) return [];
  return raw.filter((e): e is EmbedItem => typeof e === "object" && e !== null);
});

// Metadata items
const metadataItems = computed(() => {
  const items: Array<{ icon: typeof IconFlag; label: string }> = [];

  if (props.post.visibility === 1) {
    items.push({ icon: IconUsers, label: "Friends only" });
  } else if (props.post.visibility === 2) {
    items.push({ icon: IconEyeOff, label: "Unlisted" });
  } else if (props.post.visibility === 3) {
    items.push({ icon: IconLock, label: "Private" });
  }

  if (props.post.attachments.length > 0) {
    items.push({
      icon: IconPaperclip,
      label: `${props.post.attachments.length} attachment(s)`,
    });
  }

  return items;
});

// Embed helpers
function getEmbedType(embed: EmbedItem): string {
  return typeof embed.type === "string" ? embed.type.toLowerCase() : "unknown";
}

function getEmbedString(embed: EmbedItem, keys: string[]): string | null {
  for (const key of keys) {
    const value = embed[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return null;
}

function getEmbedUrl(embed: EmbedItem): string | null {
  return getEmbedString(embed, ["url", "uri", "href"]);
}

function getEmbedTitle(embed: EmbedItem): string | null {
  return getEmbedString(embed, ["title"]);
}

function getEmbedDescription(embed: EmbedItem): string | null {
  return getEmbedString(embed, ["description"]);
}

function getEmbedSiteName(embed: EmbedItem): string | null {
  return getEmbedString(embed, ["siteName", "site_name"]);
}

function getEmbedFavicon(embed: EmbedItem): string | null {
  return getEmbedString(embed, ["faviconUrl", "favicon_url"]);
}

function getEmbedImage(embed: EmbedItem): string | null {
  return getEmbedString(embed, ["imageUrl", "image_url"]);
}

// Helpers
function getHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function resolveAssetUrl(baseUrl: string, rawUrl: string): string {
  if (rawUrl.startsWith("//")) return `https:${rawUrl}`;
  if (rawUrl.startsWith("/")) {
    try {
      const parsed = new URL(baseUrl);
      return `${parsed.protocol}//${parsed.host}${rawUrl}`;
    } catch {
      return rawUrl;
    }
  }
  return rawUrl;
}

function openExternal(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

function formatDate(dateStr: string, isDetailMode = false): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (isDetailMode) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Navigation
function navigateToReference() {
  if (referencePost.value) {
    navigateTo(`/posts/${referencePost.value.id}`);
  }
}

// Actions
function closeMenu() {
  showMenu.value = false;
}

function handleShare() {
  closeMenu();
  emit("share", props.post);
}

function handleCopyLink() {
  const url = `${window.location.origin}/posts/${props.post.id}`;
  navigator.clipboard.writeText(url);
  closeMenu();
}

function handleReply() {
  closeMenu();
  const compose = useCompose();
  compose.initializeFromState({
    content: "",
    replyingTo: props.post,
  });
  emit("reply", props.post);
  window.dispatchEvent(new CustomEvent("open-compose"));
}

function handleForward() {
  closeMenu();
  const compose = useCompose();
  compose.initializeFromState({
    content: "",
    forwardingTo: props.post,
  });
  window.dispatchEvent(new CustomEvent("open-compose"));
}

function handleEdit() {
  closeMenu();
  const compose = useCompose();
  compose.initializeFromPost(props.post);
  window.dispatchEvent(new CustomEvent("open-compose"));
}

function handleDelete() {
  closeMenu();
  // TODO: Implement delete
}

function handleReport() {
  closeMenu();
  // TODO: Implement report
}

function handleBoost() {
  hasBoosted.value = !hasBoosted.value;
  emit("boost", props.post);
}

async function handleReact(symbol: string, attitude: number) {
  // Optimistic update
  localReactionsCount.value = {
    ...localReactionsCount.value,
    [symbol]: (localReactionsCount.value[symbol] || 0) + 1,
  };
  localReactionsMade.value = { ...localReactionsMade.value, [symbol]: true };

  try {
    const { reactToPost } = await import("~/utils/api");
    await reactToPost(props.post.id, symbol, attitude);
    $toast.success("Reaction sent!");
  } catch (e) {
    // Revert on failure
    localReactionsCount.value = {
      ...localReactionsCount.value,
      [symbol]: Math.max(0, (localReactionsCount.value[symbol] || 1) - 1),
    };
    localReactionsMade.value = { ...localReactionsMade.value, [symbol]: false };
    console.error("Failed to react:", e);
    $toast.error("Failed to send reaction");
  }
}

async function handleRemoveReaction(symbol: string) {
  // Optimistic update
  const updatedCount = Math.max(0, (localReactionsCount.value[symbol] || 1) - 1);
  const { [symbol]: _, ...restCounts } = localReactionsCount.value;
  localReactionsCount.value =
    updatedCount > 0 ? { ...restCounts, [symbol]: updatedCount } : restCounts;
  localReactionsMade.value = { ...localReactionsMade.value, [symbol]: false };

  try {
    const { removeReaction } = await import("~/utils/api");
    await removeReaction(props.post.id, symbol);
    $toast.success("Reaction removed!");
  } catch (e) {
    // Revert on failure
    localReactionsCount.value = {
      ...localReactionsCount.value,
      [symbol]: (localReactionsCount.value[symbol] || 0) + 1,
    };
    localReactionsMade.value = { ...localReactionsMade.value, [symbol]: true };
    console.error("Failed to remove reaction:", e);
    $toast.error("Failed to remove reaction");
  }
}
</script>
<style scoped>
/* Pixel-perfect left alignment of footer controls with the content edge.
   DaisyUI `btn` adds 1px border-left + padding, nudging icons right of the
   prose edge. Pull them back so icon/text start exactly at content edge. */
.feed-post .btn-ghost {
  border-left: none;
  padding-left: 0;
}

/* Tag / category chips: box flush with content edge, chip padding intact. */
.feed-post .badge {
  margin-left: 0;
}
</style>
