<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-5xl">
      <AdminPageHeader
        :title="t('developer.apps.distribution.title')"
        :description="t('developer.apps.distribution.detailDescription')"
      />
      <div v-if="isLoading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg" />
      </div>
      <DistributionCenterPanel
        v-else-if="publisherName"
        :publisher-name="publisherName"
        :product-slug="slug"
      />
      <div v-else class="alert alert-warning">
        {{ t('developer.apps.distribution.requestFailed') }}
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
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
