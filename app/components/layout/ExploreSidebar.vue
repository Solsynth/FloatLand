<template>
  <div class="flex w-full flex-col gap-5">
    <!-- Search -->
    <div v-if="showSearch" class="relative">
      <input
        v-model="searchQuery"
        type="search"
        :placeholder="t('common.search')"
        :aria-label="t('common.search')"
        class="rail-search input w-full pr-10"
        @keyup.enter="handleSearch"
      />
      <button
        type="button"
        :aria-label="t('common.search')"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 transition-colors hover:text-base-content/70"
        @click="handleSearch"
      >
        <IconSearch class="h-4 w-4" />
      </button>
    </div>

    <!-- Discovery (categories + tags) -->
    <ExploreDiscovery v-if="showDiscovery" />

    <!-- External resources -->
    <div class="px-2 text-xs leading-relaxed text-base-content/40">
      <p>{{ t("sidebar.copyright", { year: currentYear }) }}</p>
      <div class="flex flex-wrap gap-2 text-xs">
        <a
          :href="aboutUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-hover"
        >{{ t("sidebar.about") }}</a>
        <span class="text-base-content/30">&middot;</span>
        <a
          :href="privacyUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-hover"
        >{{ t("sidebar.privacy") }}</a>
        <span class="text-base-content/30">&middot;</span>
        <a
          :href="userAgreementUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-hover"
        >{{ t("sidebar.terms") }}</a>
        <span class="text-base-content/30">&middot;</span>
        <a
          :href="helpUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-hover"
        >{{ t("sidebar.help") }}</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconSearch } from "#components";

const { t, locale } = useI18n();

withDefaults(
  defineProps<{ showSearch?: boolean; showDiscovery?: boolean }>(),
  {
    showSearch: true,
    showDiscovery: true,
  },
);

const currentYear = new Date().getFullYear();
const searchQuery = ref("");

const aboutUrl = "https://solsynth.dev/products-solar-network";
const privacyUrl = "https://solsynth.dev/legal/privacy-policy";
const userAgreementUrl = "https://solsynth.dev/legal/user-agreements";
const helpUrl = computed(() =>
  locale.value.startsWith("zh")
    ? "https://kb.solsynth.dev/zh/solar-network/"
    : "https://kb.solsynth.dev/solar-network/",
);

function handleSearch() {
  if (searchQuery.value.trim()) {
    navigateTo(`/search?q=${encodeURIComponent(searchQuery.value.trim())}`);
  }
}
</script>
