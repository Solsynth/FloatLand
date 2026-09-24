<template>
  <div class="space-y-5">
    <p class="text-lg font-bold">
      {{ t("calendar.weekNumber", { n: weekNumberOfSelected }) }}
    </p>

    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="day in weekDays"
        :key="toDateKey(day)"
        class="flex flex-col items-center gap-1"
      >
        <span class="text-[11px] text-base-content/60">
          {{ formatWeekdayShort(day, locale) }}
        </span>
        <button
          type="button"
          class="btn btn-circle btn-xs"
          :class="
            sameDay(day, selectedDate) ? 'btn-primary' : 'btn-ghost'
          "
          @click="emit('select', day)"
        >
          {{ day.getDate() }}
        </button>
      </div>
    </div>

    <p
      v-if="sections.length === 0"
      class="py-10 text-center text-sm text-base-content/50"
    >
      {{ t("calendar.noEventsWeek") }}
    </p>

    <section
      v-for="section in sections"
      :key="section.key"
      class="space-y-2"
    >
      <h3 class="px-1 text-sm font-semibold">{{ section.label }}</h3>
      <CalendarEventTile
        v-for="event in section.events"
        :key="event.id"
        :event="event"
        :editable="editable"
        :self-name="selfName"
        @edit="emit('edit', $event)"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent, EventCalendarEntry } from "~/utils/api";
import {
  buildWeekDays,
  eventsForDay,
  formatFullDate,
  formatWeekdayShort,
  sameDay,
  toDateKey,
  weekOfMonth,
} from "~/utils/calendar";

const props = defineProps<{
  entries: EventCalendarEntry[];
  selectedDate: Date;
  editable: boolean;
  selfName?: string | null;
}>();

const emit = defineEmits<{
  select: [day: Date];
  edit: [event: CalendarEvent];
}>();

const { t, locale } = useI18n();

const weekDays = computed(() => buildWeekDays(props.selectedDate));

const weekNumberOfSelected = computed(() => weekOfMonth(props.selectedDate));

const sections = computed(() =>
  weekDays.value
    .map((day) => ({
      key: toDateKey(day),
      label: formatFullDate(day, locale.value),
      events: eventsForDay(props.entries, day),
    }))
    .filter((section) => section.events.length > 0),
);
</script>
