<template>
    <div
        class="card bg-base-100 overflow-hidden"
    >
        <div class="card-body p-5 gap-5">
            <!-- Art Image -->
            <div
                v-if="artAsset"
                class="relative rounded-box overflow-hidden"
                :style="{ backgroundColor: artBackdrop }"
            >
                <div class="relative p-3.5">
                    <div class="aspect-square">
                        <img
                            :src="artAsset"
                            :alt="`Fortune level ${level}`"
                            class="h-full w-full object-contain"
                        >
                    </div>
                </div>
            </div>

            <!-- Seal Header -->
            <div v-if="showSealHeader" class="flex items-end justify-between">
                <div class="flex items-end gap-2.5">
                    <span
                        class="text-sm font-bold leading-tight text-base-content/60"
                        :style="{ fontFamily: serifFont }"
                    >
                        农<br>历
                    </span>
                    <span
                        class="text-3xl font-black text-primary"
                        :style="{ fontFamily: serifFont }"
                    >
                        {{ lunarMonth }}
                    </span>
                    <span
                        class="text-base font-bold pb-1 text-primary"
                        :style="{ fontFamily: serifFont }"
                    >
                        月
                    </span>
                </div>
                <div class="text-right">
                    <span
                        class="text-3xl font-black text-primary"
                        :style="{ fontFamily: serifFont }"
                    >
                        {{ levelLabel }}
                    </span>
                    <p
                        class="text-base font-bold text-base-content/60"
                        :style="{ fontFamily: serifFont }"
                    >
                        {{ lunarDay }}
                    </p>
                </div>
            </div>

            <!-- Poem -->
            <p
                v-if="poem"
                class="text-center text-base font-semibold leading-relaxed"
                :style="{ fontFamily: serifFont }"
            >
                {{ poem }}
            </p>

            <!-- Summary -->
            <p
                v-if="summary"
                class="text-center text-sm leading-relaxed text-base-content/60"
                :style="{ fontFamily: serifFont }"
            >
                {{ summary }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Solar } from "lunar-javascript";

interface Props {
    level: number;
    createdAt?: string;
    poem?: string;
    summary?: string;
    showSealHeader?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    createdAt: undefined,
    poem: undefined,
    summary: undefined,
    showSealHeader: true,
});

const serifFont = "'Noto Serif', 'Noto Serif SC', serif";

const levelLabels: Record<number, string> = {
    0: "Terrible",
    1: "Bad",
    2: "Good",
    3: "Excellent",
    4: "Great",
    5: "Lucky",
};

const artAssets: Record<number, string> = {
    0: "/images/michan/check-in-result0.webp",
    1: "/images/michan/check-in-result1.webp",
    2: "/images/michan/check-in-result2.webp",
    3: "/images/michan/check-in-result3.webp",
    4: "/images/michan/check-in-result4.webp",
    5: "/images/michan/check-in-result5.webp",
};

const artBackdropColors: Record<number, string> = {
    0: "#7A587D",
    1: "#79709C",
    2: "#8DB7EF",
    3: "#FEDE81",
    4: "#E04A46",
    5: "#FFB7C0",
};

const levelLabel = computed(() => levelLabels[props.level] ?? "Fortune");
const artAsset = computed(() => artAssets[props.level] ?? null);
const artBackdrop = computed(() => artBackdropColors[props.level] ?? "#8DB7EF");

const lunarMonth = computed(() => {
    if (!props.createdAt) return "--";
    try {
        const solar = Solar.fromDate(new Date(props.createdAt));
        const lunar = solar.getLunar();
        return lunar.getMonthInChinese();
    } catch {
        return "--";
    }
});

const lunarDay = computed(() => {
    if (!props.createdAt) return "--";
    try {
        const solar = Solar.fromDate(new Date(props.createdAt));
        const lunar = solar.getLunar();
        return lunar.getDayInChinese();
    } catch {
        return "--";
    }
});
</script>
