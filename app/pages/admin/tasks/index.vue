<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Tasks" description="Manage IdeaSk task records across boards">
      <template #actions>
        <button class="btn btn-sm btn-ghost" :class="{ 'opacity-50 pointer-events-none': isLoading }" @click="load">
          <IconRefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          Refresh
        </button>
      </template>
    </AdminPageHeader>

    <AdminCard class="mb-6">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search task name..."
              class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
              @keyup.enter="handleSearch"
            />
          </div>
          <select v-model="status" class="select select-sm rounded-box border-0 bg-base-200 sm:w-44" @change="handleSearch">
            <option value="">All statuses</option>
            <option :value="0">Open</option>
            <option :value="1">Completed</option>
            <option :value="2">Skipped</option>
            <option :value="3">Duplicated</option>
          </select>
          <button class="btn btn-sm btn-primary" @click="handleSearch">
            <IconSearch class="w-4 h-4" />
            Search
          </button>
        </div>
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input v-model="includeDeleted" type="checkbox" class="checkbox checkbox-xs checkbox-primary" @change="handleSearch" />
          <span class="text-xs text-base-content/60">Include deleted tasks</span>
        </label>
      </div>
    </AdminCard>

    <div v-if="errorMessage" class="alert alert-error mb-4 text-sm">
      <IconAlertCircle class="w-5 h-5" />
      <span>{{ errorMessage }}</span>
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <AdminCard v-else no-padding>
      <div class="overflow-x-auto">
        <table class="table table-sm table-zebra">
          <thead>
            <tr class="text-xs text-base-content/50 uppercase tracking-wider">
              <th class="pl-5">Task</th>
              <th>Board id</th>
              <th>Serial</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Deadline</th>
              <th>Deleted</th>
              <th class="pr-5">Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in items" :key="task.id" class="hover:bg-base-200/50 transition-colors">
              <td class="pl-5">
                <NuxtLink :to="`/admin/tasks/${task.id}`" class="text-sm font-medium hover:underline hover:text-primary">
                  {{ task.name || 'Untitled task' }}
                </NuxtLink>
              </td>
              <td>
                <span class="text-xs font-mono text-base-content/60">{{ task.broadId }}</span>
              </td>
              <td>
                <span class="text-xs tabular-nums text-base-content/60">{{ task.serialNumber }}</span>
              </td>
              <td>
                <span class="text-xs tabular-nums text-base-content/60">{{ task.priority }}</span>
              </td>
              <td>
                <span v-if="task.deletedAt" class="badge badge-sm badge-error">Deleted</span>
                <span v-else-if="task.completeReason === 0" class="badge badge-sm badge-success">Completed</span>
                <span v-else-if="task.completeReason === 1" class="badge badge-sm badge-warning">Skipped</span>
                <span v-else-if="task.completeReason === 2" class="badge badge-sm badge-neutral">Duplicated</span>
                <span v-else class="badge badge-sm badge-info">Open</span>
              </td>
              <td>
                <span class="text-xs tabular-nums text-base-content/60">{{ task.deadlineAt ? formatDateTime(task.deadlineAt) : '—' }}</span>
              </td>
              <td>
                <span v-if="task.deletedAt" class="text-xs text-error">Yes</span>
                <span v-else class="text-xs text-base-content/30">—</span>
              </td>
              <td class="pr-5">
                <span class="text-xs tabular-nums text-base-content/60">{{ formatDate(task.createdAt) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="items.length === 0" class="flex flex-col items-center py-16 text-center">
        <IconClipboardList class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50">No tasks found</p>
      </div>

      <div v-if="total > pageSize" class="flex items-center justify-between px-5 py-3">
        <span class="text-xs text-base-content/40">
          Showing {{ offset + 1 }}–{{ Math.min(offset + pageSize, total) }} of {{ total }}
        </span>
        <div class="flex gap-1">
          <button class="btn btn-ghost btn-xs" :disabled="offset === 0" @click="prevPage">
            <IconChevronLeft class="w-3.5 h-3.5" />
          </button>
          <button class="btn btn-ghost btn-xs" :disabled="offset + pageSize >= total" @click="nextPage">
            <IconChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </AdminCard>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconSearch,
  IconRefreshCw,
  IconChevronLeft,
  IconChevronRight,
  IconClipboardList,
  IconAlertCircle,
} from '#components'
import type { TaskAdminSummary, TaskListStatus } from '~/types/admin'
import { fetchAdminTasks } from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const items = ref<TaskAdminSummary[]>([])
const total = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
const pageSize = 20
const offset = ref(0)
const searchQuery = ref('')
const status = ref<TaskListStatus | ''>('')
const includeDeleted = ref(false)

async function load() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const result = await fetchAdminTasks({
      q: searchQuery.value || undefined,
      status: status.value === '' ? undefined : status.value,
      includeDeleted: includeDeleted.value || undefined,
      take: pageSize,
      offset: offset.value,
    })
    items.value = result.items
    total.value = result.total
  } catch (e: any) {
    items.value = []
    total.value = 0
    errorMessage.value = e?.data?.message || e?.message || 'Failed to load tasks'
  } finally {
    isLoading.value = false
  }
}

function handleSearch() {
  offset.value = 0
  load()
}

function prevPage() {
  if (offset.value === 0) return
  offset.value = Math.max(offset.value - pageSize, 0)
  load()
}

function nextPage() {
  if (offset.value + pageSize >= total.value) return
  offset.value += pageSize
  load()
}

function formatDateTime(x: string) {
  try {
    return new Date(x).toLocaleString()
  } catch {
    return x
  }
}

function formatDate(x: string) {
  try {
    return new Date(x).toLocaleDateString()
  } catch {
    return x
  }
}

onMounted(() => load())
</script>