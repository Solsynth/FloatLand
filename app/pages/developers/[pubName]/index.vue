<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-4xl">
      <!-- Stats Card -->
      <div v-if="stats" class="card bg-base-100 shadow-sm mb-6">
        <div class="card-body p-5">
          <h3 class="text-lg font-bold mb-4">{{ t('developer.overview') }}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="stat bg-base-200 rounded-box">
              <div class="stat-title">{{ t('developer.stats.totalCustomApps') }}</div>
              <div class="stat-value text-primary">{{ stats.totalCustomApps }}</div>
            </div>
            <div class="stat bg-base-200 rounded-box">
              <div class="stat-title">{{ t('developer.projects.title') }}</div>
              <div class="stat-value text-primary">{{ projects.length }}</div>
            </div>
            <div class="stat bg-base-200 rounded-box">
              <div class="stat-title">{{ t('developer.bots.title') }}</div>
              <div class="stat-value text-primary">{{ stats.totalBots ?? 0 }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Projects Section -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="card-title text-base">{{ t('developer.projects.title') }}</h3>
            <button class="btn btn-primary btn-sm" @click="openCreateModal">
              <IconPlus class="w-4 h-4" />
              {{ t('developer.projects.create') }}
            </button>
          </div>

          <div v-if="isLoadingProjects" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg" />
          </div>

          <template v-else>
            <div v-if="projects.length > 0" class="space-y-2">
              <div
                v-for="project in projects"
                :key="project.id"
                class="flex items-center gap-4 rounded-box p-3 transition-colors hover:bg-base-200"
              >
                <NuxtLink
                  :to="`/developers/${pubName}/projects/${project.id}`"
                  class="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-content">
                    <IconFolder class="w-5 h-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-medium">{{ project.name }}</div>
                    <div class="text-sm text-base-content/50">{{ project.description }}</div>
                  </div>
                  <IconChevronRight class="w-5 h-5 text-base-content/30" />
                </NuxtLink>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-xs" @click="openEditModal(project)">
                    <IconEdit class="w-4 h-4" />
                  </button>
                  <button class="btn btn-ghost btn-xs text-error" @click="handleDelete(project)">
                    <IconTrash class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="flex flex-col items-center py-8 text-center">
              <IconFolder class="w-12 h-12 text-base-content/20 mb-4" />
              <p class="text-base-content/60 mb-4">{{ t('developer.projects.noProjects') }}</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Create/Edit Project Drawer -->
      <AdminDrawer
        :open="modalOpen"
        :title="editingProject ? t('developer.projects.edit') : t('developer.projects.create')"
        @update:open="modalOpen = $event"
      >
        <form @submit.prevent="handleSubmit">
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.projects.name') }}</legend>
            <input
              v-model="formData.name"
              type="text"
              class="input w-full"
              required
            />
          </fieldset>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.projects.slug') }}</legend>
            <input
              v-model="formData.slug"
              type="text"
              class="input w-full"
              required
            />
          </fieldset>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.projects.description') }}</legend>
            <textarea
              v-model="formData.description"
              class="textarea w-full"
              rows="3"
            />
          </fieldset>
          <div class="flex items-center justify-between gap-3">
            <button type="button" class="btn btn-ghost" @click="modalOpen = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="loading loading-spinner loading-sm" />
              {{ editingProject ? t('common.save') : t('common.create') }}
            </button>
          </div>
        </form>
      </AdminDrawer>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconPlus,
  IconFolder,
  IconChevronRight,
  IconEdit,
  IconTrash,
} from '#components'
import type { DeveloperStats, DevProject } from '~/types/developer'
import {
  fetchDeveloperStats,
  fetchDevProjects,
  createDevProject,
  updateDevProject,
  deleteDevProject,
} from '~/utils/developer'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const route = useRoute()
const pubName = computed(() => route.params.pubName as string)
const developer = useDeveloper()

const stats = ref<DeveloperStats | null>(null)
const projects = ref<DevProject[]>([])
const isLoadingProjects = ref(false)
const modalOpen = ref(false)
const isSubmitting = ref(false)
const editingProject = ref<DevProject | null>(null)

const formData = reactive({
  name: '',
  slug: '',
  description: '',
})

defineOgImage('UniOgImage', { title: `${t('developer.dashboard')} - ${pubName.value}` })

useSolarSeo({ title: `${t('developer.dashboard')} - ${pubName.value}` })

async function loadData() {
  await developer.loadDevelopers()
  developer.selectByPublisherName(pubName.value)

  isLoadingProjects.value = true
  try {
    const [statsResult, projectsResult] = await Promise.allSettled([
      fetchDeveloperStats(pubName.value),
      fetchDevProjects(pubName.value),
    ])
    stats.value = statsResult.status === 'fulfilled' ? statsResult.value : null
    projects.value = projectsResult.status === 'fulfilled' ? projectsResult.value : []
  } catch (e) {
    console.error(e)
  } finally {
    isLoadingProjects.value = false
  }
}

function openCreateModal() {
  editingProject.value = null
  formData.name = ''
  formData.slug = ''
  formData.description = ''
  modalOpen.value = true
}

function openEditModal(project: DevProject) {
  editingProject.value = project
  formData.name = project.name
  formData.slug = project.slug
  formData.description = project.description
  modalOpen.value = true
}

async function handleSubmit() {
  isSubmitting.value = true
  try {
    if (editingProject.value) {
      await updateDevProject(pubName.value, editingProject.value.id, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
      })
    } else {
      await createDevProject(pubName.value, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
      })
    }
    modalOpen.value = false
    await loadData()
  } catch (e) {
    console.error(e)
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(project: DevProject) {
  if (!(await useAlert().confirm('Confirm', t('developer.projects.deleteConfirm')))) return
  try {
    await deleteDevProject(pubName.value, project.id)
    await loadData()
  } catch (e) {
    console.error(e)
  }
}

// Load on mount and when route params change
watch(pubName, () => {
  loadData()
}, { immediate: true })
</script>
