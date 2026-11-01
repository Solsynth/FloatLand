<template>
  <transition name="step">
    <aside
      v-if="visible"
      class="card-tint mb-3 flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-card px-4 py-3"
      :aria-label="t('home.appBanner.title')"
    >
      <span
        class="grid size-8 shrink-0 place-items-center rounded-chip bg-primary/15 text-primary"
        aria-hidden="true"
      >
        <IconSmartphone class="size-4" />
      </span>

      <div class="min-w-0 flex-1">
        <p class="text-[13px] font-semibold leading-snug text-base-content">
          {{ t("home.appBanner.title") }}
        </p>
        <p class="mt-0.5 text-2xs leading-relaxed text-dim">
          {{ t("home.appBanner.body") }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <a
          :href="APP_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-primary btn-xs"
        >
          {{ t("home.appBanner.download") }}
        </a>
        <a
          :href="WEB_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-xs bg-base-100 text-dim hover:bg-base-200 hover:text-base-content"
        >
          {{ t("home.appBanner.web") }}
        </a>
        <button
          type="button"
          class="btn btn-xs btn-quiet px-1.5"
          :title="t('home.appBanner.dismiss')"
          :aria-label="t('home.appBanner.dismiss')"
          @click="dismiss"
        >
          <IconX class="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  </transition>
</template>

<script setup lang="ts">
import { IconSmartphone, IconX } from "#components";

/**
 * The one line this explorer has to say about itself.
 *
 * It sits above the feed and asks for nothing: the feed is fully readable
 * without an account, so the banner's job is to name the products that make
 * participating easier, not to gate the page behind a signup. A reader who
 * closes it keeps it closed.
 */
const { t } = useI18n();
const { dismissed, dismiss } = useDismissible("app-banner");

const APP_URL = "https://solsynth.dev/products/solar-network";
const WEB_URL = "https://web.solian.app";

const visible = computed(() => !dismissed.value);
</script>
