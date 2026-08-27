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
          <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 z-10" />
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

    <!-- Backfill individual workspaces -->
    <AdminCard class="mb-6">
      <form class="space-y-4" @submit.prevent="runBackfill">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Account IDs</legend>
          <textarea
            v-model="backfillInput"
            class="textarea"
            rows="3"
            placeholder="00000000-0000-0000-0000-000000000000, 11111111-1111-1111-1111-111111111111 …"
          ></textarea>
          <p class="label">
            Creates an individual workspace for each account that doesn't already own one (comma, space, or newline
            separated).
          </p>
        </fieldset>
        <button
          class="btn btn-sm btn-primary"
          type="submit"
          :disabled="backfilling || !backfillIds.length"
        >
          <IconRefreshCw class="w-4 h-4" :class="{ 'animate-spin': backfilling }" />
          {{ backfilling ? 'Backfilling…' : `Backfill ${backfillIds.length} account${backfillIds.length === 1 ? '' : 's'}` }}
        </button>
      </form>

      <div v-if="backfillResults.length" class="mt-4 border-t border-base-300 pt-4">
        <h4 class="text-sm font-semibold mb-3">Results</h4>
        <ul class="space-y-2">
          <li
            v-for="r in backfillResults"
            :key="r.accountId"
            class="flex items-baseline gap-2 text-sm"
          >
            <span
              class="font-semibold"
              :class="r.created ? 'text-success' : r.alreadyExists ? 'text-base-content/40' : 'text-error'"
            >
              {{ r.created ? '✓' : r.alreadyExists ? '·' : '✕' }}
            </span>
            <code class="font-mono text-xs">{{ r.accountId }}</code>
            <span
              class="text-xs"
              :class="r.error || (!r.created && !r.alreadyExists) ? 'text-error' : 'text-base-content/50'"
            >
              <template v-if="r.created">created (workspace {{ r.workspaceId }})</template>
              <template v-else-if="r.alreadyExists">already has an individual workspace</template>
              <template v-else>{{ r.error || 'failed' }}</template>
            </span>
          </li>
        </ul>
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
import type { WorkspaceAdminSummary, WorkspaceAdminStats, WorkspaceAdminQuery, BackfillIndividualWorkspaceResult } from '~/types/admin'
import { fetchAdminWorkspaces, fetchWorkspaceAdminStats, backfillIndividualWorkspaces } from '~/utils/admin'

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

const backfillInput = ref('')
const backfilling = ref(false)
const backfillResults = ref<BackfillIndividualWorkspaceResult[]>([])
const backfillIds = computed(() =>
  backfillInput.value
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean),
)
const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function runBackfill() {
  const valid: string[] = []
  const invalid: string[] = []
  for (const id of backfillIds.value) {
    if (GUID_RE.test(id)) valid.push(id)
    else invalid.push(id)
  }
  backfillResults.value = invalid.map((id) => ({
    accountId: id,
    created: false,
    workspaceId: null,
    alreadyExists: false,
    error: 'Invalid account ID',
  }))
  if (!valid.length) return
  backfilling.value = true
  try {
    const results = await backfillIndividualWorkspaces(valid)
    backfillResults.value = [...backfillResults.value, ...results]
  } catch (err) {
    backfillResults.value = [{
      accountId: valid.join(', '),
      created: false,
      workspaceId: null,
      alreadyExists: false,
      error: err instanceof Error ? err.message : 'Backfill failed',
    }]
  } finally {
    backfilling.value = false
    load()
  }
}

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