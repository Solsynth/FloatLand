<template>
  <div class="space-y-5">
    <div class="flex items-center gap-3">
      <span
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-box bg-primary/10 text-lg font-bold text-primary"
      >
        {{ date.getDate() }}
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold">
          {{ formatWeekday(date, locale) }}
        </p>
        <p class="truncate text-xs text-base-content/60">
          {{ formatFullDate(date, locale) }}
        </p>
      </div>
      <button
        v-if="editable"
        type="button"
        class="btn btn-circle btn-sm btn-ghost"
        :aria-label="t('calendar.addEvent')"
        @click="emit('add', date)"
      >
        <IconPlus class="h-4 w-4" />
      </button>
    </div>

    <section v-if="notableDays.length" class="space-y-2">
      <h3 class="text-xs font-semibold text-accent">
        {{ t("calendar.notableDays") }}
      </h3>
      <button
        v-for="day in notableDays"
        :key="day.date + notableDayName(day)"
        type="button"
        class="flex w-full items-center gap-2 rounded-box bg-accent/10 px-3 py-2 text-left text-sm"
        @click="emit('open-notable', day)"
      >
        <IconPartyPopper class="h-4 w-4 shrink-0 text-accent" />
        <span class="min-w-0 flex-1 truncate">{{ notableDayName(day) }}</span>
      </button>
    </section>

    <section v-if="events.length" class="space-y-2">
      <h3 class="text-xs font-semibold text-primary">
        {{ t("calendar.events") }}
      </h3>
      <CalendarEventTile
        v-for="event in events"
        :key="event.id"
        :event="event"
        :editable="editable"
        :self-name="selfName"
        @edit="emit('edit', $event)"
      />
    </section>

    <section class="space-y-2">
      <h3 class="text-xs font-semibold text-secondary">
        {{ t("calendar.checkIn") }}
      </h3>
      <CalendarCheckInSection
        :result="checkIn"
        :is-today="isToday"
        :can-draw="canDraw"
        :drawing="drawing"
        @draw="emit('draw')"
      />
    </section>

    <section v-if="statuses.length" class="space-y-2">
      <h3 class="text-xs font-semibold text-base-content/60">
        {{ t("calendar.statuses") }}
      </h3>
      <div
        v-for="status in statuses"
        :key="status.id || status.label"
        class="flex items-center gap-2 rounded-box bg-base-200/60 px-3 py-2 text-xs"
      >
        <FileImage
          v-if="status.icon"
          :file="status.icon"
          alt=""
          class="h-5 w-5 shrink-0 rounded-full object-cover"
        />
        <IconSmile v-else-if="status.attitude === 0" class="h-4 w-4 shrink-0" />
        <IconFrown v-else-if="status.attitude === 2" class="h-4 w-4 shrink-0" />
        <IconMeh v-else class="h-4 w-4 shrink-0" />
        <span class="truncate">{{ status.label || status.symbol }}</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  IconFrown,
  IconMeh,
  IconPartyPopper,
  IconPlus,
  IconSmile,
} from "#components";
import type {
  CalendarEvent,
  CalendarStatus,
  CheckInResult,
  EventCalendarEntry,
  NotableDay,
} from "~/utils/api";
import { formatFullDate, formatWeekday, notableDayName } from "~/utils/calendar";

const props = defineProps<{
  date: Date;
  entry: EventCalendarEntry | null;
  events: CalendarEvent[];
  checkIn: CheckInResult | null;
  editable: boolean;
  selfName?: string | null;
  isToday: boolean;
  canDraw: boolean;
  drawing: boolean;
}>();

const emit = defineEmits<{
  add: [day: Date];
  edit: [event: CalendarEvent];
  draw: [];
  "open-notable": [day: NotableDay];
}>();

const { t, locale } = useI18n();

const notableDays = computed(() => props.entry?.notableDays ?? []);
const statuses = computed<CalendarStatus[]>(() => props.entry?.statuses ?? []);
</script>
