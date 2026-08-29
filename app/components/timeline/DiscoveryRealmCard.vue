<template>
  <div
    class="feed-discovery-card flex h-full flex-col p-3"
  >
    <div class="flex items-center gap-2.5">
      <div v-if="realmPicture" class="avatar shrink-0">
        <div class="h-11 w-11 rounded-lg">
          <FileImage
            :file="realmPicture"
            :alt="realm.name"
            class="h-full w-full rounded-lg object-cover"
          />
        </div>
      </div>
      <div
        v-else
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-base-200"
      >
        <IconGlobe class="h-5 w-5 text-base-content/55" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold">{{ realm.name }}</p>
        <p v-if="realm.slug" class="truncate text-xs text-base-content/50">
          /{{ realm.slug }}
        </p>
      </div>
    </div>

    <p
      v-if="realm.description"
      class="mt-2 line-clamp-2 text-xs leading-relaxed text-base-content/60"
    >
      {{ realm.description }}
    </p>

    <p
      v-if="reasons.length > 0"
      class="mt-2 flex items-start gap-1 text-[11px] text-base-content/45"
    >
      <IconSparkles class="mt-0.5 h-3 w-3 shrink-0" />
      <span class="line-clamp-2">{{ reasons[0] }}</span>
    </p>

    <NuxtLink
      :to="`/realms/${realm.slug}`"
      class="btn btn-sm btn-ghost mt-3 border border-base-300/80 bg-base-200/50 hover:bg-base-200"
    >
      {{ t("home.discovery.viewRealm") }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { DiscoveryItem } from "~/types/post";
import { IconGlobe, IconSparkles } from "#components";

const { t } = useI18n();

const props = defineProps<{
  item: DiscoveryItem;
}>();

const realm = computed(() => {
  const data = props.item.data as unknown as {
    id: string;
    name: string;
    slug: string;
    description?: string;
    picture?: { id: string };
  };
  return data;
});

const realmPicture = computed(() => {
  return realm.value.picture ?? undefined;
});

const reasons = computed(() => props.item.reasons ?? []);
</script>
