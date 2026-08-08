<template>
  <NuxtLayout name="creator">
    <div class="mx-auto max-w-5xl">
      <AdminPageHeader :title="t('creator.settings')" />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Main Column (Publisher Form) -->
        <div>
          <PublisherForm :publisher="currentPublisher" @saved="handleSaved" />
        </div>

        <!-- Side Column (Settings) -->
        <div class="space-y-5">
          <!-- Feature Flags -->
          <AdminCard :title="t('creator.features.title')">
            <div class="space-y-2.5">
              <div
                v-for="flag in featureFlags"
                :key="flag.key"
                class="portal-setting-row"
              >
                <div class="min-w-0">
                  <div class="font-medium text-sm">{{ flag.label }}</div>
                  <div class="text-xs text-base-content/50 mt-0.5 leading-relaxed">{{ flag.description }}</div>
                </div>
                <input
                  type="checkbox"
                  class="toggle toggle-primary toggle-sm shrink-0"
                  :checked="features?.[flag.key] ?? false"
                  @change="toggleFeature(flag.key, ($event.target as HTMLInputElement).checked)"
                >
              </div>
            </div>
          </AdminCard>

          <!-- Fediverse -->
          <AdminCard :title="t('creator.fediverse.title')">
            <ConfuseSpinner v-if="fediverseStatus === 'pending'" />

            <template v-else-if="fediverse">
              <div class="portal-setting-row mb-4">
                <div class="min-w-0">
                  <div class="font-medium text-sm">
                    {{ fediverse.enabled ? t('creator.fediverse.enabled') : t('creator.fediverse.disabled') }}
                  </div>
                  <div class="text-xs text-base-content/50 mt-0.5 leading-relaxed">
                    {{ fediverse.enabled ? t('creator.fediverse.disableHint') : t('creator.fediverse.enableHint') }}
                  </div>
                </div>
                <input
                  type="checkbox"
                  class="toggle toggle-primary toggle-sm shrink-0"
                  :checked="fediverse.enabled"
                  @change="toggleFediverse"
                >
              </div>

              <div v-if="fediverse.enabled && fediverse.actor" class="space-y-3">
                <div class="flex items-center gap-3 p-3 rounded-xl bg-base-200/50 border border-base-300/40">
                  <div class="avatar shrink-0">
                    <div class="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold">
                      {{ (fediverse.actor.displayName || fediverse.actor.username).slice(0, 2).toUpperCase() }}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div class="font-medium text-sm truncate">{{ fediverse.actor.displayName || fediverse.actor.username }}</div>
                    <div class="text-xs text-base-content/50 truncate">
                      @{{ fediverse.actor.username }}@{{ fediverse.actor.instance.domain }}
                    </div>
                  </div>
                </div>
                <div class="text-xs text-base-content/50 space-y-1 px-1">
                  <div>{{ t('creator.fediverse.actorUri') }}: {{ fediverse.actorUri || 'N/A' }}</div>
                  <div>{{ t('creator.fediverse.followerCount') }}: {{ fediverse.followerCount || 0 }}</div>
                </div>
              </div>

              <details class="collapse collapse-arrow bg-base-200/60 border border-base-300/40 rounded-xl mt-3">
                <summary class="collapse-title text-sm font-medium min-h-0 py-3">{{ t('creator.fediverse.whatIs') }}</summary>
                <div class="collapse-content text-sm text-base-content/65 leading-relaxed">
                  {{ t('creator.fediverse.about') }}
                </div>
              </details>
            </template>
          </AdminCard>

          <!-- Danger Zone -->
          <AdminCard class="!border-error/25 !bg-error/[0.03]">
            <template #header>
              <h3 class="font-semibold text-sm text-error">{{ t('creator.deletePublisher') }}</h3>
            </template>
            <p class="text-sm text-base-content/60 mb-4 leading-relaxed">{{ t('creator.deletePublisherConfirm') }}</p>
            <button type="button" class="btn btn-error btn-sm" @click="handleDelete">
              <IconTrash class="w-4 h-4" />
              {{ t('creator.deletePublisher') }}
            </button>
          </AdminCard>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconTrash } from '#components'
import {
  fetchPublisherFeatures,
  enablePublisherFeature,
  disablePublisherFeature,
  fetchFediverseStatus,
  enableFediverse,
  disableFediverse,
  deletePublisher,
} from '~/utils/creator'

definePageMeta({ middleware: 'creator' })

const { t } = useI18n()
const route = useRoute()
const pubName = computed(() => route.params.pubName as string)

const creator = useCreator()
const { currentPublisher } = creator

defineOgImage('UniOgImage', { title: computed(() => `${t('creator.settings')} - ${currentPublisher.value?.nick ?? pubName.value}`) })

useSolarSeo({ title: computed(() => `${t('creator.settings')} - ${currentPublisher.value?.nick ?? pubName.value}`) })

const { data: features, refresh: refreshFeatures } = await useAsyncData(
  `creator-features-${pubName.value}`,
  () => fetchPublisherFeatures(pubName.value),
)

const { data: fediverse, status: fediverseStatus, refresh: refreshFediverse } = await useAsyncData(
  `creator-fediverse-${pubName.value}`,
  () => fetchFediverseStatus(pubName.value),
)

const featureFlags = computed(() => [
  {
    key: 'followRequiresApproval',
    label: t('creator.features.followRequiresApproval'),
    description: t('creator.features.followRequiresApprovalDesc'),
  },
  {
    key: 'postsRequireFollow',
    label: t('creator.features.postsRequireFollow'),
    description: t('creator.features.postsRequireFollowDesc'),
  },
])

async function toggleFeature(flag: string, enabled: boolean) {
  if (enabled) {
    await enablePublisherFeature(pubName.value, flag)
  } else {
    await disablePublisherFeature(pubName.value, flag)
  }
  await refreshFeatures()
}

async function toggleFediverse() {
  if (!fediverse.value) return
  if (fediverse.value.enabled) {
    await disableFediverse(pubName.value)
  } else {
    await enableFediverse(pubName.value)
  }
  await refreshFediverse()
}

async function handleDelete() {
  if (!(await useAlert().confirm('Confirm', t('creator.deletePublisherConfirm')))) return
  await deletePublisher(pubName.value)
  creator.clearSelection()
  navigateTo('/creators')
}

function handleSaved() {
  creator.loadManagedPublishers()
}
</script>
