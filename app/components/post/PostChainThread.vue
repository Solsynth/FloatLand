<template>
  <div v-if="posts.length > 0">
    <template v-for="(member, idx) in visiblePosts" :key="member.id">
      <!-- Collapsing an upward thread hides its earliest members, above. -->
      <div
        v-if="collapsed && direction === 'above' && idx === 0"
        class="flex h-7 cursor-pointer items-center"
        role="button"
        tabindex="0"
        @click.stop="expanded = true"
        @keydown.enter.stop="expanded = true"
      >
        <span class="relative flex h-full w-8 shrink-0 justify-center">
          <span class="absolute inset-y-0 left-4 w-px bg-base-300/80" />
        </span>
        <span class="btn btn-ghost btn-xs gap-1 text-base-content/55">
          <IconChevronDown class="h-3.5 w-3.5" />
          {{ t('post.chain.showMore', { count: hiddenCount }) }}
        </span>
      </div>

      <!--
        Rows stack flush: the rail is a line spanning each row's full height, so
        it reads as one thread from the host post's avatar to the last member's.
        A downward thread ends at that last avatar; an upward thread runs on,
        into the host post below.
      -->
      <div class="flex cursor-pointer" @click.stop="openPost(member)">
        <span class="relative flex w-8 shrink-0 justify-center">
          <span
            :class="
              isTail(idx)
                ? 'absolute top-0 left-4 h-4 w-px bg-base-300/80'
                : 'absolute inset-y-0 left-4 w-px bg-base-300/80'
            "
          />
          <PublisherAvatar :publisher="member.publisher" size="sm" linked />
        </span>

        <div class="min-w-0 flex-1 pb-3 pl-3">
          <div class="flex min-w-0 items-baseline gap-2">
            <span class="min-w-0 truncate text-sm font-semibold">
              {{ getDisplayName(member.publisher) }}
            </span>
            <span class="shrink-0 text-xs text-base-content/40">
              {{ formatChainTime(member.publishedAt) }}
            </span>
          </div>

          <!-- eslint-disable-next-line vue/no-v-html -->
          <div
            v-if="member.content"
            class="prose prose-xs line-clamp-2 max-w-none break-words text-xs leading-relaxed prose-p:my-0.5 prose-a:text-primary"
            @click="handleMarkdownClick"
            v-html="renderMarkdown(member.content)"
          />

          <div
            v-if="member.attachments.length > 0"
            class="mt-0.5 inline-flex items-center gap-1 text-[11px] text-base-content/45"
          >
            <IconPaperclip class="h-3 w-3" />
            <span>{{ t('post.attachmentCount', { count: member.attachments.length }) }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- A collapsed downward thread ends in the expand row instead of a member. -->
    <div
      v-if="collapsed && direction === 'below'"
      class="flex h-7 cursor-pointer items-center"
      role="button"
      tabindex="0"
      @click.stop="expanded = true"
      @keydown.enter.stop="expanded = true"
    >
      <span class="relative flex h-full w-8 shrink-0 justify-center">
        <span class="absolute inset-y-0 left-4 w-px bg-base-300/80" />
      </span>
      <span class="btn btn-ghost btn-xs gap-1 text-base-content/55">
        <IconChevronDown class="h-3.5 w-3.5" />
        {{ t('post.chain.showMore', { count: hiddenCount }) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from "~/types/post";
import { renderMarkdown } from "~/utils/markdown";
import { getDisplayName } from "~/utils/identity";

interface Props {
  /**
   * Chain members in publication order (head first).
   *
   * A chain head passes its `chainedPosts`; the detail page passes the members
   * that precede the post it shows, in the same order.
   */
  posts: Post[];
  /**
   * Whether the thread leads into the host post (`above`, the members a chained
   * post continues from) or continues it (`below`, a chain head's members).
   */
  direction?: "below" | "above";
  /** Members kept visible before the rest collapse behind a `show more` row. */
  collapseThreshold?: number;
}

const props = withDefaults(defineProps<Props>(), {
  direction: "below",
  collapseThreshold: 3,
});

const { t } = useI18n();

const expanded = ref(false);

const hiddenCount = computed(() =>
  props.posts.length > props.collapseThreshold
    ? props.posts.length - props.collapseThreshold
    : 0,
);
const collapsed = computed(() => hiddenCount.value > 0 && !expanded.value);

/**
 * Collapsing keeps the members nearest the host post: the last ones for a
 * downward thread, the first ones for one that leads into it.
 */
const visiblePosts = computed(() => {
  if (!collapsed.value) return props.posts;
  return props.direction === "below"
    ? props.posts.slice(0, props.collapseThreshold)
    : props.posts.slice(-props.collapseThreshold);
});

/**
 * Whether this row ends a downward thread: its rail stops at the avatar rather
 * than running on, since no member is drawn below it.
 */
function isTail(idx: number): boolean {
  return props.direction === "below" && !collapsed.value && idx === visiblePosts.value.length - 1;
}

// Reused instances must not leak another chain's expanded state.
watch(
  () => [props.direction, props.posts.length, props.posts.at(-1)?.id] as const,
  () => {
    expanded.value = false;
  },
);

function openPost(member: Post) {
  void navigateTo(`/posts/${member.id}`);
}

function formatChainTime(dateStr: string): string {
  const published = Date.parse(dateStr);
  if (Number.isNaN(published)) return "";
  const minutes = Math.floor((Date.now() - published) / 60_000);
  if (minutes < 1) return t("post.justNow");
  if (minutes < 60) return t("post.minutesAgo", { m: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("post.hoursAgo", { h: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("post.daysAgo", { d: days });
  return new Date(published).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Mention chips navigate; spoilers toggle — the contract the reply preview uses.
 * Both stop the row's own click so a member is not opened twice.
 */
function handleMarkdownClick(e: MouseEvent) {
  const target = e.target as HTMLElement;

  if (target.closest(".mention-chip")) {
    e.preventDefault();
    e.stopPropagation();
    const href = target.closest("a")?.getAttribute("href");
    if (href) void navigateTo(href);
    return;
  }

  if (target.classList.contains("spoiler")) {
    e.stopPropagation();
    target.classList.toggle("revealed");
  }
}
</script>
