<template>
  <dialog class="modal" :open="props.open">
    <div class="modal-box max-w-xl">
      <div class="flex items-center justify-between pb-2">
        <h3 class="text-lg font-bold">
          {{ isEditing ? t("calendar.editEvent") : t("calendar.addEvent") }}
        </h3>
        <button
          type="button"
          class="btn btn-ghost btn-square btn-sm"
          :aria-label="t('common.close')"
          @click="emit('close')"
        >
          <IconX class="h-4 w-4" />
        </button>
      </div>

      <form class="max-h-[70vh] space-y-4 overflow-y-auto pr-1" @submit.prevent="submit">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("calendar.eventTitle") }}
          </legend>
          <input
            v-model="form.title"
            type="text"
            class="input w-full"
            maxlength="256"
            required
          >
        </fieldset>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("calendar.eventStart") }}
            </legend>
            <input
              v-model="form.start"
              :type="form.isAllDay ? 'date' : 'datetime-local'"
              class="input w-full"
              required
            >
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("calendar.eventEnd") }}
            </legend>
            <input
              v-model="form.end"
              :type="form.isAllDay ? 'date' : 'datetime-local'"
              class="input w-full"
              required
            >
          </fieldset>
        </div>

        <label class="flex cursor-pointer items-center gap-3">
          <input
            v-model="form.isAllDay"
            type="checkbox"
            class="toggle toggle-sm"
          >
          <span class="text-sm">{{ t("calendar.allDay") }}</span>
        </label>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("calendar.eventLocation") }}
          </legend>
          <input
            v-model="form.location"
            type="text"
            class="input w-full"
            maxlength="512"
          >
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("calendar.eventDescription") }}
          </legend>
          <textarea
            v-model="form.description"
            class="textarea w-full"
            rows="3"
            maxlength="4096"
          />
        </fieldset>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("calendar.visibility") }}
            </legend>
            <select v-model.number="form.visibility" class="select w-full">
              <option :value="CALENDAR_EVENT_VISIBILITY.private">
                {{ t("calendar.visibilityPrivate") }}
              </option>
              <option :value="CALENDAR_EVENT_VISIBILITY.friends">
                {{ t("calendar.visibilityFriends") }}
              </option>
              <option :value="CALENDAR_EVENT_VISIBILITY.public">
                {{ t("calendar.visibilityPublic") }}
              </option>
            </select>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("calendar.tags") }}
            </legend>
            <input
              v-model="form.tags"
              type="text"
              class="input w-full"
              :placeholder="t('calendar.tagsHint')"
            >
          </fieldset>
        </div>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("calendar.recurrence") }}
          </legend>
          <select v-model.number="form.recurrenceFrequency" class="select w-full">
            <option :value="CALENDAR_RECURRENCE_FREQUENCY.none">
              {{ t("calendar.recurrenceNone") }}
            </option>
            <option :value="CALENDAR_RECURRENCE_FREQUENCY.daily">
              {{ t("calendar.recurrenceDaily") }}
            </option>
            <option :value="CALENDAR_RECURRENCE_FREQUENCY.weekly">
              {{ t("calendar.recurrenceWeekly") }}
            </option>
            <option :value="CALENDAR_RECURRENCE_FREQUENCY.monthly">
              {{ t("calendar.recurrenceMonthly") }}
            </option>
            <option :value="CALENDAR_RECURRENCE_FREQUENCY.yearly">
              {{ t("calendar.recurrenceYearly") }}
            </option>
          </select>
        </fieldset>

        <template v-if="form.recurrenceFrequency !== CALENDAR_RECURRENCE_FREQUENCY.none">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("calendar.recurrenceInterval") }}
            </legend>
            <input
              v-model.number="form.recurrenceInterval"
              type="number"
              min="1"
              max="365"
              class="input w-full"
            >
          </fieldset>

          <fieldset
            v-if="form.recurrenceFrequency === CALENDAR_RECURRENCE_FREQUENCY.weekly"
            class="fieldset"
          >
            <legend class="fieldset-legend">
              {{ t("calendar.recurrenceDays") }}
            </legend>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="day in WEEKDAYS"
                :key="day.value"
                type="button"
                class="badge"
                :class="form.recurrenceDays.includes(day.value) ? 'badge-primary' : 'badge-ghost'"
                @click="toggleDay(day.value)"
              >
                {{ t(`calendar.weekday${day.label}`) }}
              </button>
            </div>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("calendar.recurrenceEnd") }}
            </legend>
            <select v-model="form.recurrenceEndMode" class="select w-full">
              <option value="never">
                {{ t("calendar.recurrenceEndNever") }}
              </option>
              <option value="onDate">
                {{ t("calendar.recurrenceEndOnDate") }}
              </option>
              <option value="afterOccurrences">
                {{ t("calendar.recurrenceEndAfter") }}
              </option>
            </select>
          </fieldset>

          <fieldset v-if="form.recurrenceEndMode === 'onDate'" class="fieldset">
            <legend class="fieldset-legend">
              {{ t("calendar.recurrenceEndDate") }}
            </legend>
            <input v-model="form.recurrenceEndDate" type="date" class="input w-full">
          </fieldset>

          <fieldset v-else-if="form.recurrenceEndMode === 'afterOccurrences'" class="fieldset">
            <legend class="fieldset-legend">
              {{ t("calendar.recurrenceOccurrences") }}
            </legend>
            <input
              v-model.number="form.recurrenceOccurrences"
              type="number"
              min="1"
              max="500"
              class="input w-full"
            >
          </fieldset>
        </template>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("calendar.eventIcon") }}
            </legend>
            <div class="flex items-center gap-2">
              <FileImage
                v-if="iconFile"
                :file="iconFile"
                alt=""
                class="h-10 w-10 rounded-box object-cover"
              />
              <span
                v-else
                class="flex h-10 w-10 items-center justify-center rounded-box bg-base-200 text-base-content/40"
              >
                <IconImage class="h-4 w-4" />
              </span>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                @click="pickerTarget = 'icon'"
              >
                {{ t("calendar.chooseFile") }}
              </button>
              <button
                v-if="iconFile"
                type="button"
                class="btn btn-ghost btn-circle btn-xs"
                @click="iconFile = null"
              >
                <IconX class="h-3 w-3" />
              </button>
            </div>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("calendar.eventBackground") }}
            </legend>
            <div class="flex items-center gap-2">
              <FileImage
                v-if="backgroundFile"
                :file="backgroundFile"
                alt=""
                class="h-10 w-20 rounded-box object-cover"
              />
              <span
                v-else
                class="flex h-10 w-20 items-center justify-center rounded-box bg-base-200 text-base-content/40"
              >
                <IconImage class="h-4 w-4" />
              </span>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                @click="pickerTarget = 'background'"
              >
                {{ t("calendar.chooseFile") }}
              </button>
              <button
                v-if="backgroundFile"
                type="button"
                class="btn btn-ghost btn-circle btn-xs"
                @click="backgroundFile = null"
              >
                <IconX class="h-3 w-3" />
              </button>
            </div>
          </fieldset>
        </div>

        <div class="modal-action">
          <button
            v-if="isEditing"
            type="button"
            class="btn btn-error btn-outline btn-sm mr-auto gap-1"
            :disabled="submitting"
            @click="remove"
          >
            <IconTrash2 class="h-4 w-4" />
            {{ t("common.delete") }}
          </button>
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="submitting"
            @click="emit('close')"
          >
            {{ t("common.cancel") }}
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="submitting || !form.title.trim()"
          >
            <span v-if="submitting" class="loading loading-spinner loading-xs" />
            {{ t("common.save") }}
          </button>
        </div>
      </form>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button @click="emit('close')">close</button>
    </form>
  </dialog>

  <CloudFileDrawer
    v-model:open="pickerOpen"
    :allow-multiple="false"
    :allowed-types="['image']"
    :usage="
      pickerTarget === 'background'
        ? 'calendar.event.background'
        : 'calendar.event.icon'
    "
    @select="onFileSelected"
  />
