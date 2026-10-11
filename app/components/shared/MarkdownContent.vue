<template>
  <div>
    <!--
      `contents` keeps each chunk's nodes as direct children of the prose
      container, so typography first/last-child rules still apply.
    -->
    <template v-for="(segment, index) in segments" :key="index">
      <PostEmbed v-if="segment.type === 'post'" :post-id="segment.id" />
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-else class="contents" v-html="segment.html" />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { MarkdownSegment } from "~/utils/markdown";
import { renderMarkdown, renderMarkdownSegments } from "~/utils/markdown";

const props = withDefaults(
  defineProps<{
    content: string;
    /**
     * Render a paragraph holding nothing but a Solar post link as an inline
     * post preview card. See `renderMarkdown`.
     */
    embedPosts?: boolean;
  }>(),
  { embedPosts: false },
);

const segments = computed<MarkdownSegment[]>(() =>
  props.embedPosts
    ? renderMarkdownSegments(props.content)
    : [{ type: "html", html: renderMarkdown(props.content) }],
);
</script>
