<template>
  <article :class="rootClass">
    <div :class="bodyClass">
      <!-- Reference Post (Reply/Forward) -->
      <div v-if="showReference && hasReference" class="mb-2">
        <button
          type="button"
          class="flex w-full items-center gap-1.5 text-left text-xs font-medium text-base-content/50 hover:text-base-content/70 transition-colors"
          @click.stop="referenceCollapsed = !referenceCollapsed"
        >
          <IconReply v-if="referenceIsReply" class="h-3.5 w-3.5" />
          <IconForward v-else class="h-3.5 w-3.5" />
          <span>{{ referenceIsReply ? "Replied to" : "Forwarded" }}</span>
          <IconChevronDown
            v-if="referenceCollapsed"
            class="h-3.5 w-3.5 ml-auto"
          />
          <IconChevronUp v-else class="h-3.5 w-3.5 ml-auto" />
        </button>

        <div
          v-if="!referenceCollapsed && referencePost"
          class="mt-2 grid grid-cols-[40px_1fr] gap-3"
        >
          <!-- Publisher avatar + threading line -->
          <div class="flex flex-col items-center">
            <component
              :is="referencePost.publisher ? 'NuxtLink' : 'div'"
              class="shrink-0"
              :to="
                referencePost.publisher
                  ? `/publishers/${referencePost.publisher.name}`
                  : undefined
              "
              @click.stop
            >
              <div v-if="getAvatarUrl(referencePost)" class="avatar">
                <div class="h-7 w-7 rounded-full">
                  <img
                    :src="getAvatarUrl(referencePost)"
                    :alt="getDisplayName(referencePost.publisher)"
                    class="h-full w-full rounded-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
              <div v-else class="avatar avatar-placeholder">
                <div
                  class="h-7 w-7 rounded-full bg-primary text-primary-content"
                >
                  <span class="text-[10px] font-medium">
                    {{ getInitials(getDisplayName(referencePost.publisher)) }}
                  </span>
                </div>
              </div>
            </component>
            <div class="w-px flex-1 min-h-2 bg-base-300/80 mt-1" />
          </div>

          <!-- Referenced post content -->
          <div
            class="min-w-0 pb-2 cursor-pointer"
            @click.stop="navigateToReference"
          >
            <!-- Author info -->
            <div class="flex items-center gap-2 mb-1 min-h-7">
              <AccountName
                :account="
                  referencePost.publisher.account || referencePost.publisher
                "
                :text-override="getDisplayName(referencePost.publisher)"
                size="sm"
                hide-verification-mark
              />
            </div>

            <!-- Content preview -->
            <!-- eslint-disable vue/no-v-html -->
            <div
              v-if="referencePost.content"
              class="prose prose-xs max-w-none break-words text-xs line-clamp-3 prose-p:my-0.5 prose-headings:mb-1 prose-headings:mt-1 prose-a:text-primary prose-a:no-underline"
              v-html="renderedReferenceContent"
            />
            <!-- eslint-enable vue/no-v-html -->

            <!-- Truncated hint -->
            <div
              v-if="referencePost.isTruncated"
              class="mt-1 inline-flex items-center gap-1 text-xs text-base-content/50 italic"
            >
              <IconEllipsis class="h-3 w-3" />
              <span>Post truncated</span>
            </div>

            <!-- Attachments indicator -->
            <div
              v-if="referencePost.attachments.length > 0"
              class="mt-1 inline-flex items-center gap-1 text-xs text-base-content/50"
            >
              <IconPaperclip class="h-3 w-3" />
              <span>{{ referencePost.attachments.length }} attachment(s)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Post Header -->
      <div class="flex items-start gap-3">
        <!-- Avatar -->
        <component
          :is="post.publisher ? 'NuxtLink' : 'div'"
          type="button"
          class="shrink-0"
          :to="
            post.publisher ? `/publishers/${post.publisher.name}` : undefined
          "
          @click.stop
        >
          <div v-if="getAvatarUrl(post)" class="avatar">
            <div class="h-10 w-10 rounded-full">
                <img
                  :src="getAvatarUrl(post)"
                  :alt="getDisplayName(post.publisher)"
                  class="h-full w-full rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
            </div>
          </div>
          <div v-else class="avatar avatar-placeholder">
            <div class="h-10 w-10 rounded-full bg-primary text-primary-content">
              <span class="text-sm font-medium">
                {{ getInitials(getDisplayName(post.publisher)) }}
              </span>
            </div>
          </div>
        </component>

        <!-- Author info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 min-w-0">
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
            <span v-else class="text-sm leading-tight font-semibold truncate">
              {{ getDisplayName(post.publisher) }}
            </span>

            <!-- Realm -->
            <template v-if="post.realm">
              <IconChevronRight class="h-3 w-3 text-base-content/40 shrink-0" />
              <NuxtLink
                :to="`/realms/${post.realm.slug}`"
                class="flex items-center gap-1 text-xs text-base-content/60 hover:underline truncate"
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
        <div class="relative shrink-0">
          <button
            class="btn btn-circle btn-ghost btn-sm"
            @click.stop="showMenu = !showMenu"
          >
            <IconMoreHorizontal class="h-5 w-5" />
          </button>
          <div
            v-if="showMenu"
            class="absolute top-full right-0 z-50 mt-1"
            role="menu"
            tabindex="-1"
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

      <!-- Article type header (only in list view) -->
      <div
        v-if="isArticle && !isDetail"
        class="mt-2 overflow-hidden rounded-lg border border-base-300/70 bg-base-200/40"
      >
        <NuxtLink
          :to="`/posts/${post.id}`"
          class="block hover:bg-base-200/50 transition-colors"
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
            <h3 v-if="post.title" class="text-base font-bold line-clamp-2">
              {{ post.title }}
            </h3>
            <p
              v-if="post.description"
              class="text-sm text-base-content/70 line-clamp-2 mt-1"
            >
              {{ post.description }}
            </p>
          </div>
        </NuxtLink>
      </div>

      <!-- Content (shown for all posts, or for articles in detail view) -->
      <div v-if="!isArticle || isDetail" class="mt-2">
        <div v-if="isArticle && isDetail" class="mb-3">
          <div class="badge badge-primary badge-sm mb-2">Article</div>
          <h3 v-if="post.title" class="text-xl font-bold">
            {{ post.title }}
          </h3>
          <p
            v-if="post.description"
            class="text-base text-base-content/70 mt-2"
          >
            {{ post.description }}
          </p>
        </div>
        <h3
          v-else-if="post.title"
          class="mb-2 text-base font-bold line-clamp-2"
        >
          {{ post.title }}
        </h3>
        <!-- eslint-disable vue/no-v-html -->
        <div
          class="prose prose-sm max-w-none break-words prose-headings:mb-2 prose-headings:mt-4 prose-p:my-1.5 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:break-all prose-code:text-primary prose-code:bg-base-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-base-200 prose-pre:text-sm prose-pre:overflow-x-auto prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:italic prose-ul:my-1.5 prose-ol:my-1.5"
          :class="{ 'prose-lg': isArticle && isDetail }"
          v-html="renderedContent"
          @click="handleMarkdownClick"
        />
        <!-- eslint-enable vue/no-v-html -->

        <!-- Read more link -->
        <NuxtLink
          v-if="!isDetail"
          :to="`/posts/${post.id}`"
          class="mt-2 inline-flex items-center gap-1.5 text-sm btn btn-link btn-xs -mx-2"
        >
          <span>Read more</span>
          <IconArrowRight class="h-4 w-4" />
        </NuxtLink>
      </div>

      <!-- Attachments (hidden for articles — thumbnail is shown in the article card) -->
      <AttachmentGrid
        v-if="!isArticle && post.attachments.length > 0"
        :attachments="post.attachments"
      />

      <!-- Tags -->
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
          <!-- Link Embed -->
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
                :src="
                  resolveAssetUrl(getEmbedUrl(embed)!, getEmbedImage(embed)!)
                "
                :alt="getEmbedTitle(embed) || 'Link preview'"
                class="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div class="card-body gap-1 p-3">
              <div class="flex items-center gap-2 text-xs text-base-content/60">
                <img
                  v-if="getEmbedFavicon(embed)"
                  :src="
                    resolveAssetUrl(
                      getEmbedUrl(embed)!,
                      getEmbedFavicon(embed)!,
                    )
                  "
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
              <div
                v-if="getEmbedTitle(embed)"
                class="line-clamp-2 text-sm font-semibold"
              >
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

          <!-- Poll Embed -->
          <div
            v-else-if="getEmbedType(embed) === 'poll'"
            class="rounded-lg border border-base-300/70 bg-base-200/40"
          >
            <div class="p-3">
              <div class="flex items-center gap-2 text-sm font-medium">
                <IconVote class="h-4 w-4" /> Poll
              </div>
              <div
                v-if="getEmbedTitle(embed)"
                class="text-sm text-base-content/80"
              >
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

      <!-- Reactions -->
      <PostReactionList
        :reactions="formattedReactions"
        :post-id="post.id"
        class="mt-2"
        @react="handleReact"
        @remove="handleRemoveReaction"
      />

      <!-- Reply Preview -->
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
        :class="isFeed ? 'pt-2' : 'pt-3 border-t border-base-200'"
      >
        <div class="flex items-center gap-0.5">
          <button
            class="btn gap-1.5 btn-ghost btn-sm text-base-content/60 hover:bg-primary/10 hover:text-primary"
            @click.stop="handleReply"
          >
            <IconMessageCircle class="h-4 w-4" />
            <span class="text-xs tabular-nums">{{
              formatNumber(post.repliesCount)
            }}</span>
          </button>
          <button
            class="btn gap-1.5 btn-ghost btn-sm text-base-content/60 hover:bg-success/10 hover:text-success"
            :class="{ 'text-success': hasBoosted }"
            @click.stop="handleBoost"
          >
            <IconRepeat2 class="h-4 w-4" />
            <span class="text-xs tabular-nums">{{
              formatNumber(post.boostCount)
            }}</span>
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
import {
  IconMessageCircle,
  IconRepeat2,
  IconMoreHorizontal,
  IconShare,
  IconFlag,
  IconLink,
  IconReply,
  IconForward,
  IconChevronDown,
  IconChevronUp,
  IconChevronRight,
  IconEllipsis,
  IconArrowRight,
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
  if (isFeed.value) {
    return "feed-post";
  }
  if (props.embedded) {
    return "card bg-base-200 transition-shadow";
  }
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
const hasUpvoted = ref(false);
const hasDownvoted = ref(false);

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
  const displayContent = referencePost.value.isTruncated
    ? `${content}...`
    : content;
  return renderMarkdown(displayContent);
});

