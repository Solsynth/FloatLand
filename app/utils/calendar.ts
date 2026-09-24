import { toLocalDate } from "./datetime";
import type { CalendarEvent, EventCalendarEntry } from "~/utils/api";

/** Event visibility levels (int values matching the backend enum). */
export const CALENDAR_EVENT_VISIBILITY = {
  private: 0,
  friends: 100,
  public: 200,
} as const;

/** Recurrence frequency (int values matching the backend enum). */
export const CALENDAR_RECURRENCE_FREQUENCY = {
  none: 0,
  daily: 1,
  weekly: 2,
  monthly: 3,
  yearly: 4,
} as const;

/** Notable day tag filter options (int values matching the backend enum). */
export const NOTABLE_DAY_TAGS = [
  { value: 0, key: "holiday" },
  { value: 1, key: "event" },
  { value: 2, key: "anniversary" },
  { value: 3, key: "memorial" },
  { value: 4, key: "festival" },
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export type CalendarViewMode = "month" | "week";

/**
 * Parse a calendar timestamp. Date-only payloads (entry `date`, notable-day
 * `date`) are parsed from their components so the local timezone never shifts
 * them onto the neighbouring day; full instants go through the shared
 * UTC-normalizing parser.
 */
export function parseCalendarDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return toLocalDate(value) ?? new Date(value);
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dateOnly(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function toDateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return dateOnly(next);
}

export function addMonths(value: Date, months: number): Date {
  return new Date(value.getFullYear(), value.getMonth() + months, 1);
}

/** Monday-first week start, matching the Flutter event hub. */
export function startOfWeek(value: Date): Date {
  const day = dateOnly(value);
  const offset = (day.getDay() + 6) % 7;
  return addDays(day, -offset);
}

export function buildWeekDays(value: Date): Date[] {
  const start = startOfWeek(value);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** 42 Monday-first cells covering the focused month (6 fixed rows). */
export function buildMonthCells(focusedMonth: Date): Date[] {
  const firstOfMonth = new Date(
    focusedMonth.getFullYear(),
    focusedMonth.getMonth(),
    1,
  );
  const start = startOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function weekOfMonth(value: Date): number {
  const firstOfMonth = new Date(value.getFullYear(), value.getMonth(), 1);
  const firstWeekStart = startOfWeek(firstOfMonth);
  const target = startOfWeek(dateOnly(value));
  return (
    Math.round((target.getTime() - firstWeekStart.getTime()) / (7 * DAY_MS)) + 1
  );
}

/**
 * Day the calendar reports an entry for. The backend buckets days by UTC
 * (`LocalDate(...).AtStartOfDayInZone(Utc)`), so instants are read back in UTC
 * rather than shifted into the viewer's zone.
 */
export function entryDateKey(entry: EventCalendarEntry): string {
  const value = entry.date;
  if (value.length === 10) return value;
  const iso = /Z$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`;
  const date = new Date(iso);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function entryForDay(
  entries: EventCalendarEntry[],
  day: Date,
): EventCalendarEntry | null {
  const key = toDateKey(day);
  return entries.find((entry) => entryDateKey(entry) === key) ?? null;
}

/**
 * Days the current view renders. Month mode shows the 42-cell grid; week mode
 * shows Monday through Sunday of the selected day.
 */
export function visibleRange(
  mode: CalendarViewMode,
  focusedMonth: Date,
  selectedDate: Date,
): { start: Date; end: Date } {
  if (mode === "week") {
    const start = startOfWeek(selectedDate);
    return { start, end: addDays(start, 7) };
  }
  const start = startOfWeek(
    new Date(focusedMonth.getFullYear(), focusedMonth.getMonth(), 1),
  );
  return { start, end: addDays(start, 42) };
}

/** Months (1-12) touched by `[start, end]`, in order. */
export function monthsInRange(
  start: Date,
  end: Date,
): { year: number; month: number }[] {
  const months: { year: number; month: number }[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

/**
 * Flatten every event the calendar reports for `day`. Multi-day events appear
 * on each covered day, so dedupe by id and sort all-day events first.
 */
export function eventsForDay(
  entries: EventCalendarEntry[],
  day: Date,
): CalendarEvent[] {
  const target = dateOnly(day);
  const seen = new Set<string>();
  const events: CalendarEvent[] = [];

  for (const entry of entries) {
    for (const event of entry.userEvents ?? []) {
      const start = dateOnly(parseCalendarDate(event.startTime));
      const end = dateOnly(parseCalendarDate(event.endTime));
      if (target < start || target > end) continue;
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      events.push(event);
    }
  }

  return events.sort((a, b) => {
    if (a.isAllDay !== b.isAllDay) return a.isAllDay ? -1 : 1;
    return (
      parseCalendarDate(a.startTime).getTime() -
      parseCalendarDate(b.startTime).getTime()
    );
  });
}

export function notableDayName(day: {
  localName: string;
  globalName: string;
}): string {
  return day.localName || day.globalName;
}

export function formatMonthYear(value: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
  }).format(value);
}

export function formatFullDate(value: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(value);
}

export function formatWeekday(value: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(value);
}

export function formatWeekdayShort(value: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(value);
}

export function formatShortDate(value: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(value);
}
