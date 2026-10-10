<template>
  <div class="space-y-3">
    <NuxtLink
      class="btn btn-ghost btn-sm w-fit gap-2 outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
      :to="`/developers/${encodeURIComponent(publisherName)}/distribution`"
    >
      <IconArrowLeft class="h-4 w-4" />
      {{ t('developer.apps.distribution.backToProducts') }}
    </NuxtLink>

    <div class="relative overflow-hidden rounded-box border border-base-300 bg-gradient-to-br from-base-100 via-base-100 to-primary/[0.05] p-5 shadow-sm sm:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0">
          <p class="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/75">
            {{ t('developer.apps.distribution.title') }}
          </p>
          <h1 v-if="product" class="mt-2 break-words text-2xl font-black tracking-tight">
            {{ localizedDistributionText(product.names, product.name, localizationLocales) }}
          </h1>
          <div v-else class="skeleton mt-2 h-8 w-56 max-w-full" />
          <p v-if="product" class="mt-1 font-mono text-xs text-base-content/45">{{ product.slug }}</p>
          <p v-if="product" class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-base-content/50">
            <button
              class="btn btn-ghost btn-xs h-7 min-h-7 gap-1.5 px-2 text-base-content/55"
              type="button"
              :title="product.id"
              :aria-label="t('developer.apps.distribution.copyAppId')"
              @click="copyAppId"
            >
              <IconCopy class="h-3.5 w-3.5" />
              {{ t('developer.apps.distribution.appId') }}
            </button>
            <span v-if="product.updatedAt">{{ t('developer.apps.distribution.updatedAt') }} {{ formatDate(product.updatedAt) }}</span>
          </p>
          <p
            v-if="product && (product.description || Object.keys(product.descriptions || {}).length)"
            class="mt-3 max-w-2xl text-sm text-base-content/65"
          >
            {{ localizedDistributionText(product.descriptions, product.description, localizationLocales) }}
          </p>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2">
          <NuxtLink
            class="btn btn-outline btn-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
            :to="`${base}/settings`"
          >
            <IconSettings class="h-4 w-4" />
            {{ t('developer.apps.distribution.tabs.settings') }}
          </NuxtLink>
          <button
            class="btn btn-ghost btn-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
            type="button"
            :disabled="refreshing"
            @click="$emit('refresh')"
          >
            <IconRefreshCw class="h-4 w-4" :class="{ 'animate-spin': refreshing }" />
            {{ t('developer.apps.distribution.refresh') }}
          </button>
        </div>
      </div>
    </div>

    <nav class="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1" :aria-label="t('developer.apps.distribution.title')">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.href"
        :to="tab.href"
        class="shrink-0 rounded-btn px-3 py-2 text-sm font-medium outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
        :class="isActive(tab.href) ? 'bg-primary/10 text-primary' : 'text-base-content/60 hover:bg-base-200 hover:text-base-content'"
        :aria-current="isActive(tab.href) ? 'page' : undefined"
      >
        {{ t(tab.labelKey) }}
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconCopy, IconRefreshCw, IconSettings } from '#components'
import type { DistributionProduct } from '~/types/distribution'
import { localizedDistributionText } from '~/utils/distribution'

const props = defineProps<{
  product: DistributionProduct | null
  publisherName: string
  productSlug: string
  refreshing?: boolean
}>()

defineEmits<{ refresh: [] }>()

const { t, locale, localeProperties } = useI18n()
const route = useRoute()
const toast = useAppToast()

const localizationLocales = computed<readonly string[]>(() =>
  [localeProperties.value.language, locale.value].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  ),
)

const base = computed(
  () => `/developers/${encodeURIComponent(props.publisherName)}/distribution/${encodeURIComponent(props.productSlug)}`,
)

const tabs = computed(() => [
  { labelKey: 'developer.apps.distribution.tabs.overview', href: base.value },
  { labelKey: 'developer.apps.distribution.tabs.releases', href: `${base.value}/releases` },
  { labelKey: 'developer.apps.distribution.tabs.channels', href: `${base.value}/channels` },
  { labelKey: 'developer.apps.distribution.tabs.metrics', href: `${base.value}/metrics` },
  { labelKey: 'developer.apps.distribution.tabs.keys', href: `${base.value}/keys` },
  { labelKey: 'developer.apps.distribution.tabs.settings', href: `${base.value}/settings` },
])

function isActive(href: string) {
  return route.path === href
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

async function copyAppId() {
  if (!props.product) return
  try {
    await navigator.clipboard.writeText(props.product.id)
    toast.success(t('developer.apps.distribution.idCopied'))
  } catch {
    toast.error(t('developer.apps.distribution.copyFailed'))
  }
}
</script>
