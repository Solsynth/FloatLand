<template>
  <div
    class="card bg-base-100 shadow-sm transition-shadow hover:shadow-md"
  >
    <div class="card-body flex-row items-start gap-3 p-4">
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15"
      >
        <component :is="eventIcon" class="h-4 w-4 text-primary" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="mb-0.5 flex items-center gap-1.5 text-xs">
          <NuxtLink
            v-if="account"
            :to="`/accounts/${account.name}`"
            class="truncate font-medium text-base-content/80 hover:text-primary"
          >
            {{ account.nick || account.name }}
          </NuxtLink>
          <span class="text-base-content/30">·</span>
          <span class="shrink-0 text-base-content/40">
            {{ formatRelativeTime(createdAt) }}
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-sm font-medium">{{ eventLabel }}</span>
          <span
            v-if="statusLabel"
            class="badge badge-sm badge-ghost"
          >
            {{ statusLabel }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SnTimelineEvent } from "~/types/post";
import type { SnAccount } from "~/types/auth";
import {
  IconBadgeCheck,
  IconSparkles,
  IconStar,
  IconStarOff,
  IconUsers,
} from "#components";
import { fetchAccount } from "~/utils/api";
import { useI18n } from "vue-i18n";

const props = defineProps<{ event: SnTimelineEvent }>();

const { t } = useI18n();
const createdAt = computed(() => props.event.createdAt);

interface ServiceEventData {
  source?: string;
  event_type?: string;
  account_id?: string;
  payload?: Record<string, unknown> | null;
}

const data = computed<ServiceEventData>(() => {
  const raw = props.event.data;
  if (raw == null || typeof raw !== "object") return {};
  return raw as ServiceEventData;
});

const eventType = computed(() => data.value.event_type ?? "");
const payload = computed<Record<string, unknown>>(
  () =>
    (data.value.payload as Record<string, unknown> | null | undefined) ?? {},
);

const eventLabels: Record<string, string> = {
  "realm.created": "account.timelineEvent.realmCreated",
  "realm.joined": "account.timelineEvent.realmJoined",
  "work.reviewed": "account.timelineEvent.workReviewed",
  "work.review_deleted": "account.timelineEvent.workReviewDeleted",
  "work.status_updated": "account.timelineEvent.workStatusUpdated",
};

const eventLabel = computed(() => {
  const key = eventLabels[eventType.value];
  return key ? t(key) : t("account.timelineEvent.generic");
});

const eventIcon = computed(() => {
  switch (eventType.value) {
    case "realm.created":
    case "realm.joined":
      return IconUsers;
    case "work.reviewed":
      return IconStar;
    case "work.review_deleted":
      return IconStarOff;
    case "work.status_updated":
      return IconBadgeCheck;
    default:
      return IconSparkles;
  }
});

const WORK_STATUS_LABELS: Record<string, string> = {
  plan_to_watch: "account.timelineEvent.workStatus.plan_to_watch",
  watching: "account.timelineEvent.workStatus.watching",
  completed: "account.timelineEvent.workStatus.completed",
  on_hold: "account.timelineEvent.workStatus.on_hold",
  dropped: "account.timelineEvent.workStatus.dropped",
};

const statusLabel = computed(() => {
  if (eventType.value !== "work.status_updated") return "";
  const status = String(payload.value.status ?? "");
  const key = WORK_STATUS_LABELS[status];
  return key ? t(key) : status;
});

// The actor is not hydrated by the feed; resolve the public account by id.
const account = ref<SnAccount | null>(null);
watchEffect(async () => {
  const accountId = data.value.account_id;
  if (!accountId) return;
  try {
    account.value = await fetchAccount(accountId);
  } catch {
    account.value = null;
  }
});
</script>
