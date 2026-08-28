<template>
  <div
    class="feed-discovery-card flex h-full flex-col p-3"
  >
    <div class="flex items-center gap-2.5">
      <div v-if="publisherPictureUrl" class="avatar shrink-0">
        <div class="h-11 w-11 rounded-full">
          <img
            :src="publisherPictureUrl"
            :alt="publisher.nick || publisher.name"
            class="h-full w-full rounded-full object-cover"
          />
        </div>
      </div>
      <div v-else class="avatar avatar-placeholder shrink-0">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-full bg-base-200 text-base-content"
        >
          <span class="text-sm font-medium">{{
            getInitials(publisher.nick || publisher.name)
          }}</span>
        </div>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1">
          <p class="truncate text-sm font-semibold">
            {{ publisher.nick || publisher.name }}
          </p>
          <IconBadgeCheck
            v-if="publisher.verification"
            class="h-3.5 w-3.5 shrink-0 text-primary"
          />
        </div>
        <p class="truncate text-xs text-base-content/50">@{{ publisher.name }}</p>
      </div>
    </div>

    <p
      v-if="publisher.bio"
      class="mt-2 line-clamp-2 text-xs leading-relaxed text-base-content/60"
    >
      {{ publisher.bio }}
    </p>

    <p
      v-if="reasons.length > 0"
      class="mt-2 flex items-start gap-1 text-[11px] text-base-content/45"
    >
      <IconSparkles class="mt-0.5 h-3 w-3 shrink-0" />
      <span class="line-clamp-2">{{ reasons[0] }}</span>
    </p>

    <NuxtLink
      :to="`/publishers/${publisher.name}`"
      class="btn btn-sm btn-ghost mt-3 border border-base-300/80 bg-base-200/50 hover:bg-base-200"
    >
      {{ t("home.discovery.viewProfile") }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { DiscoveryItem } from "~/types/post";
import { getFileUrl } from "~/utils/files";
import { getInitials } from "~/utils/identity";
import { IconBadgeCheck, IconSparkles } from "#components";

const { t } = useI18n();

const props = defineProps<{
  item: DiscoveryItem;
}>();

const publisher = computed(() => {
  const data = props.item.data as unknown as {
    id: string;
    name: string;
    nick?: string;
    bio?: string;
    picture?: { id: string };
    verification?: unknown;
  };
  return data;
});

const publisherPictureUrl = computed(() => {
  if (!publisher.value.picture) return undefined;
  return getFileUrl(publisher.value.picture.id) ?? undefined;
});

const reasons = computed(() => props.item.reasons ?? []);
</script>
