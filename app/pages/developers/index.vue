<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-4xl space-y-5">
      <!-- The landing header acts as a compact control-room readout. -->
      <header class="relative isolate overflow-hidden rounded-box bg-base-100 px-5 py-6 shadow-sm sm:px-7">
        <div class="absolute inset-y-0 right-0 -z-10 w-1/3 bg-primary/[0.06]" aria-hidden="true">
          <div class="absolute inset-y-0 left-0 w-px bg-primary/15" />
          <div class="absolute inset-y-0 left-5 w-px bg-primary/10" />
          <div class="absolute inset-y-0 left-10 w-px bg-primary/10" />
        </div>
        <div class="flex items-start justify-between gap-5">
          <div class="min-w-0 max-w-2xl">
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Solar Network
            </p>
            <h1 class="text-2xl font-black tracking-tight sm:text-3xl">
              {{ t('developer.title') }}
            </h1>
            <p class="mt-2 max-w-xl text-sm leading-relaxed text-base-content/60">
              {{ t('developer.hubDescription') }}
            </p>
          </div>
          <div class="hidden shrink-0 flex-col items-end border-l border-base-300/80 pl-5 sm:flex">
            <span class="text-4xl font-black leading-none tabular-nums text-primary">{{ developers.length }}</span>
            <span class="mt-1 max-w-20 text-right text-[11px] font-semibold uppercase leading-tight tracking-wide text-base-content/45">
              {{ t('developer.selectDeveloper') }}
            </span>
          </div>
        </div>
      </header>

      <section aria-labelledby="developer-list-title" class="overflow-hidden rounded-box bg-base-100 shadow-sm">
        <div class="flex items-center justify-between gap-4 border-b border-base-300/70 px-5 py-4 sm:px-6">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-base-content/40">
              {{ t('developer.overview') }}
            </p>
            <h2 id="developer-list-title" class="mt-1 text-lg font-bold">
              {{ t('developer.selectDeveloper') }}
            </h2>
          </div>
          <span class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold tabular-nums text-primary sm:hidden">
            {{ developers.length }}
          </span>
        </div>

        <div
          v-if="isLoading"
          class="space-y-1 p-3"
          aria-busy="true"
          :aria-label="t('common.loading')"
        >
          <div v-for="item in 3" :key="item" class="flex items-center gap-4 rounded-box p-3">
            <div class="skeleton h-10 w-10 shrink-0 rounded-full" />
            <div class="flex-1 space-y-2">
              <div class="skeleton h-4 w-32" />
              <div class="skeleton h-3 w-24" />
            </div>
            <div class="skeleton h-8 w-20 rounded-btn" />
          </div>
        </div>

        <div v-else-if="loadError" class="flex flex-col items-center gap-3 px-5 py-10 text-center">
          <IconInfo class="h-10 w-10 text-error/70" aria-hidden="true" />
          <p role="alert" class="text-sm text-base-content/60">{{ t('common.error') }}</p>
          <button type="button" class="btn btn-outline btn-sm" @click="loadDevelopers">
            {{ t('common.retry') }}
          </button>
        </div>

        <template v-else>
          <ul v-if="developers.length > 0" class="divide-y divide-base-300/60 px-3">
            <li v-for="dev in developers" :key="dev.id" class="group flex items-center gap-2 py-1">
              <NuxtLink
                :to="`/developers/${encodeURIComponent(dev.publisher?.name ?? '')}`"
                class="flex min-w-0 flex-1 items-center gap-4 rounded-box p-3 outline-offset-2 transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div class="avatar shrink-0">
                  <div class="w-10 rounded-full">
                    <FileImage
                      v-if="dev.publisher?.picture"
                      :file="dev.publisher.picture"
                      :alt="dev.publisher?.nick"
                      loading="lazy"
                      decoding="async"
                    />
                    <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-content">
                      {{ dev.publisher?.nick?.slice(0, 2).toUpperCase() || '?' }}
                    </div>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate font-bold">{{ dev.publisher?.nick || dev.publisher?.name }}</div>
                  <div class="truncate text-sm text-base-content/50">@{{ dev.publisher?.name }}</div>
                </div>
                <IconChevronRight class="h-5 w-5 shrink-0 text-base-content/25 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </NuxtLink>
            </li>
          </ul>

          <div v-else class="flex flex-col items-center px-5 py-10 text-center">
            <IconInfo class="mb-4 h-12 w-12 text-base-content/20" aria-hidden="true" />
            <p class="max-w-sm text-sm leading-relaxed text-base-content/60">{{ t('developer.noDevelopers') }}</p>
          </div>

          <div class="border-t border-base-300/60 p-3">
            <button
              type="button"
              class="flex w-full items-center gap-4 rounded-box border border-dashed border-primary/35 bg-primary/[0.04] p-3 text-left transition-colors hover:border-primary/60 hover:bg-primary/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              :aria-expanded="enrollModalOpen"
              @click="openEnrollModal"
            >
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content">
                <IconPlus class="h-5 w-5" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-bold">{{ t('developer.enrollDeveloper') }}</div>
                <div class="text-sm text-base-content/50">{{ t('developer.enrollDeveloperHint') }}</div>
              </div>
              <IconChevronRight class="h-5 w-5 shrink-0 text-primary/60" aria-hidden="true" />
            </button>
          </div>
        </template>
      </section>

      <AdminDrawer
        :open="enrollModalOpen"
        :title="t('developer.enrollDeveloper')"
        @update:open="enrollModalOpen = $event"
      >
        <div v-if="isLoadingPublishers" class="space-y-2" aria-busy="true">
          <div v-for="item in 3" :key="item" class="flex items-center gap-3 rounded-box p-3">
            <div class="skeleton h-9 w-9 rounded-full" />
            <div class="flex-1 space-y-2">
              <div class="skeleton h-4 w-32" />
              <div class="skeleton h-3 w-24" />
            </div>
          </div>
        </div>
        <div v-else-if="enrollLoadError" class="flex flex-col items-center gap-3 py-6 text-center">
          <p role="alert" class="text-sm text-base-content/60">{{ t('common.error') }}</p>
          <button type="button" class="btn btn-outline btn-sm" @click="loadManagedPublishers">
            {{ t('common.retry') }}
          </button>
        </div>
        <div v-else-if="managedPublishers.length === 0" class="py-6 text-center">
          <p class="text-sm leading-relaxed text-base-content/60">{{ t('developer.noPublishersToEnroll') }}</p>
        </div>
        <div v-else class="space-y-1">
          <p class="mb-3 text-xs text-base-content/50">{{ t('developer.enrollDeveloperHint') }}</p>
          <button
            v-for="pub in managedPublishers"
            :key="pub.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-box p-3 text-left transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
            :disabled="!!enrollingPublisher"
            :aria-busy="enrollingPublisher === pub.name"
            @click="handleEnroll(pub.name)"
          >
            <div class="avatar shrink-0">
              <div class="w-9 rounded-full">
                <FileImage
                  v-if="pub.picture"
                  :file="pub.picture"
                  :alt="pub.nick"
                  loading="lazy"
                  decoding="async"
                />
                <div v-else class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-content">
                  {{ pub.nick?.slice(0, 2).toUpperCase() || '?' }}
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-bold">{{ pub.nick }}</div>
              <div class="truncate text-xs text-base-content/50">@{{ pub.name }}</div>
            </div>
            <span v-if="enrollingPublisher === pub.name" class="loading loading-spinner loading-sm text-primary" />
            <IconChevronRight v-else class="h-4 w-4 shrink-0 text-base-content/25" aria-hidden="true" />
          </button>
          <p v-if="enrollError" role="alert" class="mt-3 rounded-box bg-error/10 px-3 py-2 text-sm text-error">
            {{ t('common.error') }}
          </p>
        </div>
      </AdminDrawer>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconInfo,
  IconChevronRight,
  IconPlus,
} from '#components'
import { enrollDeveloper } from '~/utils/developer'
import { fetchManagedPublishers } from '~/utils/creator'
import type { PublisherManaged } from '~/types/creator'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const developer = useDeveloper()
const { developers, isLoading } = developer

