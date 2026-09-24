<template>
  <NuxtLayout name="app">
    <div class="feed-layout">
      <!-- Main column: calendar surface -->
      <div class="min-w-0">
        <div class="feed-stream">
          <!-- Controls -->
          <div
            class="flex flex-wrap items-center gap-2 border-b border-base-300/80 px-4 py-2.5"
          >
            <h1 class="text-base font-bold">{{ t("calendar.title") }}</h1>

            <div class="ml-auto flex items-center gap-1">
              <div class="hidden rounded-box bg-base-200 p-1 text-xs sm:flex">
                <button
                  v-for="option in modeOptions"
                  :key="option.value"
                  type="button"
                  class="rounded-box px-3 py-1.5 font-medium transition-colors"
                  :class="
                    mode === option.value
                      ? 'bg-base-100 text-base-content shadow-sm'
                      : 'text-base-content/60 hover:text-base-content'
                  "
                  @click="mode = option.value"
                >
                  {{ option.label }}
                </button>
              </div>

              <button
                type="button"
                class="btn btn-ghost btn-square btn-sm"
                :aria-label="t('calendar.prevPeriod')"
                @click="shiftPeriod(-1)"
              >
                <IconChevronLeft class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                @click="jumpToToday"
              >
                {{ t("calendar.today") }}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-square btn-sm"
                :aria-label="t('calendar.nextPeriod')"
                @click="shiftPeriod(1)"
              >
                <IconChevronRight class="h-4 w-4" />
              </button>

              <button
                type="button"
                class="btn btn-ghost btn-square btn-sm"
                :class="{ 'btn-active': searchActive }"
                :aria-label="t('calendar.search')"
                @click="toggleSearch"
              >
                <IconSearch class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-square btn-sm"
                :aria-label="t('calendar.filters')"
                @click="filtersModalOpen = true"
              >
                <IconSlidersHorizontal class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Search bar -->
          <div
            v-if="searchActive"
            class="border-b border-base-300/80 px-4 py-2.5"
          >
            <label class="input input-sm flex w-full items-center gap-2">
              <IconSearch class="h-4 w-4 text-base-content/40" />
              <input
                v-model="searchQuery"
                type="search"
                class="grow"
                :placeholder="t('calendar.search')"
              >
              <button
                v-if="searchQuery"
                type="button"
                class="btn btn-ghost btn-square btn-xs"
                :aria-label="t('calendar.searchClose')"
                @click="clearSearch"
              >
                <IconX class="h-3.5 w-3.5" />
              </button>
            </label>
          </div>

          <!-- Sync indicator -->
          <div
            v-if="refreshing"
            class="h-0.5 w-full overflow-hidden bg-base-200"
          >
            <div class="h-full w-1/3 animate-pulse rounded-full bg-primary" />
          </div>

          <!-- Period label + compact view switch -->
          <div class="flex items-center justify-between gap-2 px-4 pt-3">
            <p class="truncate text-sm font-semibold text-base-content/70">
              {{ periodLabel }}
            </p>
            <div class="flex rounded-box bg-base-200 p-1 text-xs sm:hidden">
              <button
                v-for="option in modeOptions"
                :key="option.value"
                type="button"
                class="rounded-box px-2 py-1 font-medium transition-colors"
                :class="
                  mode === option.value
                    ? 'bg-base-100 text-base-content shadow-sm'
                    : 'text-base-content/60'
                "
                @click="mode = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <!-- Calendar / results -->
          <div class="p-3 sm:p-4">
            <div
              v-if="loading"
              key="loading"
              class="flex flex-col items-center gap-3 py-20"
            >
              <ConfuseSpinner />
              <p class="text-sm text-base-content/60">
                {{ t("calendar.loading") }}
              </p>
            </div>

            <div v-else-if="loadError" key="error" class="card bg-base-100">
              <div class="card-body items-center gap-3 py-10 text-center">
                <IconAlertCircle class="h-10 w-10 text-error" />
                <p class="text-sm text-base-content/70">{{ loadError }}</p>
                <button class="btn btn-primary btn-sm gap-1" @click="loadEntries">
                  <IconRefreshCw class="h-4 w-4" />
                  {{ t("common.retry") }}
                </button>
              </div>
            </div>

            <CalendarSearchResults
              v-else-if="searchVisible"
              key="search"
              :items="searchItems"
              :loading="searchLoading"
              :error="searchError"
              :editable="true"
              :self-name="selfName"
              @edit="openEditor($event)"
              @open-notable="openNotableDetail($event)"
            />

            <CalendarMonthView
              v-else-if="mode === 'month'"
              key="month"
              :entries="entries"
              :focused-month="focusedMonth"
              :selected-date="selectedDate"
              @select="selectDate"
            />
            <CalendarWeekView
              v-else
              key="week"
              :entries="entries"
              :selected-date="selectedDate"
              :editable="true"
              :self-name="selfName"
              @select="selectDate"
              @edit="openEditor($event)"
            />
          </div>
        </div>
      </div>

      <!-- Right rail: selected day inspector (events, notable days, check-in) -->
      <aside class="feed-sidebar">
        <div class="rounded-box border border-base-300 bg-base-100 p-4">
          <CalendarDayAgenda
            :date="selectedDate"
            :entry="selectedEntry"
            :events="selectedEvents"
            :check-in="selectedCheckIn"
            :editable="true"
            :self-name="selfName"
            :is-today="isSelectedToday"
            :can-draw="isSelectedToday && !selectedCheckIn"
            :drawing="checkingIn"
            @add="openEditor(null, $event)"
            @edit="openEditor($event)"
            @draw="checkIn()"
            @open-notable="openNotableDay($event)"
          />
        </div>
      </aside>
    </div>

    <!-- Filters -->
    <dialog class="modal" :open="filtersModalOpen">
      <div class="modal-box max-w-sm">
        <div class="flex items-center justify-between pb-3">
          <h3 class="text-lg font-bold">{{ t("calendar.filters") }}</h3>
          <button
            type="button"
            class="btn btn-ghost btn-square btn-sm"
            :aria-label="t('common.close')"
            @click="filtersModalOpen = false"
          >
            <IconX class="h-4 w-4" />
          </button>
        </div>
        <CalendarFiltersPanel
          v-model:mode="mode"
          v-model:include-notable-days="includeNotableDays"
          :selected-date="selectedDate"
          :focused-month="focusedMonth"
          :used-tags="usedTags"
          :selected-tags="selectedTags"
          :notable-day-tag="notableDayTag"
          @select-date="selectDate"
          @change-month="changeMonth"
          @toggle-tag="toggleTag"
          @set-notable-tag="notableDayTag = $event"
          @clear="clearFilters"
          @today="jumpToToday"
        />
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="filtersModalOpen = false">close</button>
      </form>
    </dialog>

    <CalendarEventEditorModal
      :open="editorOpen"
      :event="editorEvent"
      :initial-date="editorDate"
      @close="editorOpen = false"
      @saved="onEditorSaved"
      @deleted="onEditorSaved"
    />

    <CalendarNotableDayDialog
      :open="notableOpen"
      :detail="notableDetail"
      :day="notableDay"
      @close="notableOpen = false"
    />

    <!-- Check-in progress overlay -->
    <div
      v-if="checkingIn"
      class="fixed inset-0 z-50 flex items-center justify-center bg-base-100/90"
    >
      <div class="card mx-4 max-w-sm bg-base-100 shadow-sm">
        <div class="card-body items-center gap-3 text-center">
          <IconSparkles class="h-8 w-8 animate-pulse text-primary" />
          <p class="text-sm font-semibold">{{ t("calendar.drawing") }}</p>
          <progress class="progress progress-primary w-40" />
        </div>
      </div>
    </div>

    <!-- Captcha dialog -->
    <dialog class="modal" :open="showCaptcha">
      <div class="modal-box">
        <div class="flex items-center justify-between pb-4">
          <h3 class="text-lg font-bold">
            {{ t("calendar.verificationRequired") }}
          </h3>
          <button
            type="button"
            class="btn btn-ghost btn-square btn-sm"
            :aria-label="t('common.close')"
            @click="showCaptcha = false"
          >
            <IconX class="h-4 w-4" />
          </button>
        </div>
        <CaptchaWidget @verified="onCaptchaVerified" />
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showCaptcha = false">close</button>
      </form>
    </dialog>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconAlertCircle,
  IconChevronLeft,
  IconChevronRight,
  IconRefreshCw,
  IconSearch,
  IconSlidersHorizontal,
  IconSparkles,
  IconX,
} from "#components";
import { refDebounced } from "@vueuse/core";
import type {
  CalendarEvent,
  CalendarSearchItem,
  CheckInResult,
  EventCalendarEntry,
  NotableDay,
  NotableDayDetail,
} from "~/utils/api";
import {
  ApiError,
  fetchCalendarTags,
  fetchEventCalendar,
  getCheckInResultToday,
  performCheckIn,
  searchCalendarEvents,
} from "~/utils/api";
import type { CalendarViewMode } from "~/utils/calendar";
import {
  addDays,
  addMonths,
  dateOnly,
  entryForDay,
  eventsForDay,
  formatFullDate,
  formatMonthYear,
  monthsInRange,
  parseCalendarDate,
  sameDay,
  toDateKey,
  visibleRange,
  weekOfMonth,
} from "~/utils/calendar";

