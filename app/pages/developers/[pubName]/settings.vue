<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-4xl">
      <AdminPageHeader :title="t('developer.settings')" />

      <div class="space-y-5">
        <!-- Developer Info Card -->
        <AdminCard :title="t('developer.settingsDeveloperInfo')">
          <div v-if="developerInfo" class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="avatar shrink-0">
                <div class="w-14 rounded-full">
                  <img
                    v-if="getFileUrl(developerInfo.publisher?.picture?.id)"
                    :src="getFileUrl(developerInfo.publisher?.picture?.id)"
                    :alt="developerInfo.publisher?.nick"
                  >
                  <div
                    v-else
                    class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold"
                  >
                    {{ developerInfo.publisher?.nick?.slice(0, 2).toUpperCase() }}
                  </div>
                </div>
              </div>
              <div class="min-w-0">
                <div class="text-base font-bold truncate">{{ developerInfo.publisher?.nick }}</div>
                <div class="text-sm text-base-content/50">@{{ developerInfo.publisher?.name }}</div>
              </div>
            </div>
            <div v-if="developerInfo.publisher?.bio" class="text-sm text-base-content/65 leading-relaxed">
              {{ developerInfo.publisher.bio }}
            </div>
            <div class="text-xs text-base-content/45">
              {{ t('developer.settingsMemberSince') }}: {{ formatDate(developerInfo.publisher?.createdAt) }}
            </div>
          </div>
          <div v-else class="flex justify-center py-4">
            <span class="loading loading-spinner loading-md" />
          </div>
        </AdminCard>

        <!-- Quick Stats -->
        <AdminCard :title="t('developer.settingsQuickStats')">
          <div v-if="stats" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="rounded-xl bg-base-200/60 border border-base-300/40 px-4 py-3">
              <div class="text-xs text-base-content/45 mb-1">{{ t('developer.stats.totalCustomApps') }}</div>
              <div class="text-2xl font-bold text-primary tabular-nums">{{ stats.totalCustomApps }}</div>
            </div>
            <div class="rounded-xl bg-base-200/60 border border-base-300/40 px-4 py-3">
              <div class="text-xs text-base-content/45 mb-1">{{ t('developer.projects.title') }}</div>
              <div class="text-2xl font-bold text-primary tabular-nums">{{ stats.totalProjects ?? 0 }}</div>
            </div>
            <div class="rounded-xl bg-base-200/60 border border-base-300/40 px-4 py-3">
              <div class="text-xs text-base-content/45 mb-1">{{ t('developer.bots.title') }}</div>
              <div class="text-2xl font-bold text-primary tabular-nums">{{ stats.totalBots ?? 0 }}</div>
            </div>
          </div>
          <div v-else class="flex justify-center py-4">
            <span class="loading loading-spinner loading-md" />
          </div>
        </AdminCard>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { getFileUrl } from '~/utils/files'
import type { DeveloperStats } from '~/types/developer'
import { fetchDeveloperStats } from '~/utils/developer'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const route = useRoute()
const pubName = computed(() => route.params.pubName as string)
const developer = useDeveloper()
const { currentDeveloper } = developer

const stats = ref<DeveloperStats | null>(null)
const isLoading = ref(false)

const developerInfo = computed(() => currentDeveloper.value)

defineOgImage('UniOgImage', { title: `${t('developer.settings')} · ${pubName.value}` })

useSolarSeo({ title: `${t('developer.settings')} · ${pubName.value}` })

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}

async function loadData() {
  isLoading.value = true
  try {
    await developer.loadDevelopers()
    developer.selectByPublisherName(pubName.value)
    stats.value = await fetchDeveloperStats(pubName.value)
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

watch(pubName, () => {
  loadData()
}, { immediate: true })
</script>