</template>

<script setup lang="ts">
import { IconImage, IconTrash2, IconX } from "#components";
import type { CalendarEvent, CalendarRecurrence, CloudFileRef } from "~/utils/api";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "~/utils/api";
import type { SnCloudFile } from "~/types/drive";
import {
  CALENDAR_EVENT_VISIBILITY,
  CALENDAR_RECURRENCE_FREQUENCY,
  parseCalendarDate,
} from "~/utils/calendar";

const props = defineProps<{
  open: boolean;
  event: CalendarEvent | null;
  initialDate?: Date | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
  deleted: [];
}>();

const { t } = useI18n();
const { notify } = useAlert();

const WEEKDAYS = [
  { value: "Monday", label: "Mon" },
  { value: "Tuesday", label: "Tue" },
  { value: "Wednesday", label: "Wed" },
  { value: "Thursday", label: "Thu" },
  { value: "Friday", label: "Fri" },
  { value: "Saturday", label: "Sat" },
  { value: "Sunday", label: "Sun" },
] as const;

interface CalendarEventForm {
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  isAllDay: boolean;
  visibility: number;
  tags: string;
  recurrenceFrequency: number;
  recurrenceInterval: number;
  recurrenceDays: string[];
  recurrenceEndMode: "never" | "onDate" | "afterOccurrences";
  recurrenceEndDate: string;
  recurrenceOccurrences: number;
}

