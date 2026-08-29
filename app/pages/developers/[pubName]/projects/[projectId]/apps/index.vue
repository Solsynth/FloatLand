<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-4xl">
      <div class="flex items-center gap-4 mb-4 -mx-4">
        <NuxtLink :to="`/developers/${pubName}/projects/${projectId}`" class="btn btn-ghost btn-sm">
          <IconArrowLeft class="w-4 h-4" />
          {{ t('developer.projects.detail') }}
        </NuxtLink>
      </div>

      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold">{{ t('developer.apps.title') }}</h2>
        <button class="btn btn-primary btn-sm" @click="openCreateModal">
          <IconPlus class="w-4 h-4" />
          {{ t('developer.apps.create') }}
        </button>
      </div>

      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <div v-if="isLoading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg" />
          </div>

          <template v-else>
            <div v-if="apps.length > 0" class="space-y-2">
              <NuxtLink
                v-for="app in apps"
                :key="app.id"
                :to="`/developers/${pubName}/projects/${projectId}/apps/${app.id}`"
                class="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-base-200"
              >
                <div class="avatar">
                  <div class="w-10 rounded-full">
                    <FileImage v-if="app.picture" :file="app.picture" :alt="app.name" />
                    <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-content text-sm font-bold">
                      {{ app.name?.slice(0, 2).toUpperCase() }}
                    </div>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-medium">{{ app.name }}</div>
                  <div class="text-sm text-base-content/50">{{ app.description || app.slug }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="badge badge-sm"
                    :class="{
                      'badge-success': app.status === 1,
                      'badge-warning': app.status === 0,
                      'badge-error': app.status === -1,
                    }"
                  >
                    {{ app.status === 1 ? 'Active' : app.status === 0 ? 'Draft' : 'Disabled' }}
                  </span>
                  <IconChevronRight class="w-5 h-5 text-base-content/30" />
                </div>
              </NuxtLink>
            </div>

            <div v-else class="flex flex-col items-center py-8 text-center">
              <IconBoxes class="w-12 h-12 text-base-content/20 mb-4" />
              <p class="text-base-content/60">{{ t('developer.apps.noApps') }}</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Create App Drawer -->
      <AdminDrawer
        :open="createModalOpen"
        :title="t('developer.apps.create')"
        @update:open="createModalOpen = $event"
      >
        <form @submit.prevent="handleCreate">
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.apps.name') }}</legend>
            <input
              v-model="newApp.name"
              type="text"
              class="input w-full"
              required
            />
          </fieldset>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.apps.slug') }}</legend>
            <input
              v-model="newApp.slug"
              type="text"
              class="input w-full"
              required
            />
          </fieldset>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.apps.description') }}</legend>
            <textarea
              v-model="newApp.description"
              class="textarea w-full"
              rows="3"
            />
          </fieldset>
          <div class="flex items-center justify-between gap-3">
            <button type="button" class="btn btn-ghost" @click="createModalOpen = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="isCreating">
              <span v-if="isCreating" class="loading loading-spinner loading-sm" />
              {{ t('common.create') }}
            </button>
          </div>
        </form>
      </AdminDrawer>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  ArrowLeft as IconArrowLeft,
  Plus as IconPlus,
  Boxes as IconBoxes,
  ChevronRight as IconChevronRight,
} from '@lucide/vue'
import type { CustomApp } from '~/types/developer'
import { fetchCustomApps, createCustomApp } from '~/utils/developer'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const route = useRoute()
const pubName = computed(() => route.params.pubName as string)
const projectId = computed(() => route.params.projectId as string)
const developer = useDeveloper()

const apps = ref<CustomApp[]>([])
const isLoading = ref(false)
const createModalOpen = ref(false)
const isCreating = ref(false)

const newApp = reactive({
  name: '',
  slug: '',
  description: '',
})

defineOgImage('UniOgImage', { title: `${t('developer.apps.title')} · ${developer.currentPublisherNick.value}` })

useSolarSeo({ title: `${t('developer.apps.title')} · ${developer.currentPublisherNick.value}` })

async function loadApps() {
  isLoading.value = true
  try {
    apps.value = await fetchCustomApps(pubName.value, projectId.value)
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

function openCreateModal() {
  newApp.name = ''
  newApp.slug = ''
  newApp.description = ''
  createModalOpen.value = true
}

async function handleCreate() {
  isCreating.value = true
  try {
    await createCustomApp(pubName.value, projectId.value, {
      name: newApp.name,
      slug: newApp.slug,
      description: newApp.description || undefined,
    })
    createModalOpen.value = false
    await loadApps()
  } catch (e) {
    console.error(e)
  } finally {
    isCreating.value = false
  }
}

// Load on mount and when route params change
watch([pubName, projectId], async () => {
  await developer.loadDevelopers()
  developer.selectByPublisherName(pubName.value)
  await developer.loadProject(pubName.value, projectId.value)
  await loadApps()
}, { immediate: true })
</script>
