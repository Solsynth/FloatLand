<template>
    <div class="card bg-base-100">
        <div class="card-body p-4 gap-3">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <IconTrendingUp class="w-5 h-5 text-primary" />
                    <h3 class="text-sm font-bold">Fortune Trend</h3>
                </div>
                <NuxtLink
                    v-if="username"
                    :to="`/accounts/${username}/fortune`"
                    class="text-xs text-primary hover:underline"
                >
                    View all
                </NuxtLink>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center py-4">
                <span class="loading loading-spinner loading-xs text-primary" />
            </div>

            <!-- Error -->
            <div
                v-else-if="error"
                class="text-xs text-error text-center py-2"
            >
                {{ error }}
            </div>

            <!-- Empty -->
            <div
                v-else-if="dataPoints.length === 0"
                class="text-xs text-base-content/50 text-center py-4"
            >
                No fortune data this month
            </div>

            <!-- Chart -->
            <div v-else class="space-y-2">
                <svg
                    :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
                    class="w-full"
                    :style="{ height: `${svgHeight}px` }"
                >
                    <defs>
                        <linearGradient id="fortuneGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3" />
                            <stop offset="100%" stop-color="#6366f1" stop-opacity="0.02" />
                        </linearGradient>
                    </defs>

                    <path :d="areaPath" fill="url(#fortuneGrad)" />

                    <path
                        :d="linePath"
                        fill="none"
                        stroke="#6366f1"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />

                    <circle
                        v-for="(pt, i) in points"
                        :key="i"
                        :cx="pt.x"
                        :cy="pt.y"
                        r="3"
                        fill="#6366f1"
                        stroke="var(--color-base-100, #fff)"
                        stroke-width="1.5"
                    />
                </svg>

                <div class="flex justify-between text-[10px] text-base-content/40">
                    <span v-for="label in levelLabels" :key="label">{{ label }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { IconTrendingUp } from "#components";
import { fetchEventCalendar } from "~/utils/api";

const props = defineProps<{
    username?: string;
}>();

const loading = ref(true);
const error = ref<string | null>(null);
const dataPoints = ref<{ date: Date; level: number }[]>([]);

const levelLabels = ["Awful", "Bad", "Good", "Great", "Super", "Lucky"];

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;

const svgWidth = 200;
const svgHeight = 80;
const padding = 8;

const points = computed(() => {
    const pts = dataPoints.value;
    if (pts.length === 0) return [];
    if (pts.length === 1) {
        return [{ x: svgWidth / 2, y: svgHeight - padding - (pts[0].level / 5) * (svgHeight - padding * 2) }];
    }

    return pts.map((pt, i) => ({
        x: (i / (pts.length - 1)) * svgWidth,
        y: svgHeight - padding - (pt.level / 5) * (svgHeight - padding * 2),
    }));
});

const linePath = computed(() => {
    const pts = points.value;
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
        const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
        d += ` C ${cpx1} ${prev.y} ${cpx2} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
});

const areaPath = computed(() => {
    const pts = points.value;
    if (pts.length === 0) return "";
    const line = linePath.value;
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L ${last.x} ${svgHeight} L ${first.x} ${svgHeight} Z`;
});

async function loadData() {
    loading.value = true;
    error.value = null;
    try {
        const entries = await fetchEventCalendar({
            year,
            month,
            username: props.username,
        });
        const withResults = entries
            .filter((e) => e.checkInResult != null)
            .map((e) => ({
                date: new Date(e.date),
                level: e.checkInResult!.level,
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
        dataPoints.value = withResults;
    } catch (err) {
        error.value = err instanceof Error ? err.message : "Failed to load";
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadData();
});
</script>