/** Either a freshly picked drive file or an embedded calendar file reference. */
type PickedFile = SnCloudFile | CloudFileRef;

const emptyForm = (): CalendarEventForm => ({
  title: "",
  description: "",
  location: "",
  start: "",
  end: "",
  isAllDay: false,
  visibility: CALENDAR_EVENT_VISIBILITY.private,
  tags: "",
  recurrenceFrequency: CALENDAR_RECURRENCE_FREQUENCY.none,
  recurrenceInterval: 1,
  recurrenceDays: [],
  recurrenceEndMode: "never",
  recurrenceEndDate: "",
  recurrenceOccurrences: 10,
});

const form = ref<CalendarEventForm>(emptyForm());
const iconFile = ref<PickedFile | null>(null);
const backgroundFile = ref<PickedFile | null>(null);
const pickerTarget = ref<"icon" | "background" | null>(null);
const submitting = ref(false);

const pickerOpen = computed({
  get: () => pickerTarget.value !== null,
  set: (value: boolean) => {
    if (!value) pickerTarget.value = null;
  },
});

const isEditing = computed(() => props.event !== null);

function toInputValue(date: Date, dateOnly: boolean): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return dateOnly ? day : `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function resetForm() {
  const base = props.initialDate ?? new Date();
  const next: CalendarEventForm = emptyForm();
  next.start = toInputValue(
    new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0),
    false,
  );
  next.end = toInputValue(
    new Date(base.getFullYear(), base.getMonth(), base.getDate(), 10, 0),
    false,
  );

  const event = props.event;
  if (event) {
    next.title = event.title;
    next.description = event.description ?? "";
    next.location = event.location ?? "";
    next.isAllDay = event.isAllDay;
    next.visibility = event.visibility;
    next.tags = event.tags.join(", ");
    const start = parseCalendarDate(event.startTime);
    const end = parseCalendarDate(event.endTime);
    next.start = toInputValue(start, event.isAllDay);
    next.end = toInputValue(end, event.isAllDay);
    if (event.recurrence) {
      next.recurrenceFrequency = event.recurrence.frequency;
      next.recurrenceInterval = event.recurrence.interval ?? 1;
      next.recurrenceDays = [...(event.recurrence.daysOfWeek ?? [])];
      if (event.recurrence.endDate) {
        next.recurrenceEndMode = "onDate";
        next.recurrenceEndDate = event.recurrence.endDate.slice(0, 10);
      } else if (event.recurrence.occurrences != null) {
        next.recurrenceEndMode = "afterOccurrences";
        next.recurrenceOccurrences = event.recurrence.occurrences;
      }
    }
  }

  form.value = next;
  iconFile.value = event?.icon ?? null;
  backgroundFile.value = event?.background ?? null;
  pickerTarget.value = null;
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) resetForm();
  },
);

watch(
  () => form.value.isAllDay,
  (isAllDay) => {
    const strip = (value: string) => value.slice(0, 10);
    const withTime = (value: string) =>
      value.length > 10 ? value : `${value}T09:00`;
    if (isAllDay) {
      form.value.start = strip(form.value.start);
      form.value.end = strip(form.value.end);
    } else {
      form.value.start = withTime(form.value.start);
      form.value.end = withTime(form.value.end);
    }
  },
);

function toggleDay(day: string) {
  const days = new Set(form.value.recurrenceDays);
  if (days.has(day)) days.delete(day);
  else days.add(day);
  form.value.recurrenceDays = [...days];
}

function onFileSelected(files: SnCloudFile | SnCloudFile[] | null) {
  const file = Array.isArray(files) ? (files[0] ?? null) : files;
  if (pickerTarget.value === "icon") iconFile.value = file;
  else if (pickerTarget.value === "background") backgroundFile.value = file;
  pickerTarget.value = null;
}

function parseTags(input: string): string[] {
  const tags = new Set(
    input
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0),
  );
  return [...tags].sort();
}

function buildRecurrence(): CalendarRecurrence | null {
  if (form.value.recurrenceFrequency === CALENDAR_RECURRENCE_FREQUENCY.none) {
    return null;
  }
  return {
    frequency: form.value.recurrenceFrequency,
    interval: Math.max(1, form.value.recurrenceInterval),
    daysOfWeek:
      form.value.recurrenceFrequency === CALENDAR_RECURRENCE_FREQUENCY.weekly &&
      form.value.recurrenceDays.length > 0
        ? form.value.recurrenceDays
        : null,
    endDate:
      form.value.recurrenceEndMode === "onDate" &&
      form.value.recurrenceEndDate
        ? new Date(`${form.value.recurrenceEndDate}T23:59`).toISOString()
        : null,
    occurrences:
      form.value.recurrenceEndMode === "afterOccurrences"
        ? Math.max(1, form.value.recurrenceOccurrences)
        : null,
  };
}

function resolveRange(): { startTime: string; endTime: string } | null {
  if (form.value.isAllDay) {
    const start = new Date(`${form.value.start}T00:00`);
    const end = new Date(`${form.value.end}T23:59`);
    return {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
  }
  return {
    startTime: new Date(form.value.start).toISOString(),
    endTime: new Date(form.value.end).toISOString(),
  };
}

async function submit() {
  if (!form.value.title.trim()) {
    await notify(t("calendar.eventTitleRequired"));
    return;
  }
  const range = resolveRange();
  if (!range || Number.isNaN(Date.parse(range.startTime)) || Number.isNaN(Date.parse(range.endTime))) {
    await notify(t("calendar.eventTimeInvalid"));
    return;
  }
  if (range.endTime < range.startTime) {
    await notify(t("calendar.eventEndTimeError"));
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      title: form.value.title.trim(),
      description: form.value.description.trim() || undefined,
      location: form.value.location.trim() || undefined,
      startTime: range.startTime,
      endTime: range.endTime,
      isAllDay: form.value.isAllDay,
      visibility: form.value.visibility,
      recurrence: buildRecurrence(),
      tags: parseTags(form.value.tags),
      iconId: iconFile.value?.id ?? null,
      backgroundId: backgroundFile.value?.id ?? null,
    };

    if (props.event) await updateCalendarEvent(props.event.id, payload);
    else await createCalendarEvent(payload);

    emit("saved");
  } catch (error) {
    await notify(
      error instanceof Error ? error.message : t("calendar.eventSaveFailed"),
    );
  } finally {
    submitting.value = false;
  }
}

async function remove() {
  if (!props.event) return;
  submitting.value = true;
  try {
    await deleteCalendarEvent(props.event.id);
    emit("deleted");
  } catch (error) {
    await notify(
      error instanceof Error ? error.message : t("calendar.eventDeleteFailed"),
    );
  } finally {
    submitting.value = false;
  }
}
</script>
