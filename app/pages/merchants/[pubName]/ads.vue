<template>
  <NuxtLayout name="merchant">
    <div class="mx-auto max-w-5xl">
      <!-- Ad Stats Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="stat bg-base-100 rounded-box shadow-sm">
          <div class="stat-title">{{ t('merchant.totalAdPosts') }}</div>
          <div class="stat-value text-primary text-2xl">{{ adStats.length }}</div>
        </div>
        <div class="stat bg-base-100 rounded-box shadow-sm">
          <div class="stat-title">{{ t('merchant.totalImpressions') }}</div>
          <div class="stat-value text-primary text-2xl">{{ totalImpressions }}</div>
        </div>
        <div class="stat bg-base-100 rounded-box shadow-sm">
          <div class="stat-title">{{ t('merchant.currentlyPlaced') }}</div>
          <div class="stat-value text-primary text-2xl">{{ liveCount }}</div>
        </div>
      </div>

      <!-- Ads Table -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-bold">{{ t('merchant.adPerformance') }}</h3>
            <button class="btn btn-ghost btn-xs" @click="loadAds" :disabled="isLoading">
              <IconRefresh class="w-3.5 h-3.5" />
              {{ t('common.refresh') }}
            </button>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg" />
          </div>

          <!-- Table -->
          <div v-else-if="adStats.length > 0" class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>{{ t('merchant.table.post') }}</th>
                  <th class="text-right">{{ t('merchant.table.bidTotal') }}</th>
                  <th class="text-right">{{ t('merchant.table.bids') }}</th>
                  <th class="text-right">{{ t('merchant.table.impressions') }}</th>
                  <th class="text-center">{{ t('merchant.table.status') }}</th>
                  <th class="text-right">{{ t('merchant.table.lastShown') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ad in adStats" :key="ad.postId">
                  <td class="min-w-0">
                    <div class="truncate font-medium text-sm max-w-[200px]">
                      {{ ad.title || ad.slug || ad.postId.slice(0, 8) }}
                    </div>
                    <div v-if="ad.slug" class="text-xs text-base-content/40 font-mono truncate max-w-[200px]">
                      {{ ad.slug }}
                    </div>
                  </td>
                  <td class="text-right font-mono font-semibold">
                    {{ ad.activeBidTotal.toFixed(0) }}
                    <span class="text-xs text-base-content/40">{{ t('merchant.golds') }}</span>
                  </td>
                  <td class="text-right text-sm text-base-content/60">
                    {{ ad.bidCount }}
                  </td>
                  <td class="text-right font-mono text-sm">
                    {{ ad.shownCount }}
                  </td>
                  <td class="text-center">
                    <span
                      class="badge badge-xs"
                      :class="ad.isCurrentlyPlaced ? 'badge-success' : 'badge-ghost'"
                    >
                      {{ ad.isCurrentlyPlaced ? t('merchant.status.live') : t('merchant.status.queued') }}
                    </span>
                  </td>
                  <td class="text-right text-xs text-base-content/50">
                    {{ ad.lastShownAt ? formatDate(ad.lastShownAt) : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <div v-if="hasMore" class="flex justify-center mt-4">
              <button
                class="btn btn-ghost btn-sm"
                :disabled="isLoading"
                @click="loadMore"
              >
                {{ t('common.loadMore') }}
              </button>
            </div>
          </div>

          <!-- Empty -->
          <div v-else class="flex flex-col items-center py-8 text-base-content/30">
            <IconTrendingUp class="w-10 h-10 mb-3" />
            <p class="text-sm">{{ t('merchant.noAdData') }}</p>
            <p class="text-xs text-base-content/40 mt-1">{{ t('merchant.adsHint') }}</p>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconRefreshCw as IconRefresh,
  IconTrendingUp,
} from '#components'
import type { AdPostStat } from '~/types/merchant'
import { fetchAdPostStats } from '~/utils/merchant'
import { fetchManagedPublishers } from '~/utils/creator'
import { useMerchant } from '~/composables/useMerchant'

definePageMeta({ middleware: 'merchant' })

const { t } = useI18n()
const { $toast } = useNuxtApp()
const route = useRoute()
const merchant = useMerchant()
const pubName = computed(() => route.params.pubName as string)

const adStats = ref<AdPostStat[]>([])
const isLoading = ref(false)
const offset = ref(0)
const pageSize = 20
const totalAds = ref(0)

const totalImpressions = computed(() =>
  adStats.value.reduce((sum, a) => sum + a.shownCount, 0),
)

const liveCount = computed(() =>
  adStats.value.filter(a => a.isCurrentlyPlaced).length,
)

const hasMore = computed(() => offset.value + pageSize < totalAds.value)

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadAds() {
  isLoading.value = true
  try {
    offset.value = 0
    const result = await fetchAdPostStats(pubName.value, 0, pageSize)
    adStats.value = result.items
    totalAds.value = result.total
  } catch (e) {
    console.error(e)
    $toast.error(t('merchant.error.loadingAds'))
  } finally {
    isLoading.value = false
  }
}

async function loadMore() {
  isLoading.value = true
  try {
    offset.value += pageSize
    const result = await fetchAdPostStats(pubName.value, offset.value, pageSize)
    adStats.value = [...adStats.value, ...result.items]
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (!merchant.hasPublisherSelected.value || merchant.currentPublisherName.value !== pubName.value) {
    const pubs = await fetchManagedPublishers()
    const pub = pubs.find(p => p.name === pubName.value)
    if (pub) await merchant.selectPublisher(pub)
  }
})

watch(pubName, () => { loadAds() }, { immediate: true })
</script>
