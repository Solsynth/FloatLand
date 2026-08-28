<template>
  <div v-if="renderer" class="timeline-event">
    <component
      :is="renderer"
      v-bind="rendererProps"
      @boost="$emit('boost', $event)"
      @share="$emit('share', $event)"
      @reply="$emit('reply', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import type {
  SnTimelineEvent,
  SnPresenceActivity,
  SnAccountStatus,
  Post,
} from "~/types/post";
import TimelinePostItem from "~/components/timeline/TimelinePostItem.vue";
import DiscoveryActivityBlock from "~/components/timeline/DiscoveryActivityBlock.vue";
import FriendPresenceCard from "~/components/timeline/FriendPresenceCard.vue";
import FriendStatusCard from "~/components/timeline/FriendStatusCard.vue";

const props = defineProps<{
  event: SnTimelineEvent;
}>();

defineEmits<{
  boost: [post: Post];
  share: [post: Post];
  reply: [post: Post];
}>();

const isPostEvent = computed(
  () =>
    props.event.type === "posts.new" ||
    props.event.type === "posts.new.replies",
);
const isDiscoveryEvent = computed(
  () =>
    props.event.type === "discovery" || props.event.type === "discovery.v2",
);
const isPresenceEvent = computed(() => props.event.type === "presence.friend");
const isStatusEvent = computed(() => props.event.type === "status.friend");

function eventData<T>(): T | null {
  if (props.event.data == null || typeof props.event.data !== "object") return null;
  return props.event.data as T;
}

const renderer = computed<Component | null>(() => {
  if (isPostEvent.value) return TimelinePostItem;
  if (isDiscoveryEvent.value) return DiscoveryActivityBlock;
  if (isPresenceEvent.value && presenceActivity.value) return FriendPresenceCard;
  if (isStatusEvent.value && statusData.value) return FriendStatusCard;
  return null;
});

const presenceActivity = computed(() =>
  isPresenceEvent.value ? eventData<{ activity: SnPresenceActivity }>()?.activity ?? null : null,
);

const presenceRawData = computed<Record<string, unknown>>(() =>
  isPresenceEvent.value ? eventData<Record<string, unknown>>() ?? {} : {},
);

const statusData = computed(() =>
  isStatusEvent.value ? eventData<{ status: SnAccountStatus }>()?.status ?? null : null,
);

const rendererProps = computed(() => {
  switch (renderer.value) {
    case TimelinePostItem:
      return { event: props.event };
    case DiscoveryActivityBlock:
      return { event: props.event };
    case FriendPresenceCard:
      return { activity: presenceActivity.value, rawData: presenceRawData.value, variant: "feed" };
    case FriendStatusCard:
      return { status: statusData.value, createdAt: props.event.createdAt, variant: "feed" };
    default:
      return {};
  }
});
</script>

<style scoped>
.timeline-event {
  content-visibility: auto;
  contain-intrinsic-size: auto 240px;
}
</style>
