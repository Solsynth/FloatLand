<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-2">
      <button
        type="button"
        class="btn btn-circle btn-ghost btn-sm"
        :aria-label="t('calendar.prevMonth')"
        @click="emit('change-month', addMonths(focusedMonth, -1))"
      >
        <IconChevronLeft class="h-4 w-4" />
      </button>
      <span class="text-sm font-semibold">
        {{ formatMonthYear(focusedMonth, locale) }}
      </span>
      <button
        type="button"
        class="btn btn-circle btn-ghost btn-sm"
        :aria-label="t('calendar.nextMonth')"
        @click="emit('change-month', addMonths(focusedMonth, 1))"
      >
        <IconChevronRight class="h-4 w-4" />
      </button>
    </div>

    <div class="grid grid-cols-7 gap-px text-center">
      <template v-for="cell in cells" :key="toDateKey(cell)">
        <button
          type="button"
          class="mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors"
          :class="cellClass(cell)"
          @click="emit('select-date', cell)"
        >
          {{ cell.getDate() }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconChevronLeft, IconChevronRight } from "#components";
import {
  addMonths,
  buildMonthCells,
  formatMonthYear,
  sameDay,
  toDateKey,
} from "~/utils/calendar";

const props = defineProps<{
  selectedDate: Date;
  focusedMonth: Date;
}>();

const emit = defineEmits<{
  "select-date": [day: Date];
  "change-month": [month: Date];
}>();

const { t, locale } = useI18n();

const cells = computed(() => buildMonthCells(props.focusedMonth));

function cellClass(cell: Date): Record<string, boolean> {
  const inMonth =
    cell.getMonth() === props.focusedMonth.getMonth() &&
    cell.getFullYear() === props.focusedMonth.getFullYear();
  return {
    "bg-primary font-semibold text-primary-content": sameDay(
      cell,
      props.selectedDate,
    ),
    "text-base-content/35": !inMonth,
    "hover:bg-base-200": !sameDay(cell, props.selectedDate),
  };
}
</script>
