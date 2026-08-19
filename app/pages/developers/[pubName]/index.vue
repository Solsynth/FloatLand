<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-4xl">
      <!-- Stats Card -->
      <section v-if="stats || isLoadingProjects" aria-labelledby="developer-overview-title" class="mb-5 overflow-hidden rounded-box bg-base-100 shadow-sm">
        <div class="border-b border-base-300/60 px-5 py-4">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-base-content/40">
            {{ t('developer.overview') }}
          </p>
          <h2 id="developer-overview-title" class="mt-1 text-lg font-bold">
            {{ t('developer.dashboard') }}
          </h2>
        </div>
        <div v-if="stats" class="grid grid-cols-1 gap-px bg-base-300/60 sm:grid-cols-3">
          <div class="bg-base-100 px-5 py-4">
            <div class="text-xs text-base-content/50">{{ t('developer.stats.totalCustomApps') }}</div>
            <div class="mt-1 text-3xl font-black tabular-nums text-primary">{{ stats.totalCustomApps }}</div>
          </div>
          <div class="bg-base-100 px-5 py-4">
            <div class="text-xs text-base-content/50">{{ t('developer.projects.title') }}</div>
            <div class="mt-1 text-3xl font-black tabular-nums text-primary">{{ projects.length }}</div>
          </div>
          <div class="bg-base-100 px-5 py-4">
            <div class="text-xs text-base-content/50">{{ t('developer.bots.title') }}</div>
            <div class="mt-1 text-3xl font-black tabular-nums text-primary">{{ stats.totalBots ?? 0 }}</div>
          </div>
        </div>
        <div v-else class="grid grid-cols-1 gap-px bg-base-300/60 sm:grid-cols-3" aria-busy="true">
          <div v-for="item in 3" :key="item" class="space-y-2 bg-base-100 px-5 py-4">
            <div class="skeleton h-3 w-20" />
            <div class="skeleton h-8 w-12" />
          </div>
        </div>
      </section>

      <!-- Projects Section -->
      <section aria-labelledby="projects-title" class="overflow-hidden rounded-box bg-base-100 shadow-sm">
        <div class="flex items-center justify-between gap-4 border-b border-base-300/60 px-5 py-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-base-content/40">
              {{ t('developer.overview') }}
            </p>
            <h2 id="projects-title" class="mt-1 text-lg font-bold">{{ t('developer.projects.title') }}</h2>
          </div>
          <button type="button" class="btn btn-primary btn-sm" @click="openCreateModal">
            <IconPlus class="h-4 w-4" aria-hidden="true" />
            <span class="hidden sm:inline">{{ t('developer.projects.create') }}</span>
            <span class="sm:hidden">+</span>
          </button>
        </div>

        <div v-if="loadError" class="flex flex-col items-center gap-3 px-5 py-10 text-center">
          <IconFolder class="h-10 w-10 text-error/60" aria-hidden="true" />
          <p role="alert" class="text-sm text-base-content/60">{{ t('common.error') }}</p>
          <button type="button" class="btn btn-outline btn-sm" @click="loadData">
            {{ t('common.retry') }}
          </button>
        </div>

        <div v-else-if="isLoadingProjects" class="space-y-2 p-3" aria-busy="true" :aria-label="t('common.loading')">
          <div v-for="item in 3" :key="item" class="flex items-center gap-4 rounded-box p-3">
            <div class="skeleton h-10 w-10 shrink-0 rounded-full" />
            <div class="flex-1 space-y-2">
              <div class="skeleton h-4 w-40" />
              <div class="skeleton h-3 w-56" />
            </div>
            <div class="skeleton h-7 w-14 rounded-btn" />
          </div>
        </div>

        <template v-else>
          <ul v-if="projects.length > 0" class="divide-y divide-base-300/60 px-3">
            <li v-for="project in projects" :key="project.id" class="group flex items-center gap-2 py-1">
              <NuxtLink
                :to="`/developers/${encodeURIComponent(pubName)}/projects/${project.id}`"
                class="flex min-w-0 flex-1 items-center gap-4 rounded-box p-3 outline-offset-2 transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content">
                  <IconFolder class="h-5 w-5" aria-hidden="true" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate font-bold">{{ project.name }}</div>
                  <div class="truncate text-sm text-base-content/50">{{ project.description || project.slug }}</div>
                </div>
                <IconChevronRight class="h-5 w-5 shrink-0 text-base-content/25 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </NuxtLink>
              <div class="flex shrink-0 gap-1">
                <button
                  type="button"
                  class="btn btn-ghost btn-square btn-xs"
                  :aria-label="`${t('common.edit')} ${project.name}`"
                  @click="openEditModal(project)"
                >
                  <IconEdit class="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-square btn-xs text-error"
                  :aria-label="`${t('common.delete')} ${project.name}`"
                  @click="handleDelete(project)"
                >
                  <IconTrash class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          </ul>

          <div v-else class="flex flex-col items-center px-5 py-10 text-center">
            <IconFolder class="mb-4 h-12 w-12 text-base-content/20" aria-hidden="true" />
            <p class="max-w-sm text-sm leading-relaxed text-base-content/60">{{ t('developer.projects.noProjects') }}</p>
          </div>
        </template>
      </section>

      <!-- Create/Edit Project Drawer -->
      <AdminDrawer
        :open="modalOpen"
        :title="editingProject ? t('developer.projects.edit') : t('developer.projects.create')"
        @update:open="modalOpen = $event"
      >
        <form @submit.prevent="handleSubmit">
          <p v-if="formError" role="alert" class="mb-4 rounded-box bg-error/10 px-3 py-2 text-sm text-error">
            {{ t('common.error') }}
          </p>
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
const loadError = ref(false)
const modalOpen = ref(false)
const isSubmitting = ref(false)
const formError = ref(false)
const editingProject = ref<DevProject | null>(null)

