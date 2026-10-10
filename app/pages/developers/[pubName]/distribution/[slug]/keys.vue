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
        <div class="skeleton h-44 w-full rounded-box" />
      </div>

      <template v-else-if="product">
        <section class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold">{{ t('developer.apps.distribution.uploadKeys') }}</h2>
              <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.hints.keys') }}</p>
              <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.uploadKeysHint') }}</p>
            </div>
            <button class="btn btn-outline btn-sm" :disabled="isLoadingUploadApiKeys" type="button" @click="loadUploadApiKeys">
              <span v-if="isLoadingUploadApiKeys" class="loading loading-spinner loading-xs" />
              {{ t('developer.apps.distribution.refresh') }}
            </button>
          </div>
          <div v-if="oneTimeUploadApiKey" class="alert alert-warning mt-5 rounded-box border border-warning/40">
            <div class="min-w-0">
              <div class="font-medium">{{ t('developer.apps.distribution.uploadKeyCreated') }}</div>
              <code class="mt-2 block max-w-[28rem] truncate whitespace-nowrap font-mono text-xs">{{ oneTimeUploadApiKey }}</code>
            </div>
            <button
              class="btn btn-warning btn-sm h-9 min-h-9 w-9 shrink-0 px-0"
              type="button"
              :title="t('developer.apps.distribution.copyUploadKey')"
              :aria-label="t('developer.apps.distribution.copyUploadKey')"
              @click="copyIdentifier(oneTimeUploadApiKey)"
            >
              <IconCopy class="h-4 w-4" />
            </button>
          </div>
          <form class="mt-5 flex flex-col gap-2 sm:flex-row" @submit.prevent="submitUploadApiKey">
            <input
              v-model="newUploadApiKeyName"
              class="input w-full"
              type="text"
              maxlength="100"
              :placeholder="t('developer.apps.distribution.uploadKeyNamePlaceholder')"
              :aria-label="t('developer.apps.distribution.uploadKeyName')"
              required
            />
            <button class="btn btn-primary shrink-0" :disabled="isCreatingUploadApiKey" type="submit">
              <span v-if="isCreatingUploadApiKey" class="loading loading-spinner loading-xs" />
              {{ t('developer.apps.distribution.createUploadKey') }}
            </button>
          </form>
          <div v-if="isLoadingUploadApiKeys && !uploadApiKeys.length" class="mt-5 space-y-2" aria-busy="true">
            <div v-for="item in 3" :key="item" class="skeleton h-16 w-full rounded-box" />
          </div>
          <div v-else-if="uploadApiKeys.length" class="mt-5 space-y-2">
            <div
              v-for="key in uploadApiKeys"
              :key="key.id"
              class="flex flex-wrap items-center justify-between gap-3 border border-base-300 p-3 rounded-box"
            >
              <div class="min-w-0">
                <div class="font-medium">{{ key.name }}</div>
                <div class="mt-1 text-xs text-base-content/55">
                  <span class="font-mono">{{ key.id }}</span>
                  <span v-if="key.lastUsedAt"> · {{ key.lastUsedAt }}</span>
                </div>
              </div>
              <button class="btn btn-ghost btn-xs text-error" type="button" @click="deleteUploadApiKey(key)">
                {{ t('common.remove') }}
              </button>
            </div>
          </div>
          <p v-else class="mt-5 border border-base-300 p-4 rounded-box text-sm text-base-content/60">
            {{ t('developer.apps.distribution.noUploadKeys') }}
          </p>
        </section>
      </template>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconCopy } from '#components'

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
  uploadApiKeys,
  isLoadingUploadApiKeys,
  isCreatingUploadApiKey,
  oneTimeUploadApiKey,
  loadUploadApiKeys,
  createUploadApiKey,
  deleteUploadApiKey,
  copyIdentifier,
  loadProduct,
} = useDistributionProduct(pubName, slug, 'developer.apps.distribution.tabs.keys')

const newUploadApiKeyName = ref('')

watch(
  product,
  (value) => {
    if (value) loadUploadApiKeys()
  },
  { immediate: true },
)

async function submitUploadApiKey() {
  const created = await createUploadApiKey(newUploadApiKeyName.value)
  if (created) newUploadApiKeyName.value = ''
}

async function reload() {
  await loadProduct()
  await loadUploadApiKeys()
}
</script>
