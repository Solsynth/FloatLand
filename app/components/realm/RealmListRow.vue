<template>
  <NuxtLink
    :to="`/realms/${realm.slug}`"
    class="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-base-200/40"
  >
    <div class="avatar shrink-0">
      <div class="h-10 w-10 rounded-full">
        <FileImage
          v-if="pictureUrl"
          :file="pictureUrl"
          :alt="realm.name"
          class="h-full w-full object-cover"
          loading="lazy"
        />
        <div
          v-else
          class="flex h-full w-full items-center justify-center bg-primary text-sm font-bold text-primary-content"
        >
          {{ realm.name.charAt(0).toUpperCase() }}
        </div>
      </div>
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="truncate text-sm font-semibold">{{ realm.name }}</span>
        <span
          v-if="!realm.isPublic"
          class="badge badge-xs badge-ghost gap-0.5"
        >
          <IconLock class="h-2.5 w-2.5" />
        </span>
        <span
          v-if="realm.boostLevel > 0"
          class="badge badge-xs badge-primary gap-0.5"
        >
          <IconRocket class="h-2.5 w-2.5" />
          {{ t("realms.lv", { level: realm.boostLevel }) }}
        </span>
      </div>
      <p
        v-if="realm.description"
        class="mt-0.5 truncate text-xs text-base-content/50"
      >
        {{ realm.description }}
      </p>
      <p v-else class="mt-0.5 truncate text-xs text-base-content/40">
        @{{ realm.slug }}
      </p>
    </div>

    <IconChevronRight
      class="h-4 w-4 shrink-0 text-base-content/25 transition-colors group-hover:text-base-content/50"
    />
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Realm } from "~/types/realm";
import { IconLock, IconRocket, IconChevronRight } from "#components";

const { t } = useI18n();

const props = defineProps<{
  realm: Realm;
}>();

const pictureUrl = computed(() => props.realm.picture ?? null);
</script>
