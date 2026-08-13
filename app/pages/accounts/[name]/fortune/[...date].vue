<template>
    <NuxtLayout name="app">
        <ConfuseSpinner v-if="loading" message="Loading fortune history..." />

        <div v-else-if="error" class="mx-auto max-w-md p-6">
            <div class="card">
                <div class="card-body items-center text-center gap-4">
                    <IconAlertCircle class="text-error w-12 h-12" />
                    <h1 class="text-xl font-bold">Failed to Load</h1>
                    <p class="text-base-content/60">{{ error }}</p>
                    <button class="btn btn-primary" @click="loadData">
                        <IconRefreshCw class="w-4 h-4" />
                        Retry
                    </button>
                </div>
            </div>
        </div>

        <template v-else>
            <!-- Header -->
            <div class="flex items-center gap-3 px-4 py-4">
                <button
                    class="btn btn-ghost btn-square btn-sm"
                    @click="router.back()"
                >
                    <IconArrowLeft class="w-5 h-5" />
                </button>
                <div class="flex-1 min-w-0">
                    <h1 class="text-xl font-bold truncate">
                        {{ displayName }}'s Fortune
                    </h1>
                </div>
                <NuxtLink
                    :to="`/accounts/${accountName}`"
                    class="btn btn-ghost btn-sm gap-1"
                >
                    <IconUser class="w-4 h-4" />
                    Profile
                </NuxtLink>
            </div>

            <div class="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-x-6">
                <!-- Main Content: Fortune Details -->
                <div class="space-y-4 min-w-0 px-4 py-4 lg:px-6">
                    <template v-if="selectedDay">
                        <!-- Date Header -->
                        <div class="flex items-center gap-3">
                            <div
                                class="w-12 h-12 rounded-box flex items-center justify-center bg-primary text-primary-content"
                            >
                                <span class="text-xl font-bold">
                                    {{ selectedDay.dayOfMonth }}
                                </span>
                            </div>
                            <div>
                                <p class="font-semibold">
                                    {{ formatWeekday(selectedDay.date) }}
                                </p>
                                <p class="text-sm text-base-content/60">
                                    {{ formatFullDate(selectedDay.date) }}
                                </p>
                            </div>
                        </div>

                        <!-- Check-in Result -->
                        <template v-if="selectedDay.level !== null">
                            <FortuneCard
                                :level="selectedDay.level"
                                :created-at="selectedDay.date.toISOString()"
                                :poem="selectedDay.poem"
                                :summary="selectedDay.summary"
                                :show-seal-header="true"
                            />

                            <FortuneTipsCard
                                v-if="selectedDay.tips.length > 0"
                                :tips="selectedDay.tips"
                            />

                            <FortuneGuidanceCard
                                v-if="selectedDay.summaryDetail"
                                :summary-detail="selectedDay.summaryDetail"
                            />

                            <FortuneLuckyGrid
                                v-if="selectedDay.luckyColor"
                                :report="selectedDay"
                            />

                            <FortuneDetailsCard
                                v-if="selectedDay.wish"
                                :report="selectedDay"
                            />

                            <FortuneRitualCard
                                v-if="selectedDay.ritual"
                                :ritual="selectedDay.ritual"
                            />
                        </template>

                        <!-- No check-in for this day -->
                        <div
                            v-else
                            class="text-center py-12 text-base-content/50"
                        >
                            <IconCalendarDays class="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No check-in on this day</p>
                        </div>
                    </template>

                    <!-- No day selected -->
                    <div
                        v-else
                        class="text-center py-12 text-base-content/50"
                    >
                        <IconCalendarDays class="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Select a day to view fortune details</p>
                    </div>
                </div>

                <!-- Right Sidebar (xl+) -->
                <aside class="hidden w-full space-y-4 self-start sticky top-20 xl:block">
                    <!-- User Profile Card -->
                    <div v-if="account" class="card bg-base-100 overflow-hidden">
                        <div class="h-16 w-full bg-base-200">
                            <img
                                v-if="backgroundUrl"
                                :src="backgroundUrl"
                                :alt="`${displayName} background`"
                                class="h-full w-full object-cover"
                            >
                        </div>
                        <div class="card-body p-4">
                            <div class="flex items-center gap-3 -mt-6 mb-2">
                                <NuxtLink :to="`/accounts/${accountName}`" class="shrink-0">
                                    <div v-if="avatarUrl" class="avatar">
                                        <div class="w-12 h-12 rounded-full ring-2 ring-base-100">
                                            <img :src="avatarUrl" :alt="displayName">
                                        </div>
                                    </div>
                                    <div v-else class="avatar avatar-placeholder">
                                        <div
                                            class="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold ring-2 ring-base-100"
                                        >
                                            {{ getInitials(displayName) }}
                                        </div>
                                    </div>
                                </NuxtLink>
                                <div class="min-w-0 flex-1 pt-4">
                                    <NuxtLink
                                        :to="`/accounts/${accountName}`"
                                        class="font-bold text-sm truncate hover:underline block"
                                    >
                                        {{ displayName }}
                                    </NuxtLink>
                                    <p class="text-xs text-base-content/60 truncate">
                                        @{{ accountName }}
                                    </p>
                                </div>
                            </div>
                            <NuxtLink
                                :to="`/accounts/${accountName}`"
                                class="btn btn-outline btn-xs w-full mt-1"
                            >
                                View Profile
                            </NuxtLink>
                        </div>
                    </div>

                    <!-- Calendar Card -->
                    <div class="card bg-base-100">
                        <div class="card-body p-4">
                            <!-- Calendar Header -->
                            <div class="flex items-center justify-between mb-2">
                                <button
                                    class="btn btn-ghost btn-sm btn-square"
                                    @click="prevMonth"
                                >
                                    <IconChevronLeft class="w-4 h-4" />
                                </button>
                                <h2 class="text-base font-semibold">
                                    {{ monthLabel }} {{ year }}
                                </h2>
                                <button
                                    class="btn btn-ghost btn-sm btn-square"
                                    :disabled="isCurrentMonth"
                                    @click="nextMonth"
                                >
                                    <IconChevronRight class="w-4 h-4" />
                                </button>
                            </div>

                            <!-- Day of Week Headers -->
                            <div class="grid grid-cols-7 mb-1">
                                <div
                                    v-for="dow in ['S', 'M', 'T', 'W', 'T', 'F', 'S']"
                                    :key="dow"
                                    class="text-center text-xs font-medium text-base-content/50 py-2"
                                >
                                    {{ dow }}
                                </div>
                            </div>

                            <!-- Calendar Grid -->
                            <div class="grid grid-cols-7 gap-px">
                                <template v-for="(cell, idx) in calendarCells" :key="idx">
                                    <div v-if="!cell" class="aspect-square" />
                                    <div
                                        v-else
                                        role="button"
                                        class="cursor-pointer aspect-square flex flex-col items-center justify-center gap-0.5 rounded-box transition-colors select-none"
                                        :class="{
                                            'bg-primary text-primary-content': cell.isSelected,
                                            'bg-primary/10': cell.isToday && !cell.isSelected,
                                            'hover:bg-base-200': !cell.isSelected,
                                        }"
                                        @click="selectDay(cell)"
                                    >
                                        <span
                                            class="text-xs font-medium leading-none"
                                            :class="{
                                                'text-primary-content': cell.isSelected,
                                                'text-primary font-bold': cell.isToday && !cell.isSelected,
                                            }"
                                        >
                                            {{ cell.dayOfMonth }}
                                        </span>
                                        <span
                                            v-if="cell.levelLabel"
                                            class="text-[9px] font-semibold leading-none text-primary"
                                            :class="{
                                                'text-primary-content/80': cell.isSelected,
                                            }"
                                        >
                                            {{ cell.levelLabel }}
                                        </span>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </aside>

                <!-- Mobile: Calendar + User Info (below xl) -->
                <div class="xl:hidden px-4 pb-4 space-y-4">
                    <!-- User Info -->
                    <div v-if="account" class="card bg-base-100">
                        <div class="card-body p-4">
                            <div class="flex items-center gap-3">
                                <NuxtLink :to="`/accounts/${accountName}`" class="shrink-0">
                                    <div v-if="avatarUrl" class="avatar">
                                        <div class="w-10 h-10 rounded-full">
                                            <img :src="avatarUrl" :alt="displayName">
                                        </div>
                                    </div>
                                    <div v-else class="avatar avatar-placeholder">
                                        <div
                                            class="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold"
                                        >
                                            {{ getInitials(displayName) }}
                                        </div>
                                    </div>
                                </NuxtLink>
                                <div class="min-w-0 flex-1">
                                    <NuxtLink
                                        :to="`/accounts/${accountName}`"
                                        class="font-semibold text-sm truncate hover:underline block"
                                    >
                                        {{ displayName }}
                                    </NuxtLink>
                                    <p class="text-xs text-base-content/60">
                                        @{{ accountName }}
                                    </p>
                                </div>
                                <NuxtLink
                                    :to="`/accounts/${accountName}`"
                                    class="btn btn-outline btn-xs"
                                >
                                    Profile
                                </NuxtLink>
                            </div>
                        </div>
                    </div>

                    <!-- Calendar -->
                    <div class="card bg-base-100">
                        <div class="card-body p-4">
                            <div class="flex items-center justify-between mb-2">
                                <button
                                    class="btn btn-ghost btn-sm btn-square"
                                    @click="prevMonth"
                                >
                                    <IconChevronLeft class="w-4 h-4" />
                                </button>
                                <h2 class="text-base font-semibold">
                                    {{ monthLabel }} {{ year }}
                                </h2>
                                <button
                                    class="btn btn-ghost btn-sm btn-square"
                                    :disabled="isCurrentMonth"
                                    @click="nextMonth"
                                >
                                    <IconChevronRight class="w-4 h-4" />
                                </button>
                            </div>

                            <div class="grid grid-cols-7 mb-1">
                                <div
                                    v-for="dow in ['S', 'M', 'T', 'W', 'T', 'F', 'S']"
                                    :key="'m-' + dow"
                                    class="text-center text-xs font-medium text-base-content/50 py-2"
                                >
                                    {{ dow }}
                                </div>
                            </div>

                            <div class="grid grid-cols-7 gap-px">
                                <template v-for="(cell, idx) in calendarCells" :key="'m-' + idx">
                                    <div v-if="!cell" class="aspect-square" />
                                    <div
                                        v-else
                                        role="button"
                                        class="cursor-pointer aspect-square flex flex-col items-center justify-center gap-0.5 rounded-box transition-colors select-none"
                                        :class="{
                                            'bg-primary text-primary-content': cell.isSelected,
                                            'bg-primary/10': cell.isToday && !cell.isSelected,
                                            'hover:bg-base-200': !cell.isSelected,
                                        }"
                                        @click="selectDay(cell)"
                                    >
                                        <span
                                            class="text-xs font-medium leading-none"
                                            :class="{
                                                'text-primary-content': cell.isSelected,
                                                'text-primary font-bold': cell.isToday && !cell.isSelected,
                                            }"
                                        >
                                            {{ cell.dayOfMonth }}
                                        </span>
                                        <span
                                            v-if="cell.levelLabel"
                                            class="text-[9px] font-semibold leading-none text-primary"
                                            :class="{
                                                'text-primary-content/80': cell.isSelected,
                                            }"
                                        >
                                            {{ cell.levelLabel }}
                                        </span>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </NuxtLayout>
