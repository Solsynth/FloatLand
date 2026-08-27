<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Ideask Boards" description="Manage Ideask task boards">
      <template #actions>
        <button class="btn btn-sm btn-ghost" :class="{ 'cursor-wait': loading }" :disabled="loading" @click="load">
          <IconRefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </template>
    </AdminPageHeader>

    <AdminCard class="mb-6">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 z-10" />
          <input
            v-model="filters.q"
            type="text"
            placeholder="Search boards..."
            class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
            @keyup.enter="handleSearch"
          />
        </div>
        <select
          v-model="filters.visibility"
          class="select select-sm rounded-lg border-0 bg-base-200"
          @change="handleSearch"
        >
          <option :value="null">All visibilities</option>
          <option :value="0">Private</option>
          <option :value="1">Public</option>
        </select>
        <div class="relative">
          <IconBuilding2 class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            v-model="filters.workspaceId"
            type="text"
            placeholder="Workspace ID (optional)"
            class="input input-sm w-full sm:w-44 rounded-lg border-0 bg-base-200 pl-9 font-mono text-xs"
            @keyup.enter="handleSearch"
          />
        </div>
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input v-model="filters.includeDeleted" type="checkbox" class="checkbox checkbox-xs" @change="handleSearch" />
          <span class="text-xs text-base-content/60">Include deleted</span>
        </label>
        <button class="btn btn-sm btn-primary" @click="handleSearch">
          <IconSearch class="w-4 h-4" />
          Search
        </button>
      </div>
    </AdminCard>

    <div v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <AdminCard v-else no-padding>
      <div class="overflow-x-auto">
        <table class="table table-sm table-zebra">
          <thead>
            <tr class="text-xs text-base-content/50 uppercase tracking-wider">
              <th class="pl-5">Name</th>
              <th>Visibility</th>
              <th>Task Prefix</th>
              <th class="text-right">Tasks</th>
              <th>Account ID</th>
              <th>Workspace ID</th>
              <th>Created At</th>
              <th class="pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="board in boards" :key="board.id" class="hover:bg-base-200/50 transition-colors cursor-pointer" @click="openDetail(board)">
              <td class="pl-5">
                <div class="text-sm font-medium">{{ board.name }}</div>
                <div v-if="board.deletedAt" class="text-[10px] text-error mt-0.5">Deleted</div>
              </td>
              <td>
                <span class="badge badge-xs" :class="board.visibility === 1 ? 'badge-success' : 'badge-ghost'">
                  {{ visibilityLabel(board.visibility) }}
                </span>
              </td>
              <td>
                <span v-if="board.taskPrefix" class="text-xs font-mono text-base-content/60">{{ board.taskPrefix }}</span>
                <span v-else class="text-xs text-base-content/30">—</span>
              </td>
              <td class="text-right">
                <span class="text-sm tabular-nums">{{ board.taskCount ?? 0 }}</span>
              </td>
              <td>
                <span class="text-xs font-mono text-base-content/50">{{ board.accountId }}</span>
              </td>
              <td>
                <span v-if="board.workspaceId" class="text-xs font-mono text-base-content/50">{{ board.workspaceId }}</span>
                <span v-else class="text-xs text-base-content/30">—</span>
              </td>
              <td>
                <span class="text-xs text-base-content/50">{{ formatDateTimeIn(board.createdAt) }}</span>
              </td>
              <td class="pr-5 text-right">
                <div class="flex justify-end gap-1">
                  <button class="btn btn-ghost btn-xs" @click.stop="openDetail(board)">
                    <IconEye class="w-3.5 h-3.5" />
                  </button>
                  <button class="btn btn-ghost btn-xs" @click.stop="openEdit(board)">
                    <IconPencil class="w-3.5 h-3.5" />
                  </button>
                  <button class="btn btn-ghost btn-xs text-error" @click.stop="remove(board)">
                    <IconTrash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="boards.length === 0" class="flex flex-col items-center py-16 text-center">
        <IconLayoutGrid class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50 mb-1">No boards found</p>
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

    <!-- Detail Drawer -->
    <AdminDrawer :open="detailOpen" title="Board Detail" @update:open="detailOpen = $event">
      <div v-if="detailLoading" class="flex justify-center py-16">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <div v-else-if="detailError" class="flex flex-col items-center py-12 text-center">
        <IconAlertTriangle class="w-10 h-10 text-warning/60 mb-3" />
        <p class="text-sm text-base-content/70">{{ detailError }}</p>
      </div>

      <div v-else-if="detail" class="space-y-6">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="text-lg font-semibold">{{ detail.broad.name }}</h2>
            <span class="badge badge-xs" :class="detail.broad.visibility === 1 ? 'badge-success' : 'badge-ghost'">
              {{ visibilityLabel(detail.broad.visibility) }}
            </span>
            <span v-if="detail.broad.taskPrefix" class="text-xs font-mono badge badge-ghost badge-xs">
              {{ detail.broad.taskPrefix }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-xs text-base-content/40 uppercase tracking-wider block">Account ID</span>
            <p class="font-mono text-xs mt-1 break-all text-base-content/70">{{ detail.broad.accountId }}</p>
          </div>
          <div>
            <span class="text-xs text-base-content/40 uppercase tracking-wider block">Workspace ID</span>
            <p v-if="detail.broad.workspaceId" class="font-mono text-xs mt-1 break-all text-base-content/70">{{ detail.broad.workspaceId }}</p>
            <p v-else class="mt-1 text-base-content/40">—</p>
          </div>
          <div>
            <span class="text-xs text-base-content/40 uppercase tracking-wider block">Task Prefix</span>
            <p v-if="detail.broad.taskPrefix" class="font-mono text-xs mt-1 text-base-content/70">{{ detail.broad.taskPrefix }}</p>
            <p v-else class="mt-1 text-base-content/40">—</p>
          </div>
          <div>
            <span class="text-xs text-base-content/40 uppercase tracking-wider block">Created At</span>
            <p class="mt-1 text-base-content/70">{{ formatDateTimeIn(detail.broad.createdAt) }}</p>
          </div>
          <div v-if="detail.broad.description" class="sm:col-span-2">
            <span class="text-xs text-base-content/40 uppercase tracking-wider block">Description</span>
            <p class="mt-1 text-base-content/70 whitespace-pre-wrap">{{ detail.broad.description }}</p>
          </div>
          <div v-if="detail.broad.content" class="sm:col-span-2">
            <span class="text-xs text-base-content/40 uppercase tracking-wider block">Content</span>
            <p class="mt-1 text-base-content/70 whitespace-pre-wrap">{{ detail.broad.content }}</p>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <h3 class="text-sm font-semibold">Tasks ({{ detail.tasks.length }})</h3>
          <button class="btn btn-ghost btn-xs" @click="openEdit(detail.broad)">
            <IconPencil class="w-3.5 h-3.5" /> Edit board
          </button>
        </div>

        <div v-if="detail.tasks.length" class="space-y-2">
          <div
            v-for="task in detail.tasks"
            :key="task.id"
            class="flex items-start gap-3 p-3 rounded-lg bg-base-200/50"
          >
            <IconClipboardList class="w-4 h-4 text-base-content/40 shrink-0 mt-0.5" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium truncate">{{ task.name }}</p>
              <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-base-content/40 mt-1">
                <span>#{{ task.serialNumber }}</span>
                <span>{{ priorityLabel(task.priority) }}</span>
                <span v-if="task.completeReason !== null && task.completeReason !== undefined">
                  {{ completeReasonLabel(task.completeReason) }}
                </span>
                <span v-if="task.deadlineAt">Due {{ formatDateTimeIn(task.deadlineAt) }}</span>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-base-content/40">No tasks in this board</p>
      </div>
    </AdminDrawer>

    <!-- Edit Drawer -->
    <AdminDrawer :open="editOpen" :title="'Edit Board'" @update:open="editOpen = $event">
      <form class="space-y-4" @submit.prevent="save">
        <label class="form-control">
          <span class="label-text text-xs mb-1">Name</span>
          <input v-model="form.name" class="input input-sm rounded-lg border-0 bg-base-200" required placeholder="Board name" />
        </label>
        <label class="form-control">
          <span class="label-text text-xs mb-1">Description</span>
          <textarea v-model="form.description" class="textarea textarea-sm rounded-lg border-0 bg-base-200" rows="3" placeholder="Optional description" />
        </label>
        <div>
          <span class="label-text text-xs mb-1 block">Visibility</span>
          <select v-model="form.visibility" class="select select-sm w-full rounded-lg border-0 bg-base-200">
            <option :value="0">Private</option>
            <option :value="1">Public</option>
          </select>
        </div>
        <label class="form-control">
          <span class="label-text text-xs mb-1">Task Prefix</span>
          <input v-model="form.taskPrefix" class="input input-sm rounded-lg border-0 bg-base-200 font-mono" placeholder="e.g. ENG" />
        </label>
        <label v-if="editing?.taskPrefix" class="flex items-center gap-2 cursor-pointer">
          <input v-model="form.clearTaskPrefix" type="checkbox" class="checkbox checkbox-xs" />
          <span class="text-xs">Clear task prefix</span>
        </label>
        <button class="btn btn-sm btn-primary w-full" :disabled="saving || !form.name" @click="save">
          {{ saving ? 'Saving...' : 'Save changes' }}
        </button>
      </form>
    </AdminDrawer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconSearch,
  IconRefreshCw,
  IconPencil,
  IconTrash2,
  IconEye,
  IconChevronLeft,
  IconChevronRight,
  IconLayoutGrid,
  IconBuilding2,
  IconClipboardList,
  IconAlertTriangle,
} from '#components'
import type { BoardAdminDetail, BoardAdminSummary, IdeaskBoard } from '~/types/admin'
import {
  fetchAdminBoards,
  fetchAdminBoard,
  updateAdminBoard,
  deleteAdminBoard,
} from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const { destructive } = useAlert()
const boards = ref<BoardAdminSummary[]>([])
const total = ref(0)
const loading = ref(false)
const pageSize = 20
const offset = ref(0)
const filters = ref<{ q: string; visibility: number | null; includeDeleted: boolean; workspaceId: string }>({
  q: '',
  visibility: null,
  includeDeleted: false,
  workspaceId: '',
})

