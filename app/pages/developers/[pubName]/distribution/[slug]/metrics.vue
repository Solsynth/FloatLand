<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-7xl space-y-5">
      <DistributionProductHeader
        :product="product"
        :publisher-name="publisherName"
        :product-slug="slug"
        :refreshing="isLoadingProduct"
        @refresh="reload"
      />

      <div v-if="!isHydrated || isLoadingProduct" class="space-y-3" aria-busy="true" :aria-label="t('common.loading')">
        <div class="skeleton h-24 w-full rounded-box" />
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div v-for="item in 3" :key="item" class="skeleton h-20 w-full rounded-box" />
        </div>
        <div class="skeleton h-40 w-full rounded-box" />
      </div>

      <section v-else-if="product" class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="font-semibold">{{ t('developer.apps.distribution.metrics') }}</h2>
            <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.hints.metrics') }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <select
              v-model="metricsRangeDays"
              class="select select-sm"
              :aria-label="t('developer.apps.distribution.metricsRange')"
            >
              <option :value="7">{{ t('developer.apps.distribution.last7Days') }}</option>
              <option :value="30">{{ t('developer.apps.distribution.last30Days') }}</option>
              <option :value="90">{{ t('developer.apps.distribution.last90Days') }}</option>
            </select>
            <button class="btn btn-outline btn-sm" :disabled="isLoadingMetrics" @click="loadMetrics">
              <span v-if="isLoadingMetrics" class="loading loading-spinner loading-xs" />
              {{ t('developer.apps.distribution.loadMetrics') }}
            </button>
          </div>
        </div>
        <div v-if="metrics" class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div class="border border-base-300 p-3 rounded-box">
            <div class="text-sm text-base-content/60">{{ t('developer.apps.distribution.checks') }}</div>
            <div class="mt-1 text-xl font-semibold">{{ metrics.checks }}</div>
          </div>
          <div class="border border-base-300 p-3 rounded-box">
            <div class="text-sm text-base-content/60">{{ t('developer.apps.distribution.dau') }}</div>
            <div class="mt-1 text-xl font-semibold">{{ metrics.dau }}</div>
          </div>
          <div class="border border-base-300 p-3 rounded-box">
            <div class="text-sm text-base-content/60">{{ t('developer.apps.distribution.mau') }}</div>
            <div class="mt-1 text-xl font-semibold">{{ metrics.mau }}</div>
          </div>
        </div>
        <div v-if="metrics && metricGroups.length" class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div v-for="group in metricGroups" :key="group.key" class="border border-base-300 p-3 rounded-box">
            <div class="text-sm text-base-content/60">{{ group.label }}</div>
            <div v-if="group.entries.length" class="mt-2 space-y-1.5">
              <div v-for="entry in visibleMetricEntries(group)" :key="entry.key" class="flex items-center justify-between gap-3">
                <span class="truncate font-mono text-xs">{{ entry.key }}</span>
                <span class="shrink-0 text-sm font-semibold tabular-nums">{{ entry.count }}</span>
              </div>
              <p v-if="group.entries.length > MAX_METRIC_ENTRIES" class="text-xs text-base-content/45">
                {{ t('developer.apps.distribution.moreCount', { count: group.entries.length - MAX_METRIC_ENTRIES }) }}
              </p>
            </div>
            <p v-else class="mt-2 text-xs text-base-content/45">{{ t('developer.apps.distribution.breakdownEmpty') }}</p>
          </div>
        </div>
        <p v-else-if="!metrics" class="mt-5 border border-base-300 p-4 rounded-box text-sm text-base-content/60">
          {{ t('developer.apps.distribution.metricsEmpty') }}
        </p>
      </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { MAX_METRIC_ENTRIES, type MetricGroup } from '~/composables/useDistributionProduct'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const route = useRoute()
const developer = useDeveloper()

const pubName = computed(() => route.params.pubName as string)
const slug = computed(() => route.params.slug as string)
const publisherName = computed(() => developer.currentDeveloper.value?.publisher?.name || pubName.value)

const {
  product,
  isLoadingProduct,
  isHydrated,
  metrics,
  isLoadingMetrics,
  metricsRangeDays,
  metricGroups,
  loadMetrics,
  loadProduct,
} = useDistributionProduct(pubName, slug, 'developer.apps.distribution.tabs.metrics')

function visibleMetricEntries(group: MetricGroup) {
  return group.entries.slice(0, MAX_METRIC_ENTRIES)
}

watch(
  product,
  (value) => {
    if (value) loadMetrics()
  },
  { immediate: true },
)

async function reload() {
  await loadProduct()
  if (metrics.value) await loadMetrics()
}
</script>