</template>

<script setup lang="ts">
import {
    IconAlertCircle,
    IconRefreshCw,
    IconArrowLeft,
    IconChevronLeft,
    IconChevronRight,
    IconUser,
    IconCalendarDays,
} from "#components";
import type { EventCalendarEntry, FortuneTip } from "~/utils/api";
import { fetchEventCalendar, fetchAccount } from "~/utils/api";
import { getFileUrl } from "~/utils/files";
import type { SnAccount } from "~/types/auth";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref<string | null>(null);
const entries = ref<EventCalendarEntry[]>([]);
const selectedDateStr = ref<string | null>(null);
const account = ref<SnAccount | null>(null);

const now = new Date();
const year = ref(now.getFullYear());
const month = ref(now.getMonth() + 1);

const accountName = computed(() => route.params.name as string);

// Parse date from URL if provided (format: yyyymmdd)
const dateParam = computed(() => {
    const param = route.params.date;
    if (Array.isArray(param)) return param[0] || undefined;
    return param || undefined;
});

const displayName = computed(() => account.value?.nick || account.value?.name || accountName.value);
const avatarUrl = computed(() => getFileUrl(account.value?.profile?.picture?.id));
const backgroundUrl = computed(() => getFileUrl(account.value?.profile?.background?.id));