definePageMeta({ middleware: "auth" });

useSolarSeo({ title: "Calendar" });

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuth();
const { notify } = useAlert();

const selfName = computed(() => auth.user.value?.name ?? null);

const mode = ref<CalendarViewMode>("month");
const today = dateOnly(new Date());
const selectedDate = ref(today);
const focusedMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1));
const filtersModalOpen = ref(false);
const includeNotableDays = ref(true);

const entries = ref<EventCalendarEntry[]>([]);
const loading = ref(true);
const refreshing = ref(false);
const loadError = ref<string | null>(null);

const usedTags = ref<string[]>([]);
const selectedTags = ref<string[]>([]);
const notableDayTag = ref<number | null>(null);

const searchActive = ref(false);
const searchQuery = ref("");
const debouncedQuery = refDebounced(searchQuery, 450);
const searchItems = ref<CalendarSearchItem[]>([]);
const searchLoading = ref(false);
const searchError = ref<string | null>(null);

const checkingIn = ref(false);
const showCaptcha = ref(false);
const drawnToday = ref<CheckInResult | null>(null);

const editorOpen = ref(false);
const editorEvent = ref<CalendarEvent | null>(null);
const editorDate = ref<Date | null>(null);

const notableOpen = ref(false);
const notableDetail = ref<NotableDayDetail | null>(null);
const notableDay = ref<NotableDay | null>(null);

