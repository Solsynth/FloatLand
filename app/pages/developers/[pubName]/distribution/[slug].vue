<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-7xl space-y-5">
      <NuxtLink
        class="btn btn-ghost btn-sm w-fit gap-2 outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
        :to="`/developers/${encodeURIComponent(pubName)}/distribution`"
      >
        <IconArrowLeft class="h-4 w-4" />
        {{ t('developer.apps.distribution.backToProducts') }}
      </NuxtLink>

      <div v-if="isLoading" class="rounded-box bg-base-100 p-5 shadow-sm sm:p-6" aria-busy="true" :aria-label="t('common.loading')">
        <div class="space-y-4">
          <div class="skeleton h-5 w-40" />
          <div class="skeleton h-3 w-64" />
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div v-for="item in 3" :key="item" class="skeleton h-24 w-full rounded-box" />
          </div>
        </div>
      </div>

      <DistributionCenterPanel
        v-else-if="publisherName"
        v-model:product="product"
        :publisher-name="publisherName"
        :product-slug="slug"
      />

      <div v-else class="flex flex-col items-center gap-3 rounded-box bg-base-100 px-5 py-14 text-center shadow-sm">
        <h1 class="sr-only">{{ t('developer.apps.distribution.title') }}</h1>
        <IconAlertTriangle class="h-10 w-10 text-error/60" aria-hidden="true" />
        <p role="alert" class="text-sm text-base-content/60">{{ t('developer.apps.distribution.requestFailed') }}</p>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconAlertTriangle } from '#components'
import type { DistributionProduct } from '~/types/distribution'
import { localizedDistributionText } from '~/utils/distribution'
definePageMeta({ middleware: 'developer' })

const { t, locale, localeProperties } = useI18n()
const route = useRoute()
const developer = useDeveloper()
const { currentDeveloper } = developer
const pubName = computed(() => route.params.pubName as string)
const slug = computed(() => route.params.slug as string)
const publisherName = computed(() => currentDeveloper.value?.publisher?.name || pubName.value)
const isLoading = ref(false)
const product = ref<DistributionProduct | null>(null)
const localizationLocales = computed<readonly string[]>(() =>
  [localeProperties.value.language, locale.value].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  ),
)
// The product name drives the UI: breadcrumbs, document title, and the panel hero.
const productName = computed(() =>
  product.value
    ? localizedDistributionText(product.value.names, product.value.name, localizationLocales.value)
    : '',
)

watch(product, (value) => {
  developer.setDistributionProduct(value ? { slug: value.slug, name: productName.value } : null)
})

useSolarSeo({
  title: computed(
    () => `${productName.value || slug.value} · ${t('developer.apps.distribution.title')} · ${pubName.value}`,
  ),
})

async function autoLoad() {
  isLoading.value = true
  try {
    await developer.loadDevelopers()
    developer.selectByPublisherName(pubName.value)
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

watch(pubName, autoLoad, { immediate: true })
</script>