// Detail
const detailOpen = ref(false)
const detail = ref<BoardAdminDetail | null>(null)
const detailLoading = ref(false)
const detailError = ref('')

// Edit
const editOpen = ref(false)
const editing = ref<IdeaskBoard | null>(null)
const saving = ref(false)
const form = ref<{ name: string; description: string; visibility: number; taskPrefix: string; clearTaskPrefix: boolean }>({
  name: '',
  description: '',
  visibility: 0,
  taskPrefix: '',
  clearTaskPrefix: false,
})

function visibilityLabel(v: number): string {
  return v === 1 ? 'Public' : 'Private'
}

function priorityLabel(p: number): string {
  const labels: Record<number, string> = { 0: 'Low', 1: 'Medium', 2: 'High', 3: 'Urgent' }
  return labels[p] || `Priority ${p}`
}

function completeReasonLabel(r: number): string {
  const labels: Record<number, string> = { 0: 'Completed', 1: 'Skipped', 2: 'Duplicated' }
  return labels[r] || `Reason ${r}`
}

function formatDateTimeIn(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

async function load() {
  loading.value = true
  try {
    const result = await fetchAdminBoards({
      q: filters.value.q || undefined,
      visibility: filters.value.visibility ?? undefined,
      includeDeleted: filters.value.includeDeleted || undefined,
      workspaceId: filters.value.workspaceId || undefined,
      take: pageSize,
      offset: offset.value,
    })
    boards.value = result.items
    total.value = result.total
  } catch {
    boards.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  offset.value = 0
  load()
}

function prevPage() {
  offset.value = Math.max(0, offset.value - pageSize)
  load()
}

function nextPage() {
  offset.value += pageSize
  load()
}

async function openDetail(board: BoardAdminSummary) {
  detail.value = null
  detailError.value = ''
  detailOpen.value = true
  detailLoading.value = true
  try {
    detail.value = await fetchAdminBoard(board.id)
  } catch (e: any) {
    detailError.value = e?.data?.message || e?.message || 'Could not load board details. You may not have access to this board.'
  } finally {
    detailLoading.value = false
  }
}

function openEdit(board: IdeaskBoard) {
  editing.value = board
  form.value = {
    name: board.name || '',
    description: board.description || '',
    visibility: board.visibility === 1 ? 1 : 0,
    taskPrefix: board.taskPrefix || '',
    clearTaskPrefix: false,
  }
  editOpen.value = true
}

async function save() {
  if (!form.value.name || saving.value || !editing.value) return
  saving.value = true
  try {
    await updateAdminBoard(editing.value.id, {
      name: form.value.name,
      description: form.value.description || undefined,
      visibility: form.value.visibility,
      taskPrefix: form.value.clearTaskPrefix ? undefined : (form.value.taskPrefix || undefined),
      clearTaskPrefix: form.value.clearTaskPrefix || undefined,
    })
    useNuxtApp().$toast.success('Board updated')
    editOpen.value = false
    await load()
    if (detailOpen.value && detail.value?.broad.id === editing.value.id) {
      detail.value = await fetchAdminBoard(editing.value.id)
    }
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Save failed')
  } finally {
    saving.value = false
  }
}

async function remove(board: BoardAdminSummary) {
  const ok = await destructive('Delete board', `Delete "${board.name}"? All tasks in this board will be removed.`)
  if (!ok) return
  try {
    await deleteAdminBoard(board.id)
    useNuxtApp().$toast.success('Board deleted')
    await load()
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Delete failed')
  }
}

onMounted(() => load())
</script>