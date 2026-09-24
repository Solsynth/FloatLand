<template>
  <dialog class="modal" :open="open">
    <div class="modal-box max-w-md">
      <div class="flex items-start gap-3">
        <IconPartyPopper class="mt-0.5 h-6 w-6 shrink-0 text-accent" />
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-lg font-bold">
            {{ displayName || t("calendar.notableDays") }}
          </h3>
          <p v-if="dateLabel" class="mt-1 text-xs text-base-content/60">
            {{ dateLabel }}
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-square btn-sm"
          :aria-label="t('common.close')"
          @click="emit('close')"
        >
          <IconX class="h-4 w-4" />
        </button>
      </div>

      <div class="space-y-3 py-4">
        <p v-if="description" class="text-sm leading-relaxed">
          {{ description }}
        </p>
        <div v-if="tags.length" class="flex flex-wrap gap-1.5">
          <span v-for="tag in tags" :key="tag" class="badge badge-ghost badge-sm">
            {{ tag }}
          </span>
        </div>
        <div v-if="holidays.length" class="flex flex-wrap gap-1.5">
          <span
            v-for="holiday in holidays"
            :key="holiday"
            class="badge badge-primary badge-sm"
          >
            {{ holiday }}
          </span>
        </div>
      </div>

      <div class="modal-action">
        <button type="button" class="btn btn-ghost" @click="emit('close')">
          {{ t("common.close") }}
        </button>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button @click="emit('close')">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { IconPartyPopper, IconX } from "#components";
import type { NotableDay, NotableDayDetail } from "~/utils/api";
import { formatFullDate, notableDayName, parseCalendarDate } from "~/utils/calendar";

const props = defineProps<{
  open: boolean;
  /** Full notable-day payload (search results carry description + tags). */
  detail?: NotableDayDetail | null;
  /** Entry-level notable day, used when no detail payload is available. */
  day?: NotableDay | null;
}>();

const emit = defineEmits<{ close: [] }>();

const { t, locale } = useI18n();

const displayName = computed(() => {
  const source = props.detail ?? props.day;
  return source ? notableDayName(source) : "";
});

const dateLabel = computed(() => {
  const raw = props.detail?.date ?? props.day?.date;
  return raw ? formatFullDate(parseCalendarDate(raw), locale.value) : "";
});

const description = computed(() => props.detail?.description ?? "");
const tags = computed(() => props.detail?.tags ?? []);
const holidays = computed(() =>
  (props.detail?.holidays ?? []).filter(Boolean),
);
</script>
