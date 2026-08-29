<template>
  <NuxtLink
    :to="`/realms/${realm.slug}`"
    class="group block overflow-hidden rounded-box bg-base-100 transition-colors hover:bg-base-200"
  >
    <!-- Banner + overlapping avatar (Flutter RealmListTile card) -->
    <div class="relative aspect-[16/7] w-full bg-base-200">
      <FileImage
        v-if="backgroundUrl"
        :file="backgroundUrl"
        :alt="`${realm.name} background`"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <div
        class="absolute -bottom-6 left-4 h-12 w-12 overflow-hidden rounded-full ring-4 ring-base-100 sm:h-14 sm:w-14"
      >
        <FileImage
          v-if="pictureUrl"
          :file="pictureUrl"
          :alt="realm.name"
          class="h-full w-full object-cover"
          loading="lazy"
        />
        <div
          v-else
          class="flex h-full w-full items-center justify-center bg-primary text-sm font-bold text-primary-content sm:text-base"
        >
          {{ realm.name.charAt(0).toUpperCase() }}
        </div>
      </div>
    </div>

    <div class="px-4 pb-3.5 pt-9 sm:px-5">
      <div class="flex items-start gap-2">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-1.5">
            <h3 class="truncate text-sm font-semibold sm:text-base">
              {{ realm.name }}
            </h3>
            <span
              v-if="!realm.isPublic"
              class="badge badge-xs badge-ghost gap-0.5"
            >
              <IconLock class="h-2.5 w-2.5" />
              {{ t("realms.realmPrivate") }}
            </span>
            <span
              v-if="realm.boostLevel > 0"
              class="badge badge-xs badge-primary gap-0.5"
            >
              <IconRocket class="h-2.5 w-2.5" />
              {{ t("realms.lv", { level: realm.boostLevel }) }}
            </span>
          </div>
          <p class="mt-0.5 truncate text-xs text-base-content/45">
            @{{ realm.slug }}
          </p>
          <p
            v-if="realm.description"
            class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-base-content/60 sm:text-sm"
          >
            {{ realm.description }}
          </p>
        </div>
        <IconChevronRight
          class="mt-0.5 h-4 w-4 shrink-0 text-base-content/25 transition-colors group-hover:text-base-content/50"
        />
      </div>
    </div>
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
const backgroundUrl = computed(() => props.realm.background ?? null);
</script>
