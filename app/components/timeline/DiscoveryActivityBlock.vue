<template>
  <section
    v-if="items.length > 0"
    class="feed-insert"
  >
    <div class="feed-insert__header">
      <component :is="titleIcon" class="h-3.5 w-3.5 text-base-content/55" />
      <h3 class="text-xs font-semibold tracking-wide text-base-content/65">
        {{ title }}
      </h3>
    </div>

    <!-- Single non-post suggestion -->
    <div v-if="isSingleSuggestion" class="px-3 pb-3 pt-1">
      <component
        :is="cardComponent"
        :item="items[0]"
        @boost="$emit('boost', $event)"
        @share="$emit('share', $event)"
        @reply="$emit('reply', $event)"
      />
    </div>

    <!-- Multi-item carousel -->
    <div
      v-else
      class="flex gap-3 overflow-x-auto px-4 pb-4 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <div
        v-for="(item, idx) in items"
        :key="itemKey(item, idx)"
        class="shrink-0"
        :class="discoveryType === 'post' ? 'w-[18.5rem] max-w-[88vw]' : 'w-64 max-w-[80vw]'"
      >
        <component
          :is="cardComponent"
          :item="item"
          @boost="$emit('boost', $event)"
          @share="$emit('share', $event)"
          @reply="$emit('reply', $event)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import type { DiscoveryItem, Post, SnTimelineEvent } from "~/types/post";
import DiscoveryAccountCard from "~/components/timeline/DiscoveryAccountCard.vue";
import DiscoveryArticleCard from "~/components/timeline/DiscoveryArticleCard.vue";
import DiscoveryPostCard from "~/components/timeline/DiscoveryPostCard.vue";
import DiscoveryPublisherCard from "~/components/timeline/DiscoveryPublisherCard.vue";
import DiscoveryRealmCard from "~/components/timeline/DiscoveryRealmCard.vue";
import {
  IconSparkles,
  IconUser,
  IconBadgeCheck,
  IconGlobe,
  IconNewspaper,
  IconShuffle,
} from "#components";

const props = defineProps<{
  event: SnTimelineEvent;
}>();

defineEmits<{
  boost: [post: Post];
  share: [post: Post];
  reply: [post: Post];
}>();

const { t } = useI18n();

const cardByType: Record<string, Component> = {
  realm: DiscoveryRealmCard,
  publisher: DiscoveryPublisherCard,
  account: DiscoveryAccountCard,
  article: DiscoveryArticleCard,
  post: DiscoveryPostCard,
};

const data = computed(() => {
  const raw = props.event.data;
  if (!raw || typeof raw !== "object") return {} as Record<string, unknown>;
  return raw as Record<string, unknown>;
});

const rawItems = computed(() => {
  const list = data.value.items;
  if (!Array.isArray(list)) return [] as Record<string, unknown>[];
  return list.filter(
    (e): e is Record<string, unknown> =>
      typeof e === "object" && e !== null,
  );
});

function extractItemData(item: Record<string, unknown>): Record<string, unknown> {
  const nested = item.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return item;
}

const discoveryType = computed(() => {
  if (props.event.type === "discovery.v2") {
    const kind = data.value.kind;
    if (typeof kind === "string" && kind.length > 0) return kind;

    const parts = props.event.resourceIdentifier?.split(":") ?? [];
    if (parts.length > 1 && parts[parts.length - 1]) {
      return parts[parts.length - 1];
    }
  }

  const firstType = rawItems.value[0]?.type;
  if (typeof firstType === "string" && firstType.length > 0) return firstType;

  const fallbackKind = data.value.kind;
  if (typeof fallbackKind === "string" && fallbackKind.length > 0) {
    return fallbackKind;
  }

  return "unknown";
});

const items = computed<DiscoveryItem[]>(() =>
  rawItems.value.map((item) => {
    const type =
      (typeof item.type === "string" && item.type) || discoveryType.value;
    const reasons = Array.isArray(item.reasons)
      ? item.reasons.filter((r): r is string => typeof r === "string")
      : undefined;
    const rank = typeof item.rank === "string" ? item.rank : undefined;
    const score =
      typeof item.score === "number"
        ? item.score
        : typeof item.score === "string"
          ? Number(item.score)
          : undefined;

    return {
      type,
      data: extractItemData(item),
      rank,
      reasons,
      score: Number.isFinite(score) ? score : undefined,
    };
  }),
);

const isSingleSuggestion = computed(
  () => discoveryType.value !== "post" && items.value.length === 1,
);

const title = computed(() => {
  switch (discoveryType.value) {
    case "realm":
      return t("home.discovery.suggestedRealm");
    case "publisher":
      return t("home.discovery.suggestedPublisher");
    case "account":
      return t("home.discovery.suggestedPeople");
    case "article":
      return t("home.discovery.webArticles");
    case "post":
      return t("home.discovery.shuffledPosts");
    default:
      return t("home.discovery.explore");
  }
});

const titleIcon = computed(() => {
  switch (discoveryType.value) {
    case "realm":
      return IconGlobe;
    case "publisher":
      return IconBadgeCheck;
    case "account":
      return IconUser;
    case "article":
      return IconNewspaper;
    case "post":
      return IconShuffle;
    default:
      return IconSparkles;
  }
});

const cardComponent = computed(
  () => cardByType[discoveryType.value] ?? DiscoveryAccountCard,
);

function itemKey(item: DiscoveryItem, idx: number): string {
  const id = (item.data as { id?: string })?.id;
  return id ? `${item.type}-${id}` : `${item.type}-${idx}`;
}
</script>
