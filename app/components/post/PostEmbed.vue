<template>
  <div class="not-prose my-3">
    <NuxtLink
      :to="`/posts/${postId}`"
      class="block overflow-hidden rounded-box border border-base-300/70 bg-base-200/40 transition-colors hover:border-primary/45 hover:bg-base-200/65"
    >
      <template v-if="post">
        <div class="flex min-w-0 items-center gap-2 px-3 pb-1 pt-2.5">
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

        <p v-if="post.title" class="px-3 pb-0.5 line-clamp-2 text-sm font-semibold">
          {{ post.title }}
        </p>

        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          v-if="previewHtml"
          class="prose prose-xs max-w-none break-words px-3 text-xs prose-a:text-primary prose-a:no-underline prose-headings:mb-1 prose-headings:mt-1 prose-p:my-0.5"
          v-html="previewHtml"
        />

        <div
          v-if="post.attachments.length > 0"
          class="flex items-center gap-1 px-3 pb-2.5 pt-1 text-xs text-base-content/50"
        >
          <IconPaperclip class="h-3 w-3" />
          <span>{{ t("post.attachmentCount", { count: post.attachments.length }) }}</span>
        </div>
        <div v-else class="pb-2.5" />
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
  </div>
</template>

<script setup lang="ts">
import { renderMarkdown } from "~/utils/markdown";
import { formatRelativeTime } from "~/utils/datetime";
import { getDisplayName } from "~/utils/identity";
import { IconLink, IconPaperclip } from "#components";

const props = defineProps<{ postId: string }>();

const { t } = useI18n();
const { post, status } = usePostPreview(() => props.postId);

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
</script>
