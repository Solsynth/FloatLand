<template>
  <div
    class="feed-discovery-card flex h-full flex-col p-3"
  >
    <div class="flex items-center gap-2.5">
      <div v-if="accountPictureUrl" class="avatar shrink-0">
        <div class="h-11 w-11 rounded-full">
          <img
            :src="accountPictureUrl"
            :alt="account.nick || account.name"
            class="h-full w-full rounded-full object-cover"
          />
        </div>
      </div>
      <div v-else class="avatar avatar-placeholder shrink-0">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-full bg-base-200 text-base-content"
        >
          <span class="text-sm font-medium">{{
            getInitials(account.nick || account.name)
          }}</span>
        </div>
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold">
          {{ account.nick || account.name }}
        </p>
        <p class="truncate text-xs text-base-content/50">@{{ account.name }}</p>
      </div>
    </div>

    <p
      v-if="account.profile?.bio"
      class="mt-2 line-clamp-2 text-xs leading-relaxed text-base-content/60"
    >
      {{ account.profile.bio }}
    </p>

    <p
      v-if="reasons.length > 0"
      class="mt-2 flex items-start gap-1 text-[11px] text-base-content/45"
    >
      <IconSparkles class="mt-0.5 h-3 w-3 shrink-0" />
      <span class="line-clamp-2">{{ reasons[0] }}</span>
    </p>

    <NuxtLink
      :to="`/accounts/${account.name}`"
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
import { IconSparkles } from "#components";

const { t } = useI18n();

const props = defineProps<{
  item: DiscoveryItem;
}>();

const accountPictureUrl = computed(() => {
  if (!account.value.profile?.picture) return undefined;
  return getFileUrl(account.value.profile.picture.id) ?? undefined;
});
 
const reasons = computed(() => props.item.reasons ?? []);

</script>
