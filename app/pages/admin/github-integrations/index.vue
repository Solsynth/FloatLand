<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="GitHub Integrations" description="Manage repository sync integrations">
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
              placeholder="Search repo, owner, installation..."
              class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
              @keyup.enter="handleSearch"
            />
          </div>
          <input
            v-model="broadId"
            type="text"
            placeholder="Filter by Broad (board) id..."
            class="input input-sm rounded-box border-0 bg-base-200 sm:w-64"
            @keyup.enter="handleSearch"
          />
          <button class="btn btn-sm btn-primary" @click="handleSearch">
            <IconSearch class="w-4 h-4" />
            Search
          </button>
        </div>
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input v-model="includeDeleted" type="checkbox" class="checkbox checkbox-xs checkbox-primary" @change="handleSearch" />
          <span class="text-xs text-base-content/60">Include deleted integrations</span>
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
              <th class="pl-5">Repo</th>
              <th>Owner</th>
              <th>Repository</th>
              <th>Broad</th>
              <th>Installation Id</th>
              <th>GitHub Repo Id</th>
              <th>Last synced</th>
              <th>Last error</th>
              <th>Status</th>
              <th>Created</th>
              <th>Updated</th>
              <th class="pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in items" :key="row.id" class="hover:bg-base-200/50 transition-colors">
              <td class="pl-5">
                <span class="text-sm font-mono">{{ row.owner }}/{{ row.repository }}</span>
              </td>
              <td>
                <span class="text-sm">{{ row.owner }}</span>
              </td>
              <td>
                <span class="text-sm">{{ row.repository }}</span>
              </td>
              <td>
                <span class="text-xs font-mono text-base-content/60">{{ row.broadId }}</span>
              </td>
              <td>
                <span class="text-xs tabular-nums text-base-content/60">{{ row.installationId }}</span>
              </td>
              <td>
                <span class="text-xs tabular-nums text-base-content/60">{{ row.githubRepositoryId }}</span>
              </td>
              <td>
                <span class="text-xs tabular-nums">{{ row.lastSyncedAt ? formatDateTime(row.lastSyncedAt) : '—' }}</span>
              </td>
              <td>
                <span v-if="row.lastError" class="badge badge-error badge-sm text-error-content whitespace-nowrap">
                  {{ shortError(row.lastError) }}
                </span>
                <span v-else class="text-xs text-base-content/30">—</span>
              </td>
              <td>
                <span v-if="row.deletedAt" class="badge badge-sm badge-error">Deleted</span>
                <span v-else class="badge badge-sm badge-success">Active</span>
              </td>
              <td>
                <span class="text-xs tabular-nums text-base-content/60">{{ formatDate(row.createdAt) }}</span>
              </td>
              <td>
                <span class="text-xs tabular-nums text-base-content/60">{{ formatDate(row.updatedAt) }}</span>
              </td>
              <td class="pr-5 text-right">
                <div class="flex justify-end gap-1">
                  <button class="btn btn-ghost btn-xs text-error" @click="remove(row)">
                    <IconTrash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="items.length === 0" class="flex flex-col items-center py-16 text-center">
        <IconGitBranch class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50">No GitHub integrations found</p>
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
  IconTrash2,
  IconChevronLeft,
  IconChevronRight,
  IconGitBranch,
  IconAlertCircle,
} from '#components'
import type { GitHubIntegrationAdminSummary } from '~/types/admin'
import { fetchAdminGitHubIntegrations, deleteAdminGitHubIntegration } from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const { destructive } = useAlert()
const items = ref<GitHubIntegrationAdminSummary[]>([])
const total = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
const pageSize = 20
const offset = ref(0)
const searchQuery = ref('')
const broadId = ref('')
const includeDeleted = ref(false)

async function load() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const result = await fetchAdminGitHubIntegrations({
      q: searchQuery.value || undefined,
      broadId: broadId.value || undefined,
      includeDeleted: includeDeleted.value || undefined,
      take: pageSize,
      offset: offset.value,
    })
    items.value = result.items
    total.value = result.total
  } catch (e: any) {
    items.value = []
    total.value = 0
    errorMessage.value = e?.data?.message || e?.message || 'Failed to load GitHub integrations'
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

async function remove(row: GitHubIntegrationAdminSummary) {
  const ok = await destructive(
    'Delete integration',
    `Delete GitHub integration for “${row.owner}/${row.repository}”?`,
  )
  if (!ok) return
  try {
    await deleteAdminGitHubIntegration(row.id)
    useNuxtApp().$toast.success('Integration deleted')
    if (items.value.length === 1 && offset.value > 0) {
      offset.value -= pageSize
    }
    await load()
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Delete failed')
  }
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

function shortError(x: string) {
  return x.length > 80 ? `${x.slice(0, 80)}…` : x
}

onMounted(() => load())
</script>