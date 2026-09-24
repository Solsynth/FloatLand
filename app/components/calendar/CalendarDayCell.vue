<template>
  <button
    type="button"
    class="relative flex h-full min-h-16 flex-col items-start gap-0.5 border-base-300 p-1.5 text-left transition-colors sm:min-h-20"
    :class="[borderClass, stateClass]"
    @click="emit('select', day)"
  >
    <span class="text-sm font-semibold leading-none" :class="numberClass">
      {{ day.getDate() }}
    </span>

    <span
      v-if="checkInLabel"
      class="w-full truncate text-[10px] font-semibold leading-tight"
    >
      {{ checkInLabel }}
    </span>

    <span
      v-for="status in statusIcons"
      :key="status.id || status.label"
      class="flex items-center gap-1 text-[10px] leading-tight text-base-content/60"
    >
      <FileImage
        v-if="status.icon"
        :file="status.icon"
        alt=""
        class="h-3 w-3 shrink-0 rounded-full object-cover"
      />
      <IconSmile v-else-if="status.attitude === 0" class="h-3 w-3 shrink-0" />
      <IconFrown v-else-if="status.attitude === 2" class="h-3 w-3 shrink-0" />
      <IconMeh v-else class="h-3 w-3 shrink-0" />
      <span class="truncate">{{ status.label }}</span>
    </span>

    <span
      v-if="firstEvent"
      class="flex w-full items-center gap-1 text-[10px] leading-tight text-base-content/70"
    >
      <IconCalendarDays class="h-3 w-3 shrink-0 text-primary" />
      <span class="truncate">{{ firstEvent.title }}</span>
    </span>
    <span
      v-else-if="notableLabel"
      class="w-full truncate text-[10px] leading-tight text-accent"
    >
      {{ notableLabel }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { IconCalendarDays, IconFrown, IconMeh, IconSmile } from "#components";
import type { CalendarEvent, CalendarStatus, EventCalendarEntry } from "~/utils/api";
import { notableDayName, sameDay } from "~/utils/calendar";

const props = defineProps<{
  day: Date;
  focusedMonth: Date;
  selectedDate: Date;
  entry: EventCalendarEntry | null;
  events: CalendarEvent[];
  gridIndex: number;
}>();

const emit = defineEmits<{ select: [day: Date] }>();

const { t } = useI18n();

const borderClass = computed(() => [
  props.gridIndex % 7 === 6 ? "" : "border-r",
  Math.floor(props.gridIndex / 7) === 5 ? "" : "border-b",
]);

const stateClass = computed(() => {
  if (sameDay(props.day, props.selectedDate)) {
    return "z-10 bg-primary/15 ring-1 ring-primary";
  }
  if (sameDay(props.day, new Date())) return "bg-primary/5";
  return "hover:bg-base-200/60";
});

const numberClass = computed(() => {
  const inMonth =
    props.day.getMonth() === props.focusedMonth.getMonth() &&
    props.day.getFullYear() === props.focusedMonth.getFullYear();
  if (sameDay(props.day, props.selectedDate)) return "text-primary";
  if (sameDay(props.day, new Date())) return "text-primary";
  return inMonth ? "text-base-content" : "text-base-content/35";
});

const checkInLabel = computed(() => {
  const level = props.entry?.checkInResult?.level;
  return level == null ? null : t(`calendar.fortuneLevelShort${level}`);
});

const statusIcons = computed<CalendarStatus[]>(() =>
  (props.entry?.statuses ?? []).slice(0, 2),
);

const firstEvent = computed(() => props.events[0] ?? null);

const notableLabel = computed(() => {
  const day = props.entry?.notableDays?.[0];
  return day ? notableDayName(day) : null;
});
</script>
