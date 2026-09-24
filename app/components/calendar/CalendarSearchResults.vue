<template>
  <div class="space-y-4">
    <p v-if="loading" class="py-10 text-center text-sm text-base-content/50">
      {{ t("common.loading") }}
    </p>

    <p v-else-if="error" class="py-10 text-center text-sm text-error">
      {{ error }}
    </p>

    <p
      v-else-if="items.length === 0"
      class="py-10 text-center text-sm text-base-content/50"
    >
      {{ t("calendar.searchEmpty") }}
    </p>

    <template v-else>
      <p class="text-lg font-bold">
        {{ t("calendar.searchResults", { n: items.length }) }}
      </p>

      <section v-for="section in sections" :key="section.key" class="space-y-2">
        <h3 class="px-1 text-sm font-semibold">{{ section.label }}</h3>
        <template v-for="row in section.rows" :key="row.key">
          <CalendarEventTile
            v-if="row.event"
            :event="row.event"
            :editable="editable"
            :self-name="selfName"
            @edit="emit('edit', $event)"
          />
          <button
            v-else-if="row.notable"
            type="button"
            class="flex w-full items-center gap-2 rounded-box bg-accent/10 px-3 py-2 text-left"
            @click="emit('open-notable', row.notable)"
          >
            <IconPartyPopper class="h-4 w-4 shrink-0 text-accent" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold">
                {{ row.notableLabel }}
              </span>
              <span class="block truncate text-xs text-base-content/60">
                {{ row.dateLabel }}
              </span>
            </span>
            <IconChevronRight class="h-4 w-4 shrink-0 text-base-content/40" />
          </button>
        </template>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { IconChevronRight, IconPartyPopper } from "#components";
import type {
  CalendarEvent,
  CalendarSearchItem,
  NotableDayDetail,
} from "~/utils/api";
import {
  formatFullDate,
  formatShortDate,
  notableDayName,
  parseCalendarDate,
  toDateKey,
} from "~/utils/calendar";

const props = defineProps<{
  items: CalendarSearchItem[];
  loading: boolean;
  error: string | null;
  editable: boolean;
  selfName?: string | null;
}>();

const emit = defineEmits<{
  edit: [event: CalendarEvent];
  "open-notable": [detail: NotableDayDetail];
}>();

const { t, locale } = useI18n();

const sections = computed(() => {
  const grouped = new Map<string, CalendarSearchItem[]>();
  for (const item of props.items) {
    const key = toDateKey(parseCalendarDate(item.startTime));
    const bucket = grouped.get(key);
    if (bucket) bucket.push(item);
    else grouped.set(key, [item]);
  }

  const timestamp = (item: CalendarSearchItem) =>
    parseCalendarDate(item.startTime).getTime();

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entries]) => ({
      key,
      label: formatFullDate(parseCalendarDate(key), locale.value),
      rows: [...entries]
        .sort((a, b) => {
          const allDayDiff =
            Number(b.userEvent?.isAllDay ?? false) -
            Number(a.userEvent?.isAllDay ?? false);
          return allDayDiff !== 0 ? allDayDiff : timestamp(a) - timestamp(b);
        })
        .map((item, index) => ({
          key: `${key}-${index}`,
          event: item.userEvent,
          notable: item.notableDay,
          notableLabel: item.notableDay ? notableDayName(item.notableDay) : "",
          dateLabel: formatShortDate(parseCalendarDate(item.startTime), locale.value),
        })),
    }));
});
</script>
