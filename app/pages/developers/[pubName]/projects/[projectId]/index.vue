<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-5xl space-y-5">
      <div v-if="isLoading" class="space-y-5" aria-busy="true" :aria-label="t('common.loading')">
        <div class="skeleton h-8 w-32" />
        <section class="rounded-box bg-base-100 p-6 shadow-sm">
          <div class="flex items-start gap-4">
            <div class="skeleton h-14 w-14 rounded-2xl" />
            <div class="flex-1 space-y-3">
              <div class="skeleton h-7 w-56" />
              <div class="skeleton h-4 w-32" />
              <div class="skeleton h-3 w-3/4" />
            </div>
          </div>
        </section>
        <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div v-for="item in 2" :key="item" class="rounded-box bg-base-100 p-5 shadow-sm">
            <div class="skeleton mb-5 h-5 w-28" />
            <div class="space-y-3">
              <div v-for="row in 2" :key="row" class="flex items-center gap-3">
                <div class="skeleton h-9 w-9 rounded-xl" />
                <div class="skeleton h-4 flex-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="loadError" class="flex flex-col items-center rounded-box bg-base-100 px-5 py-14 text-center shadow-sm">
        <IconFolder class="mb-4 h-12 w-12 text-error/60" aria-hidden="true" />
        <p role="alert" class="text-sm text-base-content/60">{{ t('common.error') }}</p>
        <button type="button" class="btn btn-outline btn-sm mt-4" @click="loadData">
          {{ t('common.retry') }}
        </button>
      </div>

      <template v-else-if="project">
        <NuxtLink :to="`/developers/${encodeURIComponent(pubName)}`" class="btn btn-ghost btn-sm -ml-2">
          <IconArrowLeft class="h-4 w-4" aria-hidden="true" />
          {{ t('developer.dashboard') }}
        </NuxtLink>

        <section class="relative isolate overflow-hidden rounded-box bg-base-100 shadow-sm">
          <div class="absolute inset-y-0 right-0 -z-10 w-1/3 bg-primary/[0.06]" aria-hidden="true">
            <div class="absolute inset-y-0 left-0 w-px bg-primary/15" />
            <div class="absolute inset-y-0 left-5 w-px bg-primary/10" />
            <div class="absolute inset-y-0 left-10 w-px bg-primary/10" />
          </div>
          <div class="p-5 sm:p-7">
            <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  {{ t('developer.projects.detail') }}
                </p>
                <h1 class="mt-2 break-words text-2xl font-black tracking-tight sm:text-3xl">{{ project.name }}</h1>
                <code class="mt-2 inline-block rounded bg-base-200 px-2 py-1 text-xs text-base-content/55">{{ project.slug }}</code>
                <p v-if="project.description" class="mt-4 max-w-2xl text-sm leading-relaxed text-base-content/65">
                  {{ project.description }}
                </p>
              </div>
              <div class="flex shrink-0 gap-2">
                <button type="button" class="btn btn-ghost btn-sm" @click="openEditModal">
                  <IconEdit class="h-4 w-4" aria-hidden="true" />
                  {{ t('common.edit') }}
                </button>
                <button type="button" class="btn btn-ghost btn-sm text-error" @click="handleDelete">
                  <IconTrash class="h-4 w-4" aria-hidden="true" />
                  {{ t('common.delete') }}
                </button>
              </div>
            </div>
            <div class="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-base-300/60 pt-4 text-xs text-base-content/50">
              <span>{{ t('developer.projects.createdAt') }}: {{ formatDate(project.createdAt) }}</span>
              <span>{{ t('developer.projects.updatedAt') }}: {{ formatDate(project.updatedAt) }}</span>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <!-- Apps Section -->
          <section aria-labelledby="project-apps-title" class="overflow-hidden rounded-box bg-base-100 shadow-sm">
            <div class="flex items-center justify-between gap-3 border-b border-base-300/60 px-5 py-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.16em] text-base-content/40">{{ t('developer.projects.detail') }}</p>
                <h2 id="project-apps-title" class="mt-1 text-lg font-bold">{{ t('developer.apps.title') }}</h2>
              </div>
              <NuxtLink :to="`/developers/${encodeURIComponent(pubName)}/projects/${projectId}/apps`" class="btn btn-ghost btn-sm">
                {{ t('developer.apps.viewAll') }}
                <IconChevronRight class="h-4 w-4" aria-hidden="true" />
              </NuxtLink>
            </div>
            <div v-if="apps.length > 0" class="divide-y divide-base-300/60 px-3 py-2">
              <NuxtLink
                v-for="app in apps"
                :key="app.id"
                :to="`/developers/${encodeURIComponent(pubName)}/projects/${projectId}/apps/${app.id}`"
                class="group flex items-center gap-3 rounded-box p-3 outline-offset-2 transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div class="avatar shrink-0">
                  <div class="w-9 rounded-xl">
                    <FileImage v-if="app.picture" :file="app.picture" :alt="app.name" loading="lazy" decoding="async"/>
                    <div v-else class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-content">
                      {{ app.name?.slice(0, 2).toUpperCase() || '?' }}
                    </div>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-bold">{{ app.name }}</div>
                  <div class="truncate text-xs text-base-content/45">{{ app.slug }}</div>
                </div>
                <IconChevronRight class="h-4 w-4 shrink-0 text-base-content/25 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </NuxtLink>
            </div>
            <p v-else class="px-5 py-8 text-sm text-base-content/50">{{ t('developer.apps.noApps') }}</p>
          </section>

          <!-- Bots Section -->
          <section aria-labelledby="project-bots-title" class="overflow-hidden rounded-box bg-base-100 shadow-sm">
            <div class="flex items-center justify-between gap-3 border-b border-base-300/60 px-5 py-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.16em] text-base-content/40">{{ t('developer.projects.detail') }}</p>
                <h2 id="project-bots-title" class="mt-1 text-lg font-bold">{{ t('developer.bots.title') }}</h2>
              </div>
              <NuxtLink :to="`/developers/${encodeURIComponent(pubName)}/projects/${projectId}/bots`" class="btn btn-ghost btn-sm">
                {{ t('developer.bots.viewAll') }}
                <IconChevronRight class="h-4 w-4" aria-hidden="true" />
              </NuxtLink>
            </div>
            <div v-if="bots.length > 0" class="divide-y divide-base-300/60 px-3">
              <NuxtLink
                v-for="bot in bots"
                :key="bot.id"
                :to="`/developers/${encodeURIComponent(pubName)}/projects/${projectId}/bots/${bot.id}`"
                class="group flex items-center gap-3 rounded-box p-3 outline-offset-2 transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div class="avatar shrink-0">
                  <div class="w-9 rounded-full">
                    <FileImage v-if="bot.account.profile?.picture" :file="bot.account.profile.picture" :alt="bot.account.nick" loading="lazy" decoding="async"/>
                    <div v-else class="flex h-9 w-9 items-center justify-center rounded-full bg-info text-xs font-bold text-info-content">
                      {{ bot.account.nick?.slice(0, 2).toUpperCase() || '?' }}
                    </div>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-bold">{{ bot.account.nick }}</div>
                  <div class="truncate text-xs text-base-content/45">@{{ bot.account.name }}</div>
                </div>
                <IconChevronRight class="h-4 w-4 shrink-0 text-base-content/25 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </NuxtLink>
            </div>
            <p v-else class="px-5 py-8 text-sm text-base-content/50">{{ t('developer.bots.noBots') }}</p>
          </section>
        </div>
      </template>

      <div v-else class="flex flex-col items-center rounded-box bg-base-100 px-5 py-14 text-center shadow-sm">
        <IconFolder class="mb-4 h-12 w-12 text-base-content/20" aria-hidden="true" />
        <p class="text-sm text-base-content/60">{{ t('developer.projects.notFound') }}</p>
        <NuxtLink :to="`/developers/${encodeURIComponent(pubName)}`" class="btn btn-primary btn-sm mt-4">
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
          <p v-if="updateError" role="alert" class="mb-4 rounded-box bg-error/10 px-3 py-2 text-sm text-error">
            {{ t('common.error') }}
          </p>
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
const loadError = ref(false)
const editModalOpen = ref(false)
const isUpdating = ref(false)
const updateError = ref(false)

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
  loadError.value = false
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
    project.value = null
    apps.value = []
    bots.value = []
    loadError.value = true
  } finally {
    isLoading.value = false
  }
}

function openEditModal() {
  updateError.value = false
  if (!project.value) return
  editForm.name = project.value.name
  editForm.slug = project.value.slug
  editForm.description = project.value.description
  editModalOpen.value = true
}

async function handleUpdate() {
  isUpdating.value = true
  updateError.value = false
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
    updateError.value = true
  } finally {
    isUpdating.value = false
  }
}

async function handleDelete() {
  if (!(await useAlert().confirm(t('common.confirm'), t('developer.projects.deleteConfirm')))) return
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
