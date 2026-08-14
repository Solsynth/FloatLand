<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-4xl">
      <!-- Developer List Card -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <div v-if="isLoading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg" />
          </div>

          <template v-else>
            <!-- Developer List -->
            <div v-if="developers.length > 0" class="space-y-1">
              <div v-for="dev in developers" :key="dev.id" class="flex items-center gap-2 rounded-box p-2 transition-colors hover:bg-base-200">
                <NuxtLink :to="`/developers/${dev.publisher?.name}`" class="flex min-w-0 flex-1 items-center gap-4 p-1">
                  <div class="avatar">
                    <div class="w-10 rounded-full">
                      <img v-if="dev.publisher?.picture?.id" :src="getFileUrl(dev.publisher?.picture?.id)!" :alt="dev.publisher?.nick" />
                      <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-content text-sm font-bold">
                        {{ dev.publisher?.nick?.slice(0, 2).toUpperCase() }}
                      </div>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-medium">{{ dev.publisher?.nick }}</div>
                    <div class="text-sm text-base-content/50">@{{ dev.publisher?.name }}</div>
                  </div>
                  <IconChevronRight class="w-5 h-5 text-base-content/30" />
                </NuxtLink>
                <NuxtLink
                  v-if="dev.publisher?.name"
                  :to="`/developers/${encodeURIComponent(dev.publisher.name)}/distribution`"
                  class="btn btn-ghost btn-sm"
                >
                  <IconStore class="w-4 h-4" />
                  {{ t('developer.apps.distribution.title') }}
                </NuxtLink>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="flex flex-col items-center py-8 text-center">
              <IconInfo class="w-12 h-12 text-base-content/20 mb-4" />
              <p class="text-base-content/60 mb-4">{{ t('developer.noDevelopers') }}</p>
            </div>

            <div class="h-2" />

            <!-- Enroll Developer -->
            <button class="flex w-full items-center gap-4 rounded-box p-3 transition-colors hover:bg-base-200"
              @click="openEnrollModal">
              <div class="avatar avatar-placeholder">
                <div class="w-10 rounded-full bg-primary text-primary-content">
                  <IconPlus class="w-5 h-5" />
                </div>
              </div>
              <div class="text-left min-w-0 flex-1">
                <div class="font-medium">{{ t('developer.enrollDeveloper') }}</div>
                <div class="text-sm text-base-content/50">{{ t('developer.enrollDeveloperHint') }}</div>
              </div>
              <IconChevronRight class="w-5 h-5 text-base-content/30" />
            </button>
          </template>
        </div>
      </div>

      <!-- Enroll Developer Drawer -->
      <AdminDrawer :open="enrollModalOpen" :title="t('developer.enrollDeveloper')"
        @update:open="enrollModalOpen = $event">
        <div v-if="managedPublishers.length === 0" class="text-center py-4">
          <p class="text-base-content/60">{{ t('developer.noPublishersToEnroll') }}</p>
        </div>
        <div v-else class="space-y-2">
          <button v-for="pub in managedPublishers" :key="pub.id"
            class="flex w-full items-center gap-3 rounded-box p-3 transition-colors hover:bg-base-200"
            @click="handleEnroll(pub.name)">
            <div class="avatar">
              <div class="w-9 rounded-full">
                <img v-if="getFileUrl(pub.picture?.id)" :src="getFileUrl(pub.picture?.id)" :alt="pub.nick" />
                <div v-else
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-content text-xs font-bold">
                  {{ pub.nick?.slice(0, 2).toUpperCase() }}
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1 text-left">
              <div class="font-medium text-sm">{{ pub.nick }}</div>
              <div class="text-xs text-base-content/50">@{{ pub.name }}</div>
            </div>
          </button>
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
  IconStore,
} from '#components'
import { getFileUrl } from '~/utils/files'
import { enrollDeveloper } from '~/utils/developer'
import { fetchManagedPublishers } from '~/utils/creator'
import type { PublisherManaged } from '~/types/creator'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const developer = useDeveloper()
const { developers, isLoading } = developer

const enrollModalOpen = ref(false)
const managedPublishers = ref<PublisherManaged[]>([])

defineOgImage('UniOgImage', { title: t('developer.title') })

useSolarSeo({
  title: t('developer.title'), breadcrumbs: [
    { name: 'Home', item: 'https://solian.app' },
    { name: 'Developers', item: 'https://solian.app/developers' }
  ]
})

async function openEnrollModal() {
  try {
    managedPublishers.value = await fetchManagedPublishers()
  } catch {
    managedPublishers.value = []
  }
  enrollModalOpen.value = true
}

async function handleEnroll(pubName: string) {
  try {
    await enrollDeveloper(pubName)
    enrollModalOpen.value = false
    await developer.loadDevelopers()
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  await developer.loadDevelopers()
})
</script>