function getInitials(name: string): string {
    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .map((p) => p[0]?.toUpperCase())
            .slice(0, 2)
            .join("") || "?"
    );
}

const monthLabel = computed(() => {
    return new Date(year.value, month.value - 1, 1).toLocaleDateString("en-US", { month: "long" });
});

const isCurrentMonth = computed(() => {
    return year.value === now.getFullYear() && month.value === now.getMonth() + 1;
});

interface CalendarDay {
    date: Date;
    dateStr: string;
    dayOfMonth: number;
    level: number | null;
    levelLabel: string;
    isSelected: boolean;
    isToday: boolean;
    poem: string;
    summary: string;
    summaryDetail: string | null;
    tips: FortuneTip[];
    luckyColor: string;
    luckyDirection: string;
    luckyTime: string;
    luckyItem: string;
    wish: string;
    love: string;
    study: string;
    career: string;
    health: string;
    lostItem: string;
    luckyAction: string;
    avoidAction: string;
    ritual: string;
}

const levelShortLabels: Record<number, string> = {
    0: "Awful",
    1: "Bad",
    2: "Good",
    3: "Excel",
    4: "Great",
    5: "Lucky",
};

const startDayOfWeek = computed(() => new Date(year.value, month.value - 1, 1).getDay());

const calendarCells = computed(() => {
    const cells: (CalendarDay | null)[] = [];
    const padding = startDayOfWeek.value;
    for (let i = 0; i < padding; i++) cells.push(null);
    for (const day of daysInMonth.value) cells.push(day);
    return cells;
});

