<template>
  <NuxtLayout name="admin">
    <div v-if="isLoading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="errorMessage" class="flex flex-col items-center py-16 text-center">
      <IconAlertCircle class="w-12 h-12 text-base-content/20 mb-4" />
      <p class="text-base-content/50">{{ errorMessage }}</p>
      <NuxtLink to="/admin/tasks" class="btn btn-sm btn-ghost mt-3">Back to tasks</NuxtLink>
    </div>

    <template v-else-if="detail">
      <!-- Header -->
      <div class="flex items-start gap-3 mb-6">
        <NuxtLink to="/admin/tasks" class="btn btn-circle btn-ghost btn-sm mt-0.5">
          <IconArrowLeft class="w-4 h-4" />
        </NuxtLink>
        <div class="min-w-0 flex-1">
          <h1 class="text-xl font-bold tracking-tight">{{ detail.task.name || 'Untitled task' }}</h1>
          <p class="text-xs text-base-content/40 font-mono mt-0.5">{{ detail.task.taskKey }}</p>
        </div>
        <button v-if="isOpen" class="btn btn-sm btn-primary" :disabled="acting" @click="toggleComplete">
          <IconCheck class="w-4 h-4" />
          Complete
        </button>
        <button v-else class="btn btn-sm btn-ghost" :disabled="acting" @click="toggleComplete">
          <IconRotateCcw class="w-4 h-4" />
          Reopen
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: edit + comments + github -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Edit form -->
          <AdminCard>
            <template #title>Edit task</template>
            <div class="space-y-4">
              <label class="form-control">
                <span class="label-text text-xs mb-1">Name</span>
                <input v-model="form.name" class="input input-sm rounded-box border-0 bg-base-200" placeholder="Task name" />
              </label>
              <label class="form-control">
                <span class="label-text text-xs mb-1">Description</span>
                <textarea v-model="form.description" rows="3" class="textarea textarea-sm rounded-box border-0 bg-base-200" placeholder="Description" />
              </label>
              <div class="flex flex-col sm:flex-row gap-4">
                <label class="form-control flex-1">
                  <span class="label-text text-xs mb-1">Priority</span>
                  <input v-model.number="form.priority" type="number" class="input input-sm rounded-box border-0 bg-base-200" />
                </label>
                <label class="form-control flex-1">
                  <span class="label-text text-xs mb-1">Deadline</span>
                  <input v-model="form.deadline" type="datetime-local" class="input input-sm rounded-box border-0 bg-base-200" />
                </label>
              </div>
              <button class="btn btn-sm btn-primary w-full" :disabled="saving" @click="save">
                {{ saving ? 'Saving...' : 'Save changes' }}
              </button>
            </div>
          </AdminCard>

          <!-- Comments -->
          <AdminCard no-padding>
            <template #title>Comments ({{ detail.comments.length }})</template>
            <div v-if="detail.comments.length === 0" class="px-5 py-10 text-center">
              <p class="text-sm text-base-content/40">No comments</p>
            </div>
            <div v-else class="divide-y divide-base-200">
              <div v-for="c in detail.comments" :key="c.id" class="px-5 py-4">
                <div class="mb-2">
                  <span v-if="c.authorAccountId" class="text-xs font-medium">Account {{ c.authorAccountId }}</span>
                  <span v-else-if="c.externalAuthorLogin" class="text-xs font-medium">{{ c.externalAuthorLogin }}</span>
                  <span v-else class="text-xs text-base-content/40">Unknown author</span>
                  <span class="text-xs text-base-content/40 ml-2">{{ formatDateTime(c.createdAt) }}</span>
                </div>
                <p class="text-sm whitespace-pre-wrap">{{ c.content }}</p>
              </div>
            </div>
          </AdminCard>

          <!-- GitHub issues -->
          <AdminCard no-padding>
            <template #title>GitHub issues ({{ detail.githubIssues.length }})</template>
            <div v-if="detail.githubIssues.length === 0" class="px-5 py-10 text-center">
              <p class="text-sm text-base-content/40">No linked GitHub issues</p>
            </div>
            <div v-else class="divide-y divide-base-200">
              <a
                v-for="g in detail.githubIssues"
                :key="g.id"
                :href="g.htmlUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-3 px-5 py-3 hover:bg-base-200/50 transition-colors"
              >
                <span class="text-sm font-medium">{{ g.repositoryFullName || 'repository' }}#{{ g.issueNumber }}</span>
                <IconExternalLink class="w-3.5 h-3.5 text-base-content/40" />
                <span v-if="g.lastGitHubUpdatedAt" class="ml-auto text-xs text-base-content/40">
                  {{ formatDateTime(g.lastGitHubUpdatedAt) }}
                </span>
              </a>
            </div>
          </AdminCard>
        </div>

        <!-- Right column -->
        <div class="space-y-6">
          <!-- Details -->
          <AdminCard>
            <template #title>Details</template>
            <dl class="grid grid-cols-1 gap-3 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-base-content/50">Task key</dt>
                <dd class="font-mono">{{ detail.task.taskKey }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-base-content/50">Serial</dt>
                <dd class="tabular-nums">{{ detail.task.serialNumber }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-base-content/50">Priority</dt>
                <dd class="tabular-nums">{{ detail.task.priority }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-base-content/50">Status</dt>
                <dd>
                  <span v-if="detail.task.completeReason !== null" class="badge badge-sm" :class="statusBadgeClass">
                    {{ statusLabel }}
                  </span>
                  <span v-else class="badge badge-sm badge-info">Open</span>
                </dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-base-content/50">Deadline</dt>
                <dd class="tabular-nums">{{ detail.task.deadlineAt ? formatDateTime(detail.task.deadlineAt) : '—' }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-base-content/50">Completed</dt>
                <dd class="tabular-nums">{{ detail.task.completedAt ? formatDateTime(detail.task.completedAt) : '—' }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-base-content/50">Group id</dt>
                <dd class="font-mono">{{ detail.task.groupId || '—' }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-base-content/50">Board id</dt>
                <dd class="font-mono">{{ detail.task.broadId || '—' }}</dd>
              </div>
            </dl>
          </AdminCard>

          <!-- Assignees -->
          <AdminCard>
            <template #title>Assignees ({{ detail.assigneeAccountIds.length }})</template>
            <div v-if="detail.assigneeAccountIds.length === 0" class="text-sm text-base-content/40">No assignees</div>
            <ul v-else class="space-y-1 text-sm">
              <li v-for="acc in detail.assigneeAccountIds" :key="acc" class="font-mono">{{ acc }}</li>
            </ul>
          </AdminCard>

          <!-- Danger zone -->
          <AdminCard class="border border-error/30">
            <template #title>Danger zone</template>
            <button class="btn btn-sm btn-error btn-outline w-full" :disabled="deleting" @click="removeTask">
              <IconTrash2 class="w-4 h-4" />
              Delete task
            </button>
          </AdminCard>
        </div>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconArrowLeft,
  IconCheck,
  IconRotateCcw,
  IconTrash2,
  IconExternalLink,
  IconAlertCircle,
} from '#components'
import type { TaskAdminDetail, TaskUpdatePayload } from '~/types/admin'
import { fetchAdminTask, updateAdminTask, deleteAdminTask } from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { destructive } = useAlert()

const detail = ref<TaskAdminDetail | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const acting = ref(false)
const saving = ref(false)
const deleting = ref(false)

const form = reactive({ name: '', description: '', priority: 0, deadline: '' })

const task = computed(() => detail.value?.task ?? null)
const isOpen = computed(() => task.value?.completeReason === null || task.value?.completeReason === undefined)
const statusLabel = computed(() => {
  const r = task.value?.completeReason
  return r === 0 ? 'Completed' : r === 1 ? 'Skipped' : r === 2 ? 'Duplicated' : 'Open'
})
const statusBadgeClass = computed(() => {
  const r = task.value?.completeReason
  return r === 0 ? 'badge-success' : r === 1 ? 'badge-warning' : r === 2 ? 'badge-neutral' : ''
})

async function load() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    detail.value = await fetchAdminTask(String(route.params.id))
    const t = detail.value.task
    form.name = t.name || ''
    form.description = t.description || ''
    form.priority = t.priority
    form.deadline = toDatetimeLocal(t.deadlineAt)
  } catch (e: any) {
    detail.value = null
    errorMessage.value = e?.data?.message || e?.message || 'Failed to load task'
  } finally {
    isLoading.value = false
  }
}

async function save() {
  if (!detail.value || saving.value) return
  saving.value = true
  try {
    const payload: TaskUpdatePayload = {}
    if (form.name !== detail.value.task.name) payload.name = form.name
    if (form.description !== (detail.value.task.description || '')) payload.description = form.description || null
    if (form.priority !== detail.value.task.priority) payload.priority = form.priority
    const deadline = fromDatetimeLocal(form.deadline)
    if (deadline !== detail.value.task.deadlineAt) payload.deadlineAt = deadline
    if (Object.keys(payload).length > 0) {
      await updateAdminTask(detail.value.task.id, payload)
      useNuxtApp().$toast.success('Task updated')
    }
    await load()
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Save failed')
  } finally {
    saving.value = false
  }
}

async function toggleComplete() {
  if (!detail.value || acting.value) return
  acting.value = true
  try {
    await updateAdminTask(detail.value.task.id, { complete: isOpen.value })
    useNuxtApp().$toast.success(isOpen.value ? 'Task completed' : 'Task reopened')
    await load()
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Update failed')
  } finally {
    acting.value = false
  }
}

async function removeTask() {
  if (!detail.value || deleting.value) return
  const ok = await destructive(
    'Delete task',
    `Permanently delete “${detail.value.task.name || 'Untitled task'}”? This cannot be undone.`,
  )
  if (!ok) return
  deleting.value = true
  try {
    await deleteAdminTask(detail.value.task.id)
    useNuxtApp().$toast.success('Task deleted')
    await navigateTo('/admin/tasks')
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Delete failed')
  } finally {
    deleting.value = false
  }
}

function toDatetimeLocal(x: string | null) {
  if (!x) return ''
  try {
    const d = new Date(x)
    if (Number.isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

function fromDatetimeLocal(x: string) {
  return x ? new Date(x).toISOString() : null
}

function formatDateTime(x: string) {
  try {
    return new Date(x).toLocaleString()
  } catch {
    return x
  }
}

onMounted(() => load())
</script>