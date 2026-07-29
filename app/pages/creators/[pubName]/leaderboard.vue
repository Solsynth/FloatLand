<template>
  <NuxtLayout name="creator">
    <div class="mx-auto max-w-4xl">
      <h1 class="text-xl font-bold mb-4">{{ t('creator.leaderboard.title') }}</h1>

      <ConfuseSpinner v-if="status === 'pending'" />

      <div v-else-if="error" class="alert alert-error">
        <span>{{ String(error) }}</span>
      </div>

      <div v-else-if="!leaderboard?.length" class="text-center py-12 text-base-content/50">
        {{ t('creator.noResults') }}
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="entry in leaderboard"
          :key="entry.rank"
          class="card bg-base-100 shadow-sm"
        >
          <div class="card-body p-4 flex-row items-center gap-4">
            <div class="w-10 text-center">
              <span
                class="text-2xl font-bold"
                :class="{
                  'text-primary': entry.rank <= 3,
                  'text-base-content/50': entry.rank > 3,
                }"
              >
                {{ entry.rank }}
              </span>
            </div>
            <div class="avatar">
              <div class="w-10 rounded-full">
                <img v-if="getFileUrl(entry.picture?.id)" :src="getFileUrl(entry.picture?.id)" :alt="entry.nick" />
                <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-content text-sm font-bold">
                  {{ (entry.nick || entry.name || '?').slice(0, 2).toUpperCase() }}
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-medium">{{ entry.nick || entry.name }}</div>
              <div v-if="entry.name" class="text-sm text-base-content/50">@{{ entry.name }}</div>
            </div>
            <div class="text-right">
              <div class="flex items-center gap-2">
                <span
                  class="text-lg font-bold"
                  :class="gradeColor(entry.grade)"
                >
                  {{ entry.grade }}
                </span>
                <span class="text-sm text-base-content/50">
                  {{ formatRating(entry.rating) }}
                </span>
              </div>
              <div class="text-xs text-base-content/40">
                {{ t('creator.rating.percentile', { percentile: (entry.percentile || 0).toFixed(1) }) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { fetchPublisherLeaderboard } from '~/utils/creator'
import { getFileUrl } from '~/utils/files'

definePageMeta({ middleware: 'creator' })

const { t } = useI18n()
const route = useRoute()
const pubName = computed(() => route.params.pubName as string)

const creator = useCreator()
const { currentPublisher } = creator

defineOgImage('UniOgImage', { title: computed(() => `${t('creator.leaderboard.title')} - ${currentPublisher.value?.nick ?? pubName.value}`) })

useSolarSeo({ title: computed(() => `${t('creator.leaderboard.title')} - ${currentPublisher.value?.nick ?? pubName.value}`) })

const { data: leaderboard, status, error } = await useAsyncData(
  `creator-leaderboard-${pubName.value}`,
  () => fetchPublisherLeaderboard(),
)

function formatRating(value: number): string {
  if (!value) return '0'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}

function gradeColor(grade: string): string {
  if (!grade) return 'text-base-content/60'
  if (grade.startsWith('S')) return 'text-primary'
  if (grade.startsWith('A')) return 'text-primary'
  if (grade.startsWith('B')) return 'text-primary'
  if (grade === 'D') return 'text-error'
  return 'text-base-content/60'
}
</script>
