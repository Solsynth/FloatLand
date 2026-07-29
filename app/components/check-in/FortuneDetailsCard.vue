<template>
    <div class="space-y-3">
        <div class="flex items-center gap-2">
            <IconSparkles class="w-5 h-5 text-primary" />
            <h3
                class="text-base font-bold"
                :style="{ fontFamily: serifFont }"
            >
                Fortune Details
            </h3>
        </div>
        <div class="card bg-base-100">
            <div class="space-y-1">
                <FortuneItem
                    v-for="item in fortuneItems"
                    :key="item.label"
                    :icon="item.icon"
                    :label="item.label"
                    :value="item.value"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    IconSparkles,
    IconHeart,
    IconBookOpen,
    IconBriefcase,
    IconLeaf,
    IconSearch,
    IconCheck,
    IconBan,
} from "#components";
import type { FortuneReport } from "~/utils/api";

const props = defineProps<{
    report: FortuneReport;
}>();

const serifFont = "'Noto Serif', 'Noto Serif SC', serif";

const fortuneItems = computed(() => [
    { icon: IconHeart, label: "Wish", value: props.report.wish },
    { icon: IconHeart, label: "Love", value: props.report.love },
    { icon: IconBookOpen, label: "Study", value: props.report.study },
    { icon: IconBriefcase, label: "Career", value: props.report.career },
    { icon: IconLeaf, label: "Health", value: props.report.health },
    { icon: IconSearch, label: "Lost Item", value: props.report.lostItem },
    { icon: IconCheck, label: "Lucky Action", value: props.report.luckyAction },
    { icon: IconBan, label: "Avoid", value: props.report.avoidAction },
]);
</script>