const modeOptions = computed<{ value: CalendarViewMode; label: string }[]>(
  () => [
    { value: "week", label: t("calendar.viewWeek") },
    { value: "month", label: t("calendar.viewMonth") },
  ],
);

const isSelectedToday = computed(() => sameDay(selectedDate.value, today));

const selectedEntry = computed(() =>
  entryForDay(entries.value, selectedDate.value),
);

const selectedEvents = computed(() =>
  eventsForDay(entries.value, selectedDate.value),
);

const selectedCheckIn = computed(() => {
  if (isSelectedToday.value && drawnToday.value) return drawnToday.value;
  return selectedEntry.value?.checkInResult ?? null;
});

const hasActiveFilters = computed(
  () =>
    debouncedQuery.value.trim().length > 0 ||
    selectedTags.value.length > 0 ||
    notableDayTag.value !== null,
);

const searchVisible = computed(
  () => searchActive.value && hasActiveFilters.value,
);

const visibleMonths = computed(() =>
  // Pad a day: the backend buckets events by their UTC day, so an event in the
  // visible range can live in the neighbouring month's response.
  monthsInRange(
    addDays(
      visibleRange(mode.value, focusedMonth.value, selectedDate.value).start,
      -1,
    ),
    visibleRange(mode.value, focusedMonth.value, selectedDate.value).end,
  ),
);

/** Changing this means the rendered days need different data. */
const visibleMonthsKey = computed(() =>
  visibleMonths.value.map((month) => `${month.year}-${month.month}`).join(","),
);

const visibleRangeBounds = computed(() => {
  const range = visibleRange(mode.value, focusedMonth.value, selectedDate.value);
  return {
    startTime: range.start.toISOString(),
    endTime: range.end.toISOString(),
  };
});

const periodLabel = computed(() => {
  if (mode.value === "month") {
    return formatMonthYear(focusedMonth.value, locale.value);
  }
  if (mode.value === "week") {
    return t("calendar.weekNumber", { n: weekOfMonth(selectedDate.value) });
  }
  return formatFullDate(selectedDate.value, locale.value);
});

function selectDate(day: Date) {
  selectedDate.value = dateOnly(day);
  focusedMonth.value = new Date(day.getFullYear(), day.getMonth(), 1);
}

function changeMonth(month: Date) {
  focusedMonth.value = new Date(month.getFullYear(), month.getMonth(), 1);
}

function toggleTag(tag: string) {
  selectedTags.value = selectedTags.value.includes(tag)
    ? selectedTags.value.filter((value) => value !== tag)
    : [...selectedTags.value, tag];
}

function clearFilters() {
  selectedTags.value = [];
  notableDayTag.value = null;
  searchQuery.value = "";
}

