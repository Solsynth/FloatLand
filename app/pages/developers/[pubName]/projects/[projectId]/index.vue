<template>
  <NuxtLayout name="developer">
    <div>
      <div v-if="isLoading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <template v-else-if="project">
        <!-- Project Header -->
        <div class="flex items-center gap-4 mb-6">
          <NuxtLink :to="`/developers/${pubName}`" class="btn btn-ghost btn-sm">
            <IconArrowLeft class="w-4 h-4" />
            {{ t('developer.dashboard') }}
          </NuxtLink>
        </div>

        <div class="card bg-base-100 shadow-sm mb-6">
          <div class="card-body p-5">
            <div class="flex items-start justify-between">
              <div>
                <h2 class="text-2xl font-bold">{{ project.name }}</h2>
                <p class="text-base-content/50 mt-1">{{ project.slug }}</p>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-ghost btn-sm" @click="openEditModal">
                  <IconEdit class="w-4 h-4" />
                  {{ t('common.edit') }}
                </button>
                <button class="btn btn-ghost btn-sm text-error" @click="handleDelete">
                  <IconTrash class="w-4 h-4" />
                  {{ t('common.delete') }}
                </button>
              </div>
            </div>
            <p v-if="project.description" class="mt-4 text-base-content/70">
              {{ project.description }}
            </p>
            <div class="mt-4 text-sm text-base-content/50">
              <p>{{ t('developer.projects.createdAt') }}: {{ formatDate(project.createdAt) }}</p>
              <p>{{ t('developer.projects.updatedAt') }}: {{ formatDate(project.updatedAt) }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Apps Section -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="card-title text-base">{{ t('developer.apps.title') }}</h3>
                <NuxtLink :to="`/developers/${pubName}/projects/${projectId}/apps`" class="btn btn-ghost btn-sm">
                  {{ t('developer.apps.viewAll') }}
                  <IconChevronRight class="w-4 h-4" />
                </NuxtLink>
              </div>
              <div v-if="apps.length > 0" class="space-y-2">
                <NuxtLink
                  v-for="app in apps"
                  :key="app.id"
                  :to="`/developers/${pubName}/projects/${projectId}/apps/${app.id}`"
                  class="flex items-center gap-3 rounded-lg p-3 hover:bg-base-200"
                >
                  <div class="avatar">
                    <div class="w-8 rounded-full">
                      <img v-if="getFileUrl(app.picture?.id)" :src="getFileUrl(app.picture?.id)!" :alt="app.name" />
                      <div v-else class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-content text-xs font-bold">
                        {{ app.name?.slice(0, 2).toUpperCase() }}
                      </div>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-medium text-sm">{{ app.name }}</div>
                  </div>
                  <IconChevronRight class="w-4 h-4 text-base-content/30" />
                </NuxtLink>
              </div>
              <p v-else class="text-sm text-base-content/50">{{ t('developer.apps.noApps') }}</p>
            </div>
          </div>

          <!-- Bots Section -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="card-title text-base">{{ t('developer.bots.title') }}</h3>
                <NuxtLink :to="`/developers/${pubName}/projects/${projectId}/bots`" class="btn btn-ghost btn-sm">
                  {{ t('developer.bots.viewAll') }}
                  <IconChevronRight class="w-4 h-4" />
                </NuxtLink>
              </div>
              <div v-if="bots.length > 0" class="space-y-2">
                <NuxtLink
                  v-for="bot in bots"
                  :key="bot.id"
                  :to="`/developers/${pubName}/projects/${projectId}/bots/${bot.id}`"
                  class="flex items-center gap-3 rounded-lg p-3 hover:bg-base-200"
                >
                  <div class="avatar">
                    <div class="w-8 rounded-full">
                      <img v-if="getFileUrl(bot.account.profile?.picture?.id)" :src="getFileUrl(bot.account.profile?.picture?.id)!" :alt="bot.account.nick" />
                      <div v-else class="flex h-8 w-8 items-center justify-center rounded-full bg-info text-info-content text-xs font-bold">
                        {{ bot.account.nick?.slice(0, 2).toUpperCase() }}
                      </div>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-medium text-sm">{{ bot.account.nick }}</div>
                    <div class="text-xs text-base-content/50">@{{ bot.account.name }}</div>
                  </div>
                  <IconChevronRight class="w-4 h-4 text-base-content/30" />
                </NuxtLink>
              </div>
              <p v-else class="text-sm text-base-content/50">{{ t('developer.bots.noBots') }}</p>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="flex flex-col items-center py-8 text-center">
        <IconFolder class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/60">{{ t('developer.projects.notFound') }}</p>
        <NuxtLink :to="`/developers/${pubName}`" class="btn btn-primary btn-sm mt-4">
          {{ t('developer.projects.backToList') }}
        </NuxtLink>
      </div>

      <!-- Edit Project Drawer -->
      <AdminDrawer
        :open="editModalOpen"
        :title="t('developer.projects.edit')"
        @update:open="editModalOpen = $event"
      >
        <form @submit.prevent="handleUpdate">
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.projects.name') }}</legend>
            <input
              v-model="editForm.name"
              type="text"
              class="input w-full"
              required
            />
          </fieldset>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.projects.slug') }}</legend>
            <input
              v-model="editForm.slug"
              type="text"
              class="input w-full"
              required
            />
          </fieldset>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.projects.description') }}</legend>
            <textarea
              v-model="editForm.description"
              class="textarea w-full"
              rows="3"
            />
          </fieldset>
          <div class="flex items-center justify-between gap-3">
            <button type="button" class="btn btn-ghost" @click="editModalOpen = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="isUpdating">
              <span v-if="isUpdating" class="loading loading-spinner loading-sm" />
              {{ t('common.save') }}
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
	ChevronRight as IconChevronRight,
	Folder as IconFolder,
	Pencil as IconEdit,
	Trash as IconTrash
} from '@lucide/vue';
import { getFileUrl } from '~/utils/files';
import type { Bot, CustomApp, DevProject } from '~/types/developer';
import { deleteDevProject, fetchBots, fetchCustomApps, fetchDevProject, updateDevProject } from '~/utils/developer';

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const pubName = computed(() => route.params.pubName as string)
const projectId = computed(() => route.params.projectId as string)
const developer = useDeveloper()

