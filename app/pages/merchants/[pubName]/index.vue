<template>
  <NuxtLayout name="merchant">
    <MerchantProfileMissing
      v-if="profileMissing"
      :pub-name="pubName"
      class="mb-6"
    />

    <!-- Stats Overview -->
    <div class="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="stat bg-base-100 rounded-box shadow-sm">
        <div class="stat-title">{{ t('merchant.totalPending') }}</div>
        <div class="stat-value text-primary text-2xl">{{ overview?.totalPending ?? 0 }}</div>
        <div class="stat-desc text-base-content/40">{{ t('merchant.settlements') }}</div>
      </div>
      <div class="stat bg-base-100 rounded-box shadow-sm">
        <div class="stat-title">{{ t('merchant.totalSettled') }}</div>
        <div class="stat-value text-primary text-2xl">{{ overview?.totalSettled ?? 0 }}</div>
        <div class="stat-desc text-base-content/40">{{ t('merchant.allTime') }}</div>
      </div>
      <div class="stat bg-base-100 rounded-box shadow-sm">
        <div class="stat-title">{{ t('merchant.activeAds') }}</div>
        <div class="stat-value text-primary text-2xl">{{ adStats.filter(a => a.isCurrentlyPlaced).length }}</div>
        <div class="stat-desc text-base-content/40">{{ t('merchant.sponsoredPosts') }}</div>
      </div>
    </div>

    <!-- Quick Actions + Pending Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <!-- Pending by Currency -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-5">
          <h3 class="text-base font-bold mb-3">{{ t('merchant.pendingByCurrency') }}</h3>
          <div v-if="hasPending" class="space-y-2">
            <div
              v-for="(data, currency) in overview?.pending"
              :key="currency"
              class="flex items-center justify-between rounded-box bg-base-200 px-2 py-1"
            >
              <span class="text-sm font-medium text-base-content/70">{{ currency }}</span>
              <div class="text-right">
                <div class="font-mono font-semibold">{{ data.total.toFixed(2) }}</div>
                <div class="text-xs text-base-content/40">{{ t('merchant.countSettlements', { count: data.count }) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center py-4 text-base-content/30">
            <IconWallet class="w-8 h-8 mb-2" />
            <p class="text-sm">{{ t('merchant.noPending') }}</p>
          </div>
        </div>
      </div>

      <!-- Recent Ads -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-bold">{{ t('merchant.topAds') }}</h3>
            <NuxtLink :to="`/merchants/${pubName}/ads`" class="btn btn-ghost btn-xs">
              {{ t('common.viewAll') }}
            </NuxtLink>
          </div>
          <div v-if="adStats.length > 0" class="space-y-2">
            <div
              v-for="ad in adStats.slice(0, 5)"
              :key="ad.postId"
              class="flex items-center justify-between rounded-box bg-base-200 px-2 py-1"
            >
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium">{{ ad.title || ad.slug || ad.postId.slice(0, 8) }}</div>
                <div class="text-xs text-base-content/40">
                  {{ ad.shownCount }} {{ t('merchant.impressions') }}
                  <span v-if="ad.isCurrentlyPlaced" class="text-success ml-1">
                    {{ t('merchant.live') }}
                  </span>
                </div>
              </div>
              <div class="text-right ml-3">
                <div class="font-mono text-sm font-semibold">{{ ad.activeBidTotal.toFixed(0) }} {{ t('merchant.golds') }}</div>
                <div class="text-xs text-base-content/40">{{ ad.bidCount }} {{ t('merchant.bids') }}</div>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center py-4 text-base-content/30">
            <IconTrendingUp class="w-8 h-8 mb-2" />
            <p class="text-sm">{{ t('merchant.noAds') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Income Chart Preview -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-base font-bold">{{ t('merchant.recentIncome') }}</h3>
          <NuxtLink :to="`/merchants/${pubName}/settlements`" class="btn btn-ghost btn-xs">
            {{ t('common.viewAll') }}
          </NuxtLink>
        </div>
        <div v-if="isLoadingDaily" class="flex justify-center py-6">
          <span class="loading loading-spinner loading-md" />
        </div>
        <div v-else-if="dailyData.length > 0" class="grid grid-cols-7 gap-1">
          <div
            v-for="day in dailyData"
            :key="day.date"
            class="flex flex-col items-center gap-1 rounded-lg p-2 bg-base-200/50"
          >
            <span class="text-[10px] text-base-content/40">{{ formatDay(day.date) }}</span>
            <span class="font-mono text-xs font-semibold">{{ day.total.toFixed(0) }}</span>
            <span class="text-[10px] text-base-content/30">{{ day.count }}</span>
          </div>
        </div>
        <div v-else class="flex flex-col items-center py-4 text-base-content/30">
          <IconChartBar class="w-8 h-8 mb-2" />
          <p class="text-sm">{{ t('merchant.noIncomeData') }}</p>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconWallet,
  IconTrendingUp,
  IconChartBar,
} from '#components'
import type { MerchantOverview, AdPostStat, MerchantDailyIncoming } from '~/types/merchant'
import {
  fetchMerchantOverview,
  fetchMerchantDaily,
  fetchAdPostStats,
  isMerchantProfileNotFound,
} from '~/utils/merchant'
import { fetchManagedPublishers } from '~/utils/creator'

definePageMeta({ middleware: 'merchant' })

const { t } = useI18n()
const route = useRoute()
const merchant = useMerchant()
const pubName = computed(() => route.params.pubName as string)

const overview = ref<MerchantOverview | null>(null)
const adStats = ref<AdPostStat[]>([])
const dailyData = ref<MerchantDailyIncoming[]>([])
const isLoadingDaily = ref(false)
const profileMissing = ref(false)

const hasPending = computed(() => {
  return overview.value && Object.keys(overview.value.pending).length > 0
})

function formatDay(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)
}

async function loadData() {
  const days30 = new Date()
  days30.setDate(days30.getDate() - 30)
  const from = days30.toISOString().split('T')[0]
  const to = new Date().toISOString().split('T')[0]

  profileMissing.value = false
  overview.value = null
  dailyData.value = []

  try {
    const [overviewResult, dailyResult, adsResult] = await Promise.allSettled([
      fetchMerchantOverview(pubName.value),
      fetchMerchantDaily(pubName.value, { from, to }),
      fetchAdPostStats(pubName.value, 0, 20),
    ])

    if (overviewResult.status === 'fulfilled') {
      overview.value = overviewResult.value
    } else if (isMerchantProfileNotFound(overviewResult.reason)) {
      profileMissing.value = true
    }

    if (dailyResult.status === 'fulfilled') {
      dailyData.value = dailyResult.value.daily ?? []
    } else if (isMerchantProfileNotFound(dailyResult.reason)) {
      profileMissing.value = true
    }

    if (adsResult.status === 'fulfilled') adStats.value = adsResult.value.items
  } catch (e) {
    if (isMerchantProfileNotFound(e)) {
      profileMissing.value = true
    } else {
      console.error(e)
    }
  }
}

onMounted(async () => {
  if (!merchant.hasPublisherSelected.value || merchant.currentPublisherName.value !== pubName.value) {
    const pubs = await fetchManagedPublishers()
    const pub = pubs.find(p => p.name === pubName.value)
    if (pub) await merchant.selectPublisher(pub)
  }
})

watch(pubName, () => {
  isLoadingDaily.value = true
  loadData().finally(() => { isLoadingDaily.value = false })
}, { immediate: true })
</script>
