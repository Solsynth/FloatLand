<template>
  <div
    class="not-prose my-3 overflow-hidden rounded-box border border-base-300/70 bg-base-200/40"
  >
    <NuxtLink
      :to="`/posts/${postId}`"
      class="block transition-colors hover:bg-base-200/50"
    >
      <template v-if="post">
        <div v-if="cover" class="aspect-video w-full overflow-hidden">
          <FileImage
            :file="cover"
            :alt="post.title || t('post.title')"
            class="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div class="px-3 pb-1 pt-2.5">
          <div class="flex min-w-0 items-center gap-2">
            <PublisherAvatar :publisher="post.publisher" size="sm" />
            <div class="min-w-0 flex-1">
              <AccountName
                :account="post.publisher.account || post.publisher"
                :text-override="getDisplayName(post.publisher)"
                size="sm"
                hide-verification-mark
              />
            </div>
            <span v-if="timestamp" class="shrink-0 text-xs text-base-content/45">
              {{ timestamp }}
            </span>
          </div>

          <p v-if="post.title" class="mt-1.5 line-clamp-2 text-sm font-semibold">
            {{ post.title }}
          </p>

          <!-- eslint-disable-next-line vue/no-v-html -->
          <div
            v-if="previewHtml"
            class="prose prose-xs max-w-none break-words text-xs prose-a:text-primary prose-a:no-underline prose-headings:mb-1 prose-headings:mt-1 prose-p:my-0.5"
            v-html="previewHtml"
          />
        </div>
      </template>

      <div v-else-if="status === 'pending'" class="flex items-center gap-3 p-3">
        <div class="skeleton h-7 w-7 shrink-0 rounded-full" />
        <div class="min-w-0 flex-1 space-y-1.5">
          <div class="skeleton h-3 w-28 rounded" />
          <div class="skeleton h-3 w-3/4 rounded" />
        </div>
      </div>

      <div
        v-else
        class="flex items-center gap-2 px-3 py-2.5 text-xs text-base-content/50"
      >
        <IconLink class="h-3.5 w-3.5 shrink-0" />
        <span class="truncate">{{ t("post.referenceUnavailable") }}</span>
      </div>
    </NuxtLink>

    <!--
      Media, tags, reactions and the reply count navigate or act on their own,
      so they stay outside the card link instead of nesting inside it.
    -->
    <template v-if="post">
      <AttachmentGrid
        v-if="showMediaGrid"
        :attachments="post.attachments"
        :max-visible="3"
        :max-height="220"
        class="mt-2"
      />

      <div class="space-y-2 px-3 pb-2.5 pt-2">
        <div v-if="post.tags.length > 0" class="flex flex-wrap gap-1.5">
          <NuxtLink
            v-for="tag in post.tags"
            :key="tag.id"
            :to="`/tags/${tag.slug}`"
            class="badge badge-ghost badge-sm transition-colors hover:badge-primary"
          >
            {{ tag.name ?? "#" + tag.slug }}
          </NuxtLink>
        </div>

        <PostReactionList
          :reactions="reactions"
          :post-id="post.id"
          compact
          readonly
          :show-add-button="false"
        />

        <div class="flex items-center gap-3 text-xs text-base-content/50">
          <NuxtLink
            :to="`/posts/${post.id}`"
            class="inline-flex items-center gap-1 transition-colors hover:text-base-content/75"
          >
            <IconMessageCircle class="h-3.5 w-3.5" />
            <span class="tabular-nums">{{ formatNumber(post.repliesCount) }}</span>
          </NuxtLink>
          <span
            v-if="post.attachments.length > 0"
            class="inline-flex items-center gap-1"
          >
            <IconPaperclip class="h-3 w-3" />
            <span>{{ t("post.attachmentCount", { count: post.attachments.length }) }}</span>
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { renderMarkdown } from "~/utils/markdown";
import { formatRelativeTime } from "~/utils/datetime";
import { getDisplayName } from "~/utils/identity";
import { IconLink, IconMessageCircle, IconPaperclip } from "#components";

const props = defineProps<{ postId: string }>();

const { t } = useI18n();
const { post, status } = usePostPreview(() => props.postId);

const isArticle = computed(() => post.value?.type === 1);

/** Article cover, the attachment the post marks as its thumbnail. */
const cover = computed(() => {
  const current = post.value;
  if (!isArticle.value || !current) return null;
  const thumbnailId = current.meta?.thumbnail as string | undefined;
  if (!thumbnailId) return null;
  return current.attachments.find((a) => a.id === thumbnailId) ?? null;
});

const showMediaGrid = computed(() => {
  const current = post.value;
  if (!current || current.attachments.length === 0) return false;
  // An article already shows its cover; everything else shows its media row.
  return !isArticle.value || !cover.value;
});

const reactions = computed(() =>
  Object.entries(post.value?.reactionsCount ?? {}).map(([symbol, count]) => ({
    symbol,
    attitude: 0,
    count,
    userReacted: post.value?.reactionsMade?.[symbol] || false,
  })),
);

const timestamp = computed(() =>
  formatRelativeTime(post.value?.publishedAt ?? post.value?.createdAt),
);

const previewHtml = computed(() => {
  const current = post.value;
  if (!current) return "";
  const content = current.content ?? "";
  // Embeds stay off here: a preview inside a preview reads wrong, and the
  // quoted post's own links are one click away.
  return renderMarkdown(current.isTruncated ? `${content}...` : content);
});

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}
</script>
