<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Flywheel" description="Manage WattEngine app settings, blob storage and audit trail">
      <template #actions>
        <button class="btn btn-sm btn-ghost" :disabled="refreshing" @click="refreshAll">
          <IconRefreshCw class="w-4 h-4" :class="{ 'animate-spin': refreshing }" />
          Refresh
        </button>
      </template>
    </AdminPageHeader>

    <!-- Stats -->
    <div v-if="statsLoading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>
    <template v-else>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-2">
        <AdminStatsCard
          label="Workspaces"
          :value="stats?.distinctWorkspaceCount ?? 0"
          :icon="IconBuilding2"
          color="primary"
          format="number"
        />
        <AdminStatsCard
          label="Apps"
          :value="stats?.totalAppSettings ?? 0"
          :icon="IconLayers"
          color="info"
          format="number"
        />
        <AdminStatsCard
          label="Blobs"
          :value="stats?.totalBlobs ?? 0"
          :icon="IconHardDrive"
          color="success"
          format="number"
        />
        <AdminStatsCard
          label="Revisions"
          :value="stats?.totalBlobRevisions ?? 0"
          :icon="IconArchive"
          color="warning"
          format="number"
        />
        <AdminStatsCard label="Bytes" :value="stats ? formatBytes(stats.totalBytes) : '—'" :icon="IconDatabase" color="secondary" />
        <AdminStatsCard
          label="Audits"
          :value="stats?.totalAuditEntries ?? 0"
          :icon="IconClipboardCheck"
          color="error"
          format="number"
        />
      </div>
      <div v-if="stats" class="mb-6 flex flex-col gap-1 text-xs text-base-content/50 px-1">
        <span>Audits last 24h: {{ formatNum(stats.auditsLastDay) }} · last 7d: {{ formatNum(stats.auditsLastWeek) }} · last 30d: {{ formatNum(stats.auditsLastMonth) }}</span>
        <span class="text-base-content/35">As of {{ formatDateTime(stats.calculatedAt) }}</span>
      </div>
    </template>

    <!-- Error state -->
    <div v-if="statsError" class="alert alert-error mb-6">
      <IconAlertCircle class="w-5 h-5 shrink-0" />
      <span>{{ statsError }}</span>
    </div>

    <!-- Tabs -->
    <div role="tablist" class="tabs tabs-boxed mb-6 w-fit">
      <button
        role="tab"
        type="button"
        class="tab tab-sm"
        :class="{ 'tab-active': activeTab === 'apps' }"
        @click="switchTab('apps')"
      >
        Apps
      </button>
      <button
        role="tab"
        type="button"
        class="tab tab-sm"
        :class="{ 'tab-active': activeTab === 'audit' }"
        @click="switchTab('audit')"
      >
        Audit
      </button>
    </div>

    <!-- Apps tab -->
    <template v-if="activeTab === 'apps'">
      <AdminCard class="mb-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 z-10" />
            <input
              v-model="filters.workspaceId"
              type="text"
              placeholder="Filter by workspace ID..."
              class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
              @keyup.enter="handleSearch"
            />
          </div>
          <button class="btn btn-sm btn-primary" :disabled="appsLoading" @click="handleSearch">
            <IconSearch class="w-4 h-4" />
            Search
          </button>
        </div>
      </AdminCard>

      <div v-if="appsLoading" class="flex justify-center py-16">
        <span class="loading loading-spinner loading-lg" />
      </div>
      <AdminCard v-else no-padding>
        <div v-if="appsError" class="alert alert-error m-4">
          <IconAlertCircle class="h-5 w-5 shrink-0" />
          <span>{{ appsError }}</span>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="table table-sm table-zebra">
            <thead>
              <tr class="text-xs text-base-content/50 uppercase tracking-wider">
                <th class="pl-5">App ID</th>
                <th>Workspace ID</th>
                <th>Retained revisions</th>
                <th>Event cursor</th>
                <th>Blobs</th>
                <th>Revisions</th>
                <th>Bytes</th>
                <th class="pr-5">Updated at</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="app in apps" :key="app.id" class="hover:bg-base-200/50 transition-colors">
                <td class="pl-5">
                  <span class="font-mono text-xs">{{ app.appId }}</span>
                </td>
                <td>
                  <span class="font-mono text-xs text-base-content/60">{{ app.workspaceId }}</span>
                </td>
                <td>
                  <div class="flex items-center gap-1.5">
                    <input
                      v-model.number="retained[app.id]"
                      type="number"
                      min="0"
                      class="input input-xs w-20 rounded-box border-0 bg-base-200"
                    />
                    <button
                      class="btn btn-ghost btn-xs"
                      :disabled="savingIds.has(app.id) || retained[app.id] === app.retainedRevisionCount"
                      @click="saveRetained(app)"
                    >
                      <IconLoader v-if="savingIds.has(app.id)" class="w-3.5 h-3.5 animate-spin" />
                      <IconCheck v-else class="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                </td>
                <td>
                  <span class="tabular-nums">{{ app.eventCursor }}</span>
                </td>
                <td>
                  <span class="tabular-nums">{{ formatNum(app.blobCount) }}</span>
                </td>
                <td>
                  <span class="tabular-nums">{{ formatNum(app.revisionCount) }}</span>
                </td>
                <td>
                  <span class="tabular-nums">{{ formatBytes(app.totalBytes) }}</span>
                </td>
                <td class="pr-5">
                  <span class="text-xs text-base-content/50">{{ formatDateTime(app.updatedAt) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!appsLoading && !appsError && apps.length === 0" class="flex flex-col items-center py-16 text-center">
          <IconLayers class="w-12 h-12 text-base-content/20 mb-4" />
          <p class="text-base-content/50 mb-1">No apps found</p>
        </div>

        <div v-if="appsTotal > appsPageSize" class="flex items-center justify-between px-5 py-3">
          <span class="text-xs text-base-content/40">
            Showing {{ appsOffset + 1 }}–{{ Math.min(appsOffset + appsPageSize, appsTotal) }} of {{ appsTotal }}
          </span>
          <div class="flex gap-1">
            <button class="btn btn-ghost btn-xs" :disabled="appsOffset === 0" @click="appsPrevPage">
              <IconChevronLeft class="w-3.5 h-3.5" />
            </button>
            <button class="btn btn-ghost btn-xs" :disabled="appsOffset + appsPageSize >= appsTotal" @click="appsNextPage">
              <IconChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </AdminCard>
    </template>

    <!-- Audit tab -->
    <template v-else>
      <AdminCard class="mb-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 z-10" />
            <input
              v-model="auditFilters.workspaceId"
              type="text"
              placeholder="Filter by workspace ID..."
              class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
              @keyup.enter="handleAuditSearch"
            />
          </div>
          <div class="relative flex-1">
            <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 z-10" />
            <input
              v-model="auditFilters.appId"
              type="text"
              placeholder="Filter by app ID..."
              class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
              @keyup.enter="handleAuditSearch"
            />
          </div>
          <button class="btn btn-sm btn-primary" :disabled="auditLoading" @click="handleAuditSearch">
            <IconSearch class="w-4 h-4" />
            Search
          </button>
        </div>
      </AdminCard>

      <div v-if="auditLoading" class="flex justify-center py-16">
        <span class="loading loading-spinner loading-lg" />
      </div>
      <AdminCard v-else no-padding>
        <div v-if="auditError" class="alert alert-error m-4">
          <IconAlertCircle class="h-5 w-5 shrink-0" />
          <span>{{ auditError }}</span>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="table table-sm table-zebra">
            <thead>
              <tr class="text-xs text-base-content/50 uppercase tracking-wider">
                <th class="pl-5">Created at</th>
                <th>Action</th>
                <th>App ID</th>
                <th>Blob ID</th>
                <th>Revision</th>
                <th class="pr-5">Actor account</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, idx) in audit" :key="idx" class="hover:bg-base-200/50 transition-colors">
                <td class="pl-5">
                  <span class="text-xs">{{ formatDateTime(entry.createdAt) }}</span>
                </td>
                <td>
                  <span class="badge badge-sm badge-ghost font-mono text-xs">{{ entry.action }}</span>
                </td>
                <td>
                  <span class="font-mono text-xs">{{ entry.appId }}</span>
                </td>
                <td>
                  <span class="font-mono text-xs">{{ entry.blobId ?? '—' }}</span>
                </td>
                <td>
                  <span class="tabular-nums">{{ entry.revision ?? '—' }}</span>
                </td>
                <td class="pr-5">
                  <span class="font-mono text-xs text-base-content/60">{{ entry.actorAccountId }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!auditLoading && !auditError && audit.length === 0" class="flex flex-col items-center py-16 text-center">
          <IconClipboardCheck class="w-12 h-12 text-base-content/20 mb-4" />
          <p class="text-base-content/50 mb-1">No audit entries found</p>
        </div>

        <div v-if="auditTotal > auditPageSize" class="flex items-center justify-between px-5 py-3">
          <span class="text-xs text-base-content/40">
            Showing {{ auditOffset + 1 }}–{{ Math.min(auditOffset + auditPageSize, auditTotal) }} of {{ auditTotal }}
          </span>
          <div class="flex gap-1">
            <button class="btn btn-ghost btn-xs" :disabled="auditOffset === 0" @click="auditPrevPage">
              <IconChevronLeft class="w-3.5 h-3.5" />
            </button>
            <button class="btn btn-ghost btn-xs" :disabled="auditOffset + auditPageSize >= auditTotal" @click="auditNextPage">
              <IconChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </AdminCard>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconRefreshCw,
  IconBuilding2,
  IconLayers,
  IconHardDrive,
  IconArchive,
  IconDatabase,
  IconClipboardCheck,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconAlertCircle,
  IconCheck,
  IconLoader,
} from '#components'
import type { FlywheelAdminStats, FlywheelAdminApp, FlywheelAuditEntry } from '~/types/admin'
import {
  fetchFlywheelAdminStats,
  fetchFlywheelAdminApps,
  updateFlywheelAdminApp,
  fetchFlywheelAdminAudit,
} from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const activeTab = ref<'apps' | 'audit'>('apps')

// Stats
const stats = ref<FlywheelAdminStats | null>(null)
const statsLoading = ref(false)
const statsError = ref<string | null>(null)
const refreshing = ref(false)

// Apps
const apps = ref<FlywheelAdminApp[]>([])
const appsTotal = ref(0)
const appsLoading = ref(false)
const appsError = ref<string | null>(null)
const appsPageSize = 50
const appsOffset = ref(0)
const retained = ref<Record<string, number>>({})
const savingIds = ref<Set<string>>(new Set())
const filters = reactive({ workspaceId: '' })

// Audit
const audit = ref<FlywheelAuditEntry[]>([])
const auditTotal = ref(0)
const auditLoading = ref(false)
const auditError = ref<string | null>(null)
const auditPageSize = 50
const auditOffset = ref(0)
const auditFilters = reactive({ workspaceId: '', appId: '' })

async function loadStats() {
  statsLoading.value = true
  statsError.value = null
  try {
    stats.value = await fetchFlywheelAdminStats()
  } catch (e: any) {
    stats.value = null
    statsError.value = e?.data?.message || e?.message || 'You do not have permission to view Flywheel stats.'
  } finally {
    statsLoading.value = false
  }
}

async function loadApps() {
  appsLoading.value = true
  appsError.value = null
  try {
    const result = await fetchFlywheelAdminApps({
      workspaceId: filters.workspaceId || undefined,
      take: appsPageSize,
      offset: appsOffset.value,
    })
    apps.value = result.items
    appsTotal.value = result.total
    retained.value = {}
    for (const app of result.items) retained[app.id] = app.retainedRevisionCount
  } catch (e: any) {
    apps.value = []
    appsTotal.value = 0
    appsError.value = e?.data?.message || e?.message || 'Failed to load apps.'
  } finally {
    appsLoading.value = false
  }
}

async function loadAudit() {
  auditLoading.value = true
  auditError.value = null
  try {
    const result = await fetchFlywheelAdminAudit({
      workspaceId: auditFilters.workspaceId || undefined,
      appId: auditFilters.appId || undefined,
      take: auditPageSize,
      offset: auditOffset.value,
    })
    audit.value = result.items
    auditTotal.value = result.total
  } catch (e: any) {
    audit.value = []
    auditTotal.value = 0
    auditError.value = e?.data?.message || e?.message || 'Failed to load audit entries.'
  } finally {
    auditLoading.value = false
  }
}

async function refreshAll() {
  refreshing.value = true
  await Promise.all([loadStats(), activeTab.value === 'apps' ? loadApps() : loadAudit()])
  refreshing.value = false
}

function switchTab(tab: 'apps' | 'audit') {
  if (tab === activeTab.value) return
  activeTab.value = tab
  if (tab === 'apps') loadApps()
  else loadAudit()
}

function handleSearch() {
  appsOffset.value = 0
  loadApps()
}

function appsPrevPage() {
  appsOffset.value = Math.max(0, appsOffset.value - appsPageSize)
  loadApps()
}

function appsNextPage() {
  appsOffset.value += appsPageSize
  loadApps()
}

async function saveRetained(app: FlywheelAdminApp) {
  const value = retained[app.id]
  if (value === undefined || savingIds.value.has(app.id)) return
  savingIds.value.add(app.id)
  try {
    const updated = await updateFlywheelAdminApp(app.id, value)
    app.retainedRevisionCount = updated.retainedRevisionCount
    retained[app.id] = updated.retainedRevisionCount
    useNuxtApp().$toast.success('Retained revisions updated')
  } catch (e: any) {
    retained[app.id] = app.retainedRevisionCount
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Save failed')
  } finally {
    savingIds.value.delete(app.id)
  }
}

function handleAuditSearch() {
  auditOffset.value = 0
  loadAudit()
}

function auditPrevPage() {
  auditOffset.value = Math.max(0, auditOffset.value - auditPageSize)
  loadAudit()
}

function auditNextPage() {
  auditOffset.value += auditPageSize
  loadAudit()
}

function formatNum(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toLocaleString()
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(0, Math.round(bytes / 1024))} KB`
}

function formatDateTime(x: string) {
  try {
    return new Date(x).toLocaleString()
  } catch {
    return x
  }
}

onMounted(() => {
  loadStats()
  loadApps()
})
</script>