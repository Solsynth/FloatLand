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
        <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div v-for="item in 4" :key="item" class="skeleton h-24 w-full rounded-box" />
        </div>
        <div class="skeleton h-32 w-full rounded-box" />
      </div>

      <template v-else-if="product">
        <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <article class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
            <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-base-content/45">{{ t('developer.apps.distribution.channels') }}</p>
            <p class="mt-2 text-2xl font-semibold tabular-nums">{{ channels.length }}</p>
            <p class="mt-1 text-xs text-base-content/55">{{ t('developer.apps.distribution.channelsSummary') }}</p>
          </article>
          <article class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
            <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-base-content/45">{{ t('developer.apps.distribution.releases') }}</p>
            <p class="mt-2 text-2xl font-semibold tabular-nums">{{ publishedReleaseCount }}</p>
            <p class="mt-1 truncate text-xs text-base-content/55">{{ selectedChannel?.name || t('developer.apps.distribution.selectChannel') }}</p>
          </article>
          <article class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
            <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-base-content/45">{{ t('developer.apps.distribution.artifacts') }}</p>
            <p class="mt-2 text-2xl font-semibold tabular-nums">{{ selectedArtifactCount }}</p>
            <p class="mt-1 text-xs text-base-content/55">{{ t('developer.apps.distribution.artifactsSummary') }}</p>
          </article>
          <article class="rounded-box border border-primary/20 bg-primary/[0.05] p-4 shadow-sm">
            <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/70">{{ t('developer.apps.distribution.activeChannel') }}</p>
            <p class="mt-2 truncate text-lg font-semibold">
              {{ selectedChannel ? localizedDistributionText(selectedChannel.displayNames, selectedChannel.displayName || selectedChannel.name, localizationLocales) : '—' }}
            </p>
            <p class="mt-1 text-xs text-base-content/55">
              {{ selectedChannel ? channelRetentionLabel(selectedChannel) || t('developer.apps.distribution.retentionDefault') : t('developer.apps.distribution.selectChannel') }}
            </p>
          </article>
        </div>

        <section class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold">{{ t('developer.apps.distribution.latestRelease') }}</h2>
              <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.hints.overview') }}</p>
            </div>
            <NuxtLink
              class="btn btn-outline btn-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
              :to="`${base}/releases`"
            >
              {{ t('developer.apps.distribution.viewAllReleases', { count: releases.length }) }}
              <IconChevronRight class="h-4 w-4" />
            </NuxtLink>
          </div>

          <div v-if="latestRelease" class="mt-4 rounded-box border border-base-300 bg-base-200/30 p-4">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="releaseStatusClass(latestRelease.status)">{{ latestRelease.status }}</span>
              <span v-if="isReleaseExpired(latestRelease)" class="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">{{ t('developer.apps.distribution.expired') }}</span>
              <span class="font-mono text-sm">{{ latestRelease.version }}</span>
            </div>
            <div v-if="latestRelease.title || Object.keys(latestRelease.titles || {}).length" class="mt-2 font-medium">
              {{ localizedDistributionText(latestRelease.titles, latestRelease.title || '', localizationLocales) }}
            </div>
            <p v-if="latestRelease.releaseNotes || Object.keys(latestRelease.descriptions || {}).length" class="mt-1 line-clamp-2 max-w-3xl text-sm text-base-content/60">
              {{ localizedDistributionText(latestRelease.descriptions, latestRelease.releaseNotes, localizationLocales) }}
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/55">
              <span v-if="latestRelease.publishedAt">{{ t('developer.apps.distribution.publishedAt') }} {{ formatRelativeTime(latestRelease.publishedAt) }}</span>
              <span v-else-if="latestRelease.createdAt">{{ t('developer.apps.distribution.createdAt') }} {{ formatRelativeTime(latestRelease.createdAt) }}</span>
              <span>{{ latestRelease.artifacts.length }} {{ t('developer.apps.distribution.artifactCount') }}</span>
              <span v-if="latestRelease.downloadCount != null" class="inline-flex items-center gap-1">
                <IconDownload class="h-3.5 w-3.5" />
                {{ latestRelease.downloadCount }} {{ t('developer.apps.distribution.downloads') }}
              </span>
            </div>
          </div>
          <p v-else class="mt-4 rounded-box border border-base-300 p-5 text-sm text-base-content/60">
            {{ t('developer.apps.distribution.noReleases') }}
          </p>
        </section>
      </template>

      <div v-else class="flex flex-col items-center gap-3 rounded-box bg-base-100 px-5 py-14 text-center shadow-sm">
        <IconAlertTriangle class="h-10 w-10 text-error/60" aria-hidden="true" />
        <p role="alert" class="text-sm text-base-content/60">{{ t('developer.apps.distribution.requestFailed') }}</p>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconAlertTriangle, IconChevronRight, IconDownload } from '#components'
import { isReleaseExpired, releaseStatusClass } from '~/composables/useDistributionProduct'
import { localizedDistributionText } from '~/utils/distribution'
import { formatRelativeTime } from '~/utils/datetime'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const route = useRoute()
const developer = useDeveloper()

const pubName = computed(() => route.params.pubName as string)
const slug = computed(() => route.params.slug as string)
const publisherName = computed(() => developer.currentDeveloper.value?.publisher?.name || pubName.value)
const base = computed(() => `/developers/${encodeURIComponent(pubName.value)}/distribution/${encodeURIComponent(slug.value)}`)

const {
  product,
  isLoadingProduct,
  isHydrated,
  channels,
  selectedChannel,
  releases,
  publishedReleaseCount,
  selectedArtifactCount,
  localizationLocales,
  channelRetentionLabel,
  loadProduct,
  loadChannels,
  loadReleases,
} = useDistributionProduct(pubName, slug, 'developer.apps.distribution.tabs.overview')

const latestRelease = computed(() => releases.value[0] || null)

async function reload() {
  await loadProduct()
  await loadChannels()
  await loadReleases()
}
</script>
