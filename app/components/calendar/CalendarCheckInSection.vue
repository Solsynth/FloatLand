<template>
  <div v-if="result" class="space-y-3">
    <div class="rounded-box bg-secondary/10 p-3">
      <div class="flex items-center gap-2">
        <IconStar class="h-4 w-4 shrink-0 text-secondary" />
        <span
          class="text-sm font-semibold"
          :style="{ color: fortuneLevelColor(result.level) }"
        >
          {{ t(`calendar.fortuneLevel${result.level}`) }}
        </span>
      </div>

      <ul v-if="result.tips.length" class="mt-2 space-y-1.5">
        <li
          v-for="(tip, index) in result.tips"
          :key="index"
          class="flex items-start gap-2 text-xs"
        >
          <IconThumbsUp
            v-if="tip.isPositive"
            class="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
          />
          <IconThumbsDown
            v-else
            class="mt-0.5 h-3.5 w-3.5 shrink-0 text-error"
          />
          <span>
            <span class="font-semibold">{{ tip.title }}</span>
            <span class="text-base-content/70"> — {{ tip.content }}</span>
          </span>
        </li>
      </ul>
    </div>

    <button
      type="button"
      class="btn btn-ghost btn-xs gap-1"
      @click="expanded = !expanded"
    >
      <IconChevronDown
        class="h-3.5 w-3.5 transition-transform"
        :class="expanded ? 'rotate-180' : ''"
      />
      {{
        expanded
          ? t("calendar.hideFullReading")
          : t("calendar.viewFullReading")
      }}
    </button>

    <div v-if="expanded" class="space-y-3">
      <FortuneCard
        :level="result.level"
        :created-at="result.createdAt"
        :poem="result.fortuneReport?.poem"
        :summary="result.fortuneReport?.summary"
        :show-seal-header="true"
      />
      <FortuneGuidanceCard
        v-if="result.fortuneReport?.summaryDetail"
        :summary-detail="result.fortuneReport.summaryDetail"
      />
      <FortuneLuckyGrid
        v-if="result.fortuneReport"
        :report="result.fortuneReport"
      />
      <FortuneDetailsCard
        v-if="result.fortuneReport"
        :report="result.fortuneReport"
      />
      <FortuneRitualCard
        v-if="result.fortuneReport?.ritual"
        :ritual="result.fortuneReport.ritual"
      />
    </div>
  </div>

  <div
    v-else-if="isToday && canDraw"
    class="rounded-box border border-dashed border-primary/40 p-4 text-center"
  >
    <IconFlame class="mx-auto h-8 w-8 text-primary" />
    <p class="mt-2 text-sm font-semibold">
      {{ t("calendar.notCheckedIn") }}
    </p>
    <p class="mt-1 text-xs text-base-content/60">
      {{ t("calendar.notCheckedInHint") }}
    </p>
    <button
      type="button"
      class="btn btn-primary btn-sm mt-3 gap-1"
      :disabled="drawing"
      @click="emit('draw')"
    >
      <span v-if="drawing" class="loading loading-spinner loading-xs" />
      <IconSparkles v-else class="h-4 w-4" />
      {{ t("calendar.drawFortune") }}
    </button>
  </div>

  <p v-else class="text-xs text-base-content/50">
    {{ t("calendar.noCheckIn") }}
  </p>
</template>

<script setup lang="ts">
import { IconChevronDown, IconFlame, IconSparkles, IconStar, IconThumbsDown, IconThumbsUp } from "#components";
import type { CheckInResult } from "~/utils/api";
import { fortuneLevelColor } from "~/utils/fortune";

const props = defineProps<{
  result: CheckInResult | null;
  isToday: boolean;
  canDraw: boolean;
  drawing: boolean;
}>();

const emit = defineEmits<{ draw: [] }>();

const { t } = useI18n();

const expanded = ref(props.isToday);
</script>