const project = ref<DevProject | null>(null)
const apps = ref<CustomApp[]>([])
const bots = ref<Bot[]>([])
const isLoading = ref(false)
const editModalOpen = ref(false)
const isUpdating = ref(false)

const editForm = reactive({
  name: '',
  slug: '',
  description: '',
})

defineOgImage('UniOgImage', { title: `${t('developer.projects.detail')} · ${pubName.value}` })

useSolarSeo({ title: `${t('developer.projects.detail')} · ${pubName.value}` })

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}

async function loadData() {
  isLoading.value = true
  try {
    await developer.loadDevelopers()
    developer.selectByPublisherName(pubName.value)

    // Fetch project first — don't let apps/bots failure block it
		project.value = await fetchDevProject(pubName.value, projectId.value)
    await developer.loadProject(pubName.value, projectId.value)

    // Apps and bots are secondary — don't fail the whole page if these error
    const [appsResult, botsResult] = await Promise.allSettled([
      fetchCustomApps(pubName.value, projectId.value),
      fetchBots(pubName.value, projectId.value),
    ])
    apps.value = appsResult.status === 'fulfilled' ? appsResult.value : []
    bots.value = botsResult.status === 'fulfilled' ? botsResult.value : []
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

function openEditModal() {
  if (!project.value) return
  editForm.name = project.value.name
  editForm.slug = project.value.slug
  editForm.description = project.value.description
  editModalOpen.value = true
}

async function handleUpdate() {
  isUpdating.value = true
  try {
    await updateDevProject(pubName.value, projectId.value, {
      name: editForm.name,
      slug: editForm.slug,
      description: editForm.description,
    })
    editModalOpen.value = false
    await loadData()
  } catch (e) {
    console.error(e)
  } finally {
    isUpdating.value = false
  }
}

async function handleDelete() {
  if (!(await useAlert().confirm('Confirm', t('developer.projects.deleteConfirm')))) return
  try {
    await deleteDevProject(pubName.value, projectId.value)
    router.push(`/developers/${pubName.value}`)
  } catch (e) {
    console.error(e)
  }
}

// Load on mount and when route params change
watch([pubName, projectId], () => {
  loadData()
}, { immediate: true })
</script>
