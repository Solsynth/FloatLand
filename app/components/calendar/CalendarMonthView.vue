<template>
  <div
    class="overflow-hidden rounded-box border border-base-300 bg-base-100"
  >
    <div class="grid grid-cols-7 border-b border-base-300 bg-base-200/40">
      <div
        v-for="label in weekdayLabels"
        :key="label"
        class="px-1 py-2 text-center text-[11px] font-medium text-base-content/60"
      >
        {{ label }}
      </div>
    </div>
    <div class="grid min-h-[58vh] grid-cols-7 grid-rows-6 sm:min-h-[62vh]">
      <CalendarDayCell
        v-for="(cell, index) in cells"
        :key="toDateKey(cell)"
        :day="cell"
        :focused-month="focusedMonth"
        :selected-date="selectedDate"
        :entry="entryByCell(cell)"
        :events="eventsByCell(cell)"
        :grid-index="index"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent, EventCalendarEntry } from "~/utils/api";
import { buildMonthCells, entryForDay, eventsForDay } from "~/utils/calendar";

const props = defineProps<{
  entries: EventCalendarEntry[];
  focusedMonth: Date;
  selectedDate: Date;
}>();

const emit = defineEmits<{ select: [day: Date] }>();

const { t } = useI18n();

const cells = computed(() => buildMonthCells(props.focusedMonth));

const weekdayLabels = computed(() => [
  t("calendar.weekdayMon"),
  t("calendar.weekdayTue"),
  t("calendar.weekdayWed"),
  t("calendar.weekdayThu"),
  t("calendar.weekdayFri"),
  t("calendar.weekdaySat"),
  t("calendar.weekdaySun"),
]);

function entryByCell(cell: Date): EventCalendarEntry | null {
  return entryForDay(props.entries, cell);
}

function eventsByCell(cell: Date): CalendarEvent[] {
  return eventsForDay(props.entries, cell);
}
</script>
