<template>
  <div class="overflow-hidden rounded-card bg-base-300/60" @click.stop>
    <div v-if="!eventId" class="p-4 text-xs text-base-content/60">
      {{ t("post.embed.calendarEventUnavailable") }}
    </div>

    <div v-else-if="loading" class="flex items-center gap-2 p-4 text-xs text-base-content/60">
      <IconLoader class="h-4 w-4 animate-spin" />
      <span>{{ t("common.loading") }}</span>
    </div>

    <div v-else-if="error || !event" class="p-4 text-xs text-base-content/60">
      {{ t("post.embed.calendarEventUnavailable") }}
    </div>

    <div v-else>
      <div v-if="event.background?.url" class="h-24 w-full overflow-hidden bg-base-200">
        <img
          :src="event.background.url"
          :alt="event.title"
          class="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div class="flex items-start gap-3 p-4">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-primary"
        >
          <img
            v-if="event.icon?.url"
            :src="event.icon.url"
            :alt="event.title"
            class="h-full w-full object-cover"
            loading="lazy"
          />
          <IconCalendar v-else class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1 space-y-1">
          <div class="truncate text-sm font-semibold">
            {{ event.title }}
          </div>
          <div class="text-xs text-base-content/65">
            {{ formattedStartTime }}
          </div>
          <p
            v-if="event.description"
            class="line-clamp-2 text-xs text-base-content/75"
          >
            {{ event.description }}
          </p>
          <div class="pt-1">
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
              :class="
                countdown.isPast
                  ? 'bg-base-200 text-base-content/65'
                  : 'bg-primary/15 text-primary'
              "
            >
              {{
                countdown.isPast
                  ? t("post.embed.countdownPast", { days: countdown.days })
                  : t("post.embed.countdownFuture", { days: countdown.days })
              }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from "~/utils/api";
import { fetchCalendarEventById } from "~/utils/api";
import { IconCalendar, IconLoader } from "#components";

const props = defineProps<{
  eventId?: string | null;
}>();

const { t } = useI18n();

const event = ref<CalendarEvent | null>(null);
const loading = ref(false);
const error = ref(false);

const formattedStartTime = computed(() => {
  if (!event.value?.startTime) return "";
  return new Date(event.value.startTime).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
});

const countdown = computed(() => {
  if (!event.value?.startTime) return { isPast: false, days: 0 };
  const diffMs = new Date(event.value.startTime).getTime() - Date.now();
  const days = Math.abs(Math.floor(diffMs / 86_400_000));
  return { isPast: diffMs < 0, days };
});

async function load() {
  if (!props.eventId) return;
  loading.value = true;
  error.value = false;
  try {
    event.value = await fetchCalendarEventById(props.eventId);
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => props.eventId, load);
</script>
