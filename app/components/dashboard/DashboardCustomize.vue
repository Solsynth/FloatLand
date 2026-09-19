<template>
  <div class="dropdown dropdown-end">
    <button
      type="button"
      tabindex="0"
      class="btn btn-ghost btn-circle btn-sm text-base-content/50"
      :aria-label="t('dashboard.customize.title')"
    >
      <IconSlidersHorizontal class="h-4 w-4" />
    </button>

    <div
      tabindex="0"
      class="dropdown-content z-50 mt-2 w-72 rounded-box border border-base-content/10 bg-base-100 p-2 shadow-lg"
    >
      <p class="px-2 pb-1 pt-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-base-content/50">
        {{ t("dashboard.customize.title") }}
      </p>

      <div
        v-for="module in modules"
        :key="module.id"
        class="flex items-center gap-1.5 rounded-box px-1.5 py-1 transition-colors hover:bg-base-200/70"
      >
        <span class="flex flex-col">
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-square -my-0.5 text-base-content/40 disabled:opacity-30"
            :disabled="indexOf(module.id) <= 0"
            :aria-label="t('dashboard.customize.moveUp')"
            @click="move(module.id, -1)"
          >
            <IconChevronUp class="h-3 w-3" />
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-square -my-0.5 text-base-content/40 disabled:opacity-30"
            :disabled="indexOf(module.id) < 0 || indexOf(module.id) >= modules.length - 1"
            :aria-label="t('dashboard.customize.moveDown')"
            @click="move(module.id, 1)"
          >
            <IconChevronDown class="h-3 w-3" />
          </button>
        </span>

        <span class="flex-1 truncate text-sm font-medium text-base-content/80">
          {{ t(module.labelKey) }}
        </span>

        <input
          type="checkbox"
          class="toggle toggle-xs toggle-primary"
          :checked="isVisible(module.id)"
          :aria-label="t('dashboard.customize.toggle', { module: t(module.labelKey) })"
          @change="toggle(module.id)"
        >
      </div>

      <button
        v-if="isCustomized"
        type="button"
        class="btn btn-ghost btn-xs mt-1 w-full text-base-content/60"
        @click="reset"
      >
        <IconRotateCcw class="h-3 w-3" />
        {{ t("dashboard.customize.reset") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconSlidersHorizontal,
  IconChevronUp,
  IconChevronDown,
  IconRotateCcw,
} from "#components";
import { DASHBOARD_MODULES, useDashboardConfig } from "~/composables/useDashboardConfig";

const { t } = useI18n();
const { isVisible, indexOf, toggle, move, reset, isCustomized } = useDashboardConfig();

const modules = DASHBOARD_MODULES;
</script>