const daysInMonth = computed<CalendarDay[]>(() => {
    const days: CalendarDay[] = [];
    const daysCount = new Date(year.value, month.value, 0).getDate();

    for (let d = 1; d <= daysCount; d++) {
        const date = new Date(year.value, month.value - 1, d);
        const dateStr = `${year.value}-${String(month.value).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

        const entry = entries.value.find((e) => {
            const ed = new Date(e.date);
            return ed.getFullYear() === date.getFullYear() &&
                ed.getMonth() === date.getMonth() &&
                ed.getDate() === date.getDate();
        });

        const ci = entry?.checkInResult;
        const report = ci?.fortuneReport;

        const isToday = date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate();

        const isSelected = selectedDateStr.value === dateStr;

        days.push({
            date,
            dateStr,
            dayOfMonth: d,
            level: ci?.level ?? null,
            levelLabel: ci != null ? (levelShortLabels[ci.level] ?? "") : "",
            isSelected,
            isToday,
            poem: report?.poem ?? "",
            summary: report?.summary ?? "",
            summaryDetail: report?.summaryDetail ?? null,
            tips: ci?.tips ?? [],
            luckyColor: report?.luckyColor ?? "",
            luckyDirection: report?.luckyDirection ?? "",
            luckyTime: report?.luckyTime ?? "",
            luckyItem: report?.luckyItem ?? "",
            wish: report?.wish ?? "",
            love: report?.love ?? "",
            study: report?.study ?? "",
            career: report?.career ?? "",
            health: report?.health ?? "",
            lostItem: report?.lostItem ?? "",
            luckyAction: report?.luckyAction ?? "",
            avoidAction: report?.avoidAction ?? "",
            ritual: report?.ritual ?? "",
        });
    }

    return days;
});

const selectedDay = computed(() => {
    if (!selectedDateStr.value) return null;
    return daysInMonth.value.find((d) => d.dateStr === selectedDateStr.value) ?? null;
});

function selectDay(day: CalendarDay) {
    selectedDateStr.value = day.dateStr;
    const yyyymmdd = `${day.date.getFullYear()}${String(day.date.getMonth() + 1).padStart(2, "0")}${String(day.date.getDate()).padStart(2, "0")}`;
    router.replace(`/accounts/${accountName.value}/fortune/${yyyymmdd}`);
}

function formatWeekday(date: Date): string {
    return date.toLocaleDateString("en-US", { weekday: "long" });
}

function formatFullDate(date: Date): string {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function prevMonth() {
    if (month.value === 1) { month.value = 12; year.value--; }
    else { month.value--; }
    selectedDateStr.value = null;
    loadData();
}

function nextMonth() {
    if (isCurrentMonth.value) return;
    if (month.value === 12) { month.value = 1; year.value++; }
    else { month.value++; }
    selectedDateStr.value = null;
    loadData();
}

function parseDateParam(param: string): { year: number; month: number; day: number } | null {
    // Expected format: yyyymmdd (e.g., 20250509)
    if (param.length !== 8) return null;
    const y = parseInt(param.slice(0, 4), 10);
    const m = parseInt(param.slice(4, 6), 10);
    const d = parseInt(param.slice(6, 8), 10);
    if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) return null;
    return { year: y, month: m, day: d };
}

async function loadData() {
    loading.value = true;
    error.value = null;
    try {
        const [calendarData, accountData] = await Promise.all([
            fetchEventCalendar(year.value, month.value, accountName.value),
            fetchAccount(accountName.value).catch(() => null),
        ]);
        entries.value = calendarData;
        account.value = accountData;
    } catch (err) {
        error.value = err instanceof Error ? err.message : "Failed to load";
    } finally {
        loading.value = false;
    }
}

function selectLatestFortune() {
    const withFortune = daysInMonth.value.filter((d) => d.level !== null);
    if (withFortune.length > 0) {
        selectDay(withFortune[withFortune.length - 1]);
    }
}

onMounted(async () => {
    // Parse date from URL if provided
    if (dateParam.value) {
        const parsed = parseDateParam(dateParam.value);
        if (parsed) {
            year.value = parsed.year;
            month.value = parsed.month;
        }
    }

    await loadData();

    if (dateParam.value) {
        const parsed = parseDateParam(dateParam.value);
        if (parsed) {
            const dateStr = `${parsed.year}-${String(parsed.month).padStart(2, "0")}-${String(parsed.day).padStart(2, "0")}`;
            const day = daysInMonth.value.find((d) => d.dateStr === dateStr);
            if (day) {
                selectDay(day);
                return;
            }
        }
    }

    selectLatestFortune();
});

defineOgImage('UniOgImage', { title: `${displayName.value}'s Fortune` })

useSolarSeo({ title: `${displayName.value}'s Fortune` });
</script>
