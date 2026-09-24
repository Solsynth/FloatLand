<template>
  <div
    ref="containerRef"
    v-if="totalReplies > 0"
    class="rounded-box bg-base-200/50 overflow-hidden"
  >
    <!-- Header -->
    <div class="px-3 py-1.5 flex items-center justify-between">
      <span class="text-sm font-semibold text-base-content/70">
        {{ totalReplies }} {{ totalReplies === 1 ? 'reply' : 'replies' }}
      </span>
    </div>

    <!-- Explore page: featured reply only -->
    <div
      v-if="isExplorePage && featuredReply"
      class="px-3 py-1.5 cursor-pointer hover:bg-base-200/40 transition-colors"
      @click.stop="navigateToPost(featuredReply.id)"
    >
      <div class="min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <div v-if="getAvatarUrl(featuredReply)" class="avatar">
              <div class="h-6 w-6 rounded-full">
                <FileImage
                  :file="getAvatarUrl(featuredReply)"
                  :alt="getDisplayName(featuredReply.publisher)"
                  class="h-full w-full rounded-full object-cover"
                />
              </div>
            </div>
            <div v-else class="avatar avatar-placeholder">
              <div class="h-6 w-6 rounded-full bg-primary text-primary-content">
                <span class="text-[10px] font-medium">
                  {{ getInitials(getDisplayName(featuredReply.publisher)) }}
                </span>
              </div>
            </div>
            <span class="text-xs font-semibold truncate">
              {{ getDisplayName(featuredReply.publisher) }}
            </span>
            <span class="text-xs text-base-content/40">
              {{ formatRelativeTime(featuredReply.publishedAt) }}
            </span>
          </div>

          <!-- eslint-disable vue/no-v-html -->
          <div
            v-if="featuredReply.content"
            class="prose prose-xs max-w-none break-words text-xs line-clamp-2 prose-p:my-0.5 prose-a:text-primary"
            v-html="renderMarkdown(featuredReply.content)"
            @click="handleMarkdownClick"
          />
          <!-- eslint-enable vue/no-v-html -->

          <div
            v-if="featuredReply.attachments.length > 0"
            class="mt-1 inline-flex items-center gap-1 text-xs text-base-content/50"
          >
            <IconPaperclip class="h-3 w-3" />
            <span>{{ featuredReply.attachments.length }} attachment(s)</span>
          </div>

          <PostReactionList
            v-if="featuredReactions.length > 0"
            :reactions="featuredReactions"
            :post-id="featuredReply.id"
            :show-add-button="false"
            :max-visible="3"
            compact
            class="mt-1"
            @react="handleReact"
            @remove="handleRemoveReaction"
          />
      </div>
    </div>

    <!-- Nested reply list -->
    <div v-else class="p-1">
      <div
        v-for="node in displayReplyNodes"
        :key="node.reply.id"
        class="flex gap-2 rounded-box px-2 py-1.5 hover:bg-base-100/70 cursor-pointer transition-colors"
        :style="{ paddingLeft: `${8 + node.depth * 14}px` }"
        @click.stop="navigateToPost(node.reply.id)"
      >
        <!-- Avatar (compact) -->
        <NuxtLink
          v-if="node.reply.publisher"
          :to="`/publishers/${node.reply.publisher.name}`"
          class="shrink-0"
          @click.stop
        >
          <div v-if="getAvatarUrl(node.reply)" class="avatar">
            <div class="h-6 w-6 rounded-full">
              <FileImage
                :file="getAvatarUrl(node.reply)"
                :alt="getDisplayName(node.reply.publisher)"
                class="h-full w-full rounded-full object-cover"
              />
            </div>
          </div>
          <div v-else class="avatar avatar-placeholder">
            <div class="h-6 w-6 rounded-full bg-primary text-primary-content">
              <span class="text-[10px] font-medium">
                {{ getInitials(getDisplayName(node.reply.publisher)) }}
              </span>
            </div>
          </div>
        </NuxtLink>

        <!-- Content -->
        <div class="min-w-0 flex-1">
          <div class="flex items-baseline gap-1.5 min-w-0">
            <NuxtLink
              v-if="node.reply.publisher"
              :to="`/publishers/${node.reply.publisher.name}`"
              class="truncate text-xs font-semibold hover:underline"
              @click.stop
            >
              {{ getDisplayName(node.reply.publisher) }}
            </NuxtLink>
            <span class="shrink-0 text-[11px] text-base-content/40">
              {{ formatRelativeTime(node.reply.publishedAt) }}
            </span>
          </div>

          <!-- Reply content preview -->
          <!-- eslint-disable vue/no-v-html -->
          <div
            v-if="node.reply.content"
            class="prose prose-xs max-w-none break-words text-xs line-clamp-2 prose-p:my-0.5 prose-a:text-primary"
            v-html="renderMarkdown(node.reply.content)"
            @click="handleMarkdownClick"
          />
          <!-- eslint-enable vue/no-v-html -->

          <!-- Attachments indicator -->
          <div
            v-if="node.reply.attachments.length > 0"
            class="mt-0.5 flex items-center gap-1 text-[11px] text-base-content/45"
          >
            <IconPaperclip class="h-3 w-3" />
            <span>{{ node.reply.attachments.length }} attachment(s)</span>
          </div>

          <!-- Compact reaction preview -->
          <div v-if="postReactions(node.reply).length > 0" class="mt-1">
            <PostReactionList
              :reactions="postReactions(node.reply)"
              :post-id="node.reply.id"
              :show-add-button="false"
              :max-visible="3"
              compact
              readonly
              class="flex-wrap"
            />
          </div>

          <!-- Replies count -->
          <span
            v-if="node.reply.repliesCount > 0"
            class="mt-0.5 block text-[11px] text-base-content/45"
          >
            {{ node.reply.repliesCount }}
            {{ node.reply.repliesCount === 1 ? 'reply' : 'replies' }}
          </span>
        </div>
      </div>

      <!-- Load more -->
      <button
        v-if="hasMore && !loading"
        class="w-full px-3 py-1.5 text-xs text-primary hover:bg-base-200/50 transition-colors"
        @click.stop="loadMore"
      >
        Load more replies...
      </button>

      <div v-if="loading" class="px-3 py-1.5 text-xs text-base-content/50">
        Loading replies...
      </div>

      <!-- View all link -->
      <NuxtLink
        v-if="totalReplies > 3"
        :to="`/posts/${postId}`"
        class="block px-3 py-1.5 text-xs text-primary hover:bg-base-200/50 transition-colors text-center"
        @click.stop
      >
        View all {{ totalReplies }} replies
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~/types/post';
import { useIntersectionObserver } from '@vueuse/core';
import { fetchPostRepliesThreaded, reactToPost } from '~/utils/api';
import { renderMarkdown } from '~/utils/markdown';
import {
  IconPaperclip,
} from '#components';

