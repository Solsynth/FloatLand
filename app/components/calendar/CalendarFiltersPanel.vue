<template>
  <div class="space-y-5">
    <div class="flex rounded-box bg-base-200 p-1 text-xs">
      <button
        v-for="option in modeOptions"
        :key="option.value"
        type="button"
        class="flex-1 rounded-box px-2 py-1.5 font-medium transition-colors"
        :class="
          mode === option.value
            ? 'bg-base-100 text-base-content shadow-sm'
            : 'text-base-content/60 hover:text-base-content'
        "
        @click="emit('update:mode', option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <CalendarMonthPicker
      :selected-date="selectedDate"
      :focused-month="focusedMonth"
      @select-date="emit('select-date', $event)"
      @change-month="emit('change-month', $event)"
    />

    <label class="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        class="checkbox checkbox-primary checkbox-sm mt-0.5"
        :checked="includeNotableDays"
        @change="
          emit(
            'update:includeNotableDays',
            ($event.target as HTMLInputElement).checked,
          )
        "
      >
      <span class="min-w-0">
        <span class="block text-sm font-medium">
          {{ t("calendar.includeNotableDays") }}
        </span>
        <span class="block text-xs text-base-content/60">
          {{ t("calendar.includeNotableDaysDesc") }}
        </span>
      </span>
    </label>

    <div v-if="usedTags.length || selectedTags.length" class="space-y-2">
      <h3 class="text-xs font-semibold text-base-content/60">
        {{ t("calendar.filterByTags") }}
      </h3>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="tag in usedTags"
          :key="tag"
          type="button"
          class="badge"
          :class="
            selectedTags.includes(tag) ? 'badge-primary' : 'badge-ghost'
          "
          @click="emit('toggle-tag', tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <h3 class="text-xs font-semibold text-base-content/60">
        {{ t("calendar.notableDayType") }}
      </h3>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="tag in NOTABLE_DAY_TAGS"
          :key="tag.value"
          type="button"
          class="badge"
          :class="notableDayTag === tag.value ? 'badge-primary' : 'badge-ghost'"
          @click="
            emit('set-notable-tag', notableDayTag === tag.value ? null : tag.value)
          "
        >
          {{ t(`calendar.notableDayTag.${tag.key}`) }}
        </button>
      </div>
    </div>

    <button
      v-if="selectedTags.length || notableDayTag !== null"
      type="button"
      class="btn btn-ghost btn-xs gap-1 text-base-content/60"
      @click="emit('clear')"
    >
      <IconX class="h-3.5 w-3.5" />
      {{ t("calendar.clearFilters") }}
    </button>

    <div class="space-y-1 border-t border-base-300 pt-4">
      <h3 class="text-xs font-semibold text-base-content/60">
        {{ t("calendar.selectedDate") }}
      </h3>
      <div class="flex items-center justify-between gap-2">
        <span class="text-sm">{{ formatFullDate(selectedDate, locale) }}</span>
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          @click="emit('today')"
        >
          {{ t("calendar.today") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconX } from "#components";
import type { CalendarViewMode } from "~/utils/calendar";
import { NOTABLE_DAY_TAGS, formatFullDate } from "~/utils/calendar";

defineProps<{
  mode: CalendarViewMode;
  selectedDate: Date;
  focusedMonth: Date;
  includeNotableDays: boolean;
  usedTags: string[];
  selectedTags: string[];
  notableDayTag: number | null;
}>();

const emit = defineEmits<{
  "update:mode": [mode: CalendarViewMode];
  "update:includeNotableDays": [value: boolean];
  "select-date": [day: Date];
  "change-month": [month: Date];
  "toggle-tag": [tag: string];
  "set-notable-tag": [tag: number | null];
  clear: [];
  today: [];
}>();

const { t, locale } = useI18n();

const modeOptions = computed<{ value: CalendarViewMode; label: string }[]>(
  () => [
    { value: "week", label: t("calendar.viewWeek") },
    { value: "month", label: t("calendar.viewMonth") },
  ],
);
</script>