const formData = reactive({
  name: '',
  slug: '',
  description: '',
})

defineOgImage('UniOgImage', { title: `${t('developer.dashboard')} · ${pubName.value}` })

useSolarSeo({ title: `${t('developer.dashboard')} · ${pubName.value}` })

async function loadData() {
  isLoadingProjects.value = true
  loadError.value = false
  try {
    await developer.loadDevelopers()
    developer.selectByPublisherName(pubName.value)

    const [statsResult, projectsResult] = await Promise.allSettled([
      fetchDeveloperStats(pubName.value),
      fetchDevProjects(pubName.value),
    ])
    stats.value = statsResult.status === 'fulfilled' ? statsResult.value : null
    projects.value = projectsResult.status === 'fulfilled' ? projectsResult.value : []
    loadError.value = statsResult.status === 'rejected' || projectsResult.status === 'rejected'
  } catch (e) {
    console.error(e)
    stats.value = null
    projects.value = []
    loadError.value = true
  } finally {
    isLoadingProjects.value = false
  }
}

function openCreateModal() {
  editingProject.value = null
  formData.name = ''
  formData.slug = ''
  formData.description = ''
  formError.value = false
  modalOpen.value = true
}

function openEditModal(project: DevProject) {
  editingProject.value = project
  formData.name = project.name
  formData.slug = project.slug
  formData.description = project.description
  formError.value = false
  modalOpen.value = true
}

async function handleSubmit() {
  isSubmitting.value = true
  formError.value = false
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
    formError.value = true
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(project: DevProject) {
  if (!(await useAlert().confirm(t('common.confirm'), t('developer.projects.deleteConfirm')))) return
  try {
    await deleteDevProject(pubName.value, project.id)
    await loadData()
  } catch (e) {
    console.error(e)
    loadError.value = true
  }
}


// Load on mount and when route params change
watch(pubName, () => {
  loadData()
}, { immediate: true })
</script>
