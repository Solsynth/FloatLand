<template>
  <div class="overflow-hidden rounded-box border border-base-300 bg-base-100">
    <FileImage
      v-if="event.background"
      :file="event.background"
      alt=""
      class="h-20 w-full object-cover"
    />
    <div class="flex items-start gap-3 p-3">
      <FileImage
        v-if="event.icon"
        :file="event.icon"
        alt=""
        class="h-8 w-8 shrink-0 rounded-lg object-cover"
      />
      <span
        v-else
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
      >
        <IconCalendarDays class="h-4 w-4" />
      </span>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <p class="truncate text-sm font-semibold">{{ event.title }}</p>
          <button
            v-if="editable"
            type="button"
            class="btn btn-ghost btn-square btn-xs"
            :aria-label="t('calendar.editEvent')"
            @click="emit('edit', event)"
          >
            <IconPencil class="h-3.5 w-3.5" />
          </button>
        </div>

        <p class="mt-1 flex items-center gap-1 text-xs text-base-content/60">
          <IconClock class="h-3 w-3 shrink-0" />
          <span>{{ timeLabel }}</span>
        </p>
        <p
          v-if="event.location"
          class="mt-0.5 flex items-center gap-1 text-xs text-base-content/60"
        >
          <IconMapPin class="h-3 w-3 shrink-0" />
          <span class="truncate">{{ event.location }}</span>
        </p>
        <p
          v-if="ownerName"
          class="mt-0.5 flex items-center gap-1 text-xs text-base-content/60"
        >
          <IconUsers class="h-3 w-3 shrink-0" />
          <span class="truncate">{{ ownerName }}</span>
        </p>
        <p
          v-if="event.description"
          class="mt-1 line-clamp-2 text-xs text-base-content/60"
        >
          {{ event.description }}
        </p>
        <div v-if="event.tags.length" class="mt-1.5 flex flex-wrap gap-1">
          <span
            v-for="tag in event.tags"
            :key="tag"
            class="badge badge-ghost badge-xs"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconCalendarDays,
  IconClock,
  IconMapPin,
  IconPencil,
  IconUsers,
} from "#components";
import type { CalendarEvent } from "~/utils/api";

const props = defineProps<{
  event: CalendarEvent;
  editable?: boolean;
  selfName?: string | null;
}>();

const emit = defineEmits<{ edit: [event: CalendarEvent] }>();

const { t } = useI18n();

const timeLabel = computed(() => {
  if (props.event.isAllDay) return t("calendar.allDay");
  return `${formatTime(props.event.startTime)} – ${formatTime(props.event.endTime)}`;
});

const ownerName = computed(() => {
  const account = props.event.account;
  if (!account?.name) return null;
  if (props.selfName && account.name === props.selfName) return null;
  return account.nick || account.name;
});
</script>
