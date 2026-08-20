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

      <header class="relative isolate overflow-hidden rounded-box bg-base-100 px-5 py-5 shadow-sm sm:px-6">
        <div class="absolute inset-y-0 right-0 -z-10 w-1/3 bg-primary/[0.06]" aria-hidden="true">
          <div class="absolute inset-y-0 left-0 w-px bg-primary/15" />
          <div class="absolute inset-y-0 left-5 w-px bg-primary/10" />
          <div class="absolute inset-y-0 left-10 w-px bg-primary/10" />
        </div>
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">{{ t('developer.apps.distribution.title') }}</p>
        <h1 class="mt-2 truncate font-mono text-2xl font-black tracking-tight">{{ slug }}</h1>
        <p class="mt-1 max-w-xl text-sm text-base-content/55">{{ t('developer.apps.distribution.detailDescription') }}</p>
      </header>

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
        :publisher-name="publisherName"
        :product-slug="slug"
      />

      <div v-else class="flex flex-col items-center gap-3 rounded-box bg-base-100 px-5 py-14 text-center shadow-sm">
        <IconAlertTriangle class="h-10 w-10 text-error/60" aria-hidden="true" />
        <p role="alert" class="text-sm text-base-content/60">{{ t('developer.apps.distribution.requestFailed') }}</p>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconAlertTriangle } from '#components'
definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const route = useRoute()
const developer = useDeveloper()
const { currentDeveloper } = developer
const pubName = computed(() => route.params.pubName as string)
const slug = computed(() => route.params.slug as string)
const publisherName = computed(() => currentDeveloper.value?.publisher?.name || pubName.value)
const isLoading = ref(false)

useSolarSeo({ title: `${t('developer.apps.distribution.title')} · ${slug.value}` })

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