function clearSearch() {
  clearFilters();
}

function toggleSearch() {
  searchActive.value = !searchActive.value;
  if (!searchActive.value) clearSearch();
}

function jumpToToday() {
  selectDate(today);
}

function shiftPeriod(delta: number) {
  if (mode.value === "week") {
    selectDate(addDays(selectedDate.value, 7 * delta));
    return;
  }
  const next = addMonths(focusedMonth.value, delta);
  focusedMonth.value = next;
  if (!sameDay(selectedDate.value, next)) selectedDate.value = next;
}

async function loadEntries() {
  loadError.value = null;
  const first = entries.value.length === 0;
  if (first) loading.value = true;
  else refreshing.value = true;
  try {
    const results = await Promise.all(
      visibleMonths.value.map((month) =>
        fetchEventCalendar({
          year: month.year,
          month: month.month,
          includeNotableDays: includeNotableDays.value,
        }),
      ),
    );
    entries.value = results.flat();
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : t("calendar.loadFailed");
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

async function loadTags() {
  try {
    usedTags.value = await fetchCalendarTags();
  } catch {
    usedTags.value = [];
  }
}

async function refreshToday() {
  try {
    const result = await getCheckInResultToday();
    if (result) drawnToday.value = result;
  } catch {
    // 404 means no check-in yet; the agenda renders the draw prompt.
  }
}

async function runSearch() {
  if (!searchVisible.value) {
    searchItems.value = [];
    return;
  }
  searchLoading.value = true;
  searchError.value = null;
  try {
    const range = visibleRangeBounds.value;
    searchItems.value = await searchCalendarEvents({
      query: debouncedQuery.value.trim() || undefined,
      tags: selectedTags.value.length ? selectedTags.value : undefined,
      notableDayTag: notableDayTag.value,
      startTime: range.startTime,
      endTime: range.endTime,
    });
  } catch (error) {
    searchError.value =
      error instanceof Error ? error.message : t("calendar.searchFailed");
  } finally {
    searchLoading.value = false;
  }
}

function openEditor(event: CalendarEvent | null, date?: Date) {
  editorEvent.value = event;
  editorDate.value = event
    ? parseCalendarDate(event.startTime)
    : (date ?? selectedDate.value);
  editorOpen.value = true;
}

async function onEditorSaved() {
  editorOpen.value = false;
  await Promise.all([loadEntries(), loadTags()]);
  if (searchVisible.value) await runSearch();
}

function openNotableDetail(detail: NotableDayDetail) {
  notableDetail.value = detail;
  notableDay.value = null;
  notableOpen.value = true;
}

function openNotableDay(day: NotableDay) {
  notableDetail.value = null;
  notableDay.value = day;
  notableOpen.value = true;
}

async function checkIn(captchaToken?: string) {
  checkingIn.value = true;
  let drawn = false;
  try {
    drawnToday.value = await performCheckIn(captchaToken);
    drawn = true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 423) {
      showCaptcha.value = true;
    } else {
      await notify(
        error instanceof Error ? error.message : t("calendar.checkInFailed"),
      );
    }
  } finally {
    // Clear the overlay as soon as the draw settles; the follow-up refresh
    // must not hold a blocking overlay if the network stalls.
    checkingIn.value = false;
  }
  if (!drawn) return;
  await auth.fetchUser();
  loadEntries();
}

function onCaptchaVerified(token: string) {
  showCaptcha.value = false;
  checkIn(token);
}

// Apply deep-link query once, before the data watcher is registered.
const queryDate = route.query.date;
if (typeof queryDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(queryDate)) {
  selectDate(parseCalendarDate(queryDate));
}
const queryView = route.query.view;
if (queryView === "week" || queryView === "month") {
  mode.value = queryView;
}

// Calendar data is per-user, so it is fetched on the client only: the server
// renders the loading shell, the client hydrates the identical tree, and the
// branch swap happens after hydration. Fetching during SSR made the markup
// depend on the request's session, which mangled the grid when the two
// renders disagreed.
watch([visibleMonthsKey, includeNotableDays], () => loadEntries());

watch(
  [debouncedQuery, selectedTags, notableDayTag, focusedMonth, searchVisible],
  () => runSearch(),
);

watch([selectedDate, mode], () => {
  router.replace({
    query: {
      ...route.query,
      date: toDateKey(selectedDate.value),
      view: mode.value,
    },
  });
});

onMounted(async () => {
  await loadEntries();
  loadTags();
  refreshToday();
});
</script>