interface Props {
  postId: string;
  totalReplies: number;
  initialReplies?: Post[];
}

const props = withDefaults(defineProps<Props>(), {
  initialReplies: () => [],
});

const containerRef = ref<HTMLElement | null>(null);
const replies = ref<Post[]>(props.initialReplies);
const replyNodes = ref<Array<{ reply: Post; depth: number; parentId: string | null }>>([]);
const loading = ref(false);
const offset = ref(0);
const hasMore = ref(true);
const hasLoaded = ref(false);
const route = useRoute();
const isExplorePage = computed(() => route.path === '/');

const displayReplyNodes = computed(() => {
  return replyNodes.value.slice(0, 24);
});

const featuredReply = computed(() => replies.value[0] ?? null);

// Compact reaction preview for a reply row (top 3 by count).
function postReactions(post: Post | null) {
  if (!post?.reactionsCount) return [];
  return Object.entries(post.reactionsCount)
    .filter(([, count]) => (count as number) > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 3)
    .map(([symbol, count]) => ({
      symbol,
      attitude: 0,
      count: count as number,
      userReacted: post.reactionsMade?.[symbol] || false,
    }));
}

const featuredReactions = computed(() => postReactions(featuredReply.value));

async function loadReplies() {
  if (loading.value) return;
  loading.value = true;
  try {
    const { nodes, total } = await fetchPostRepliesThreaded(props.postId, 6, 0);
    replyNodes.value = nodes.map((n) => ({ reply: n.post, depth: n.depth, parentId: n.parentId }));
    replies.value = nodes.map((n) => n.post);
    offset.value = nodes.length;
    hasMore.value = offset.value < total;
  } catch (e) {
    console.error('Failed to load replies:', e);
  } finally {
    loading.value = false;
  }
}

// Intersection Observer for lazy loading
const { stop: stopObserver } = useIntersectionObserver(
  containerRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting && !hasLoaded.value && !loading.value) {
      hasLoaded.value = true;
      loadReplies();
      stopObserver();
    }
  },
  { rootMargin: '100px' } // Start loading 100px before visible
);

async function loadMore() {
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const { nodes, total } = await fetchPostRepliesThreaded(props.postId, 6, offset.value);
    const mapped = nodes.map((n) => ({ reply: n.post, depth: n.depth, parentId: n.parentId }));
    replyNodes.value = [...replyNodes.value, ...mapped];
    replies.value = [...replies.value, ...nodes.map((n) => n.post)];
    offset.value += nodes.length;
    hasMore.value = offset.value < total;
  } catch (e) {
    console.error('Failed to load more replies:', e);
  } finally {
    loading.value = false;
  }
}

function navigateToPost(postId: string) {
  navigateTo(`/posts/${postId}`);
}

function getDisplayName(target: Post['publisher']): string {
  if (!target) return 'Unknown';
  return target.nick || target.name || 'Unknown';
}

function getAvatarUrl(post: Post) {
  if (!post.publisher) return null;
  return post.publisher.picture;
}

function getInitials(name: string): string {
  if (!name || name === 'Unknown') return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function handleMarkdownClick(e: MouseEvent) {
  const target = e.target as HTMLElement

  // Handle mention chip clicks
  if (target.closest('.mention-chip')) {
    e.preventDefault()
    const href = target.closest('a')?.getAttribute('href')
    if (href) {
      navigateTo(href)
    }
    return
  }

  // Handle spoiler toggles
  if (target.classList.contains('spoiler')) {
    target.classList.toggle('revealed')
  }
}

async function handleReact(symbol: string, attitude: number) {
  if (!featuredReply.value) return;
  // Server decides add/remove: 204 means the reaction was removed.
  await reactToPost(featuredReply.value.id, symbol, attitude);
}

async function handleRemoveReaction(symbol: string) {
  if (!featuredReply.value) return;
  await reactToPost(featuredReply.value.id, symbol, 0);
}

// Replies are loaded via Intersection Observer when visible
</script>
