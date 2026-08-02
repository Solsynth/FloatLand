<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Workspaces" description="Manage Valve workspaces">
      <template #actions>
        <button class="btn btn-sm btn-ghost" :class="{ 'pointer-events-none opacity-60': isLoading || statsLoading }" @click="loadAll">
          <IconRefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          Refresh
        </button>
      </template>
    </AdminPageHeader>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <AdminStatsCard label="Total workspaces" :value="stats?.totalWorkspaces ?? '—'" :icon="IconBuilding2" />
      <AdminStatsCard label="Deleted" :value="stats?.totalDeletedWorkspaces ?? '—'" :icon="IconBuilding2" color="error" />
      <AdminStatsCard label="Members" :value="stats?.totalMembers ?? '—'" :icon="IconUsers" color="info" />
      <AdminStatsCard label="Bundled plans" :value="stats?.totalBundledPlans ?? '—'" :icon="IconLayers" color="success" />
    </div>

    <!-- Filters -->
    <AdminCard class="mb-6">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            v-model="filters.q"
            type="text"
            placeholder="Search workspaces..."
            class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
            @keyup.enter="handleSearch"
          />
        </div>
        <select v-model="filters.type" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
          <option :value="undefined">All types</option>
          <option :value="0">Individual</option>
          <option :value="1">Organization</option>
        </select>
        <select v-model="filters.plan" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
          <option :value="undefined">All plans</option>
          <option :value="0">Free</option>
          <option :value="1">Pro</option>
          <option :value="2">Enterprise</option>
        </select>
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input v-model="filters.includeDeleted" type="checkbox" class="checkbox checkbox-sm" @change="handleSearch" />
          <span class="text-sm">Include deleted</span>
        </label>
        <button class="btn btn-sm btn-primary" @click="handleSearch">
          <IconSearch class="w-4 h-4" />
          Search
        </button>
      </div>
    </AdminCard>

    <div v-if="isLoading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <AdminCard v-else no-padding>
      <div class="overflow-x-auto">
        <table class="table table-sm table-zebra">
          <thead>
            <tr class="text-xs text-base-content/50 uppercase tracking-wider">
              <th class="pl-5">Name</th>
              <th>Slug</th>
              <th>Type</th>
              <th>Plan</th>
              <th>Members</th>
              <th>Owner ID</th>
              <th>Bundled</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ws in workspaces" :key="ws.id" class="hover:bg-base-200/50 transition-colors">
              <td class="pl-5">
                <NuxtLink :to="`/admin/workspaces/${ws.id}`" class="text-sm font-medium link link-hover">
                  {{ ws.name || ws.slug }}
                </NuxtLink>
                <span v-if="ws.deletedAt" class="badge badge-xs badge-error ml-2">Deleted</span>
              </td>
              <td>
                <span class="text-xs font-mono text-base-content/50">{{ ws.slug }}</span>
              </td>
              <td>
                <span class="text-sm">{{ ws.type === 1 ? 'Organization' : 'Individual' }}</span>
              </td>
              <td>
                <span class="badge badge-xs" :class="planBadgeClass(ws.plan)">{{ planLabel(ws.plan) }}</span>
              </td>
              <td>
                <span class="text-sm tabular-nums">{{ ws.memberCount }}</span>
              </td>
              <td>
                <span class="text-xs font-mono text-base-content/50">{{ ws.ownerAccountId || '—' }}</span>
              </td>
              <td>
                <span v-if="ws.isBundled" class="badge badge-xs badge-info">Bundled</span>
                <span v-else class="text-base-content/30">—</span>
              </td>
              <td>
                <span class="text-xs text-base-content/60">{{ formatDateTime(ws.createdAt) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="workspaces.length === 0" class="flex flex-col items-center py-16 text-center">
        <IconBuilding2 class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50 mb-1">No workspaces found</p>
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
  IconRefreshCw,
  IconSearch,
  IconBuilding2,
  IconUsers,
  IconLayers,
  IconChevronLeft,
  IconChevronRight,
} from '#components'
import type { WorkspaceAdminSummary, WorkspaceAdminStats, WorkspaceAdminQuery } from '~/types/admin'
import { fetchAdminWorkspaces, fetchWorkspaceAdminStats } from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const workspaces = ref<WorkspaceAdminSummary[]>([])
const total = ref(0)
const isLoading = ref(false)
const pageSize = 20
const offset = ref(0)
const filters = ref<{ q: string; type?: number; plan?: number; includeDeleted?: boolean }>({
  q: '',
  type: undefined,
  plan: undefined,
  includeDeleted: false,
})

const stats = ref<WorkspaceAdminStats | null>(null)
const statsLoading = ref(false)

function planLabel(plan: number) {
  return ['Free', 'Pro', 'Enterprise'][plan] || `Plan ${plan}`
}

function planBadgeClass(plan: number) {
  if (plan === 2) return 'badge-secondary'
  if (plan === 1) return 'badge-primary'
  return 'badge-ghost'
}

function formatDateTime(x: string) {
  try { return new Date(x).toLocaleString() } catch { return x }
}

function query(): WorkspaceAdminQuery {
  return {
    q: filters.value.q || undefined,
    type: filters.value.type,
    plan: filters.value.plan,
    includeDeleted: filters.value.includeDeleted || undefined,
    take: pageSize,
    offset: offset.value,
  }
}

async function load() {
  isLoading.value = true
  try {
    const result = await fetchAdminWorkspaces(query())
    workspaces.value = result.items
    total.value = result.total
  } catch {
    workspaces.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

async function loadStats() {
  statsLoading.value = true
  try {
    stats.value = await fetchWorkspaceAdminStats()
  } catch {
    stats.value = null
  } finally {
    statsLoading.value = false
  }
}

async function loadAll() {
  await Promise.all([load(), loadStats()])
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

onMounted(() => loadAll())
</script>