// Scores
const netScore = computed(() => props.post.upvotes - props.post.downvotes);
const hasEdits = computed(() => props.post.editedAt != null);

// Reactions
const formattedReactions = computed(() => {
  return Object.entries(localReactionsCount.value).map(([symbol, count]) => ({
    symbol,
    attitude: 0,
    count: count as number,
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

function getEmbedId(embed: EmbedItem): string | null {
  const raw = embed.id;
  if (typeof raw === "string" && raw.trim() !== "") return raw;
  if (typeof raw === "number") return String(raw);
  return null;
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
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatDate(dateStr: string, isDetailMode: boolean = false): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

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

function getInitials(name: string): string {
  if (!name || name === "Unknown") return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getDisplayName(target: Post["publisher"]): string {
  if (!target) return "Unknown";
  return target.nick || target.name || "Unknown";
}

function getAvatarUrl(target: Post): string {
  if (!target.publisher) return "";
  return getFileUrl(target.publisher.picture?.id) || "";
}

// Navigation
function navigateToReference() {
  if (referencePost.value) {
    navigateTo(`/posts/${referencePost.value.id}`);
  }
}

// Actions
function handleShare() {
  showMenu.value = false;
  emit("share", props.post);
}

function handleCopyLink() {
  const url = `${window.location.origin}/posts/${props.post.id}`;
  navigator.clipboard.writeText(url);
  showMenu.value = false;
}

function handleReply() {
  showMenu.value = false;
  const compose = useCompose();
  compose.initializeFromState({
    content: "",
    replyingTo: props.post,
  });
  emit("reply", props.post);
  const event = new CustomEvent("open-compose");
  window.dispatchEvent(event);
}

function handleForward() {
  showMenu.value = false;
  const compose = useCompose();
  compose.initializeFromState({
    content: "",
    forwardingTo: props.post,
  });
  const event = new CustomEvent("open-compose");
  window.dispatchEvent(event);
}

function handleEdit() {
  showMenu.value = false;
  const compose = useCompose();
  compose.initializeFromPost(props.post);
  const event = new CustomEvent("open-compose");
  window.dispatchEvent(event);
}

function handleDelete() {
  showMenu.value = false;
  // TODO: Implement delete
}

function handleReport() {
  showMenu.value = false;
  // TODO: Implement report
}

function handleBoost() {
  hasBoosted.value = !hasBoosted.value;
  emit("boost", props.post);
}

function handleUpvote() {
  if (hasUpvoted.value) {
    hasUpvoted.value = false;
  } else {
    hasUpvoted.value = true;
    hasDownvoted.value = false;
  }
}

function handleDownvote() {
  if (hasDownvoted.value) {
    hasDownvoted.value = false;
  } else {
    hasDownvoted.value = true;
    hasUpvoted.value = false;
  }
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
  const updatedCount = Math.max(
    0,
    (localReactionsCount.value[symbol] || 1) - 1,
  );
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

// Close menu when clicking outside
onMounted(() => {
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".relative")) {
      showMenu.value = false;
    }
  };
  document.addEventListener("click", handleClickOutside);
  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
  });
});
</script>
