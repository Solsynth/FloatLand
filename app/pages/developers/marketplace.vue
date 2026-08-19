<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-5xl space-y-5">
      <header class="flex flex-col gap-4 rounded-box bg-base-100 px-5 py-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {{ t('developer.marketplace.title') }}
          </p>
          <h1 class="mt-1 text-2xl font-black tracking-tight">{{ t('developer.marketplace.title') }}</h1>
          <p class="mt-1 max-w-xl text-sm text-base-content/55">
            {{ t('developer.marketplace.description') }}
          </p>
        </div>
        <form class="flex w-full gap-2 sm:max-w-md" @submit.prevent="load">
          <input
            v-model="search"
            type="search"
            class="input input-bordered min-w-0 flex-1"
            :placeholder="t('developer.marketplace.searchPlaceholder')"
            :aria-label="t('developer.marketplace.searchPlaceholder')"
          >
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner loading-sm" />
            <span>{{ t('developer.marketplace.search') }}</span>
          </button>
        </form>
      </header>

      <section aria-labelledby="marketplace-results-title">
        <div class="mb-3 flex items-center justify-between gap-3 px-1">
          <h2 id="marketplace-results-title" class="text-sm font-bold text-base-content/65">
            {{ t('developer.marketplace.title') }}
          </h2>
          <span v-if="!loading && !loadError" class="text-xs tabular-nums text-base-content/40">
            {{ plugins.length }}
          </span>
        </div>

        <div v-if="loading" class="grid grid-cols-1 gap-4 md:grid-cols-2" aria-busy="true" :aria-label="t('common.loading')">
          <div v-for="item in 6" :key="item" class="rounded-box bg-base-100 p-5 shadow-sm">
            <div class="flex items-start gap-3">
              <div class="skeleton h-11 w-11 shrink-0 rounded-lg" />
              <div class="flex-1 space-y-2">
                <div class="skeleton h-4 w-40" />
                <div class="skeleton h-3 w-24" />
              </div>
            </div>
            <div class="mt-4 space-y-2">
              <div class="skeleton h-3 w-full" />
              <div class="skeleton h-3 w-3/4" />
            </div>
          </div>
        </div>

        <div v-else-if="loadError" class="flex flex-col items-center gap-3 rounded-box bg-base-100 px-5 py-12 text-center shadow-sm">
          <IconPuzzle class="h-10 w-10 text-error/60" aria-hidden="true" />
          <p role="alert" class="text-sm text-base-content/60">{{ t('common.error') }}</p>
          <button type="button" class="btn btn-outline btn-sm" @click="load">
            {{ t('common.retry') }}
          </button>
        </div>

        <div v-else-if="plugins.length" class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NuxtLink
            v-for="plugin in plugins"
            :key="plugin.id"
            :to="`/developers/marketplace/${encodeURIComponent(plugin.slug)}`"
            class="group rounded-box bg-base-100 p-5 shadow-sm outline-offset-2 transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div class="flex items-start gap-3">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-content">
                <IconPuzzle class="h-6 w-6" aria-hidden="true" />
              </div>
              <div class="min-w-0">
                <h3 class="truncate font-bold">
                  {{ plugin.name || plugin.manifest?.name || plugin.slug }}
                </h3>
                <p class="truncate text-xs text-base-content/50">
                  {{ plugin.publisher?.nick || plugin.author || t('developer.marketplace.unknownPublisher') }}
                </p>
              </div>
            </div>
            <p class="mt-4 line-clamp-2 text-sm leading-relaxed text-base-content/70">
              {{ plugin.description || plugin.manifest?.description || t('developer.marketplace.noDescription') }}
            </p>
            <div class="mt-4 flex items-center justify-between gap-3 text-xs text-base-content/45">
              <span class="truncate">{{ plugin.slug }}</span>
              <span class="shrink-0 rounded-full bg-base-200 px-2 py-1">
                v{{ plugin.version || plugin.manifest?.version || '—' }}
              </span>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="flex flex-col items-center rounded-box bg-base-100 px-5 py-12 text-center shadow-sm">
          <IconPuzzle class="mb-4 h-10 w-10 text-base-content/20" aria-hidden="true" />
          <p class="text-sm text-base-content/55">{{ t('developer.marketplace.noResults') }}</p>
          <button v-if="search" type="button" class="btn btn-ghost btn-sm mt-3" @click="search = ''; load()">
            {{ t('developer.marketplace.clearSearch') }}
          </button>
        </div>
      </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Puzzle as IconPuzzle } from '@lucide/vue'
import type { MarketplacePlugin } from '~/types/developer'
import { fetchMarketplacePlugins } from '~/utils/developer'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
defineOgImage('UniOgImage', { title: t('developer.marketplace.title') })

useSolarSeo({ title: t('developer.marketplace.title') })
const search = ref('')
const plugins = ref<MarketplacePlugin[]>([])
const loading = ref(false)
const loadError = ref(false)

async function load() {
  loading.value = true
  loadError.value = false
  try {
    plugins.value = (
      await fetchMarketplacePlugins({ take: 20, search: search.value.trim() })
    ).items
  } catch (e) {
    console.error(e)
    plugins.value = []
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>