const enrollModalOpen = ref(false)
const managedPublishers = ref<PublisherManaged[]>([])
const isLoadingPublishers = ref(false)
const enrollLoadError = ref(false)
const enrollError = ref(false)
const enrollingPublisher = ref<string | null>(null)
const loadError = ref(false)

defineOgImage('UniOgImage', { title: t('developer.title') })

useSolarSeo({
  title: t('developer.title'), breadcrumbs: [
    { name: 'Home', item: 'https://solian.app' },
    { name: 'Developers', item: 'https://solian.app/developers' }
  ]
})

async function loadDevelopers() {
  loadError.value = false
  try {
    await developer.loadDevelopers()
  } catch {
    loadError.value = true
  }
}

async function loadManagedPublishers() {
  isLoadingPublishers.value = true
  enrollLoadError.value = false
  try {
    managedPublishers.value = await fetchManagedPublishers()
  } catch {
    managedPublishers.value = []
    enrollLoadError.value = true
  } finally {
    isLoadingPublishers.value = false
  }
}

function openEnrollModal() {
  enrollModalOpen.value = true
  void loadManagedPublishers()
}

async function handleEnroll(pubName: string) {
  if (enrollingPublisher.value) return

  enrollingPublisher.value = pubName
  enrollError.value = false
  try {
    await enrollDeveloper(pubName)
    await loadDevelopers()
    enrollModalOpen.value = false
  } catch (e) {
    console.error(e)
    enrollError.value = true
  } finally {
    enrollingPublisher.value = null
  }
}

onMounted(() => {
  void loadDevelopers()
})
</script>
